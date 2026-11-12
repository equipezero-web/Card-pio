from pathlib import Path
import math,random
random.seed(24)
out=Path(__file__).resolve().parents[1]/'assets/posters'
out.mkdir(exist_ok=True)
head='''<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="800" viewBox="0 0 1000 800"><defs><radialGradient id="bg"><stop stop-color="{light}"/><stop offset="1" stop-color="{dark}"/></radialGradient><radialGradient id="plate"><stop stop-color="#ffffff"/><stop offset=".78" stop-color="#f7f3ed"/><stop offset=".94" stop-color="#e7dfd4"/><stop offset="1" stop-color="#f7f5f0"/></radialGradient><filter id="sh"><feGaussianBlur stdDeviation="25"/></filter></defs><rect width="1000" height="800" fill="url(#bg)"/><ellipse cx="520" cy="600" rx="330" ry="110" fill="#4f3022" opacity=".12" filter="url(#sh)"/><ellipse cx="500" cy="430" rx="335" ry="220" fill="url(#plate)"/><ellipse cx="500" cy="430" rx="292" ry="188" fill="#fff" opacity=".56"/>'''
foot='</svg>'
base={
'burger':('#fff1e4','#eed5c2'),
'pizza':('#f7f1dd','#e7d2ba'),
'poke':('#f0f5ed','#cfe3d6'),
'brownie':('#f8ede5','#e5cdbf')
}
# stylized overhead semi-3d food illustration fallback. Actual 3D models are separate glbs.
parts={}
parts['burger']='''<ellipse cx="510" cy="460" rx="211" ry="123" fill="#603823" opacity=".32"/><ellipse cx="500" cy="440" rx="205" ry="118" fill="#925332"/><ellipse cx="503" cy="432" rx="217" ry="112" fill="#4e8636"/><ellipse cx="500" cy="416" rx="205" ry="101" fill="#c83e2b"/><ellipse cx="500" cy="407" rx="195" ry="98" fill="#e7b84e"/><ellipse cx="500" cy="395" rx="216" ry="105" fill="#e4a55a"/><ellipse cx="497" cy="380" rx="199" ry="98" fill="#efbd78"/><ellipse cx="480" cy="359" rx="150" ry="53" fill="#f9d6a5" opacity=".58"/>'''
for i in range(30):
    x=random.randint(340,650); y=random.randint(347,440)
    if ((x-500)/190)**2+((y-380)/97)**2>1:continue
    parts['burger']+=f'<ellipse cx="{x}" cy="{y}" rx="7" ry="2.8" transform="rotate(-24 {x} {y})" fill="#fff2d6"/>'
parts['pizza']='''<ellipse cx="500" cy="431" rx="228" ry="170" fill="#c17b3e"/><ellipse cx="500" cy="421" rx="211" ry="157" fill="#e2ab62"/><ellipse cx="500" cy="421" rx="193" ry="142" fill="#b84b30"/><ellipse cx="500" cy="416" rx="182" ry="132" fill="#d2633b"/>'''
for i in range(23):
    a=random.random()*math.tau;r=math.sqrt(random.random());x=500+166*r*math.cos(a);y=420+113*r*math.sin(a)
    parts['pizza']+=f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{random.randint(15,26)}" ry="{random.randint(10,18)}" fill="#f3e3be"/>'
for i in range(14):
    a=random.random()*math.tau;r=math.sqrt(random.random());x=500+160*r*math.cos(a);y=420+108*r*math.sin(a)
    parts['pizza']+=f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="15" ry="6" transform="rotate({random.randint(-65,65)} {x} {y})" fill="#43844e"/>'
parts['poke']='''<ellipse cx="500" cy="445" rx="238" ry="175" fill="#314944"/><ellipse cx="500" cy="428" rx="215" ry="155" fill="#f5f0dc"/><ellipse cx="500" cy="428" rx="190" ry="136" fill="#eee4c8"/>'''
for i in range(34):
    x=random.randint(335,485);y=random.randint(320,505)
    if ((x-500)/192)**2+((y-430)/138)**2>1:continue
    parts['poke']+=f'<rect x="{x}" y="{y}" width="{random.randint(26,38)}" height="{random.randint(17,25)}" rx="5" fill="{random.choice(["#ed8d67","#f3a47d","#d7765b"])}" transform="rotate({random.randint(-25,25)} {x} {y})"/>'
for i in range(21):
    x=random.randint(520,668);y=random.randint(322,514)
    if ((x-500)/192)**2+((y-430)/138)**2>1:continue
    parts['poke']+=f'<ellipse cx="{x}" cy="{y}" rx="21" ry="13" fill="{random.choice(["#79a758","#98c175","#bbcd85"])}"/>'
parts['brownie']='''<path d="M360 375 L540 300 L657 372 L464 451 Z" fill="#7a4535"/><path d="M360 375 L464 451 L464 541 L360 458 Z" fill="#49291e"/><path d="M464 451 L657 372 L657 465 L464 541 Z" fill="#603528"/><path d="M379 367 L537 312 L633 375 L469 436 Z" fill="#8f553e"/><ellipse cx="526" cy="360" rx="103" ry="85" fill="#e9d9b9"/><ellipse cx="514" cy="346" rx="91" ry="74" fill="#fff0d1"/><path d="M442 330 Q470 289 504 310 T583 319 Q603 355 566 362 Q535 342 521 369 T476 376 Q439 364 442 330 Z" fill="#643427" opacity=".87"/>'''
for i in range(18):
    x=random.randint(400,620);y=random.randint(372,427)
    parts['brownie']+=f'<circle cx="{x}" cy="{y}" r="{random.randrange(2,5)}" fill="#c48e63" opacity=".62"/>'
for name,(light,dark) in base.items():
    svg=head.format(light=light,dark=dark)+parts[name]+foot
    (out/f'{name}.svg').write_text(svg,encoding='utf-8')
    print(name,'poster')
