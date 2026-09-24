import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const container = document.getElementById("viewer");
const loader = document.getElementById("loader");

// ---------- Renderer, scene, camera ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(7, 2.6, 7);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.6, 0);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 4;
controls.maxDistance = 12;
controls.maxPolarAngle = Math.PI / 2.05;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.2;

// ---------- Lights and ground ----------
scene.add(new THREE.HemisphereLight(0xffffff, 0x222233, 0.6));

const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(4, 8, 3);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -4;
sun.shadow.camera.right = 4;
sun.shadow.camera.top = 4;
sun.shadow.camera.bottom = -4;
sun.shadow.radius = 6;
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(8, 64),
  new THREE.ShadowMaterial({ opacity: 0.45 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const glow = new THREE.Mesh(
  new THREE.RingGeometry(2.6, 2.65, 96),
  new THREE.MeshBasicMaterial({ color: 0xc1121f, transparent: true, opacity: 0.6 })
);
glow.rotation.x = -Math.PI / 2;
glow.position.y = 0.002;
scene.add(glow);

// ---------- Car (built from code, no model files) ----------
const paint = new THREE.MeshPhysicalMaterial({
  color: 0xc1121f,
  metalness: 0.6,
  roughness: 0.25,
  clearcoat: 1,
  clearcoatRoughness: 0.05,
});
const glass = new THREE.MeshPhysicalMaterial({
  color: 0x0d1420,
  metalness: 0.9,
  roughness: 0.05,
  clearcoat: 1,
});
const rubber = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
const alloy = new THREE.MeshStandardMaterial({ color: 0xcfd3d8, metalness: 1, roughness: 0.25 });
const trim = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.5 });
const headlightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xdfefff, emissiveIntensity: 2 });
const taillightMat = new THREE.MeshStandardMaterial({ color: 0xff2030, emissive: 0xff1020, emissiveIntensity: 2 });

const car = new THREE.Group();
scene.add(car);

function extrude(shape, depth, bevel) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 5,
    curveSegments: 32,
  });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

// Side profile of the lower body, with wheel arches cut into the outline.
const WHEEL_X = 1.4;
const WHEEL_R = 0.36;
const ARCH_R = 0.44;
const body = new THREE.Shape();
body.moveTo(-2.2, 0.35);
body.lineTo(-1.84, 0.25);
body.lineTo(-1.84, WHEEL_R);
body.absarc(-WHEEL_X, WHEEL_R, ARCH_R, Math.PI, 0, true);
body.lineTo(-0.96, 0.25);
body.lineTo(0.96, 0.25);
body.lineTo(0.96, WHEEL_R);
body.absarc(WHEEL_X, WHEEL_R, ARCH_R, Math.PI, 0, true);
body.lineTo(1.84, 0.25);
body.lineTo(2.15, 0.3);
body.quadraticCurveTo(2.32, 0.45, 2.25, 0.62);
body.quadraticCurveTo(2.1, 0.82, 1.5, 0.88);
body.lineTo(-1.6, 0.92);
body.quadraticCurveTo(-2.15, 0.92, -2.22, 0.7);
body.closePath();

const bodyMesh = new THREE.Mesh(extrude(body, 1.7, 0.08), paint);
bodyMesh.castShadow = true;
car.add(bodyMesh);

// Glass cabin.
const cabin = new THREE.Shape();
cabin.moveTo(1.1, 0.86);
cabin.quadraticCurveTo(0.5, 1.3, -0.1, 1.33);
cabin.lineTo(-0.7, 1.3);
cabin.quadraticCurveTo(-1.4, 1.2, -1.75, 0.9);
cabin.closePath();

const cabinMesh = new THREE.Mesh(extrude(cabin, 1.35, 0.1), glass);
cabinMesh.castShadow = true;
car.add(cabinMesh);

// Lights.
for (const z of [-0.6, 0.6]) {
  const hl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.45), headlightMat);
  hl.position.set(2.24, 0.68, z);
  hl.rotation.z = -0.5;
  car.add(hl);
}
const tail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 1.6), taillightMat);
tail.position.set(-2.28, 0.8, 0);
car.add(tail);

// Front grille / diffuser.
const grille = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 1.1), trim);
grille.position.set(2.3, 0.42, 0);
car.add(grille);
const diffuser = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.5), trim);
diffuser.position.set(-2.25, 0.34, 0);
car.add(diffuser);

// Wheels.
const wheels = [];
function makeWheel() {
  const wheel = new THREE.Group();
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.26, 48), rubber);
  tire.rotation.x = Math.PI / 2;
  tire.castShadow = true;
  wheel.add(tire);

  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.27, 48), alloy);
  rim.rotation.x = Math.PI / 2;
  wheel.add(rim);

  const hub = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.29), trim);
    spoke.rotation.z = (i / 5) * Math.PI;
    hub.add(spoke);
  }
  wheel.add(hub);
  return wheel;
}
for (const x of [-WHEEL_X, WHEEL_X]) {
  for (const z of [-0.78, 0.78]) {
    const w = makeWheel();
    w.position.set(x, WHEEL_R, z);
    car.add(w);
    wheels.push(w);
  }
}

loader.remove();

// ---------- UI ----------
document.querySelectorAll(".swatch").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelector(".swatch.active")?.classList.remove("active");
    btn.classList.add("active");
    paint.color.set(btn.dataset.color);
  });
});

document.getElementById("autorotate").addEventListener("change", (e) => {
  controls.autoRotate = e.target.checked;
});

// ---------- Resize and render loop ----------
function resize() {
  const { clientWidth: w, clientHeight: h } = container;
  if (!w || !h) return;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  // Pull the camera back on narrow (phone) screens so the whole car fits.
  camera.fov = w < 600 ? 40 : 35;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(container);
resize();

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const t = clock.getElapsedTime();
  glow.material.opacity = 0.35 + Math.sin(t * 2) * 0.2;
  if (controls.autoRotate) wheels.forEach((w) => (w.children[2].rotation.z -= 0.02));
  controls.update();
  renderer.render(scene, camera);
});
