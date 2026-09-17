import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

with open(r'c:\Users\ManhNV1\Desktop\ftu - Copy\stitch_ftu_exchange_planner\danh_s_ch_tr_ng_i_t_c_ftu_to_n_c_u\code.html', encoding='utf-8') as f:
    content = f.read()

# Let's inspect the card structure and hero search
print("--- MAIN SEARCH & FILTER ---")
m = re.search(r'<main[^>]*>(.*?)</main>', content, re.DOTALL)
if m:
    main_content = m.group(1)
    print("Main content length:", len(main_content))
    print(main_content[:4000])
