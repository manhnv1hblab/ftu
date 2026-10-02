// Apply reviewed status and partner-alias rules to equivalence records only.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const dataPath = path.join(root, 'data', 'equivalences_s27.json');
const aliasSource = fs.readFileSync(path.join(root, 'scripts', 'normalize_data.py'), 'utf8');
const aliasBlock = aliasSource.match(/PARTNER_NAME_ALIASES\s*=\s*\{([\s\S]*?)\n\}/)?.[1];
if (!aliasBlock) throw new Error('Could not read the explicit partner alias table.');
const aliases = [...aliasBlock.matchAll(/^\s*"([^"]+)"\s*:\s*"([^"]+)"\s*,?\s*$/gm)]
  .map(match => [match[1], match[2]]);
const normalize = value => String(value || '').normalize('NFKC').normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('en')
  .replace(/[^a-z0-9]+/g, ' ').trim();
const universities = JSON.parse(fs.readFileSync(path.join(root, 'data', 'universities_s27.json'), 'utf8'));
const partnerIds = new Map();
for (const university of universities) {
  for (const name of [university.name, university.aliasInTong].filter(Boolean)) partnerIds.set(normalize(name), university.id);
}
const explicitNamesToIds = new Map();
for (const [partnerName, sourceAlias] of aliases) {
  const partnerId = partnerIds.get(normalize(partnerName));
  if (partnerId) {
    explicitNamesToIds.set(normalize(partnerName), partnerId);
    explicitNamesToIds.set(normalize(sourceAlias), partnerId);
  }
}

const records = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const previous = {
  statuses: records.reduce((result, row) => (result[row.status] = (result[row.status] || 0) + 1, result), {}),
  unlinked: records.filter(row => !row.partnerS27Id).length
};
let newlyLinked = 0;
for (const row of records) {
  if (!row.partnerS27Id) {
    const id = explicitNamesToIds.get(normalize(row.partnerUni));
    if (id) { row.partnerS27Id = id; newlyLinked += 1; }
  }
  const rawName = String(row.ftuCourseNameRaw || '').toLocaleLowerCase('vi-VN');
  if (['không tương đương', 'không ương đương', 'không có học phần', 'từ chối', 'ko tương đương'].some(marker => rawName.includes(marker))) {
    row.status = 'REJECTED';
  } else if (['đang xét', 'chờ xét', 'đang xin ý kiến'].some(marker => rawName.includes(marker))) {
    row.status = 'PENDING';
  } else if (['chưa rõ', 'xem lại', 'cần rà soát', 'chưa xác minh'].some(marker => rawName.includes(marker))) {
    row.status = 'UNCERTAIN';
  } else if (row.approver || row.approvalYear) {
    row.status = 'APPROVED';
  } else {
    row.status = 'UNCERTAIN';
  }
  delete row.statusReason;
}
const current = {
  statuses: records.reduce((result, row) => (result[row.status] = (result[row.status] || 0) + 1, result), {}),
  unlinked: records.filter(row => !row.partnerS27Id).length
};
fs.writeFileSync(dataPath, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ previous, current, newlyLinked }, null, 2));
