# libass 抓不到 Noto Serif TC 可變字型的 Bold 軸（只會退到 ExtraLight），
# 所以從系統的 NotoSerifTC-VF.ttf 產一個靜態 Bold 實例給燒字幕用。
# 用法：python tools/make-font.py  → tools/fonts/NotoSerifTC-Bold.ttf（不進 git，缺了就重跑）
# 需要 pip install fonttools
import os
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
os.makedirs('tools/fonts', exist_ok=True)
f = TTFont('C:/Windows/Fonts/NotoSerifTC-VF.ttf')
inst = instancer.instantiateVariableFont(f, {'wght': 700})
for rec in inst['name'].names:
    try: s = rec.toUnicode()
    except Exception: continue
    if rec.nameID in (2, 17): rec.string = 'Bold'
    elif rec.nameID == 4: rec.string = 'Noto Serif TC Static Bold'
    elif rec.nameID in (3, 6): rec.string = 'NotoSerifTCStatic-Bold'
    elif 'Noto Serif TC' in s or 'NotoSerifTC' in s:
        rec.string = s.replace('Noto Serif TC', 'Noto Serif TC Static').replace('NotoSerifTC', 'NotoSerifTCStatic').replace('ExtraLight', 'Bold')
inst['OS/2'].usWeightClass = 700
inst['OS/2'].fsSelection = (inst['OS/2'].fsSelection & ~0x40) | 0x20
inst['head'].macStyle |= 1
inst.save('tools/fonts/NotoSerifTC-Bold.ttf')
print('tools/fonts/NotoSerifTC-Bold.ttf')
