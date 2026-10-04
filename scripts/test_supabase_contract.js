const fs = require('fs');
const path = require('path');

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
  ['Signup requires an immediate session', read('src/context/AuthContext.tsx').includes("EMAIL_CONFIRMATION_REQUIRED")],
  ['Email confirmation is disabled for password signup', read('supabase/config.toml').includes('[auth.email]') && read('supabase/config.toml').includes('enable_confirmations = false')],
  ['Login has no email verification step', !read('src/app/auth/login/page.tsx').includes('resendConfirmation')],
  ['Auth does not expose Google login', !read('src/context/AuthContext.tsx').includes('signInWithGoogle') && !read('src/app/auth/login/page.tsx').includes('Google')],
  ['Service role is server-only', !read('src/lib/supabase/server.ts').includes("'use client'")],
  ['Service role is not referenced by client source', !clientFiles.some(file => fs.readFileSync(file, 'utf8').includes('SUPABASE_SERVICE_ROLE_KEY'))],
];
for (const [label, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${label}`);
if (checks.some(([, pass]) => !pass)) process.exit(1);
