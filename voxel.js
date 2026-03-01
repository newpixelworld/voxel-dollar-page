// FIXED VoxelDollarPage - Select WORKS 100%
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
camera.position.set(60, 60, 60);
scene.background = new THREE.Color(0x111111);

let selectMode = false;
let selectedVoxel = null;
const voxelMeshes = []; // Per raycast
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Wireframe 100x100x100 (non lagga)
const size = 100;
const wireMat = new THREE.LineBasicMaterial({color: 0x444444, transparent: true, opacity: 0.2});
for(let x=0; x<size; x+=5) for(let y=0; y<size; y+=5) for(let z=0; z<size; z+=5) { // Solo ogni 5 per perf
    const wire = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.BoxGeometry(1,1,1)), wireMat);
    wire.position.set(x-50, y-50, z-50);
    scene.add(wire);
}

// Demo + config voxel (cliccabili)
const demoData = [
    {id: '50-50-50', color: 0xff0000, url: 'https://github.com', tooltip: 'GitHub Sponsor'},
    {id: '55-55-55', color: 0x00ff00, url: 'https://perplexity.ai', tooltip: 'AI Powered'},
    {id: '45-45-45', color: 0x0000ff, url: '#', tooltip: 'Available'}
];
let voxelConfig = demoData;

demoData.forEach(conf => {
    const [x,y,z] = conf.id.split('-').map(Number);
    const mat = new THREE.MeshLambertMaterial({color: conf.color});
    const voxel = new THREE.Mesh(new THREE.BoxGeometry(0.8,0.8,0.8), mat);
    voxel.position.set(x-50, y-50, z-50);
    voxel.userData = conf;
    voxel.userData.coords = conf.id;
    scene.add(voxel);
    voxelMeshes.push(voxel);
});

function toggleSelect() {
    selectMode = !selectMode;
    document.getElementById('selectMode').textContent = selectMode ? '✅ CLICK VOXEL TO SELECT' : '👆 SELECT MODE';
    document.getElementById('selectMode').style.background = selectMode ? '#ff6600' : 'lime';
}

window.addEventListener('click', event => {
    if(!selectMode) return;
    mouse.x = (event.clientX / window.innerWidth)*2 -1;
    mouse.y = -(event.clientY / window.innerHeight)*2 +1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(voxelMeshes);
    if(intersects[0]) {
        selectedVoxel = intersects[0].object.userData;
        document.getElementById('selectedVoxel').innerHTML = `✅ <strong>${selectedVoxel.id}</strong> selected! PayPal →`;
    } else {
        selectedVoxel = {id: 'NEW-'+Math.floor(Math.random()*1000), coords: `${Math.floor(Math.random()*100)}-${Math.floor(Math.random()*100)}-${Math.floor(Math.random()*100)}`};
        document.getElementById('selectedVoxel').innerHTML = `🆕 <strong>${selectedVoxel.coords}</strong> new voxel! PayPal →`;
    }
});

// Luci animate
scene.add(new THREE.DirectionalLight(0xffffff, 1).position.set(1,1,1));
scene.add(new THREE.AmbientLight(0x404040));

function animate() {
    requestAnimationFrame(animate);
    voxelMeshes.forEach(v => v.rotation.y += 0.01);
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
