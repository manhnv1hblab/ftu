const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dataPath = path.join(root, 'data', 'universities_s27.json');
const universities = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// These image hosts returned a broken/blocked asset during the release audit.
// Keep the partner-specific official identity image instead of shipping a
// broken campus tile.
const unreachable = new Set([
  'guangdong-university-of-foreign-studies-south-china-business-college-scbc',
  's-p-jain-institute-of-management-research',
  'meiji-university-school-of-information-and-communication',
  'meiji-university-school-of-political-science-and-economics',
  'mukogawa-women-s-university',
  'sookmyung-women-s-university',
  'queensland-university-of-technology-qut',
]);

for (const university of universities) {
  if (!unreachable.has(university.id)) continue;
  university.imageUrl = university.logoUrl;
  university.imageSourceUrl = university.websiteUrl;
  university.imageSourceType = 'official-domain-favicon';
  university.imageVerifiedAt = '2026-09-21';
  delete university.imageSearchTitle;
}

fs.writeFileSync(dataPath, `${JSON.stringify(universities, null, 2)}\n`, 'utf8');
console.log(`Restored ${unreachable.size} unreachable campus images to official identity fallbacks.`);
