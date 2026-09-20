import openpyxl
import docx
import json
import os
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DOC_DIR = PROJECT_ROOT / 'document'
DATA_DIR = PROJECT_ROOT / 'data'
os.makedirs(DATA_DIR, exist_ok=True)

REQUIRED_DOCUMENTS = [
    '[CTTĐ_S27] Danh sách trường đối tác trao đổi.xlsx',
    'Danh sách học phần tương đương (với các trường đối tác).xlsx',
    'Bảng chi phí ước tình khi tham gia kỳ trao đổi.xlsx',
    'Copy of Kế hoạch mở môn năm học 2627 theo số lớp - V2.xlsx',
    'ChuongTrinhDaoTao.xlsx',
    'Quy trình tham gia CTTD học kỳ II năm học 2026 - 2027.docx'
]
missing_documents = [name for name in REQUIRED_DOCUMENTS if not (DOC_DIR / name).is_file() or (DOC_DIR / name).stat().st_size == 0]
if missing_documents:
    raise FileNotFoundError(f'Missing or empty source documents: {missing_documents}')

# -------------------------------------------------------------
# 1. Partner University Name Mapping / Alias Dictionary
# -------------------------------------------------------------
# Maps university names as they appear in [CTTĐ_S27] to exact names in Sheet Tổng
PARTNER_NAME_ALIASES = {
    "Chung-Ang University": "Chung Ang University (CAU)",
    "Doshisha Women's College of Liberal Arts": "Doshisha Women's College of Liberal Arts (DWCLA)",
    "Kwansei Gakuin University": "Kwansei Gakuin University (KGU)",
    "Nara Women's University": "Nara Women University (NWU)",
    "Osaka University of Economics": "Osaka University of Economics (OUE)",
    "Otemon Gakuin University": "Otemon Gakuin University (OGU)",
    "Kangwon National University": "Kangwon National University (KNU)",
    "Pukyong National University": "Pukyong National University (PKNU)",
    "Seoul National University": "Seoul National University (SNU)",
    "Sopot University of Applied Sciences": "Sopot University of Applied Sciences (SANS)",
    "Neu-Ulm University of Applied Sciences": "Neu-Ulm University of Applied Sciences (HNU)",
    "The University of Applied Sciences and Arts Northwestern Switzerland, Olten (FHNW)": "University of Applied Sciences and Arts, Northwestern Switzerland, Olten (FHNW)",
    "Queensland University of Technology (QUT)": "Queensland University of Technology",
    "Ecolé 3A": "3A Lyon (Ecolé 3A)",
    "Sciences Po": "Sciences Po University",
    "Université Polytechinique Hauts de France (UPHF)": "Université Polytechnique Hauts-de-France",
    "Aix-Marseille University": "Aix-Marseille Université",
    "Heinrich-Heine University Dusseldorf (HHU)": "Heinrich Hein University Dusseldorf",
    "Universita di Trento": "Università di Trento",
    "Yonsei University Mirae Campus": "Yonsei University, Mirae campus",
    "Southwest University": "SouthWest University",
    "Ming Chuan University": "Mingchuan University",
    "Friedrich- Alexander-Universitat Erlangen-Nurnberg, School of Business & Economics": "Friedrich-Alexander-Universität Erlangen-Nürnberg",
    "Rikkyo University, College of Business": "Rikkyo University",
    "Hanyang University Business School": "Hanyang University",
    "Sookmyung Women's University": "Sookmyung Women’s University",
    "University of Seoul": "University of Seoul (UOS)",
}

# -------------------------------------------------------------
# 2. Extract S27 Partners
# -------------------------------------------------------------
print("--> Processing [CTTĐ_S27] Danh sách trường đối tác trao đổi.xlsx...")
wb_part = openpyxl.load_workbook(os.path.join(DOC_DIR, "[CTTĐ_S27] Danh sách trường đối tác trao đổi.xlsx"), data_only=True)
s_part = wb_part['Danh sách đối tác S27']

partners_list = []
for idx, r in enumerate(s_part.iter_rows(min_row=2, values_only=True), start=2):
    if not r or not r[3]:
        continue
    stt = r[0]
    region = str(r[1]).strip() if r[1] else ""
    country = str(r[2]).strip() if r[2] else ""
    name = str(r[3]).strip()
    quota = str(r[4]).strip() if r[4] else ""
    languages = str(r[5]).strip() if r[5] else ""
    requirements = str(r[6]).strip() if r[6] else ""
    status_at_ftu = str(r[7]).strip() if len(r) > 7 and r[7] else ""
    scholarship = str(r[8]).strip() if len(r) > 8 and r[8] else ""
    catalogue_url = str(r[9]).strip() if len(r) > 9 and r[9] else ""
    
    # Generate clean ID
    clean_id = re.sub(r'[^a-zA-Z0-9]+', '-', name.lower()).strip('-')
    
    alias_in_tong = PARTNER_NAME_ALIASES.get(name, name)
    
    partners_list.append({
        "id": clean_id,
        "name": name,
        "aliasInTong": alias_in_tong,
        "region": region,
        "country": country,
        "quota": quota,
        "languages": languages,
        "requirements": requirements,
        "statusAtFtu": status_at_ftu,
        "scholarship": scholarship,
        "catalogueUrl": catalogue_url,
        "source": {
            "file": "[CTTĐ_S27] Danh sách trường đối tác trao đổi.xlsx",
            "sheet": "Danh sách đối tác S27",
            "row": idx
        }
    })

print(f"Extracted {len(partners_list)} partner universities.")

# -------------------------------------------------------------
# 3. Extract Equivalences from Sheet Tổng
# -------------------------------------------------------------
print("--> Processing Danh sách học phần tương đương (với các trường đối tác).xlsx (Sheet Tổng)...")
wb_eq = openpyxl.load_workbook(os.path.join(DOC_DIR, "Danh sách học phần tương đương (với các trường đối tác).xlsx"), data_only=True)
s_eq = wb_eq['Tổng']

# Reverse alias dictionary so we can map sheet Tong names back to S27 partner IDs
tong_to_s27_id = {}
for p in partners_list:
    tong_to_s27_id[p["aliasInTong"].lower()] = p["id"]
    tong_to_s27_id[p["name"].lower()] = p["id"]

equivalences_list = []
stats = {
    "total_rows": 0,
    "approved": 0,
    "pending": 0,
    "rejected": 0,
    "uncertain": 0,
    "matched_to_s27": 0
}

for idx, r in enumerate(s_eq.iter_rows(min_row=2, values_only=True), start=2):
    if not r or not any(r):
        continue
    stats["total_rows"] += 1
    
    region = str(r[0]).strip() if r[0] else ""
    country = str(r[1]).strip() if r[1] else ""
    partner_uni = str(r[2]).strip() if r[2] else ""
    host_course_name = str(r[3]).strip() if r[3] else ""
    host_course_code = str(r[4]).strip() if r[4] else ""
    if host_course_code.endswith('.0'):
        host_course_code = host_course_code[:-2]
        
    ftu_course_name_raw = str(r[5]).strip() if r[5] else ""
    ftu_course_code_raw = str(r[6]).strip() if r[6] else ""
    curriculum = str(r[7]).strip() if len(r) > 7 and r[7] else ""
    faculty = str(r[8]).strip() if len(r) > 8 and r[8] else ""
    approver = str(r[9]).strip() if len(r) > 9 and r[9] else ""
    approval_year = str(r[10]).strip() if len(r) > 10 and r[10] else ""
    if approval_year.endswith('.0'):
        approval_year = approval_year[:-2]

    if not partner_uni or not host_course_name:
        continue

    # Determine status
    # 1. Check if rejected
    name_lower = ftu_course_name_raw.lower()
    if "không tương đương" in name_lower or "từ chối" in name_lower or "ko tương đương" in name_lower:
        status = "REJECTED"
        stats["rejected"] += 1
    # 2. Check if pending
    elif "đang xét" in name_lower or "chờ xét" in name_lower or "đang xin ý kiến" in name_lower:
        status = "PENDING"
        stats["pending"] += 1
    # 3. Check if approved (has valid approver or not marked rejected/pending and has FTU code/name)
    elif approver or approval_year or (ftu_course_code_raw and not any(kw in name_lower for kw in ["chưa rõ", "xem lại"])):
        status = "APPROVED"
        stats["approved"] += 1
    else:
        status = "UNCERTAIN"
        stats["uncertain"] += 1

    # Clean FTU course name
    clean_ftu_course_name = ftu_course_name_raw
    for prefix in [
        "Không tương đương với học phần ",
        "Đang xét tương đương với học phần ",
        "Không tương đương với HP ",
        "Đang xét tương đương với HP ",
        "Đang xét với "
    ]:
        if clean_ftu_course_name.lower().startswith(prefix.lower()):
            clean_ftu_course_name = clean_ftu_course_name[len(prefix):].strip()

    # Split multiple FTU course codes if present
    # E.g. "PLU422, PLUE422, PLU422E" or "TCH409. TCHE409, TCH409E" or "TIN314/TINE314"
    split_codes = [c.strip() for c in re.split(r'[,;/.]\s*|\s+và\s+|\s+hoặc\s+', ftu_course_code_raw) if c.strip() and re.match(r'^[A-Za-z0-9]+$', c.strip())]
    if not split_codes and ftu_course_code_raw:
        split_codes = [ftu_course_code_raw.strip()]

    # Map to partner S27 ID
    partner_s27_id = tong_to_s27_id.get(partner_uni.lower())
    if partner_s27_id:
        stats["matched_to_s27"] += 1

    equivalences_list.append({
        "id": f"eq-{idx}",
        "partnerUni": partner_uni,
        "partnerS27Id": partner_s27_id,
        "region": region,
        "country": country,
        "hostCourseName": host_course_name,
        "hostCourseCode": host_course_code,
        "ftuCourseNameRaw": ftu_course_name_raw,
        "ftuCourseNameClean": clean_ftu_course_name,
        "ftuCourseCodeRaw": ftu_course_code_raw,
        "ftuCourseCodes": split_codes,
        "curriculum": curriculum,
        "faculty": faculty,
        "approver": approver,
        "approvalYear": approval_year,
        "status": status,
        "source": {
            "file": "Danh sách học phần tương đương (với các trường đối tác).xlsx",
            "sheet": "Tổng",
            "row": idx
        }
    })

print(f"Processed {stats['total_rows']} rows. Stats: {stats}")

# -------------------------------------------------------------
# 4. Extract Cost Comparison Table
# -------------------------------------------------------------
print("--> Processing Bảng chi phí ước tình khi tham gia kỳ trao đổi.xlsx...")
wb_cost = openpyxl.load_workbook(os.path.join(DOC_DIR, "Bảng chi phí ước tình khi tham gia kỳ trao đổi.xlsx"), data_only=True)
s_cost = wb_cost['Sheet1']

# Rows:
# Row 2: Countries
# Row 3: Living cost
# Row 4: Dormitory (Ký túc xá)
# Row 5: Off-campus rent (Thuê ngoài)
cost_rows = list(s_cost.iter_rows(values_only=True))
country_names = cost_rows[2]
living_costs = cost_rows[3]
dorm_costs = cost_rows[4]
rent_costs = cost_rows[5]

costs_data = {}
for col_idx in range(2, len(country_names)):
    c_name = country_names[col_idx]
    if not c_name:
        continue
    c_name_str = str(c_name).strip()
    living_str = str(living_costs[col_idx]).strip() if col_idx < len(living_costs) and living_costs[col_idx] else ""
    dorm_str = str(dorm_costs[col_idx]).strip() if col_idx < len(dorm_costs) and dorm_costs[col_idx] else ""
    rent_str = str(rent_costs[col_idx]).strip() if col_idx < len(rent_costs) and rent_costs[col_idx] else ""

    # Parse numeric ranges (triệu VNĐ)
    def parse_range(text):
        if not text or text.lower() == 'x':
            return {"min": None, "max": None, "raw": text, "available": False if text.lower() == 'x' else None}
        nums = [float(x.replace(',', '.')) for x in re.findall(r'(\d+(?:[.,]\d+)?)', text)]
        if len(nums) >= 2:
            return {"min": min(nums[:2]), "max": max(nums[:2]), "raw": text, "available": True}
        elif len(nums) == 1:
            return {"min": nums[0], "max": nums[0], "raw": text, "available": True}
        return {"min": None, "max": None, "raw": text, "available": True}

    one_time_fee = None
    if "chi phí đăng ký trước" in dorm_str.lower():
        m = re.search(r'(\d+)\s*triệu', dorm_str.lower())
        if m:
            one_time_fee = float(m.group(1))

    # Switzerland verification warning flag
    requires_verification = False
    warning_note = ""
    if "thụy sĩ" in c_name_str.lower() or "thuỵ sỹ" in c_name_str.lower():
        requires_verification = True
        warning_note = "Dữ liệu nguồn có 2 cột Thụy Sĩ khác nhau. Cần xác nhận với Phòng HTQT về mức chi phí thực tế."

    costs_data[c_name_str] = {
        "country": c_name_str,
        "livingCost": parse_range(living_str),
        "dormitoryCost": parse_range(dorm_str),
        "rentCost": parse_range(rent_str),
        "oneTimeDepositFee": one_time_fee,
        "requiresVerification": requires_verification,
        "warningNote": warning_note,
        "source": {
            "file": "Bảng chi phí ước tình khi tham gia kỳ trao đổi.xlsx",
            "sheet": "Sheet1",
            "column": col_idx + 1
        }
    }

print(f"Extracted cost data for {len(costs_data)} countries: {list(costs_data.keys())}")

# -------------------------------------------------------------
# 5. Extract Course Offerings 2026-2027
# -------------------------------------------------------------
print("--> Processing Copy of Kế hoạch mở môn năm học 2627 theo số lớp - V2.xlsx...")
wb_offer = openpyxl.load_workbook(os.path.join(DOC_DIR, "Copy of Kế hoạch mở môn năm học 2627 theo số lớp - V2.xlsx"), data_only=True)

course_offerings = []

# Sheet 1: Ke hoach HK1 K65
s_k65 = wb_offer['Ke hoach HK1 K65']
for idx, r in enumerate(s_k65.iter_rows(min_row=3, values_only=True), start=3):
    if not r or len(r) < 5 or not r[4]:
        continue
    code = str(r[4]).strip()
    name = str(r[3]).strip() if r[3] else ""
    credits = r[5] if len(r) > 5 and r[5] is not None else 0
    periods = r[6] if len(r) > 6 and r[6] is not None else 0
    num_classes = r[7] if len(r) > 7 and r[7] is not None else 0
    target_cohort = str(r[8]).strip() if len(r) > 8 and r[8] else ""
    note = str(r[9]).strip() if len(r) > 9 and r[9] else ""

    course_offerings.append({
        "courseCode": code,
        "courseName": name,
        "credits": credits,
        "periods": periods,
        "classesCount": num_classes,
        "semester": "HK1",
        "academicYear": "2026-2027",
        "cohortTarget": target_cohort,
        "note": note,
        "source": {
            "file": "Copy of Kế hoạch mở môn năm học 2627 theo số lớp - V2.xlsx",
            "sheet": "Ke hoach HK1 K65",
            "row": idx
        }
    })

# Sheet 2: ke hoach K626364 MH 2627 (Two blocks: cols 2-9 for HK1, cols 10-17 for HK2)
s_k6264 = wb_offer['ke hoach K626364 MH 2627']
for idx, r in enumerate(s_k6264.iter_rows(min_row=4, values_only=True), start=4):
    if not r:
        continue
    # HK1 Block (cols 2-9) -> index 2: STT, 3: Mã MH, 4: Tên MH, 5: Số TC, 6: Số tiết, 7: Số lớp, 8: Khóa/ngành, 9: Ghi chú
    if len(r) > 3 and r[3]:
        hk1_code = str(r[3]).strip()
        hk1_name = str(r[4]).strip() if len(r) > 4 and r[4] else ""
        hk1_credits = r[5] if len(r) > 5 and r[5] is not None else 0
        hk1_periods = r[6] if len(r) > 6 and r[6] is not None else 0
        hk1_classes = r[7] if len(r) > 7 and r[7] is not None else 0
        hk1_target = str(r[8]).strip() if len(r) > 8 and r[8] else ""
        hk1_note = str(r[9]).strip() if len(r) > 9 and r[9] else ""

        course_offerings.append({
            "courseCode": hk1_code,
            "courseName": hk1_name,
            "credits": hk1_credits,
            "periods": hk1_periods,
            "classesCount": hk1_classes,
            "semester": "HK1",
            "academicYear": "2026-2027",
            "cohortTarget": hk1_target,
            "note": hk1_note,
            "source": {
                "file": "Copy of Kế hoạch mở môn năm học 2627 theo số lớp - V2.xlsx",
                "sheet": "ke hoach K626364 MH 2627",
                "row": idx,
                "block": "HK1"
            }
        })

    # HK2 Block (cols 10-17) -> index 10: STT, 11: Mã MH, 12: Tên MH, 13: Số TC, 14: Số tiết, 15: Số lớp, 16: Khóa/ngành, 17: Ghi chú
    if len(r) > 11 and r[11]:
        hk2_code = str(r[11]).strip()
        hk2_name = str(r[12]).strip() if len(r) > 12 and r[12] else ""
        hk2_credits = r[13] if len(r) > 13 and r[13] is not None else 0
        hk2_periods = r[14] if len(r) > 14 and r[14] is not None else 0
        hk2_classes = r[15] if len(r) > 15 and r[15] is not None else 0
        hk2_target = str(r[16]).strip() if len(r) > 16 and r[16] else ""
        hk2_note = str(r[17]).strip() if len(r) > 17 and r[17] else ""

        course_offerings.append({
            "courseCode": hk2_code,
            "courseName": hk2_name,
            "credits": hk2_credits,
            "periods": hk2_periods,
            "classesCount": hk2_classes,
            "semester": "HK2",
            "academicYear": "2026-2027",
            "cohortTarget": hk2_target,
            "note": hk2_note,
            "source": {
                "file": "Copy of Kế hoạch mở môn năm học 2627 theo số lớp - V2.xlsx",
                "sheet": "ke hoach K626364 MH 2627",
                "row": idx,
                "block": "HK2"
            }
        })

print(f"Extracted {len(course_offerings)} course offering entries.")

# -------------------------------------------------------------
# 6. Extract Sample Curriculum (ChuongTrinhDaoTao.xlsx)
# -------------------------------------------------------------
print("--> Processing ChuongTrinhDaoTao.xlsx...")
wb_curric = openpyxl.load_workbook(os.path.join(DOC_DIR, "ChuongTrinhDaoTao.xlsx"), data_only=True)
s_curric = wb_curric['Sheet1']

sample_curriculum = []
current_semester_label = ""

for idx, r in enumerate(s_curric.iter_rows(min_row=2, values_only=True), start=2):
    if not r or not any(r):
        continue
    stt_col = str(r[0]).strip() if r[0] is not None else ""
    code_col = str(r[1]).strip() if len(r) > 1 and r[1] is not None else ""
    
    # Semester divider row
    if "học kỳ" in stt_col.lower() or "năm học" in stt_col.lower() or not code_col:
        current_semester_label = stt_col
        continue

    name = str(r[2]).strip() if len(r) > 2 and r[2] else ""
    prog_type = str(r[3]).strip() if len(r) > 3 and r[3] else ""
    core_course = str(r[4]).strip() if len(r) > 4 and r[4] else ""
    credits = float(r[5]) if len(r) > 5 and r[5] is not None and str(r[5]).strip() else 0
    tuition_credits = float(r[6]) if len(r) > 6 and r[6] is not None and str(r[6]).strip() else credits
    is_mandatory = (str(r[7]).strip().lower() == 'x') if len(r) > 7 and r[7] else False
    is_taken = (str(r[8]).strip().lower() == 'x') if len(r) > 8 and r[8] else False
    
    elective_group = str(r[9]).strip() if len(r) > 9 and r[9] is not None and str(r[9]).strip() else None
    elective_branch = str(r[10]).strip() if len(r) > 10 and r[10] is not None and str(r[10]).strip() else None
    min_credits = float(r[11]) if len(r) > 11 and r[11] is not None and str(r[11]).strip() else 0
    max_credits = float(r[12]) if len(r) > 12 and r[12] is not None and str(r[12]).strip() else 0
    
    # Col 13: Môn học đã học và đạt
    is_passed = (str(r[13]).strip().lower() == 'x') if len(r) > 13 and r[13] else False

    total_periods = float(r[14]) if len(r) > 14 and r[14] is not None and str(r[14]).strip() else 0
    theory_periods = float(r[15]) if len(r) > 15 and r[15] is not None and str(r[15]).strip() else 0
    practice_periods = float(r[16]) if len(r) > 16 and r[16] is not None and str(r[16]).strip() else 0

    sample_curriculum.append({
        "stt": stt_col,
        "courseCode": code_col,
        "courseName": name,
        "program": prog_type,
        "isCore": bool(core_course),
        "credits": credits,
        "tuitionCredits": tuition_credits,
        "isMandatory": is_mandatory,
        "isTaken": is_taken,
        "isPassed": is_passed,
        "electiveGroup": elective_group,
        "electiveBranch": elective_branch,
        "minCredits": min_credits,
        "maxCredits": max_credits,
        "totalPeriods": total_periods,
        "theoryPeriods": theory_periods,
        "practicePeriods": practice_periods,
        "suggestedSemester": current_semester_label,
        "source": {
            "file": "ChuongTrinhDaoTao.xlsx",
            "sheet": "Sheet1",
            "row": idx
        }
    })

print(f"Extracted {len(sample_curriculum)} courses from ChuongTrinhDaoTao.xlsx.")

# -------------------------------------------------------------
# 7. Extract Handbook / 11 Steps from DOCX
# -------------------------------------------------------------
print("--> Processing Quy trình tham gia CTTD học kỳ II năm học 2026 - 2027.docx...")
doc = docx.Document(os.path.join(DOC_DIR, "Quy trình tham gia CTTD học kỳ II năm học 2026 - 2027.docx"))

steps = []
table0 = doc.tables[0]
for idx, row in enumerate(table0.rows[1:], start=1):
    step_title = row.cells[0].text.strip()
    detail = row.cells[1].text.strip()
    dept = row.cells[2].text.strip()
    timeline = row.cells[3].text.strip()
    steps.append({
        "step": idx,
        "title": step_title,
        "detail": detail,
        "department": dept,
        "timeline": timeline
    })

handbook_data = {
    "title": "CẨM NANG HỌC VỤ & HƯỚNG DẪN THỦ TỤC TRAO ĐỔI SINH VIÊN S27",
    "semester": "Học kỳ II năm học 2026 - 2027",
    "academicConditions": [
        "Sinh viên chính quy đang theo học tại một trong ba cơ sở (Hà Nội, CSII TP.HCM, CS Quảng Ninh).",
        "Chưa từng tham gia chương trình trao đổi theo kỳ học do FTU tổ chức.",
        "Điểm trung bình tích lũy GPA đạt tối thiểu 2.8/4.0 hoặc 7.5/10 (tính đến thời điểm đăng ký).",
        "Hoàn thành tối thiểu 2 học kỳ và tích lũy ít nhất 35 tín chỉ tại thời điểm trao đổi.",
        "Không tham gia trao đổi vào học kỳ cuối khóa.",
        "Còn ít nhất 04 học phần chưa tích lũy (đã bao gồm Học phần Tốt nghiệp).",
        "Học tối thiểu 5 học phần tại trường đối tác và cam kết chuyển điểm về tối thiểu 3 học phần FTU.",
        "Chứng chỉ ngoại ngữ còn hạn: tối thiểu B2 CEFR (tiếng Anh) hoặc chứng chỉ ngôn ngữ tương ứng theo yêu cầu của trường đối tác.",
        "Có đủ khả năng tài chính chi trả sinh hoạt phí, bảo hiểm, visa, vé máy bay."
    ],
    "steps": steps,
    "contact": {
        "office": "Phòng Hợp tác Quốc tế (P.HTQT)",
        "address": "A903 - Tầng 9 - Nhà A, Trường ĐH Ngoại thương, Hà Nội",
        "hotline": "(+84) 24 325 95161 (ext. 6200)",
        "email": "outbound@ftu.edu.vn",
        "fanpage": "https://www.facebook.com/ftuexchange",
        "workingHours": "9h00 - 11h30 sáng & 14h00 - 17h00 các ngày làm việc trong tuần",
        "cs2": "Ban QLKH & HTQT CSII TP.HCM - SĐT: 028 35127254 (ext 881 - cô Loan)",
        "qn": "P.HTQT & Ban Đào tạo CS Quảng Ninh - SĐT: 091 580 9103 (cô Hoa)"
    },
    "source": {
        "file": "Quy trình tham gia CTTD học kỳ II năm học 2026 - 2027.docx"
    }
}

print(f"Extracted handbook with {len(steps)} steps.")

# -------------------------------------------------------------
# 8. Save All Clean JSON Files
# -------------------------------------------------------------
with open(os.path.join(DATA_DIR, "universities_s27.json"), "w", encoding="utf-8") as f:
    json.dump(partners_list, f, ensure_ascii=False, indent=2)

with open(os.path.join(DATA_DIR, "equivalences_s27.json"), "w", encoding="utf-8") as f:
    json.dump(equivalences_list, f, ensure_ascii=False, indent=2)

with open(os.path.join(DATA_DIR, "costs_by_country.json"), "w", encoding="utf-8") as f:
    json.dump(costs_data, f, ensure_ascii=False, indent=2)

with open(os.path.join(DATA_DIR, "course_offerings_2627.json"), "w", encoding="utf-8") as f:
    json.dump(course_offerings, f, ensure_ascii=False, indent=2)

with open(os.path.join(DATA_DIR, "sample_curriculum.json"), "w", encoding="utf-8") as f:
    json.dump(sample_curriculum, f, ensure_ascii=False, indent=2)

with open(os.path.join(DATA_DIR, "handbook_s27.json"), "w", encoding="utf-8") as f:
    json.dump(handbook_data, f, ensure_ascii=False, indent=2)

print("\n=== ALL DATA FILES GENERATED SUCCESSFULLY IN data/ ===")
