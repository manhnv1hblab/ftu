import json
import os
import sys
import unicodedata
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / 'data'
DOC_DIR = PROJECT_ROOT / 'document'

REQUIRED_DOCUMENTS = [
    '[CTTĐ_S27] Danh sách trường đối tác trao đổi.xlsx',
    'Danh sách học phần tương đương (với các trường đối tác).xlsx',
    'Bảng chi phí ước tình khi tham gia kỳ trao đổi.xlsx',
    'Copy of Kế hoạch mở môn năm học 2627 theo số lớp - V2.xlsx',
    'ChuongTrinhDaoTao.xlsx',
    'Quy trình tham gia CTTD học kỳ II năm học 2026 - 2027.docx'
]
source_checks = []
for name in REQUIRED_DOCUMENTS:
    path = DOC_DIR / name
    exists = path.is_file() and path.stat().st_size > 0
    source_checks.append({'file': name, 'exists': exists, 'sizeBytes': path.stat().st_size if path.is_file() else 0})
if not all(item['exists'] for item in source_checks):
    print(json.dumps({'sourceChecks': source_checks}, ensure_ascii=False, indent=2))
    raise SystemExit('Source document audit failed: a required document is missing or empty.')

with open(os.path.join(DATA_DIR, "universities_s27.json"), encoding="utf-8") as f:
    unis = json.load(f)

with open(os.path.join(DATA_DIR, "equivalences_s27.json"), encoding="utf-8") as f:
    eqs = json.load(f)

with open(os.path.join(DATA_DIR, "costs_by_country.json"), encoding="utf-8") as f:
    costs = json.load(f)

with open(os.path.join(DATA_DIR, "course_offerings_2627.json"), encoding="utf-8") as f:
    offerings = json.load(f)

with open(os.path.join(DATA_DIR, "sample_curriculum.json"), encoding="utf-8") as f:
    curriculum = json.load(f)

report = {
    "sourceChecks": source_checks,
    "summary": {
        "partnerUniversitiesCount": len(unis),
        "totalEquivalenceRows": len(eqs),
        "approvedEquivalences": sum(1 for e in eqs if e["status"] == "APPROVED"),
        "pendingEquivalences": sum(1 for e in eqs if e["status"] == "PENDING"),
        "rejectedEquivalences": sum(1 for e in eqs if e["status"] == "REJECTED"),
        "uncertainEquivalences": sum(1 for e in eqs if e["status"] == "UNCERTAIN"),
        "courseOfferingsCount": len(offerings),
        "sampleCurriculumCourses": len(curriculum),
        "countriesWithCost": len(costs)
    },
    "dataQualityChecks": {
        "duplicateUniversityIds": [],
        "duplicateEquivalenceIds": [],
        "equivalencesReferencingUnknownUniversity": [],
        "equivalencesWithoutPartnerId": [],
        "universitiesWithoutEquivalences": [],
        "countriesWithoutCost": [],
        "curriculumDuplicateCourseCodes": [],
        "offeringsMissingCourseCode": [],
        "swissCostDiscrepancy": {
            "hasDiscrepancy": True,
            "details": "Thụy Sĩ vs Thuỵ Sỹ có mức chi phí khác nhau trong tài liệu gốc. Đã gắn cờ requiresVerification."
        },
        "sampleCurriculumValidation": {
            "totalCourses": len(curriculum),
            "passedCourses": sum(1 for c in curriculum if c["isPassed"]),
            "takenButNotPassedCourses": sum(1 for c in curriculum if c["isTaken"] and not c["isPassed"]),
            "remainingCourses": sum(1 for c in curriculum if not c["isPassed"])
        }
    }
}

report["dataQualityChecks"]["recordsWithoutSource"] = []
report["dataQualityChecks"]["sourceFilesOutsideDocument"] = []
allowed_source_files = set(REQUIRED_DOCUMENTS)
for collection_name, collection in {
    "universities": unis,
    "equivalences": eqs,
    "courseOfferings": offerings,
    "curriculum": curriculum,
    "costs": list(costs.values())
}.items():
    for index, record in enumerate(collection):
        source = record.get('source') if isinstance(record, dict) else None
        if not source or not source.get('file'):
            report["dataQualityChecks"]["recordsWithoutSource"].append({'collection': collection_name, 'index': index})
        elif source.get('file') not in allowed_source_files:
            report["dataQualityChecks"]["sourceFilesOutsideDocument"].append({'collection': collection_name, 'index': index, 'file': source.get('file')})

if report["dataQualityChecks"]["recordsWithoutSource"] or report["dataQualityChecks"]["sourceFilesOutsideDocument"]:
    print('ERROR: normalized data contains records without a valid document source.')
    raise SystemExit(2)

uni_ids = set()
for u in unis:
    if u["id"] in uni_ids:
        report["dataQualityChecks"]["duplicateUniversityIds"].append(u["id"])
    uni_ids.add(u["id"])

eq_ids = set()
for eq in eqs:
    if eq.get("id") in eq_ids:
        report["dataQualityChecks"]["duplicateEquivalenceIds"].append(eq.get("id"))
    eq_ids.add(eq.get("id"))
    if eq.get("partnerS27Id") and eq["partnerS27Id"] not in uni_ids:
        report["dataQualityChecks"]["equivalencesReferencingUnknownUniversity"].append({
            "id": eq.get("id"),
            "partnerS27Id": eq.get("partnerS27Id"),
            "partnerUni": eq.get("partnerUni")
        })
    if not eq.get("partnerS27Id"):
        report["dataQualityChecks"]["equivalencesWithoutPartnerId"].append({
            "id": eq.get("id"),
            "partnerUni": eq.get("partnerUni")
        })

def normalize_country(value):
    text = unicodedata.normalize('NFKC', str(value or '').strip()).casefold()
    aliases = {
        'korea': 'hàn quốc',
        'south korea': 'hàn quốc',
        'japan': 'nhật bản',
        'taiwan': 'đài loan',
        'china': 'trung quốc',
        'usa': 'mỹ',
        'united states': 'mỹ',
        'australia': 'úc',
        'germany': 'đức',
        'france': 'pháp',
        'finland': 'phần lan',
        'sweden': 'thuỵ điển',
        'switzerland': 'thuỵ sỹ',
        'italy': 'ý',
        'spain': 'tây ban nha',
        'belgium': 'bỉ',
        'norway': 'na uy',
        'russia': 'nga'
    }
    return aliases.get(text, text).replace('thụy', 'thuỵ')

cost_country_names = {normalize_country(country) for country in costs.keys()}
for university in unis:
    if normalize_country(university.get("country")) not in cost_country_names:
        report["dataQualityChecks"]["countriesWithoutCost"].append({
            "universityId": university.get("id"),
            "country": university.get("country")
        })

curriculum_codes = set()
for course in curriculum:
    code = str(course.get("courseCode", "")).strip().upper()
    if code in curriculum_codes:
        report["dataQualityChecks"]["curriculumDuplicateCourseCodes"].append(code)
    curriculum_codes.add(code)

for offering in offerings:
    if not str(offering.get("courseCode", "")).strip():
        report["dataQualityChecks"]["offeringsMissingCourseCode"].append(offering.get("source", {}))

critical_quality_errors = (
    report["dataQualityChecks"]["duplicateUniversityIds"]
    + report["dataQualityChecks"]["duplicateEquivalenceIds"]
    + report["dataQualityChecks"]["equivalencesReferencingUnknownUniversity"]
    + report["dataQualityChecks"]["curriculumDuplicateCourseCodes"]
    + report["dataQualityChecks"]["offeringsMissingCourseCode"]
)
if critical_quality_errors:
    print('ERROR: critical data quality checks failed.')
    raise SystemExit(3)

# Partner unis with approved equivalences
approved_uni_ids = set(e["partnerS27Id"] for e in eqs if e["partnerS27Id"] and e["status"] == "APPROVED")
for u in unis:
    if u["id"] not in approved_uni_ids:
        report["dataQualityChecks"]["universitiesWithoutEquivalences"].append({
            "id": u["id"],
            "name": u["name"],
            "country": u["country"]
        })

print("=== DATA VALIDATION REPORT ===")
print(json.dumps(report, ensure_ascii=False, indent=2))

with open(os.path.join(DATA_DIR, "validation_report.json"), "w", encoding="utf-8") as f:
    json.dump(report, f, ensure_ascii=False, indent=2)

print("Saved report to data/validation_report.json")
