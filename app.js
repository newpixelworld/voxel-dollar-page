import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.167.1/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.167.1/examples/jsm/controls/OrbitControls.js";
import { SelectionBox } from "https://cdn.jsdelivr.net/npm/three@0.167.1/examples/jsm/interactive/SelectionBox.js";
import { SelectionHelper } from "https://cdn.jsdelivr.net/npm/three@0.167.1/examples/jsm/interactive/SelectionHelper.js";

const REVOLUT_LINK = "https://revolut.me/francelqup";
const PRICE_PER_VOXEL_EUR = 1;

// World settings
const GRID_SIZE = 100;          // 100x100x100 = 1,000,000
const WORLD_HALF = GRID_SIZE/2; // 50

// --- Three.js scene ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0f14);

const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 2000);
camera.position.set(120, 120, 120);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(1, 2, 1);
scene.add(dir);

// A lightweight visual grid cube (so you SEE something)
const box = new THREE.BoxGeometry(GRID_SIZE, GRID_SIZE, GRID_SIZE);
const edges = new THREE.EdgesGeometry(box);
const grid = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x2e3a48 }));
grid.position.set(0, 0, 0);
scene.add(grid);

// Add a small set of "proxy points" for SelectionBox to hit.
// SelectionBox selects OBJECTS in frustum, so we create points at grid corners every N steps.
const STEP = 5; // lower = more precise, higher = faster
const proxy = [];
const proxyGroup = new THREE.Group();
scene.add(proxyGroup);

const proxyGeom = new THREE.SphereGeometry(0.15, 6, 6);
const proxyMat = new THREE.MeshBasicMaterial({ color: 0x55aaff, transparent: true, opacity: 0.0 }); // invisible but selectable
for (let x=0; x<=GRID_SIZE; x+=STEP) {
  for (let y=0; y<=GRID_SIZE; y+=STEP) {
    for (let z=0; z<=GRID_SIZE; z+=STEP) {
      const m = new THREE.Mesh(proxyGeom, proxyMat);
      m.position.set(x - WORLD_HALF, y - WORLD_HALF, z - WORLD_HALF);
      m.userData.grid = { x, y, z }; // 0..100
      proxyGroup.add(m);
      proxy.push(m);
    }
  }
}

// SelectionBox setup (official pattern) [web:226][web:197]
const selectionBox = new SelectionBox(camera, proxyGroup);
const helper = new SelectionHelper(renderer, "selectBox");

// UI refs
const selTxt = document.getElementById("selTxt");
const qtyEl = document.getElementById("qty");
const priceEl = document.getElementById("price");
const payBtn = document.getElementById("payBtn");
const clearBtn = document.getElementById("clearBtn");

let currentSelection = null;

function clearSelection() {
  currentSelection = null;
  selTxt.textContent = "None";
  qtyEl.textContent = "0";
  priceEl.textContent = "€0";
  payBtn.disabled = true;
}
clearBtn.addEventListener("click", clearSelection);

document.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  selectionBox.startPoint.set(
    (event.clientX / innerWidth) * 2 - 1,
    -(event.clientY / innerHeight) * 2 + 1,
    0.5
  );
});

document.addEventListener("pointermove", (event) => {
  if (!helper.isDown) return;
  selectionBox.endPoint.set(
    (event.clientX / innerWidth) * 2 - 1,
    -(event.clientY / innerHeight) * 2 + 1,
    0.5
  );
  selectionBox.select(); // live update (optional)
});

document.addEventListener("pointerup", (event) => {
  if (event.button !== 0) return;

  selectionBox.endPoint.set(
    (event.clientX / innerWidth) * 2 - 1,
    -(event.clientY / innerHeight) * 2 + 1,
    0.5
  );

  const selected = selectionBox.select(); // returns Object3D[] [web:197]
  if (!selected.length) { clearSelection(); return; }

  // Convert selected proxy points -> min/max in grid coords
  let minX=Infinity, minY=Infinity, minZ=Infinity;
  let maxX=-Infinity, maxY=-Infinity, maxZ=-Infinity;

  for (const obj of selected) {
    const g = obj.userData.grid;
    if (!g) continue;
    minX = Math.min(minX, g.x); minY = Math.min(minY, g.y); minZ = Math.min(minZ, g.z);
    maxX = Math.max(maxX, g.x); maxY = Math.max(maxY, g.y); maxZ = Math.max(maxZ, g.z);
  }

  // Normalize to voxel cells (0..99) and ensure min<=max
  // If you drag across proxy points, you want voxel block inside:
  const voxelMin = { x: Math.min(minX, maxX), y: Math.min(minY, maxY), z: Math.min(minZ, maxZ) };
  const voxelMax = { x: Math.max(minX, maxX)-1, y: Math.max(minY, maxY)-1, z: Math.max(minZ, maxZ)-1 };

  // Clamp
  for (const k of ["x","y","z"]) {
    voxelMin[k] = Math.max(0, Math.min(GRID_SIZE-1, voxelMin[k]));
    voxelMax[k] = Math.max(0, Math.min(GRID_SIZE-1, voxelMax[k]));
  }

  const dx = voxelMax.x - voxelMin.x + 1;
  const dy = voxelMax.y - voxelMin.y + 1;
  const dz = voxelMax.z - voxelMin.z + 1;
  const qty = Math.max(0, dx*dy*dz);
  const price = qty * PRICE_PER_VOXEL_EUR;

  currentSelection = { voxelMin, voxelMax, qty, price };

  selTxt.textContent = `${voxelMin.x},${voxelMin.y},${voxelMin.z} → ${voxelMax.x},${voxelMax.y},${voxelMax.z}`;
  qtyEl.textContent = String(qty);
  priceEl.textContent = `€${price}`;

  payBtn.disabled = qty === 0;
});

// Payment: open Revolut + copy note
payBtn.addEventListener("click", async () => {
  if (!currentSelection) return;

  const note =
    `VoxelDollarPage | ${currentSelection.qty} voxel(s) | ` +
    `Block ${currentSelection.voxelMin.x},${currentSelection.voxelMin.y},${currentSelection.voxelMin.z}` +
    `→${currentSelection.voxelMax.x},${currentSelection.voxelMax.y},${currentSelection.voxelMax.z}`;

  try { await navigator.clipboard.writeText(note); } catch {}
  alert(
    `1) Revolut will open.\n` +
    `2) Send €${currentSelection.price} to francelqup.\n` +
    `3) Paste this payment note (already copied):\n\n${note}\n\n` +
    `Then come back and upload your logo (Step 2).`
  );

  window.open(REVOLUT_LINK, "_blank", "noopener,noreferrer");
});

function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

addEventListener("resize", () => {
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
