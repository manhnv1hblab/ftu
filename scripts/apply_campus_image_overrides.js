const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dataPath = path.join(root, 'data', 'universities_s27.json');
const overridesPath = path.join(root, 'data', 'campus_image_overrides.json');
const universities = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const overrides = JSON.parse(fs.readFileSync(overridesPath, 'utf8'));
const blockedOverrides = new Set([
  'guangdong-university-of-foreign-studies-south-china-business-college-scbc',
  's-p-jain-institute-of-management-research',
  'meiji-university-school-of-information-and-communication',
  'meiji-university-school-of-political-science-and-economics',
  'mukogawa-women-s-university',
  'sookmyung-women-s-university',
  'queensland-university-of-technology-qut',
]);

for (const university of universities) {
  const override = overrides[university.id];
  if (!override || blockedOverrides.has(university.id)) continue;
  university.imageUrl = override.imageUrl;
  university.imageSourceUrl = override.sourceUrl;
  university.imageSourceType = override.official ? 'official-campus-image' : 'internet-campus-image';
  university.imageVerifiedAt = '2026-09-21';
  if (override.title) university.imageSearchTitle = override.title;
}

fs.writeFileSync(dataPath, `${JSON.stringify(universities, null, 2)}\n`, 'utf8');
console.log(`Applied ${Object.keys(overrides).length} campus image overrides.`);
