"""Gera modelos demonstrativos em GLB com trimesh/numpy. Requer pip install trimesh numpy."""
import math, random
from pathlib import Path
import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial
from trimesh.visual import TextureVisuals

random.seed(12)
BASE = Path(__file__).resolve().parents[1] / 'assets' / 'models'
BASE.mkdir(parents=True, exist_ok=True)

class Food:
    def __init__(self):
        self.scene = trimesh.Scene()
        self.count = 0
    def add(self, mesh, color, roughness=0.78, metallic=0.0):
        mesh.visual = TextureVisuals(material=PBRMaterial(baseColorFactor=list(color), metallicFactor=metallic, roughnessFactor=roughness, doubleSided=True))
        self.count += 1
        self.scene.add_geometry(mesh, geom_name=f'part-{self.count}')
    def sphere(self, center, scale, color, subdiv=2, roughness=.82):
        m=trimesh.creation.icosphere(subdivisions=subdiv, radius=1)
        m.apply_scale(scale)
        m.apply_translation(center)
        self.add(m,color,roughness)
    def cylinder(self, center, radius, h, color, sections=48, roughness=.8):
        m=trimesh.creation.cylinder(radius=radius,height=h, sections=sections)
        m.apply_transform(trimesh.transformations.rotation_matrix(math.pi/2,[1,0,0]))
        m.apply_translation(center)
        self.add(m, color, roughness)
    def box(self, center, extents, color, roughness=.85, angle=0):
        m=trimesh.creation.box(extents=extents)
        if angle:
            m.apply_transform(trimesh.transformations.rotation_matrix(angle,[0,1,0]))
        m.apply_translation(center)
        self.add(m,color,roughness)
    def ring(self, radius, tube, height, color, segments=72, rings=10, noise=0):
        verts=[];faces=[]
        for i in range(segments):
            theta=math.tau*i/segments
            for j in range(rings):
                phi=math.tau*j/rings
                rr=radius + tube*math.cos(phi) + random.uniform(-noise,noise)
                verts.append([rr*math.cos(theta),height+tube*math.sin(phi),rr*math.sin(theta)])
        for i in range(segments):
            ni=(i+1)%segments
            for j in range(rings):
                nj=(j+1)%rings
                a=i*rings+j; b=ni*rings+j;c=ni*rings+nj;d=i*rings+nj
                faces.extend([[a,b,c],[a,c,d]])
        self.add(trimesh.Trimesh(vertices=verts,faces=faces,process=False),color)
    def flake(self, center, size, color, ang=0):
        self.sphere(center, [size,.0017,size*.43],color,subdiv=1)
    def ceramic(self,radius=.16):
        self.cylinder([0,-.014,0],radius,.016,[237,234,224,255],sections=72,roughness=.26)
        self.cylinder([0,-.004,0],radius*.89,.004,[251,249,242,255],sections=72,roughness=.28)
        self.ring(radius*.92,.004,-.002,[211,202,187,255])
    def export(self,name):
        output=BASE/f'{name}.glb'
        output.write_bytes(self.scene.export(file_type='glb'))
        print(name,len(output.read_bytes()),'bytes',self.count,'meshes')

# BURGER ARTESANAL
f=Food(); f.ceramic(.156)
f.sphere([0,.026,0],[.104,.027,.103],[208,139,72,255],subdiv=3)
f.cylinder([0,.055,0],.101,.018,[95,48,30,255],sections=56)
for i in range(50):
    a=math.tau*i/50
    r=.101+random.uniform(-.007,.004)
    f.sphere([r*math.cos(a), .059+random.uniform(-.004,.005),r*math.sin(a)],[.012,.009,.012],random.choice([[75,36,22,255],[113,58,34,255],[56,31,23,255]]),1)
f.box([0,.075,0],[.17,.006,.17],[249,190,55,255],angle=.11)
f.cylinder([0,.085,0],.093,.013,[190,50,33,255])
for i in range(65):
    a=i*math.tau/65;radius=.094+random.uniform(0,.011)
    f.sphere([radius*math.cos(a),.095+random.uniform(-.004,.003),radius*math.sin(a)],[.016,.004,.012],[72+random.randrange(24),137+random.randrange(40),58,255],subdiv=1)
f.sphere([0,.120,0],[.109,.039,.109],[225,153,76,255],subdiv=3)
for i in range(32):
    a=random.uniform(0,math.tau);r=random.uniform(0,.078)
    f.sphere([r*math.cos(a),.151-(r/.1)**2*.019,r*math.sin(a)],[.006,.0015,.0023],[250,228,180,255],subdiv=1)
f.export('burger')

# PIZZA MARGHERITA
f=Food();f.ceramic(.17)
f.cylinder([0,.008,0],.143,.012,[219,150,74,255],sections=96)
f.cylinder([0,.017,0],.125,.006,[178,52,36,255],sections=96)
f.ring(.128,.015,.021,[230,165,83,255],segments=96,noise=.002)
for i in range(24):
    a=math.tau*i/24; r=random.uniform(.017,.105)
    f.sphere([r*math.cos(a),.023,r*math.sin(a)],[random.uniform(.013,.024),.003,random.uniform(.010,.018)],[244,233,192,255],subdiv=2)
for i in range(12):
    a=math.tau*i/12+random.uniform(-.18,.18);r=random.uniform(.025,.104)
    f.sphere([r*math.cos(a),.027,r*math.sin(a)],[.016,.0019,.009],[49,114,44,255],subdiv=1)
for i in range(15):
    a=random.uniform(0,math.tau);r=random.uniform(.018,.11)
    f.sphere([r*math.cos(a),.024,r*math.sin(a)],[.008,.002,.008],[176,48,35,255],subdiv=1)
f.export('pizza')

# BOWL POKE
f=Food()
f.cylinder([0,-.039,0],.075,.012,[66,79,76,255],sections=64,roughness=.24)
# curved bowl as thick concentric rings
for j in range(20):
    y=-.038 + .006*j
    r=.058 + .0054*j
    f.ring(r,.0031,y,[76+int(j*.8),94+int(j*.7),88+int(j*.5),255],segments=60,rings=7)
f.sphere([0,.040,0],[.120,.029,.120],[242,236,216,255],subdiv=3)
# salmon cubes across quadrant
for i in range(19):
    x=random.uniform(-.085,-.005); z=random.uniform(-.085,-.007)
    if x*x+z*z>.010: continue
    f.box([x,.065+random.uniform(0,.006),z],[.023,.014,.018],random.choice([[236,111,72,255],[246,130,89,255],[218,96,68,255]]),angle=random.uniform(-.5,.5))
# avocado wedges
for i in range(9):
    a=-.25+i*.13
    f.sphere([.047+math.cos(a)*.033,.067,.046+math.sin(a)*.033],[.024,.008,.013],random.choice([[136,170,80,255],[166,193,98,255]]),subdiv=2)
# edamame + cucumber
for i in range(28):
    a=random.uniform(0,math.tau);r=random.uniform(.018,.104)
    if math.cos(a)<0.15: continue
    f.sphere([r*math.cos(a),.073,r*math.sin(a)],[.010,.007,.007],[103+random.randrange(20),158+random.randrange(25),79,255],subdiv=2)
for i in range(9):
    a=random.uniform(0,math.tau);r=random.uniform(.012,.085)
    f.sphere([r*math.cos(a),.079,r*math.sin(a)],[.004,.0015,.002],[238,223,164,255],subdiv=1)
f.export('poke')

# BROWNIE + GELATO
f=Food();f.ceramic(.151)
f.box([0,.021,0],[.105,.056,.100],[71,35,27,255],angle=.1)
for i in range(55):
    x=random.uniform(-.055,.055);z=random.uniform(-.055,.055)
    f.sphere([x,.053+random.uniform(0,.005),z],[random.uniform(.002,.006),.002,random.uniform(.002,.006)],random.choice([[113,57,38,255],[43,23,19,255],[134,66,42,255]]),subdiv=1)
f.sphere([.015,.085,0],[.048,.039,.045],[250,229,188,255],subdiv=3)
for i in range(25):
    a=random.uniform(0,math.tau);r=random.uniform(0,.04)
    f.sphere([.015+r*math.cos(a),.105, r*math.sin(a)],[.003,.001,.002],[245,211,156,255],subdiv=1)
# glossy chocolate sauce over top
f.sphere([.020,.119,-.006],[.025,.005,.018],[88,39,27,255],subdiv=2,roughness=.22)
for i in range(7):
    a=random.uniform(0,math.tau);r=.04
    f.sphere([.015+r*math.cos(a),.078,r*math.sin(a)],[.005,.017,.005],[102,49,32,255],subdiv=2,roughness=.27)
f.export('brownie')
