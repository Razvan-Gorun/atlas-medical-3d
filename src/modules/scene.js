import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createScene(canvas) {
  // Detectează capabilitățile dispozitivului
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isLowEnd = isMobile && (window.devicePixelRatio <= 2);

  // Renderer cu setări adaptive
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isLowEnd,            // fără antialias pe low-end
    alpha: false,
    powerPreference: isLowEnd ? 'default' : 'high-performance',
  });
  
  // Pixel ratio redus pentru dispozitive slabe
  renderer.setPixelRatio(isLowEnd ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = !isLowEnd;   // umbre doar pe desktop/tabletă
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.sortObjects = true;
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.setClearColor(0x0e1524);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    45,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    1000
  );
  camera.position.set(4, 3, 8);
  camera.lookAt(0, 1, 0);

  // ⚡ Iluminare adaptivă
  const ambient = new THREE.AmbientLight(0x405080, isLowEnd ? 1.4 : 1.1); // ambient mai puternic dacă nu avem fill/back
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xfff5eb, 1.4);
  key.position.set(3, 6, 4);
  scene.add(key);

  if (!isLowEnd) {
    // Lumini suplimentare doar pe desktop
    const fill = new THREE.DirectionalLight(0xb0d0ff, 0.7);
    fill.position.set(-3, 2, -2);
    scene.add(fill);

    const back = new THREE.DirectionalLight(0x557799, 0.5);
    back.position.set(0, -1, -5);
    scene.add(back);
  }

  // Grid opțional (doar pe desktop)
  if (!isLowEnd) {
    const grid = new THREE.GridHelper(20, 20, 0x335577, 0x112233);
    grid.position.y = -1.5;
    scene.add(grid);
  }

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = isLowEnd ? 0.2 : 0.08; // mai puțină netezime pe mobil = performanță mai bună
  controls.target.set(0, 1.2, 0);
  controls.update();

  window.addEventListener('resize', () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w > 0 && h > 0) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }
  });

  // Expunem informația despre dispozitiv pentru a fi folosită în alte module
  window.isLowEndDevice = isLowEnd;

  return { renderer, scene, camera, controls };
}