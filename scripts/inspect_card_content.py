import sys
import re
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

with open(Path(__file__).resolve().parents[1] / 'stitch_ftu_exchange_planner' / 'danh_s_ch_tr_ng_i_t_c_ftu_to_n_c_u' / 'code.html', encoding='utf-8') as f:
    content = f.read()

# find Chung-Ang or any university in the file
pos = content.find("Chung-Ang")
if pos != -1:
    print("Found Chung-Ang at pos:", pos)
    print(content[pos-300:pos+1500])
else:
    print("Chung-Ang not found, searching for other names...")
    names = re.findall(r'<h[2345][^>]*>(.*?)</h[2345]>', content)
    print("Headers:", names[:15])
