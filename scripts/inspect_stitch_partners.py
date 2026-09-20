import sys
import re
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

with open(Path(__file__).resolve().parents[1] / 'stitch_ftu_exchange_planner' / 'danh_s_ch_tr_ng_i_t_c_ftu_to_n_c_u' / 'code.html', encoding='utf-8') as f:
    content = f.read()

print("File length:", len(content))

# Look for header, main, cards
body_match = re.search(r'<body[^>]*>(.*?)</body>', content, re.DOTALL)
if body_match:
    body = body_match.group(1)
    print("Body length:", len(body))
    # Print the first 3000 chars of body
    print("--- START OF BODY ---")
    print(body[:3000])
