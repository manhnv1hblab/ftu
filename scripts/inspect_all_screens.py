import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

stitch_dir = r'c:\Users\ManhNV1\Desktop\ftu - Copy\stitch_ftu_exchange_planner'

targets = [
    ('chi_ti_t_tr_ng_chung_ang_university_cau', 'Chung-Ang Detail'),
    ('ki_m_tra_h_s_h_c_t_p_ftu', 'Check Profile Step 2'),
    ('xu_t_tr_ng_trao_i_ph_h_p', 'Match Results Step 3'),
    ('chi_ti_t_ph_ng_n_quy_i_m_n_h_c', 'Course Plan Step 4'),
    ('so_s_nh_tr_ng_trao_i_ftu', 'Compare Step 5'),
    ('c_m_nang_h_c_v_h_ng_d_n_th_t_c_ftu', 'Handbook')
]

for folder, label in targets:
    path = f"{stitch_dir}\\{folder}\\code.html"
    try:
        with open(path, encoding='utf-8') as f:
            content = f.read()
        m = re.search(r'<main[^>]*>(.*?)</main>', content, re.DOTALL)
        main = m.group(1) if m else content
        # strip tags for a quick overview of headings and structure
        headings = re.findall(r'<h[1234][^>]*>(.*?)</h[1234]>', main)
        print(f"\n==========================================")
        print(f"=== {label} ({folder}) ===")
        print(f"Headings: {[re.sub(r'<[^>]+>', '', h).strip() for h in headings[:8]]}")
        # print sample snippet of first card or section
        sections = re.findall(r'<section[^>]*>(.*?)</section>', main, re.DOTALL)
        if sections:
            print("First section snippet:", re.sub(r'\s+', ' ', sections[0])[:350])
    except Exception as e:
        print(f"Error {label}: {e}")
