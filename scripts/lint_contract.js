const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const roots = [path.join(root, 'src'), path.join(root, 'scripts')];
const forbidden = [
  /ManhNV1/i,
  /ftu - Copy/i,
  /COUNTRY_DEFAULTS/,
  /defaultUni\d/,
  /Miễn 100% học phí song phương FTU/,
  /20\/10\/2026 \(Chốt đề cử FTU/,
  /IELTS ≥ 6\.0/
];

function filesIn(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return filesIn(absolute);
    return /\.(ts|tsx|js|py)$/.test(entry.name) ? [absolute] : [];
  });
}

const violations = [];
for (const directory of roots) {
  for (const file of filesIn(directory)) {
    if (path.basename(file) === 'lint_contract.js') continue;
    const content = fs.readFileSync(file, 'utf8');
    for (const pattern of forbidden) {
      if (pattern.test(content)) violations.push(`${path.relative(root, file)} matches ${pattern}`);
    }
  }
}

if (violations.length) {
  console.error('Production data contract lint failed:');
  violations.forEach((violation) => console.error(`- ${violation}`));
  process.exit(1);
}

console.log('Production data contract lint: PASS');
