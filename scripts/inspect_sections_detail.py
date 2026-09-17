import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

with open(r'c:\Users\ManhNV1\Desktop\ftu - Copy\stitch_ftu_exchange_planner\danh_s_ch_tr_ng_i_t_c_ftu_to_n_c_u\code.html', encoding='utf-8') as f:
    content = f.read()

sections = re.findall(r'<section[^>]*>(.*?)</section>', content, re.DOTALL)
print("=== SECTION 1 (FILTERS & SEARCH) ===")
print(sections[1])

print("\n=== SECTION 3 (PARTNER CARD SAMPLE) ===")
print(sections[3][:3500])
