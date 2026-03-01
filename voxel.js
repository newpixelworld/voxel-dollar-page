// VoxelDollarPage PRO - 1M voxels optimized
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
camera.position.set(60, 60, 60);

// 1M voxels con InstancedMesh (super fast)
const size = 100;
const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
const material = new THREE.MeshLambertMaterial();
const instancedMesh = new THREE.InstancedMesh(geometry, material, size*size*size);
scene.add(instancedMesh);

let voxelConfig = [];
let selectedVoxel = null;
let selectMode = false;
fetch('config.json').then(r => r.json()).then(data => voxelConfig = data.voxels);

// Dummy matrix per 1M voxels (grigio default)
const matrix = new THREE.Matrix4();
const colorArray = new Float32Array(size*size*size * 3);
for (let i = 0; i < colorArray.length; i += 3) {
    colorArray[i] = 0.5; colorArray[i+1] = 0.5; colorArray[i+2] = 0.5; // Grigio
}

instancedMesh.instanceMatrix.needsUpdate = true;

// Applica config colori
voxelConfig.forEach((conf, index) => {
    const [x, y, z] = conf.id.split('-').map(Number);
    const flatIndex = (x + y*size + z*size*size);
    colorArray[flatIndex*3] = (conf.color >> 16 & 255)/255;
    colorArray[flatIndex*3+1] = (conf.color >> 8 & 255)/255;
    colorArray[flatIndex*3+2] = (conf.color & 255)/255;
});
material.vertexColors = true;

// Posiziona voxels
for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
        for (let z = 0; z < size; z++) {
            const index = x + y*size + z*size*size;
            matrix.setPosition(x-50, y-50, z-50);
            instancedMesh.setMatrixAt(index, matrix);
        }
}
instancedMesh.instanceMatrix.needsUpdate = true;

// Raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function toggleSelect() {
    selectMode = !selectMode;
    document.getElementById('selectMode').textContent = selectMode ? '✅ SELECTED - Click voxel!' : '👆 SELECT MODE';
}

window.addEventListener('click', (event) => {
    if (!selectMode) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(instancedMesh);
    if (intersects[0]) {
        const instanceId = intersects[0].instanceId;
        selectedVoxel = instanceId;
        document.getElementById('selectedVoxel').textContent = `Selected: Voxel #${instanceId} (x,y,z soon)`;
        // TODO: converti ID → coords per PayPal
    }
});

// Luci + animate (stesso codice precedente)
scene.add(new THREE.DirectionalLight(0xffffff, 1).position.set(1,1,1));
scene.add(new THREE.AmbientLight(0x404040));

function animate() {
    requestAnimationFrame(animate);
    instancedMesh.rotation.y += 0.001;
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
