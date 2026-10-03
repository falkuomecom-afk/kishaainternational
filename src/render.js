'use strict';
/**
 * Minimal dependency-free template engine.
 *  {{ path.to.value }}   escaped output
 *  {{{ raw }}}           unescaped output
 *  {{helper a b key=x}}  helper call
 *  {{#if expr}} … {{else if expr}} … {{else}} … {{/if}}
 *  {{#each list}} … {{/each}}   ({{this}}, {{@index}}, {{@key}}, {{@first}}, {{@last}})
 *  {{> partialName}}     include (shares context)
 * Line-based block tags leave no stray whitespace, so rendered HTML stays tidy.
 */
const fs = require('fs');
const path = require('path');

const HELPERS = {};
function registerHelpers(obj) { Object.assign(HELPERS, obj); }

const cache = new Map();
function loadTemplate(name, dir) {
  const file = path.join(dir, name + '.html');
  if (!fs.existsSync(file)) throw new Error(`Template not found: ${file}`);
  const mtime = fs.statSync(file).mtimeMs;
  const hit = cache.get(file);
  // Recompile whenever the file changes on disk so editors see their edits immediately.
  if (hit && hit.mtime === mtime) return hit.compiled;
  const compiled = compile(fs.readFileSync(file, 'utf8'));
  cache.set(file, { mtime, compiled });
  return compiled;
}
function clearCache() { cache.clear(); }

const ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };
const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"'`]/g, c => ESCAPE_MAP[c]);

/** Split an argument list on top-level whitespace, respecting quotes and parentheses. */
function splitArgs(str) {
  const out = []; let cur = ''; let depth = 0; let q = null;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (q) { cur += ch; if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
    if (ch === '(' || ch === '[') { depth++; cur += ch; continue; }
    if (ch === ')' || ch === ']') { depth--; cur += ch; continue; }
    if (/\s/.test(ch) && depth <= 0) { if (cur) { out.push(cur); cur = ''; } continue; }
    cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

/** Find the index of a top-level "=" (not inside quotes, parens or brackets), or -1. */
function topLevelEq(raw) {
  let depth = 0, q = null;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (q) { if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'") { q = ch; continue; }
    if (ch === '(' || ch === '[') { depth++; continue; }
    if (ch === ')' || ch === ']') { depth--; continue; }
    if (ch === '=' && depth === 0) return i;
  }
  return -1;
}

function literalOrPath(v) {
  v = String(v).trim();
  if (/^-?\d+(\.\d+)?$/.test(v)) return { type: 'number', value: Number(v) };
  if (v === 'true') return { type: 'boolean', value: true };
  if (v === 'false') return { type: 'boolean', value: false };
  if (v === 'null') return { type: 'null' };
  if (/^"([\s\S]*)"$/.test(v) || /^'([\s\S]*)'$/.test(v)) return { type: 'string', value: v.slice(1, -1) };
  if (v.startsWith('(') && v.endsWith(')')) return { type: 'sub', value: v.slice(1, -1).trim() };
  if (v.startsWith('[') && v.endsWith(']')) return { type: 'list', value: v.slice(1, -1) };
  return { type: 'path', value: v };
}

function parseArgs(str) {
  const args = [];
  const kwargs = {};
  for (const raw of splitArgs(str)) {
    const eq = topLevelEq(raw);
    if (eq > 0 && /^[A-Za-z_$][\w$]*$/.test(raw.slice(0, eq))) {
      const key = raw.slice(0, eq);
      kwargs[key] = literalOrPath(raw.slice(eq + 1));
      continue;
    }
    args.push(literalOrPath(raw));
  }
  return { args, kwargs };
}

function resolvePath(ctx, pathStr) {
  if (!pathStr) return undefined;
  if (pathStr.startsWith('@root')) {                  // explicit root reference
    const root = (ctx && ctx.__root) || ctx;
    const rest = pathStr.slice(5).replace(/^\./, '');
    return rest ? resolvePath(root, rest) : root;
  }
  if (pathStr === 'this' || pathStr === '.') {
    return (ctx && Object.prototype.hasOwnProperty.call(ctx, 'this')) ? ctx.this : ctx;
  }
  while (pathStr.startsWith('../')) {                 // walk up the context chain
    pathStr = pathStr.slice(3);
    const parent = Object.getPrototypeOf(ctx);
    if (parent && parent !== Object.prototype) ctx = parent;
  }
  if (pathStr.startsWith('this.')) pathStr = pathStr.slice(5);
  const parts = pathStr.replace(/\[(\d+)\]/g, '.$1').split('.');
  let cur = ctx;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function evalExpr(expr, ctx, opts) {
  expr = String(expr).trim();
  // helper call?
  const sp = expr.indexOf(' ');
  if (sp > 0) {
    const name = expr.slice(0, sp);
    if (HELPERS[name]) {
      const { args, kwargs } = parseArgs(expr.slice(sp));
      const vals = args.map(a => evalArg(a, ctx, opts));
      const kw = {};
      for (const k in kwargs) kw[k] = evalArg(kwargs[k], ctx, opts);
      return HELPERS[name](...vals, { ...kw, _ctx: ctx, _opts: opts });
    }
  }
  if (HELPERS[expr]) return HELPERS[expr]({ _ctx: ctx });
  if (expr === 'true') return true;
  if (expr === 'false') return false;
  if (expr === 'null' || expr === 'undefined') return undefined;
  if (/^-?\d+(\.\d+)?$/.test(expr)) return Number(expr);
  if (/^(["']).*\1$/.test(expr)) return expr.slice(1, -1);
  return resolvePath(ctx, expr);
}
function evalArg(a, ctx, opts) {
  if (!a) return undefined;
  if (a.type === 'string') return a.value;
  if (a.type === 'number') return a.value;
  if (a.type === 'boolean') return a.value;
  if (a.type === 'null') return null;
  if (a.type === 'sub') return evalExpr(a.value, ctx, opts);          // e.g. (default a 'x')
  if (a.type === 'list') return splitArgs(a.value).map(v => evalArg(literalOrPath(v), ctx, opts));
  if (a.type === 'path') return resolvePath(ctx, a.value);
  return a.raw;
}

function truthy(v) {
  if (Array.isArray(v)) return v.length > 0;
  return !!v;
}

function compile(src) {
  // Split into segments with token objects
  const tokens = [];
  const re = /\{\{\{([\s\S]+?)\}\}\}|\{\{([\s\S]+?)\}\}/g;
  let last = 0, m;
  while ((m = re.exec(src))) {
    if (m.index > last) tokens.push({ t: 'text', v: src.slice(last, m.index) });
    if (m[1] !== undefined) tokens.push({ t: 'raw', v: m[1].trim() });
    else tokens.push({ t: 'tag', v: m[2].trim() });
    last = re.lastIndex;
  }
  if (last < src.length) tokens.push({ t: 'text', v: src.slice(last) });

  let pos = 0;
  function parse(stopTags) {
    const nodes = [];
    while (pos < tokens.length) {
      const tok = tokens[pos];
      if (tok.t === 'text' || tok.t === 'raw') { nodes.push(tok); pos++; continue; }
      const v = tok.v;
      if (v.startsWith('#')) {
        const cmd = v.slice(1).trim();
        const [kw, ...restArr] = cmd.split(/\s+/);
        const rest = restArr.join(' ');
        if (kw === 'if' || kw === 'unless') {
          pos++;
          const branches = [];
          let cond = kw === 'if' ? rest : `not ${rest}`;
          let body = parse(['else', '/if', 'else if']);
          branches.push({ cond, body });
          while (tokens[pos] && tokens[pos].t === 'tag' && tokens[pos].v.startsWith('else')) {
            const tag = tokens[pos].v;
            if (tag === 'else') { pos++; branches.push({ cond: true, body: parse(['/if', 'else if']) }); }
            else if (tag.startsWith('else if')) { const c = tag.slice(7).trim(); pos++; branches.push({ cond: c, body: parse(['/if', 'else if']) }); }
            else break;
          }
          if (tokens[pos] && tokens[pos].v === '/if') pos++;
          nodes.push({ t: 'if', branches });
          continue;
        }
        if (kw === 'each') {
          pos++;
          const body = parse(['/each']);
          if (tokens[pos]) pos++;
          nodes.push({ t: 'each', expr: rest, body });
          continue;
        }
        if (kw === 'with') {
          pos++;
          const body = parse(['/with']);
          if (tokens[pos]) pos++;
          nodes.push({ t: 'with', expr: rest, body });
          continue;
        }
      }
      if (v.startsWith('/') || v === 'else' || v.startsWith('else if')) {
        if (stopTags && stopTags.includes(v.split(/\s+/)[0])) return nodes;
        pos++; continue;
      }
      if (v.startsWith('>')) { nodes.push({ t: 'include', name: v.slice(1).trim() }); pos++; continue; }
      nodes.push({ t: 'expr', v });
      pos++;
    }
    return nodes;
  }
  const ast = parse(null);
  return (ctx, opts = {}) => render(ast, ctx, opts);
}

function render(nodes, ctx, opts) {
  let out = '';
  for (const n of nodes) {
    if (n.t === 'text') { out += n.v; continue; }
    if (n.t === 'raw') { out += String(evalExpr(n.v, ctx, opts) ?? ''); continue; }
    if (n.t === 'expr') {
      const val = evalExpr(n.v, ctx, opts);
      const first = n.v.split(/\s+/)[0];
      const isRaw = HELPERS[first] && HELPERS[first].__raw;
      out += (isRaw || n.v.startsWith('json ') || n.v.startsWith('safe ')) ? String(val ?? '') : escapeHtml(val);
      continue;
    }
    if (n.t === 'if') {
      let done = false;
      for (const b of n.branches) {
        if (done) break;
        if (truthy(evalExpr(b.cond, ctx, opts))) { out += render(b.body, ctx, opts); done = true; }
      }
      continue;
    }
    if (n.t === 'each') {
      const list = evalExpr(n.expr, ctx, opts);
      if (Array.isArray(list)) {
        list.forEach((item, i) => {
          const child = Object.create(ctx || {});
          child.__root = (ctx && ctx.__root) || ctx;
          child.this = item;
          if (item && typeof item === 'object') Object.assign(child, item);
          child['@index'] = i; child['@key'] = i; child['@first'] = i === 0; child['@last'] = i === list.length - 1;
          child['@number'] = i + 1;
          out += render(n.body, child, opts);
        });
      } else if (list && typeof list === 'object') {
        let i = 0;
        for (const k of Object.keys(list)) {
          const child = Object.create(ctx || {});
          child.__root = (ctx && ctx.__root) || ctx;
          child.this = list[k]; child['@key'] = k; child['@index'] = i++;
          if (list[k] && typeof list[k] === 'object') Object.assign(child, list[k]);
          out += render(n.body, child, opts);
        }
      }
      continue;
    }
    if (n.t === 'with') {
      const v = evalExpr(n.expr, ctx, opts);
      const child = Object.create(ctx || {});
      if (v && typeof v === 'object') Object.assign(child, v);
      child.this = v;
      out += render(n.body, child, opts);
      continue;
    }
    if (n.t === 'include') {
      const partial = loadTemplate('partials/' + n.name, opts.viewsDir || path.join(__dirname, '..', '..', 'views'));
      out += partial(ctx, opts);
      continue;
    }
  }
  return out;
}

/** Render a top-level view (partials resolved from views/). */
function renderView(viewName, ctx, viewsDir) {
  const dir = viewsDir || path.join(__dirname, '..', '..', 'views');
  const tpl = loadTemplate('site/' + viewName, dir);           // fallback lookup order
  return tpl(ctx, { viewsDir: dir });
}
function renderNamed(relName, ctx, viewsDir) {
  const dir = viewsDir || path.join(__dirname, '..', '..', 'views');
  const tpl = loadTemplate(relName, dir);
  return tpl(ctx, { viewsDir: dir });
}

/** Strip template-only lines so output HTML has no blank block lines. */
function tidy(html) {
  return html.replace(/^\s*\n/gm, '\n').replace(/\n{3,}/g, '\n\n');
}

module.exports = { registerHelpers, renderNamed, renderView, tidy, clearCache, escapeHtml, resolvePath };
