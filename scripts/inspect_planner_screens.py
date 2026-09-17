import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

stitch_dir = r'c:\Users\ManhNV1\Desktop\ftu - Copy\stitch_ftu_exchange_planner'

def inspect_file(filename, title):
    print(f"\n==============================================")
    print(f"=== {title} ===")
    path = f"{stitch_dir}\\{filename}\\code.html"
    with open(path, encoding='utf-8') as f:
        c = f.read()
    m = re.search(r'<main[^>]*>(.*?)</main>', c, re.DOTALL)
    body = m.group(1) if m else c
    # Find key divs and classes
    classes = set(re.findall(r'class="([^"]*)"', body))
    # print sample 1500 chars from middle of body
    mid = len(body) // 2
    print(body[mid-500:mid+1000])

inspect_file('ki_m_tra_h_s_h_c_t_p_ftu', 'KIỂM TRA HỒ SƠ (STEP 2)')
inspect_file('xu_t_tr_ng_trao_i_ph_h_p', 'ĐỀ XUẤT TRƯỜNG (STEP 3)')
inspect_file('chi_ti_t_ph_ng_n_quy_i_m_n_h_c', 'GHÉP MÔN & TIẾN ĐỘ (STEP 4)')
inspect_file('so_s_nh_tr_ng_trao_i_ftu', 'SO SÁNH (STEP 5)')
