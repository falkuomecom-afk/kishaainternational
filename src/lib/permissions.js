'use strict';
/**
 * Role-based access control — server enforced.
 * Mirrors "Access & Responsibilities" (brief p.20). Buttons are hidden for
 * convenience only; every route & API checks permissions here.
 */
const PERMISSIONS = {
  'content.view':        'View content lists and editors',
  'content.create':      'Create drafts (pages, posts, programs, FAQs)',
  'content.edit':        'Edit existing content records',
  'content.publish':     'Publish or unpublish content',
  'content.delete':      'Move content to trash and restore',
  'content.review':      'Approve contributor submissions for publication',
  'media.manage':        'Upload and curate the media library',
  'menus.manage':        'Edit menus, header/footer and global sections',
  'seo.manage':          'Edit SEO metadata, redirects and sitemap rules',
  'settings.manage':     'Edit site identity, contacts and design tokens',
  'integrations.manage': 'Configure providers and view connection health',
  'leads.view':          'View leads (own/assigned or all per role scope)',
  'leads.assign':        'Assign or reassign lead owners',
  'leads.edit':          'Record activities, stages and follow-ups',
  'leads.export':        'Export lead data to CSV (audited)',
  'reports.view':        'View operational reporting',
  'rules.approve':       'Approve and publish versioned funds & fee rules',
  'users.manage':        'Create, disable and permission user accounts',
  'audit.view':          'Inspect the audit trail',
  'tools.run':           'Run imports, exports, backups and maintenance tools',
};

const ROLES = {
  administrator: {
    label: 'Administrator',
    description: 'Manage accounts, site settings, integrations, content and operational access.',
    permissions: Object.keys(PERMISSIONS),
  },
  content_editor: {
    label: 'Content Editor',
    description: 'Edit approved content, media, menus and SEO; review and publish if granted.',
    permissions: ['content.view','content.create','content.edit','content.publish','content.review',
                  'content.delete','media.manage','menus.manage','seo.manage','reports.view'],
  },
  contributor: {
    label: 'Contributor',
    description: 'Prepare drafts and upload allowed media; submit for review.',
    permissions: ['content.view','content.create','content.edit','media.manage'],
  },
  lead_manager: {
    label: 'Lead Manager',
    description: 'View/assign leads, manage stages and follow-ups, reporting and approved export.',
    permissions: ['content.view','leads.view','leads.assign','leads.edit','leads.export','reports.view'],
  },
  rule_reviewer: {
    label: 'Rule Reviewer',
    description: 'Approve and publish versioned funds rules, fees and planner sources.',
    permissions: ['content.view','content.edit','rules.approve','reports.view'],
  },
  trainer: {
    label: 'Trainer / Consultant',
    description: 'View assigned leads and confirmed tasks; add contact notes and progress.',
    permissions: ['content.view','content.edit','leads.view','leads.edit'],
  },
  visitor: {
    label: 'Public Visitor',
    description: 'Read published content, use the cost planner and submit an enquiry.',
    permissions: [],
  },
};

function can(user, permission) {
  if (!user) return false;
  const role = ROLES[user.role];
  if (!role) return false;
  return role.permissions.includes(permission);
}
function canAny(user, perms) { return perms.some(p => can(user, p)); }

/** Lead visibility scope: trainers see only their assigned leads. */
function leadScope(user) {
  if (!user) return { clause: '1 = 0', params: [] };
  if (user.role === 'trainer') return { clause: 'l.owner_id = ?', params: [user.id] };
  if (can(user, 'leads.view')) return { clause: '1 = 1', params: [] };
  return { clause: '1 = 0', params: [] };
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) return res.redirect('/admin/login?next=' + encodeURIComponent(req.originalUrl));
    if (!can(req.user, permission)) {
      if (req.path.startsWith('/api') || req.xhr || req.get('accept')?.includes('application/json')) {
        return res.status(403).json({ ok: false, error: 'forbidden', message: `Missing permission: ${permission}` });
      }
      return res.status(403).render('admin/error', {
        title: 'Access denied', status: 403, user: req.user,
        message: `Your role (${ROLES[req.user.role]?.label || req.user.role}) does not include “${permission}”.`,
        permission,
      });
    }
    next();
  };
}

module.exports = { PERMISSIONS, ROLES, can, canAny, leadScope, requirePermission };
