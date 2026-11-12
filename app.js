import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const viewport = document.querySelector('#viewport');
const loading = document.querySelector('#loading');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x24231f);
scene.fog = new THREE.Fog(0x24231f, 9, 23);

const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
camera.position.set(4.2, 3.1, 6.8);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
viewport.appendChild(renderer.domElement);
loading.remove();

scene.add(new THREE.HemisphereLight(0xc9c5b8, 0x30241d, 2.0));
const key = new THREE.DirectionalLight(0xffdfc4, 4.1);
key.position.set(-3, 7, 5); key.castShadow = true; key.shadow.mapSize.set(2048,2048);
key.shadow.camera.left=-8; key.shadow.camera.right=8; key.shadow.camera.top=8; key.shadow.camera.bottom=-8;
scene.add(key);
const rim = new THREE.DirectionalLight(0xff7047, 2.8); rim.position.set(4,3,-5); scene.add(rim);
const fill = new THREE.PointLight(0xd8c4a2, 22, 12); fill.position.set(2,2,4); scene.add(fill);

// A beveled, solid 3D brick: an extruded rectangular profile, not a flat picture.
const w=3.15, h=1.35, d=1.55, bevel=.09;
const shape = new THREE.Shape();
shape.moveTo(-w/2+bevel,-h/2);
shape.lineTo(w/2-bevel,-h/2); shape.quadraticCurveTo(w/2,-h/2,w/2,-h/2+bevel);
shape.lineTo(w/2,h/2-bevel); shape.quadraticCurveTo(w/2,h/2,w/2-bevel,h/2);
shape.lineTo(-w/2+bevel,h/2); shape.quadraticCurveTo(-w/2,h/2,-w/2,h/2-bevel);
shape.lineTo(-w/2,-h/2+bevel); shape.quadraticCurveTo(-w/2,-h/2,-w/2+bevel,-h/2);
const geometry = new THREE.ExtrudeGeometry(shape, {depth:d-2*bevel, bevelEnabled:true, bevelSegments:3, steps:1, bevelSize:bevel, bevelThickness:bevel, curveSegments:5});
geometry.translate(0,0,-(d-2*bevel)/2);
geometry.computeVertexNormals();
const brickMaterial = new THREE.MeshStandardMaterial({color:0xb84a32, roughness:.82, metalness:0});
const brick = new THREE.Mesh(geometry, brickMaterial);
brick.castShadow=true; brick.receiveShadow=true; scene.add(brick);

// Subtle recessed-looking pressed lettering is real 3D geometry on the front face.
const labelCanvas=document.createElement('canvas'); labelCanvas.width=512; labelCanvas.height=180;
const ctx=labelCanvas.getContext('2d');
ctx.clearRect(0,0,512,180); ctx.fillStyle='#f2a084'; ctx.font='bold 38px Arial'; ctx.textAlign='center'; ctx.fillText('BRICKYARD',256,103);
const labelTexture=new THREE.CanvasTexture(labelCanvas); labelTexture.colorSpace=THREE.SRGBColorSpace;
const label=new THREE.Mesh(new THREE.PlaneGeometry(1.8,.63),new THREE.MeshBasicMaterial({map:labelTexture,transparent:true,depthWrite:false}));
label.position.set(0,0,d/2+.012); brick.add(label);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:0x292822,roughness:1}));
floor.rotation.x=-Math.PI/2; floor.position.y=-1.45; floor.receiveShadow=true; scene.add(floor);
const grid=new THREE.GridHelper(30,30,0x5a5145,0x403d35); grid.position.y=-1.44; grid.material.transparent=true; grid.material.opacity=.25; scene.add(grid);
const shadowPlane = new THREE.Mesh(new THREE.CircleGeometry(2.1,48),new THREE.MeshBasicMaterial({color:0x090807,transparent:true,opacity:.25}));
shadowPlane.rotation.x=-Math.PI/2; shadowPlane.scale.set(1.15,.58,1); shadowPlane.position.set(0,-1.43,0); scene.add(shadowPlane);

const target = new THREE.Vector3(0,0,0);
let isDragging=false, isOrbiting=false, lastX=0,lastY=0, pointerDown=null;
let orbitTheta=Math.atan2(camera.position.x,camera.position.z), orbitPhi=Math.acos(camera.position.y/camera.position.length()), radius=camera.position.length();
const raycaster=new THREE.Raycaster(), pointer=new THREE.Vector2(), dragPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0), hit=new THREE.Vector3(), offset=new THREE.Vector3();
function setCamera(){orbitPhi=Math.max(.25,Math.min(1.45,orbitPhi));camera.position.set(radius*Math.sin(orbitPhi)*Math.sin(orbitTheta),radius*Math.cos(orbitPhi),radius*Math.sin(orbitPhi)*Math.cos(orbitTheta));camera.lookAt(target)}
function resize(){const r=viewport.getBoundingClientRect();camera.aspect=r.width/r.height;camera.updateProjectionMatrix();renderer.setSize(r.width,r.height,false)}
new ResizeObserver(resize).observe(viewport); resize();
function setPointer(e){const r=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1}
renderer.domElement.addEventListener('pointerdown',e=>{
  setPointer(e); raycaster.setFromCamera(pointer,camera); const hits=raycaster.intersectObject(brick,true);
  pointerDown={x:e.clientX,y:e.clientY};
  if(hits.length){isDragging=true; camera.getWorldDirection(dragPlane.normal); dragPlane.constant=-brick.position.y; raycaster.ray.intersectPlane(dragPlane,hit); offset.copy(brick.position).sub(hit); renderer.domElement.style.cursor='grabbing'}
  else {isOrbiting=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.style.cursor='grabbing'}
  renderer.domElement.setPointerCapture(e.pointerId);
});
renderer.domElement.addEventListener('pointermove',e=>{
  if(!isDragging&&!isOrbiting)return;
  if(isDragging){setPointer(e);raycaster.setFromCamera(pointer,camera);if(raycaster.ray.intersectPlane(dragPlane,hit)){brick.position.copy(hit.add(offset));brick.position.y=Math.max(-.65,Math.min(2.7,brick.position.y));brick.position.x=Math.max(-4,Math.min(4,brick.position.x));brick.position.z=Math.max(-4,Math.min(4,brick.position.z));}}
  else {orbitTheta-=(e.clientX-lastX)*.008;orbitPhi+=(e.clientY-lastY)*.008;lastX=e.clientX;lastY=e.clientY;setCamera()}
});
function stop(){isDragging=false;isOrbiting=false;renderer.domElement.style.cursor='grab'}
renderer.domElement.addEventListener('pointerup',stop);renderer.domElement.addEventListener('pointercancel',stop);
renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();radius=Math.max(4,Math.min(13,radius+e.deltaY*.008));setCamera()},{passive:false});
renderer.domElement.style.cursor='grab';
document.querySelector('#spinLeft').onclick=()=>brick.rotation.y-=.28;
document.querySelector('#spinRight').onclick=()=>brick.rotation.y+=.28;
document.querySelector('#tiltUp').onclick=()=>brick.rotation.x-=.18;
document.querySelector('#tiltDown').onclick=()=>brick.rotation.x+=.18;
document.querySelector('#reset').onclick=()=>{brick.position.set(0,0,0);brick.rotation.set(0,0,0);orbitTheta=.55;orbitPhi=1.12;radius=7.7;setCamera()};
setCamera();
function animate(){requestAnimationFrame(animate);renderer.render(scene,camera)} animate();

// Demo-only donation UI. Real payments require a server-created Stripe Checkout session.
const amount=document.querySelector('#amount'),buttonAmount=document.querySelector('#buttonAmount'),message=document.querySelector('#message');
function updateAmount(){const n=Number(amount.value);buttonAmount.textContent=Number.isFinite(n)?'$'+n.toLocaleString('en-US',{maximumFractionDigits:0}):'$0';document.querySelectorAll('[data-amount]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.amount)===n))}
amount.addEventListener('input',updateAmount);
document.querySelectorAll('[data-amount]').forEach(b=>b.addEventListener('click',()=>{amount.value=b.dataset.amount;updateAmount()}));
let total=0,count=0;
document.querySelector('#contribute').addEventListener('click',()=>{
 const n=Number(amount.value);
 if(!Number.isInteger(n)||n<1||n>500){message.textContent='Choose a whole-dollar amount between $1 and $500.';message.classList.add('show');return}
 total+=n;count++;document.querySelector('#total').textContent='$'+total.toLocaleString('en-US');document.querySelector('#count').textContent=count;
 const name=document.querySelector('#name').value.trim();
 message.textContent=`Thanks${name?', '+name:''}. This is a local demo: no payment was taken. Connect Stripe Checkout to accept real contributions.`;
 message.classList.add('show');
});
updateAmount();
