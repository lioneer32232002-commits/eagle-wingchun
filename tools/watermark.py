# 影片右上角的鷹印浮水印：紙色字＋墨色描邊，72px（720p 用；540p 的片由 video-encode.mjs 縮到 54px）
# 用法：python tools/watermark.py  → 產生 tools/watermark.png
from PIL import Image, ImageDraw, ImageFont
S=4; size=72*S
img=Image.new('RGBA',(size,size),(0,0,0,0)); d=ImageDraw.Draw(img)
paper=(245,242,234,255); ink=(22,20,15,200)
r=6*S; w=3*S; pad=4*S
d.rounded_rectangle([pad,pad,size-pad,size-pad],radius=r,outline=ink,width=w+2*S)
d.rounded_rectangle([pad,pad,size-pad,size-pad],radius=r,outline=paper,width=w)
f=ImageFont.truetype('C:/Windows/Fonts/NotoSerifTC-VF.ttf',44*S)
try: f.set_variation_by_name('Bold')
except Exception: pass
tx='鷹'; bb=d.textbbox((0,0),tx,font=f,stroke_width=2*S); tw=bb[2]-bb[0]; th=bb[3]-bb[1]
x=(size-tw)//2-bb[0]; y=(size-th)//2-bb[1]
d.text((x,y),tx,font=f,fill=paper,stroke_width=2*S,stroke_fill=ink)
img=img.resize((72,72),Image.LANCZOS)
a=img.split()[3].point(lambda v:int(v*0.88)); img.putalpha(a)
img.save('tools/watermark.png'); print('tools/watermark.png')
