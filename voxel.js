// VoxelDollarPage - Viewer Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
camera.position.set(20, 20, 20);
controls.update();

// Grid 20x20x20 voxel
const size = 20;
const geometry = new THREE.BoxGeometry(1, 1, 1);
const voxels = [];
const config = []; // TODO: carica da config.json

// Colori random per demo (poi da acquisti)
const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
        for (let z = 0; z < size; z++) {
            const material = new THREE.MeshLambertMaterial({ color: colors[Math.floor(Math.random() * colors.length)] });
            const voxel = new THREE.Mesh(geometry, material);
            voxel.position.set(x - size/2, y - size/2, z - size/2);
            voxel.userData = { id: `${x}-${y}-${z}`, sold: false };
            scene.add(voxel);
            voxels.push(voxel);
        }
    }
}

// Luci
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 1);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// Animate
function animate() {
    requestAnimationFrame(animate);
    voxels.forEach(v => v.rotation.y += 0.01); // Rotazione fancy
    renderer.render(scene, camera);
}
animate();

// Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
