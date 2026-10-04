'use strict';
/**
 * QWEN AI & LIVE WEB SEARCH ENGINE — Kishaa International
 * -------------------------------------------------------------
 * Provides:
 *  1. Live Destination Costs & Statutory Proof of Funds (via real-time web search)
 *  2. AI Candidate Profile Examiner & Case Assessment
 *  3. AI SEO Content & Title/Description Copilot
 */
require('dotenv').config();

const QWEN_API_KEY = process.env.QWEN_API_KEY || 'sk-ws-H.DMHHLLX.Kg4O.MEYCIQCgfxaMDLrp1x69u9XC_KzXjiWN57Cpa3O1WWX3p7g-pQIhAN2Cl2y5xQzso-Jh4TMk289ECsg256cn20U8-8hNGVSx';
const QWEN_BASE_URL = process.env.QWEN_BASE_URL || 'https://maas.qwencloudapi.com/compatible-mode/v1';

// In-memory cache for live searches (TTL: 6 hours)
const searchCache = new Map();
const CACHE_TTL_MS = 6 * 3600 * 1000;

async function callQwenChat({ messages, enableSearch = true, temperature = 0.3, responseFormat = null }) {
  if (!QWEN_API_KEY) {
    throw new Error('QWEN_API_KEY is not configured in environment.');
  }

  const payload = {
    model: 'qwen-flash',
    messages,
    temperature,
  };

  if (enableSearch) {
    payload.enable_search = true;
  }
  if (responseFormat === 'json') {
    payload.response_format = { type: 'json_object' };
  }

  const res = await fetch(`${QWEN_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${QWEN_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Qwen API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Perform live web search for destination proof-of-funds, living costs and official embassy rules.
 */
async function getLiveDestinationCosts(countryName, city = '') {
  const cacheKey = `${countryName.toLowerCase()}_${(city || '').toLowerCase()}`;
  const cached = searchCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
    return cached.data;
  }

  const prompt = `You are a licensed senior immigration and education data intelligence analyst at Kishaa International.
Perform a real-time web search for the latest official 2026/2027 statutory proof-of-funds, bank statement requirements, and monthly living costs for international students and visa applicants in ${countryName}${city ? ` (${city})` : ''}.

Return a STRICT, valid JSON object without markdown code blocks, adhering to this exact schema:
{
  "country": "${countryName}",
  "city": "${city || 'National standard'}",
  "currency": "CAD/GBP/EUR/USD/AUD/AED",
  "proofOfFunds": {
    "amount": 20635,
    "displayAmount": "20,635 CAD",
    "months": 12,
    "authority": "IRCC / UKVI / BAföG / Migri",
    "ruleName": "Official Statutory Proof of Funds Rule",
    "effectiveDate": "2026",
    "sourceUrl": "https://official-government-source-url.gov",
    "summary": "Clear, concise 2-sentence explanation of the exact financial evidence required."
  },
  "livingCosts": {
    "budget": 950,
    "standard": 1350,
    "comfortable": 1800,
    "housing": 650,
    "food": 300,
    "transport": 100,
    "summary": "Short 1-sentence breakdown of typical monthly expenditure."
  },
  "tuitionGuide": {
    "undergradAverage": "12,000 - 18,000",
    "postgradAverage": "14,000 - 22,000",
    "note": "Initial deposit typically £4,000 - £6,000 or 1 semester fee."
  },
  "workRights": {
    "termTimeHours": 20,
    "vacationHours": 40,
    "spouseWork": true,
    "postStudyYears": 2
  },
  "keyAdvice": "One crucial compliance tip for applicants from Pakistan, UAE, or international hubs.",
  "verifiedAt": "${new Date().toISOString()}"
}`;

  try {
    const rawContent = await callQwenChat({
      messages: [
        { role: 'system', content: 'You are an immigration compliance AI agent that outputs only valid, raw JSON.' },
        { role: 'user', content: prompt }
      ],
      enableSearch: true,
      temperature: 0.2,
    });

    let cleaned = rawContent.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');

    const parsed = JSON.parse(cleaned);
    parsed.verifiedAt = new Date().toISOString();
    parsed.source = 'Live Government & Web Intelligence (Qwen Search)';

    searchCache.set(cacheKey, { timestamp: Date.now(), data: parsed });
    return parsed;
  } catch (err) {
    console.error(`Live cost search failed for ${countryName}:`, err.message);
    throw err;
  }
}

/**
 * AI Candidate Profile Examiner & Case Assessment Agent.
 * Evaluates candidate eligibility, visa refusal risk, recommended pathways, and personalized counseling roadmap.
 */
async function examineCandidateProfile(candidateData) {
  const {
    name = 'Candidate',
    countryOfOrigin = 'Pakistan / UAE',
    targetCountry = 'UK',
    desiredProgram = 'Master Degree',
    education = 'Bachelor Degree (CGPA 3.0)',
    gapYears = 2,
    budget = 'Moderate',
    ieltsBand = '6.5',
    notes = '',
  } = candidateData;

  const prompt = `You are Senior Consultant Zeb Khan (British Council Certified Trainer, MA English, MEd) and the Admissions & Visa Intelligence Desk at Kishaa International (Dubai HQ & Pakistan).
Examine this candidate's profile for 2026/2027 study and visa pathways:

CANDIDATE DETAILS:
- Name: ${name}
- Origin: ${countryOfOrigin}
- Target Country / Destination: ${targetCountry}
- Desired Route / Program: ${desiredProgram}
- Educational Background: ${education}
- Study / Career Gap: ${gapYears} year(s)
- Financial Capacity / Budget: ${budget}
- English Proficiency / IELTS: ${ieltsBand}
- Additional Notes: ${notes}

Analyze this profile thoroughly using real-time immigration knowledge (IRCC, UKVI, BAföG, Schengen, GDRFA rules).
Return a STRICT, valid JSON object with no markdown formatting:
{
  "candidateName": "${name}",
  "eligibilityScore": 85,
  "eligibilityTier": "High Eligibility",
  "statutoryRequirements": {
    "requiredFunds": "e.g. £11,360 + tuition balance",
    "englishRequirement": "e.g. Band 6.5 or Medium of Instruction (MOI) exemption",
    "gapAcceptance": "e.g. 2-year gap accepted with employment proof and tax records"
  },
  "recommendedPathways": [
    {
      "pathway": "Primary Pathway Name",
      "destination": "Country",
      "whyFit": "Reason why this suits their profile",
      "estimatedTuition": "Tuition band",
      "processingTime": "Timeline"
    },
    {
      "pathway": "Backup / Alternative Pathway Name",
      "destination": "Country",
      "whyFit": "Reason why this is a solid fallback"
    }
  ],
  "riskFactors": [
    "Specific risk factor 1 (e.g. funds seasoning period)",
    "Specific risk factor 2 (e.g. university interview or Credibility assessment)"
  ],
  "checklistForApplicant": [
    "Actionable step 1",
    "Actionable step 2",
    "Actionable step 3",
    "Actionable step 4"
  ],
  "consultantRecommendation": "Authoritative counseling opinion by Zeb Khan on how to present the case honestly and successfully.",
  "clientMessageDraft": "Professional, warm WhatsApp/Email response draft addressing the client by name and inviting them for consultation.",
  "evaluatedAt": "${new Date().toISOString()}"
}`;

  const raw = await callQwenChat({
    messages: [
      { role: 'system', content: 'You are an elite immigration case assessment AI agent that returns strictly JSON.' },
      { role: 'user', content: prompt }
    ],
    enableSearch: true,
    temperature: 0.25,
  });

  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');

  return JSON.parse(cleaned);
}

/**
 * AI SEO & Content Copilot.
 * Suggests high-CTR titles, meta descriptions, answer-first summaries, and key takeaways.
 */
async function suggestSeoContent({ topic, targetQuery = '', currentTitle = '' }) {
  const prompt = `You are Kishaa International's Senior SEO, AEO (Answer Engine Optimization) & GEO (Generative Engine Optimization) strategist.
Topic: "${topic || currentTitle}"
Target Query: "${targetQuery || topic}"

Perform a real-time web search on search trends, searcher intent, official regulatory figures for 2026, and top-ranking search snippets.
Generate:
1. 3 High-CTR, Click-Worthy, EEAT-Optimized Titles (50-65 chars).
2. 3 High-Converting Meta Descriptions (140-160 chars) with figures, dates, and clear call-to-action.
3. 1 Answer-First Summary (40-60 words): Exact, concise answer stating figures, rules, and government sources (IRCC, UKVI, BAföG, GDRFA).
4. GEO Named Entities: 4-6 key institutions, cities, statutory programs mentioned.
5. 4-5 Key Takeaways: Scannable, authoritative bullet points.
6. Recommended Slug: Clean URL slug.

Return a STRICT, valid JSON object:
{
  "titles": ["Title 1", "Title 2", "Title 3"],
  "metaDescriptions": ["Desc 1", "Desc 2", "Desc 3"],
  "answerSummary": "40-60 word authoritative answer with exact figures and authorities.",
  "geoSummary": "Entity list (e.g. IRCC, UKVI, London, Dubai, Bank Statement, 2026)",
  "keyTakeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3", "Takeaway 4"],
  "recommendedSlug": "clean-kebab-case-slug"
}`;

  const raw = await callQwenChat({
    messages: [
      { role: 'system', content: 'You are an SEO & AEO expert AI that returns only valid JSON.' },
      { role: 'user', content: prompt }
    ],
    enableSearch: true,
    temperature: 0.3,
  });

  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');

  return JSON.parse(cleaned);
}

module.exports = {
  getLiveDestinationCosts,
  examineCandidateProfile,
  suggestSeoContent,
  callQwenChat,
};
