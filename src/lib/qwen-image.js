'use strict';
/**
 * QWEN IMAGE GENERATION SERVICE — Kishaa International
 * ---------------------------------------------------
 * Generates photorealistic, high-resolution 16:9 images using Alibaba Cloud
 * DashScope `qwen-image-plus`, downloads them locally, and registers them in the CMS Media Library.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { db, audit } = require('./db');
const H = require('./helpers');

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY;
const DASHSCOPE_API_URL = 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis';
const DASHSCOPE_TASK_URL = 'https://dashscope-intl.aliyuncs.com/api/v1/tasks';

const UPLOAD_DIRS = [
  path.join(__dirname, '..', '..', 'public', 'uploads'),
  path.join(__dirname, '..', '..', 'client', 'public', 'uploads'),
];

// Ensure upload directories exist
for (const dir of UPLOAD_DIRS) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (e) {
    // ignore
  }
}

/**
 * Generate a 16:9 editorial / photorealistic image from a prompt.
 * @param {string} prompt Text prompt
 * @param {object} options { size: '1664*928', user: null, folder: 'guides' }
 */
async function generateAndSaveImage(prompt, options = {}) {
  if (!DASHSCOPE_API_KEY) {
    throw new Error('DASHSCOPE_API_KEY is not configured in environment.');
  }

  const size = options.size || '1664*928';
  const folder = options.folder || 'guides';
  const user = options.user || { id: 1, name: 'AI Generator' };

  console.log(`🎨 Submitting image synthesis to qwen-image-plus: "${prompt.slice(0, 60)}..."`);

  const submitRes = await fetch(DASHSCOPE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
      'X-DashScope-Async': 'enable',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'qwen-image-plus',
      input: { prompt },
      parameters: { size },
    }),
  });

  if (!submitRes.ok) {
    const errText = await submitRes.text();
    throw new Error(`DashScope image submit error ${submitRes.status}: ${errText}`);
  }

  const submitData = await submitRes.json();
  const taskId = submitData?.output?.task_id;
  if (!taskId) {
    throw new Error(`Failed to obtain task_id from DashScope: ${JSON.stringify(submitData)}`);
  }

  console.log(`⏳ Task created: ${taskId}. Polling for completion...`);

  // Poll for completion (up to 60 seconds)
  let imageUrl = null;
  const startTime = Date.now();
  while (Date.now() - startTime < 60000) {
    await new Promise((r) => setTimeout(r, 2500));

    const taskRes = await fetch(`${DASHSCOPE_TASK_URL}/${taskId}`, {
      headers: { 'Authorization': `Bearer ${DASHSCOPE_API_KEY}` },
    });

    if (!taskRes.ok) continue;

    const taskData = await taskRes.json();
    const status = taskData?.output?.task_status;

    if (status === 'SUCCEEDED') {
      imageUrl = taskData?.output?.results?.[0]?.url;
      break;
    } else if (status === 'FAILED') {
      throw new Error(`DashScope image task failed: ${taskData?.output?.message || 'Unknown error'}`);
    }
  }

  if (!imageUrl) {
    throw new Error('Image generation timed out after 60 seconds.');
  }

  console.log(`📥 Downloading generated image from: ${imageUrl.slice(0, 60)}...`);

  // Download image
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) {
    throw new Error(`Failed to download image file: ${imgRes.status}`);
  }

  const arrayBuffer = await imgRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const slug = H.slugify(prompt.slice(0, 40)) || 'ai-image';
  const filename = `${Date.now()}-${slug}.png`;

  // 1. Upload to Supabase Storage (public bucket 'media')
  let publicUrl = null;
  let sbMediaId = null;
  try {
    const supabase = require('./supabase');
    const sb = supabase.getClient();
    if (sb) {
      const storagePath = `${folder}/${filename}`;
      const { data: uploadData, error: uploadErr } = await sb.storage
        .from('media')
        .upload(storagePath, buffer, {
          contentType: 'image/png',
          upsert: true,
        });

      if (uploadErr) {
        console.warn('⚠️ Supabase Storage upload error:', uploadErr.message);
      } else {
        const { data: urlData } = sb.storage.from('media').getPublicUrl(storagePath);
        publicUrl = urlData?.publicUrl || null;
        console.log(`☁️ Uploaded to Supabase Storage: ${publicUrl}`);
      }

      // Register in Supabase cloud media table
      const { data: sbMedia, error: sbInsertErr } = await sb.from('media').insert({
        filename,
        original_name: `${slug}.png`,
        mime: 'image/png',
        size: buffer.length,
        alt: prompt.slice(0, 150),
        caption: `AI generated image: ${prompt.slice(0, 200)}`,
        folder,
        visibility: 'public',
      }).select().single();

      if (sbInsertErr) {
        console.warn('⚠️ Supabase media table insert warning:', sbInsertErr.message);
      } else if (sbMedia?.id) {
        sbMediaId = sbMedia.id;
      }
    }
  } catch (sbErr) {
    console.warn('⚠️ Supabase sync exception in qwen-image:', sbErr.message);
  }

  // 2. Write to local upload directories (fallback & local dev)
  for (const dir of UPLOAD_DIRS) {
    try {
      fs.writeFileSync(path.join(dir, filename), buffer);
    } catch (e) {
      console.warn(`Could not write to ${dir}:`, e.message);
    }
  }

  // 3. Register in SQLite media table
  let mediaId = null;
  try {
    const validUserId = (user && user.id && db.prepare('SELECT id FROM users WHERE id = ?').get(user.id))
      ? user.id
      : (db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get()?.id || null);

    const stmt = db.prepare(`
      INSERT INTO media (filename, original_name, mime, size, alt, caption, folder, visibility, uploaded_by, public_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      filename,
      `${slug}.png`,
      'image/png',
      buffer.length,
      prompt.slice(0, 150),
      `AI generated image via qwen-image-plus: ${prompt.slice(0, 200)}`,
      folder,
      'public',
      validUserId,
      publicUrl
    );
    mediaId = info.lastInsertRowid;
    if (user && user.id) {
      try { audit(user, 'media.ai_generate', 'media', mediaId, { filename, prompt: prompt.slice(0, 100), publicUrl }); } catch (_) {}
    }
  } catch (err) {
    console.warn('Could not register image in media table:', err.message);
  }

  return {
    mediaId,
    sbMediaId,
    filename,
    publicUrl,
    localUrl: `/uploads/${filename}`,
    url: publicUrl || `/uploads/${filename}`,
    prompt,
    size,
  };
}

module.exports = {
  generateAndSaveImage,
};
