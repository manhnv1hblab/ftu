import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

with open(r'c:\Users\ManhNV1\Desktop\ftu - Copy\stitch_ftu_exchange_planner\danh_s_ch_tr_ng_i_t_c_ftu_to_n_c_u\code.html', encoding='utf-8') as f:
    content = f.read()

# Look for card template inside the grid
card_matches = re.findall(r'(<div class="[^"]*rounded-lg[^"]*bg-surface-container-lowest.*?)(?=<div class="[^"]*rounded-lg[^"]*bg-surface-container-lowest|$)', content, re.DOTALL)
print("Found card templates:", len(card_matches))
if card_matches:
    print("--- CARD 1 SAMPLE ---")
    print(card_matches[0][:2500])
