
/* ================= the 3D world, built from real LJ's photography ================= */
(function(){
var loader=document.getElementById('loader');
function done(){ loader.classList.add('gone'); }
if(typeof THREE==='undefined'){ document.body.classList.add('no3d'); done(); return; }
var canvas=document.getElementById('world'), renderer;
try{ renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true,powerPreference:'high-performance'}); }
catch(e){ document.body.classList.add('no3d'); done(); return; }


var C={orange:0xF04E23,char:0x1F1F1F,cream:0xF4EBD9,gold:0xE7A93B};
var REDUCE=matchMedia('(prefers-reduced-motion: reduce)').matches;
var mobile=function(){return innerWidth<760};

var scene=new THREE.Scene();
var camera=new THREE.PerspectiveCamera(38,1,0.1,240);
scene.fog=new THREE.Fog(C.char,20,58);
scene.background=new THREE.Color(C.char);
scene.add(new THREE.HemisphereLight(0xfff4e6,0x3a2a22,0.95));
var key=new THREE.DirectionalLight(0xffffff,1.05); key.position.set(6,10,9); scene.add(key);
var rim=new THREE.DirectionalLight(0xffb08a,0.6); rim.position.set(-8,4,-6); scene.add(rim);

/* --- helpers --- */
function mat(c,o){return new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.6,metalness:0},o||{}));}
function hash(n){var x=Math.sin(n*127.1)*43758.5453;return x-Math.floor(x);}
function canvasTex(w,h,draw){var cv=document.createElement('canvas');cv.width=w;cv.height=h;draw(cv.getContext('2d'),w,h);var t=new THREE.CanvasTexture(cv);t.anisotropy=4;return t;}
function radial(stops){return canvasTex(256,256,function(x,w,h){var g=x.createRadialGradient(128,128,0,128,128,128);stops.forEach(function(s){g.addColorStop(s[0],s[1]);});x.fillStyle=g;x.fillRect(0,0,w,h);});}
function sealShape(r,bumps){var s=new THREE.Shape();var n=bumps*16;for(var i=0;i<=n;i++){var a=i/n*Math.PI*2,rr=r*(1+0.075*Math.cos(a*bumps));var x=Math.cos(a)*rr,y=Math.sin(a)*rr;i?s.lineTo(x,y):s.moveTo(x,y);}return s;}
function extrude(shape,depth,c,o){var g=new THREE.ExtrudeGeometry(shape,{depth:depth,bevelEnabled:true,bevelThickness:.08,bevelSize:.06,bevelSegments:3,curveSegments:24});g.center();return new THREE.Mesh(g,mat(c,o));}
function dispFont(){return LANG==='ar'?'Lalezar':'Titan One';}

var shadowTex=radial([[0,'rgba(0,0,0,.6)'],[.55,'rgba(0,0,0,.22)'],[1,'rgba(0,0,0,0)']]);
var heroGlowTex=radial([[0,'rgba(240,78,35,.55)'],[.5,'rgba(240,78,35,.14)'],[1,'rgba(240,78,35,0)']]);
var steamTex=radial([[0,'rgba(255,255,255,.55)'],[.5,'rgba(255,255,255,.18)'],[1,'rgba(255,255,255,0)']]);
var pinGlowTex=radial([[0,'rgba(255,140,90,1)'],[.25,'rgba(240,78,35,.7)'],[1,'rgba(240,78,35,0)']]);
var dotTex=canvasTex(64,64,function(x){x.fillStyle='#fff';x.beginPath();x.arc(32,32,28,0,Math.PI*2);x.fill();});

/* --- photo loading --- */
var mgr=new THREE.LoadingManager(), tl=new THREE.TextureLoader(mgr), loaded=false;
function photo(k){var t=tl.load(A[k].src);t.anisotropy=8;return t;}

/* each photo is a cut-out that always faces the camera; depth comes from where it sits */
var cards=[];
function cutout(parent,k,w,x,y,z,o){o=o||{};
  var a=A[k],h=w*a.h/a.w,g=new THREE.Group();
  if(o.shadow!==0){var sh=new THREE.Mesh(new THREE.PlaneGeometry(w*.9,w*.22),new THREE.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false,opacity:o.shadow||.5}));sh.position.set(0,-h/2+w*.015,-.02);sh.userData.op0=sh.material.opacity;g.add(sh);}
  var p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:photo(k),transparent:true,depthWrite:false}));p.userData.op0=1;g.add(p);
  g.position.set(x,y,z);parent.add(g);cards.push({g:g,p:p,base:y,ph:hash(cards.length+1)*6,amp:o.amp==null?.14:o.amp,sway:o.sway==null?.02:o.sway});return g;}

/* --- stations along the camera path --- */
var GAP=48, N=7, stations=[];
var BG=[C.char,C.char,C.orange,C.char,C.cream,C.orange,C.char];
function station(i){var g=new THREE.Group();g.position.set(0,0,-i*GAP);scene.add(g);stations.push(g);return g;}

/* 0 hero: the wrapped LJ's burger over the real griddle shot, with steam */
var s0=station(0);
var aG=A.griddle,gw=30,gh=gw*aG.h/aG.w;
var plate=new THREE.Mesh(new THREE.PlaneGeometry(gw,gh),new THREE.MeshBasicMaterial({map:photo('griddle'),color:0x6a6a6a}));plate.position.set(0,.6,-11);s0.add(plate);
var hg=new THREE.Mesh(new THREE.PlaneGeometry(10,10),new THREE.MeshBasicMaterial({map:heroGlowTex,transparent:true,depthWrite:false,opacity:.6}));hg.position.set(0,.1,-1.5);s0.add(hg);
var heroCard=cutout(s0,'burger_wrapped',5.8,0,-.1,0,{amp:0,sway:.025});
var steam=[];for(var i=0;i<14;i++){var m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:steamTex,transparent:true,depthWrite:false,opacity:0}));m.userData.steam=true;s0.add(m);steam.push({m:m,x:(hash(i)-.5)*7,z:-3-hash(i+3)*5,s:.5+hash(i+5)*.6,t:hash(i+9)});}

/* 1 journey: a dot map of Europe and North Africa, tilted like a table; the route arcs from London to Alexandria */
var s1=station(1), mapG=new THREE.Group(); s1.add(mapG); mapG.rotation.x=-.8; mapG.position.set(0,-.7,-1);
(function(){var n=MAP.dots.length,pos=new Float32Array(n*3),col=new Float32Array(n*3),cc=new THREE.Color(C.cream),bg=new THREE.Color(C.char),tmp=new THREE.Color();
  for(var i=0;i<n;i++){var x=MAP.dots[i][0],y=MAP.dots[i][1];pos[i*3]=x;pos[i*3+1]=y;
    var r=Math.sqrt((x/6.4)*(x/6.4)+(y/5.9)*(y/5.9)),a=Math.max(0,Math.min(1,(1.02-r)/.5))*.9;tmp.copy(bg).lerp(cc,a);col[i*3]=tmp.r;col[i*3+1]=tmp.g;col[i*3+2]=tmp.b;}
  var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));
  mapG.add(new THREE.Points(g,new THREE.PointsMaterial({size:.1,vertexColors:true,map:dotTex,alphaTest:.4,sizeAttenuation:true})));})();
var L=new THREE.Vector3(MAP.london[0],MAP.london[1],0), Al=new THREE.Vector3(MAP.alex[0],MAP.alex[1],0), arcPts=[];
for(var k=0;k<=80;k++){var tt=k/80;arcPts.push(new THREE.Vector3().lerpVectors(L,Al,tt).add(new THREE.Vector3(0,0,2.6*Math.sin(Math.PI*tt))));}
var arcCurve=new THREE.CatmullRomCurve3(arcPts), arcGeo=new THREE.TubeGeometry(arcCurve,200,.045,8,false), arcCount=arcGeo.index.count;
mapG.add(new THREE.Mesh(arcGeo,new THREE.MeshBasicMaterial({color:C.orange})));
function pin(v){var g=new THREE.Group();g.position.copy(v);
  var dot=new THREE.Mesh(new THREE.CircleGeometry(.13,32),new THREE.MeshBasicMaterial({color:C.orange}));dot.position.z=.01;g.add(dot);
  var ring=new THREE.Mesh(new THREE.RingGeometry(.2,.25,48),new THREE.MeshBasicMaterial({color:C.orange,transparent:true,depthWrite:false}));ring.position.z=.01;g.add(ring);
  var gl=new THREE.Sprite(new THREE.SpriteMaterial({map:pinGlowTex,transparent:true,depthWrite:false,opacity:.9}));gl.scale.set(1.3,1.3,1);g.add(gl);
  g.userData.ring=ring;mapG.add(g);return g;}
var pinL=pin(L), pinA=pin(Al);
var comet=new THREE.Sprite(new THREE.SpriteMaterial({map:pinGlowTex,transparent:true,depthWrite:false}));comet.scale.set(.9,.9,1);mapG.add(comet);
function labelSprite(key){var sp=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,depthTest:false}));sp.userData.key=key;sp.renderOrder=5;return sp;}
function paintLabel(sp){var txt=I18N[LANG][sp.userData.key];sp.material.map=canvasTex(512,128,function(x,w,h){x.font='60px "'+dispFont()+'"';var tw=Math.min(x.measureText(txt).width+84,w-8),x0=(w-tw)/2,r=52;x.fillStyle='#F4EBD9';x.beginPath();x.moveTo(x0+r,10);x.arcTo(x0+tw,10,x0+tw,h-10,r);x.arcTo(x0+tw,h-10,x0,h-10,r);x.arcTo(x0,h-10,x0,10,r);x.arcTo(x0,10,x0+tw,10,r);x.fill();x.fillStyle='#1F1F1F';x.textAlign='center';x.textBaseline='middle';x.fillText(txt,w/2,h/2+4);});sp.material.needsUpdate=true;sp.scale.set(2.3,.58,1);}
var labL=labelSprite('x.london'),labA=labelSprite('x.alex');mapG.add(labL);mapG.add(labA);
labL.position.set(L.x,L.y+.7,.5);labA.position.set(Al.x,Al.y-.75,.5);

/* 2 film: nothing floating; the video is the hero */
var s2=station(2);

/* 3 menu: one product at a time, changing as you scroll through the dishes */
var s3=station(3), menuSet=[];
function addSet(list){var g=new THREE.Group();s3.add(g);list.forEach(function(it){cutout(g,it[0],it[1],it[2],it[3],it[4],{amp:.12});});g.traverse(function(m){m.userData.menu=true;});menuSet.push(g);return g;}
addSet([['fries',5.2,0,-.3,0]]);
addSet([['chicken_box',6.0,0,-.6,0]]);
addSet([['matcha',2.1,-1.3,-.1,0],['lemonade',2.05,1.3,-.25,-.5]]);

/* 4 club: three tier coins climbing like a staircase */
var s4=station(4), coins=[];
var TIERS=[{k:'t1.name',r:1.0,c:0xDCC9A4,ink:'#1F1F1F'},{k:'t2.name',r:1.15,c:C.orange,ink:'#FFFFFF'},{k:'t3.name',r:1.35,c:C.gold,ink:'#1F1F1F',metal:.35}];
TIERS.forEach(function(T,i){var g=new THREE.Group();g.add(extrude(sealShape(T.r,10),.32,T.c,{metalness:T.metal||0,roughness:T.metal?.32:.55}));
  var faceMat=new THREE.MeshBasicMaterial({transparent:true});var f=new THREE.Mesh(new THREE.CircleGeometry(T.r*.82,48),faceMat);f.position.z=.27;g.add(f);
  var b=f.clone();b.rotation.y=Math.PI;b.position.z=-.27;g.add(b);g.userData={T:T,face:faceMat,ph:i*1.1};
  g.position.set(-1.9+i*1.9,-1.05+i*1.0,-i*.6);s4.add(g);coins.push(g);});
function paintCoins(){coins.forEach(function(g){var T=g.userData.T,txt=I18N[LANG][T.k]||'';g.userData.face.map=canvasTex(256,256,function(x,w,h){var fs=txt.length>9?40:52;x.font=fs+'px "'+dispFont()+'"';x.fillStyle=T.ink;x.textAlign='center';x.textBaseline='middle';
  var words=txt.split(' ');if(words.length>1&&x.measureText(txt).width>w*.84){var c=Math.ceil(words.length/2);x.fillText(words.slice(0,c).join(' '),w/2,h/2-fs*.55);x.fillText(words.slice(c).join(' '),w/2,h/2+fs*.6);}else x.fillText(txt,w/2,h/2+4);});g.userData.face.needsUpdate=true;});}

/* 5 perks: the takeaway bag, with a little confetti */
var s5=station(5);
cutout(s5,'bag',3.9,0,-.3,0,{shadow:.4,amp:.12});
var confN=mobile()?50:80, conf=new THREE.InstancedMesh(new THREE.PlaneGeometry(.1,.18),new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),confN), cd=new THREE.Object3D(), confData=[];
var palette=[new THREE.Color(C.char),new THREE.Color(C.cream),new THREE.Color(0xF7B733)];
for(var ci=0;ci<confN;ci++){var cx=(hash(ci)-.5)*14;if(Math.abs(cx)<2.6)cx+=cx<0?-2.6:2.6;confData.push({x:cx,y:hash(ci+1)*10-5,z:(hash(ci+2)-.5)*6-2,s:.5+hash(ci+3)*.9,r:hash(ci+4)*6});conf.setColorAt(ci,palette[ci%3]);}
s5.add(conf);

/* 6 join: the open burger box */
var s6=station(6);
cutout(s6,'burger_box',6.2,0,-.2,0,{amp:.12});

/* --- camera path --- */
var camPts=[],lookPts=[];
for(var si=0;si<N;si++){var z=-si*GAP;camPts.push(new THREE.Vector3(Math.sin(si*1.3)*2.0,.6+Math.cos(si*.9)*.5,z+14));lookPts.push(new THREE.Vector3(0,0,z));}
var camCurve=new THREE.CatmullRomCurve3(camPts),lookCurve=new THREE.CatmullRomCurve3(lookPts);

var sections=[].slice.call(document.querySelectorAll('main .st'));
/* phones: a timeline from page position to camera position; each scene arrives while its stage scrolls in, then holds while its text passes */
var KF=[];
function buildKF(){KF=[];if(!mobile())return;var vh=innerHeight,hh=document.querySelector('header').offsetHeight,maxY=Math.max(0,document.documentElement.scrollHeight-vh);
  function top(el){return el.getBoundingClientRect().top+scrollY;}
  var lastY=0,lastT=0;KF.push([0,0]);
  function add(y,v){y=Math.min(Math.max(y,lastY),maxY);if(y<=lastY&&KF.length>1){KF[KF.length-1][1]=v;lastT=v;return;}KF.push([y,v]);lastY=y;lastT=v;}
  for(var i=1;i<sections.length;i++){var a=sections[i].querySelector('.stage')||sections[i],A=top(a),arrT=i===3?2.62:i;
    add(A-vh,lastT);add(A-hh,arrT);
    if(i===3)add(A+a.offsetHeight-vh,3.38);}
  if(lastY<maxY)KF.push([maxY+1,lastT]);}
function kfT(){var y=scrollY;if(y<=KF[0][0])return KF[0][1];for(var i=1;i<KF.length;i++){if(y<=KF[i][0]){var a=KF[i-1],b=KF[i],d=b[0]-a[0];return d>0?a[1]+(b[1]-a[1])*(y-a[0])/d:b[1];}}return KF[KF.length-1][1];}
function scrollT(){if(mobile()&&KF.length>1)return kfT();var c=innerHeight/2;for(var i=0;i<sections.length;i++){var r=sections[i].getBoundingClientRect();if(c<r.bottom||i===sections.length-1){var f=(c-r.top)/r.height;return Math.max(0,Math.min(N-1,i+f-.5));}}return 0;}
var t=scrollT();

/* text side vs object side */
var ZOOM=1;
function size(){var w=innerWidth,h=innerHeight;ZOOM=mobile()?1.85:(w/h<1.15?1.35:1);scene.fog.near=20*ZOOM;scene.fog.far=Math.min(58*ZOOM,14*ZOOM+44);
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile()?1.6:2));renderer.setSize(w,h,false);camera.aspect=w/h;
  var rtl=document.documentElement.dir==='rtl';
  lastVO=null;
  if(mobile()) camera.setViewOffset(w,h,0,h*.21,w,h); else camera.setViewOffset(w,h,(rtl?1:-1)*w*.21,0,w,h);
  camera.updateProjectionMatrix();
  var big=mobile()?1:1.12; s3.scale.setScalar(big); s5.scale.setScalar(big); s6.scale.setScalar(big);}
addEventListener('resize',function(){size();buildKF();});
if(window.ResizeObserver)new ResizeObserver(function(){buildKF();}).observe(document.querySelector('main'));
addEventListener('langchange',function(){size();buildKF();paintLabel(labL);paintLabel(labA);paintCoins();});

var mx=0,my=0,pmx=0,pmy=0;
addEventListener('pointermove',function(e){if(e.pointerType==='mouse'){mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5;}});

var km=document.getElementById('km');
function setKm(f){var v=Math.round(3335*f);km.textContent=LANG==='ar'?v.toLocaleString('ar-EG')+' كم':v.toLocaleString('en-US')+' km';}
var frame=document.getElementById('frame');
function sstep(x){x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);}
function camT(t){ if(t<2) return t; if(t<2.62) return 2+(t-2)/.62; if(t<3.38) return 3; if(t<4) return 3+(t-3.38)/.62; return t; }
var vis=[1,1,1,1,1,1,1];
function fadeStation(g,v){g.visible=v>.01;if(!g.visible)return;g.traverse(function(m){if(!m.material||m.userData.menu||m.userData.steam)return;if(m.userData.op0==null){m.userData.op0=m.material.opacity;m.material.transparent=true;}m.material.opacity=m.userData.op0*v;});}

var bgA=new THREE.Color(),bgB=new THREE.Color(),clock=new THREE.Clock(),visible=true,intro=0,lastVO=null;
document.addEventListener('visibilitychange',function(){visible=!document.hidden;});
function loop(){
  requestAnimationFrame(loop);
  if(!visible) return;
  var dt=Math.min(clock.getDelta(),.05),time=clock.elapsedTime;
  t+=(scrollT()-t)*(REDUCE?1:Math.min(1,dt*4.5));
  pmx+=(mx-pmx)*Math.min(1,dt*3);pmy+=(my-pmy)*Math.min(1,dt*3);
  var tc=camT(t),u=tc/(N-1),lp=lookCurve.getPointAt(u);
  camera.position.copy(camCurve.getPointAt(u)).sub(lp).multiplyScalar(ZOOM).add(lp);
  if(!REDUCE){camera.position.x+=pmx*1.1;camera.position.y-=pmy*.6;}
  camera.lookAt(lp);
  if(mobile()){var vo=Math.round(innerHeight*(.21-.17*sstep((t-2.2)/.45)));if(vo!==lastVO){lastVO=vo;camera.setViewOffset(innerWidth,innerHeight,0,vo,innerWidth,innerHeight);camera.updateProjectionMatrix();}}
  var i0=Math.floor(tc),i1=Math.min(N-1,i0+1),f=tc-i0;
  stations.forEach(function(g,i){var dz=camera.position.z-(-i*GAP);vis[i]=sstep((dz-3)/7);fadeStation(g,vis[i]);});
  var lv=sstep((tc-.45)/.3)*(1-sstep((tc-1.45)/.3))*vis[1];labL.visible=labA.visible=lv>.01;labL.material.opacity=labA.material.opacity=lv;
  bgA.set(BG[i0]);bgB.set(BG[i1]);bgA.lerp(bgB,sstep(f));scene.background.copy(bgA);scene.fog.color.copy(bgA);

  if(loaded&&intro<1){intro=Math.min(1,intro+dt/1.4);}
  var e=1-Math.pow(1-intro,3);
  cards.forEach(function(c){c.g.quaternion.copy(camera.quaternion);
    if(!REDUCE&&c.amp){c.g.position.y=c.base+Math.sin(time*1.05+c.ph)*c.amp;}
    if(!REDUCE)c.p.rotation.z=Math.sin(time*.7+c.ph)*c.sway;});
  heroCard.position.y=-.1+(1-e)*-4+(REDUCE?0:Math.sin(time*1.05)*.16); heroCard.scale.setScalar(.85+.15*e);
  steam.forEach(function(sp){if(!REDUCE)sp.t=(sp.t+dt*.16*sp.s)%1;var k=sp.t;sp.m.position.set(sp.x+Math.sin(time*.6+sp.x)*.5,-2.6+k*7,sp.z);sp.m.scale.setScalar(1.5+k*4);sp.m.material.opacity=Math.sin(k*Math.PI)*.38*e*vis[0];sp.m.quaternion.copy(camera.quaternion);});

  // journey: the route draws itself, a light travels along it, the counter rolls to 3,335 km
  var jf=sstep((t-.45)/.5); arcGeo.setDrawRange(0,Math.floor(arcCount*jf/6)*6); setKm(jf);
  comet.position.copy(arcCurve.getPointAt(Math.max(.001,jf))); comet.material.opacity=jf>0&&jf<.995?1:0;
  [pinL,pinA].forEach(function(p,i){var k=REDUCE?.5:(time*.6+i*.5)%1;p.userData.ring.scale.setScalar(1+k*1.6);p.userData.ring.material.opacity=(1-k)*.8;});

  var ff=Math.max(-1,Math.min(1,t-2)); frame.style.setProperty('--ry',(ff*-12).toFixed(2)+'deg'); frame.style.setProperty('--rx',(ff*4).toFixed(2)+'deg');

  // menu: crossfade between products as you scroll the dishes
  var mp=sstep((t-2.62)/.76)*menuSet.length;
  menuSet.forEach(function(g,j){var d=mp-(j+.5);if(j===0&&d<0)d=0;if(j===menuSet.length-1&&d>0)d=0;var w=sstep(1-Math.abs(d)*1.4);
    g.visible=w>.01;g.position.x=-d*2.6;g.scale.setScalar(.9+.1*w);g.traverse(function(m){if(m.material&&m.userData.op0!=null)m.material.opacity=m.userData.op0*w*vis[3];});});

  coins.forEach(function(g){if(!REDUCE)g.rotation.y=Math.sin(time*.8+g.userData.ph)*.7;});
  for(var i=0;i<confN;i++){var c=confData[i];if(!REDUCE){c.y-=dt*c.s;if(c.y<-5)c.y=5;c.r+=dt*2;}cd.position.set(c.x+Math.sin(time+c.r)*.3,c.y,c.z);cd.rotation.set(c.r,c.r*.7,0);cd.updateMatrix();conf.setMatrixAt(i,cd.matrix);}
  conf.instanceMatrix.needsUpdate=true;
  renderer.render(scene,camera);
}
size();
var fontsReady=document.fonts?Promise.race([Promise.all([document.fonts.load('60px "Titan One"'),document.fonts.load('60px "Lalezar"')]),new Promise(function(r){setTimeout(r,2500)})]):Promise.resolve();
var photosReady=new Promise(function(r){mgr.onLoad=r;setTimeout(r,7000);});
Promise.all([fontsReady,photosReady]).then(function(){paintLabel(labL);paintLabel(labA);paintCoins();loaded=true;done();buildKF();});
buildKF();
loop();
})();
