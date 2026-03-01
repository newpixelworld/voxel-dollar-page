// VoxelDollarPage - Viewer con config + interattività
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
camera.position.set(20, 20, 20);
scene.background = new THREE.Color(0x111111);

// Raycaster per click
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Carica config
let voxelConfig = [];
fetch('config.json').then(r => r.json()).then(data => voxelConfig = data.voxels);

// Grid 20x20x20
const size = 20;
const geometry = new THREE.BoxGeometry(1, 1, 1);
const voxels = [];
const colors = [0x888888]; // Grigio per vuoti

for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
        for (let z = 0; z < size; z++) {
            const id = `${x}-${y}-${z}`;
            let color = 0x888888; // Default grigio
            let url = '', tooltip = '';
            
            // Check config
            const conf = voxelConfig.find(v => v.id === id);
            if (conf) {
                color = conf.color;
                url = conf.url;
                tooltip = conf.tooltip;
            }
            
            const material = new THREE.MeshLambertMaterial({ color });
            const voxel = new THREE.Mesh(geometry, material);
            voxel.position.set(x - size/2, y - size/2, z - size/2);
            voxel.userData = { id, url, tooltip, sold: !!conf };
            scene.add(voxel);
            voxels.push(voxel);
        }
    }
}

// Luci
scene.add(new THREE.DirectionalLight(0xffffff, 1).position.set(1,1,1));
scene.add(new THREE.AmbientLight(0x404040));

// Animate + click
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(voxels);
    if (intersects[0]) {
        const voxel = intersects[0].object;
        if (voxel.userData.sold && voxel.userData.url) {
            window.open(voxel.userData.url, '_blank');
            alert(`Voxel ${voxel.userData.id}: ${voxel.userData.tooltip}`);
        } else {
            window.location.href = 'buy.html';
        }
    }
});

// Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
