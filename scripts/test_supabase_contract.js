const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const { isPlainRecord, isSafeLocalRedirect, isValidDataVersion, publicReview } = require('../src/lib/apiValidation.ts');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
const clientFiles = walk(path.join(root, 'src')).filter(file => /\.(ts|tsx)$/.test(file) && !file.endsWith(`${path.sep}lib${path.sep}supabase${path.sep}server.ts`) && !file.includes(`${path.sep}app${path.sep}api${path.sep}`));
const checks = [
  ['Supabase browser client exists', fs.existsSync(path.join(root, 'src/lib/supabase/client.ts'))],
  ['Supabase server client exists', fs.existsSync(path.join(root, 'src/lib/supabase/server.ts'))],
  ['RLS migration exists', fs.existsSync(path.join(root, 'supabase/migrations/001_initial.sql'))],
  ['Planner API requires authenticated user', read('src/app/api/planner/draft/route.ts').includes("Bạn cần đăng nhập")],
  ['Review API validates source university', read('src/app/api/reviews/route.ts').includes('universityName !== university.name')],
  ['Auth normalizes email rate limits', read('src/context/AuthContext.tsx').includes("EMAIL_RATE_LIMIT")],
  ['Auth explains SMTP delivery errors', read('src/context/AuthContext.tsx').includes("EMAIL_PROVIDER_ERROR")],
  ['Signup does not require email confirmation', !read('src/context/AuthContext.tsx').includes('EMAIL_CONFIRMATION_REQUIRED') && !read('src/app/api/planner/draft/route.ts').includes('email_confirmed_at')],
  ['Email confirmation is disabled for password signup', read('supabase/config.toml').includes('[auth.email]') && read('supabase/config.toml').includes('enable_confirmations = false')],
  ['Login has no email verification step', !read('src/app/auth/login/page.tsx').includes('resendConfirmation')],
  ['Auth does not expose Google login', !read('src/context/AuthContext.tsx').includes('signInWithGoogle') && !read('src/app/auth/login/page.tsx').includes('Google')],
  ['Service role is server-only', !read('src/lib/supabase/server.ts').includes("'use client'")],
  ['Service role is not referenced by client source', !clientFiles.some(file => fs.readFileSync(file, 'utf8').includes('SUPABASE_SERVICE_ROLE_KEY'))],
  ['Review rate limit is durable and atomic', read('supabase/migrations/002_review_rate_limit.sql').includes('consume_review_rate_limit') && read('src/app/api/reviews/route.ts').includes("admin.rpc('consume_review_rate_limit'")],
  ['Anonymous review names are discarded and redacted', read('src/app/api/reviews/route.ts').includes('display_name: isAnonymous ? null : displayName') && read('src/app/api/reviews/route.ts').includes('.map(publicReview)')],
  ['Review filters are checked against source data', read('src/app/api/reviews/route.ts').includes('!universityIds.has(universityId)') && read('src/app/api/reviews/route.ts').includes('!countries.has(country)')],
  ['Draft payload size is bounded', read('src/app/api/planner/draft/route.ts').includes('MAX_DRAFT_BYTES')],
];
for (const [label, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${label}`);
if (checks.some(([, pass]) => !pass)) process.exit(1);

assert.equal(isSafeLocalRedirect('/planner?step=2'), true);
assert.equal(isSafeLocalRedirect('//attacker.example/path'), false);
assert.equal(isSafeLocalRedirect('https://attacker.example'), false);
assert.equal(isValidDataVersion('s27.2026-09-21'), true);
assert.equal(isValidDataVersion(''), false);
assert.equal(isPlainRecord({ profile: {} }), true);
assert.equal(isPlainRecord([]), false);
assert.equal(publicReview({ is_anonymous: true, display_name: 'Private' }).display_name, null);
assert.equal(publicReview({ is_anonymous: false, display_name: 'Public' }).display_name, 'Public');
console.log('PASS API boundary helper behavior');
