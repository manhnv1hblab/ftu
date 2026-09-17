import json

with open('data/universities_s27.json', 'r', encoding='utf-8') as f:
    unis = json.load(f)

print(f"Total universities: {len(unis)}")

generic_desc_count = 0
for u in unis:
    desc = u.get('description', '')
    if 'chiến lược của FTU tại' in desc or len(desc) < 100:
        generic_desc_count += 1

print(f"Universities with template/generic description: {generic_desc_count} / {len(unis)}")

for i in [0, 5, 15, 30, 50, 75, 100]:
    if i < len(unis):
        u = unis[i]
        print(f"\n--- [{i}] {u['name']} ({u.get('country')}) ---")
        print(f"  City: {u.get('city')}, Flag: {u.get('flag')}, VN: {u.get('vietnameseName')}")
        print(f"  QS: {u.get('qsRank')}, National: {u.get('nationalRank')}")
        print(f"  Web: {u.get('websiteUrl')}")
        print(f"  Desc: {u.get('description')}")
        print(f"  Faculties: {u.get('keyFaculties')}")
        print(f"  Highlights: {u.get('highlights')}")
        print(f"  Images: {len(u.get('galleryImages', []))}")
