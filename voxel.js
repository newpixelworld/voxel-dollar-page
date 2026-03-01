// VoxelDollarPage PRO FIXED - Select voxels + 1M optimized
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
camera.position.set(60, 60, 60);
scene.background = new THREE.Color(0x111111);

let voxelConfig = [];
let selectMode = false;
let selectedVoxel = null;
const size = 100;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Carica config
fetch('config.json').then(r => r.json()).then(data => voxelConfig = data.voxels).catch(() => voxelConfig = []);

// CREA voxel INDIVIDUALI solo dove serve (performance: 1000+ max, griglia wireframe per vista)
const voxelMeshes = []; // Array per raycasting
const geometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);

// Wireframe griglia per 1M effetto (non clickable)
const wireGeo = new THREE.WireframeGeometry(new THREE.BoxGeometry(1,1,1));
const wireMat = new THREE.LineBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.3 });
for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
        for (let z = 0; z < size; z++) {
            const wire = new THREE.LineSegments(wireGeo, wireMat.clone());
            wire.position.set(x-50, y-50, z-50);
            scene.add(wire);
        }
    }
}

// Voxel venduti/reali (da config + demo)
const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00];
const demoVoxels = [
    {id: '50-50-50', color: 0xff0000, url: 'https://github.com', tooltip: 'GitHub'},
    {id: '40-40-40', color: 0x00ff00, url: 'https://perplexity.ai', tooltip: 'Perplexity'}
];

[...demoVoxels, ...voxelConfig].forEach((conf, i) => {
    const [x,y,z] = conf.id.split('-').map(Number);
    const material = new THREE.MeshLambertMaterial({ color: conf.color || colors[i%colors.length] });
    const voxel = new THREE.Mesh(geometry, material);
    voxel.position.set(x-50, y-50, z-50);
    voxel.userData = conf;
    voxel.userData.sold = true;
    voxel.scale.setScalar(1.2); // Highlight
    scene.add(voxel);
    voxelMeshes.push(voxel);
});

function toggleSelect() {
    selectMode = !selectMode;
    document.getElementById('selectMode').textContent = selectMode ? '✅ SELECT MODE ON - Click voxels!' : '👆 SELECT MODE';
    document.getElementById('selectMode').style.background = selectMode ? 'orange' : 'lime';
}

window.addEventListener('click', (event) => {
    if (!selectMode) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(voxelMeshes);
    if (intersects[0]) {
        selectedVoxel = intersects[0].object.userData;
        document.getElementById('selectedVoxel').innerHTML = `✅ Selected: <strong>${selectedVoxel.id}</strong><br>Click PayPal to buy!`;
    } else {
        // Nuovo voxel libero
        selectedVoxel = {id: 'Click new pos', coords: `${Math.floor(Math.random()*100)}-${Math.floor(Math.random()*100)}-${Math.floor(Math.random()*100)}`};
        document.getElementById('selectedVoxel').innerHTML = `🆕 New voxel: <strong>${selectedVoxel.coords}</strong><br>Pay $1 to claim!`;
    }
});

// Luci animate
scene.add(new THREE.DirectionalLight(0xffffff, 1).position.set(1,1,1));
scene.add(new THREE.AmbientLight(0x404040));

function animate() {
    requestAnimationFrame(animate);
    voxelMeshes.forEach((v, i) => v.rotation.y += 0.01 + i*0.001);
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
