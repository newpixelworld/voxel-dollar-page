import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { SelectionBox } from "three/addons/interactive/SelectionBox.js";
import { SelectionHelper } from "three/addons/interactive/SelectionHelper.js";

import { clamp, blockFromSelected, saveSelection } from "./voxel.js";

const REVOLUT_LINK = "https://revolut.me/francelqup";
const GRID_SIZE = 100;                 // 100x100x100 = 1,000,000
const WORLD_HALF = GRID_SIZE / 2;
const STEP = 5;                        // proxy density
const PRICE_PER_VOXEL_EUR = 1;

const selTxt = document.getElementById("selTxt");
const qtyEl = document.getElementById("qty");
const priceEl = document.getElementById("price");
const payBtn = document.getElementById("payBtn");
const clearBtn = document.getElementById("clearBtn");

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0f14);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 2000);
camera.position.set(120, 120, 120);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const dir = new THREE.DirectionalLight(0xffffff, 1.0);
dir.position.set(1, 2, 1);
scene.add(dir);

// Visible boundary cube so you can always "see something"
const boundary = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(GRID_SIZE, GRID_SIZE, GRID_SIZE)),
  new THREE.LineBasicMaterial({ color: 0x2e3a48 })
);
scene.add(boundary);

// Proxies for SelectionBox (invisible but selectable)
const proxyGroup = new THREE.Group();
scene.add(proxyGroup);

const proxyGeom = new THREE.SphereGeometry(0.15, 6, 6);
const proxyMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0 });

for (let x = 0; x <= GRID_SIZE; x += STEP) {
  for (let y = 0; y <= GRID_SIZE; y += STEP) {
    for (let z = 0; z <= GRID_SIZE; z += STEP) {
      const m = new THREE.Mesh(proxyGeom, proxyMat);
      m.position.set(x - WORLD_HALF, y - WORLD_HALF, z - WORLD_HALF);
      m.userData.grid = { x, y, z }; // 0..100 corners
      proxyGroup.add(m);
    }
  }
}

const selectionBox = new SelectionBox(camera, proxyGroup); // drag frustum select [web:197]
const helper = new SelectionHelper(renderer, "selectBox"); // draws rectangle [web:231]

let current = null;

function clearSelection() {
  current = null;
  selTxt.textContent = "None";
  qtyEl.textContent = "0";
  priceEl.textContent = "€0";
  payBtn.disabled = true;
  localStorage.removeItem("voxel_selection");
}
clearBtn.addEventListener("click", clearSelection);

document.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  selectionBox.startPoint.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1, 0.5);
});

document.addEventListener("pointerup", (e) => {
  if (e.button !== 0) return;
  selectionBox.endPoint.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1, 0.5);

  const selected = selectionBox.select(); // Object3D[] [web:197]
  if (!selected.length) return clearSelection();

  const block = blockFromSelected(selected, GRID_SIZE);
  if (!block) return clearSelection();

  const dx = block.max.x - block.min.x + 1;
  const dy = block.max.y - block.min.y + 1;
  const dz = block.max.z - block.min.z + 1;
  const qty = dx * dy * dz;
  const price = qty * PRICE_PER_VOXEL_EUR;

  current = { ...block, qty, price };

  selTxt.textContent = `${block.min.x},${block.min.y},${block.min.z} → ${block.max.x},${block.max.y},${block.max.z}`;
  qtyEl.textContent = String(qty);
  priceEl.textContent = `€${price}`;
  payBtn.disabled = qty <= 0;

  saveSelection(current);
});

payBtn.addEventListener("click", async () => {
  if (!current) return;

  const note =
    `VoxelDollarPage | ${current.qty} voxel(s) | Block ` +
    `${current.min.x},${current.min.y},${current.min.z}→${current.max.x},${current.max.y},${current.max.z} | €${current.price}`;

  try { await navigator.clipboard.writeText(note); } catch {}

  alert(
    `Revolut will open in a new tab.\n\n` +
    `1) Send €${current.price} to francelqup\n` +
    `2) Paste the note (already copied)\n` +
    `3) Then submit your logo + link on the next page.`
  );

  window.open(REVOLUT_LINK, "_blank", "noopener,noreferrer");
  window.location.href = "./buy.html";
});

function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
