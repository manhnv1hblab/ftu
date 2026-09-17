import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

DATA_DIR = r'c:\Users\ManhNV1\Desktop\ftu - Copy\data'

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
        "universitiesWithoutEquivalences": [],
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

uni_ids = set()
for u in unis:
    if u["id"] in uni_ids:
        report["dataQualityChecks"]["duplicateUniversityIds"].append(u["id"])
    uni_ids.add(u["id"])

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
