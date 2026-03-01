const banner = document.createElement("div");
banner.style.cssText =
  "position:fixed;top:0;left:0;right:0;z-index:999999;" +
  "background:#00ffcc;color:#000;padding:10px;font:14px Arial;";
banner.textContent = "app.js OK ✅";
document.body.appendChild(banner);

const pre = document.createElement("pre");
pre.style.cssText =
  "position:fixed;top:44px;left:0;right:0;max-height:45vh;z-index:999999;" +
  "margin:0;padding:10px;background:rgba(0,0,0,.85);color:#0f0;overflow:auto;font:12px monospace;";
pre.textContent = "";
document.body.appendChild(pre);

function log(s){ pre.textContent += s + "\n"; }

try {
  log("Importing three…");
  const THREE = await import("three");
  log("THREE OK, rev=" + THREE.REVISION);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 2000);
  camera.position.set(120,120,120);

  const renderer = new THREE.WebGLRenderer({ antialias:true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 1));

  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(80,80,80),
    new THREE.MeshStandardMaterial({ color: 0xff3333 })
  );
  scene.add(cube);

  log("You should see a red cube now.");

  function animate(){
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

} catch (err) {
  log("ERROR:");
  log(String(err?.stack || err));
}

