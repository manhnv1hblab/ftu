import sys
import re
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

with open(Path(__file__).resolve().parents[1] / 'stitch_ftu_exchange_planner' / 'danh_s_ch_tr_ng_i_t_c_ftu_to_n_c_u' / 'code.html', encoding='utf-8') as f:
    content = f.read()

# Let's find sections in main
sections = re.findall(r'<section[^>]*>(.*?)</section>', content, re.DOTALL)
print(f"Total sections: {len(sections)}")
for i, s in enumerate(sections):
    print(f"\n--- SECTION {i} ---")
    print(s[:400].replace('\n', ' '))
