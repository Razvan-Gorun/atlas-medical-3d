import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { getAnatomicalColor } from './anatomyColors.js';

function normalize(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

// Lista structurilor mediane sau multi-fragment pentru care nu se afișează lateralitate
const MEDIAN_MULTI_FRAGMENT = [
  'frontal_bone', 'maxilla', 'mandible', 'hip_bone', 'sphenoid_bone',
  'temporal_bone', 'occipital_bone', 'parietal_bone', 'zygomatic_bone',
  'palatine_bone', 'lacrimal_bone', 'nasal_bone', 'ethmoid_bone',
  'vomer', 'hyoid_bone', 'sternum', 'sacrum', 'coccyx',
  'body_of_sternum', 'manubrium_of_sternum', 'xiphoid_process',
  'atlas', 'axis', 'vertebra', 'tooth', 'molar', 'premolar', 'incisor', 'canine'
];

function toDisplayName(meshName) {
  let side = '';
  let clean = meshName;

  // 1. Extrage lateralitatea explicită (_l/_r sau doar l/r la final)
  const sideMatch = clean.match(/(_?)([lr])$/i);
  if (sideMatch) {
    const sideLetter = sideMatch[2].toLowerCase();
    side = sideLetter === 'l' ? ' (stâng)' : ' (drept)';
    clean = clean.replace(/(_?)([lr])$/i, '');
  }

  // 2. Dacă nu am găsit lateralitate explicită, caută sufixul _1 / _2
  if (!side) {
    const numSideMatch = clean.match(/(_1|_2)$/);
    if (numSideMatch) {
      side = numSideMatch[1] === '_1' ? ' (stâng)' : ' (drept)';
      clean = clean.replace(/(_1|_2)$/, '');
    }
  }

  // 3. Verifică dacă structura face parte din lista mediană/multi-fragment
  const baseKey = clean.toLowerCase().replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  if (MEDIAN_MULTI_FRAGMENT.some(prefix => baseKey.includes(prefix))) {
    side = ''; // suprimă lateralitatea
    // elimină sufixele numerice rămase (fragmente)
    clean = clean.replace(/_[0-9]+$/, '');
  }

  // 4. Transformă în nume uman
  const human = clean
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();

  return human + side;
}

async function loadWhitelist(system) {
  const nameMap = {
    skeletal: 'boneWhitelist.json',
    muscular: 'muscleWhitelist.json',
    nervous: 'nervousWhitelist.json',
    arterial: 'arterialWhitelist.json',
    venous: 'venousWhitelist.json',
    visceral: 'visceralWhitelist.json',
    joints: 'jointWhitelist.json',
    integumentary: 'integumentaryWhitelist.json',
  };
  const filename = nameMap[system];
  if (!filename) return new Set();
  try {
    const resp = await fetch(`./data/${filename}`);
    if (!resp.ok) {
      console.warn(`Whitelist ${filename} nu a fost găsit (${resp.status})`);
      return new Set();
    }
    const raw = await resp.json();
    return new Set(raw.map(normalize));
  } catch (e) {
    console.warn(`Eroare la încărcarea ${filename}`, e);
    return new Set();
  }
}

export async function loadAnatomy(scene, onProgress, onReady) {
  const configResp = await fetch('./data/config.json');
  const config = await configResp.json();

  const nameToSystem = new Map();
  for (const sys of Object.keys(config.systems)) {
    if (sys === 'other') continue;
    const whitelist = await loadWhitelist(sys);
    for (const name of whitelist) {
      nameToSystem.set(name, sys);
    }
  }

  // Verifică duplicatele normalizate
  const seen = new Map();
  for (const [name, sys] of nameToSystem) {
    if (seen.has(name)) {
      console.warn(`Duplicate normalized name: "${name}" (${sys}), already in ${seen.get(name)}`);
    } else {
      seen.set(name, sys);
    }
  }

  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
  loader.setDRACOLoader(draco);

  loader.load(
    config.model.path,
    (gltf) => {
      const root = gltf.scene;

      if (config.model.center) {
        const bbox = new THREE.Box3().setFromObject(root);
        root.position.sub(bbox.getCenter(new THREE.Vector3()));
      }
      if (config.model.scale !== 1.0) {
        root.scale.setScalar(config.model.scale);
      }

      const meshes = [];

      root.traverse(child => {
        if (!child.isMesh) return;
        meshes.push(child);

        const normalized = normalize(child.name);
        const sys = nameToSystem.get(normalized) || 'other';
        child.userData.system = sys;

        child.userData.structure = {
          id: normalized,
          name: toDisplayName(child.name),
          system: sys
        };

        const isPleura = child.name.toLowerCase().includes('pleura');
        const color = getAnatomicalColor(child.name, sys);
        const roughness = isPleura ? 0.5 : 0.72;
        const opacity = isPleura ? 0.45 : 1.0;
        const transparent = isPleura;

        child.material = new THREE.MeshStandardMaterial({
          color,
          roughness,
          metalness: 0.02,
          transparent,
          opacity,
          depthTest: true,
          depthWrite: !transparent,
        });
      });

      // Poziționare pleură (valori calibrate)
      const pleuraMesh = meshes.find(m => m.name.toLowerCase().includes('pleura'));
      if (pleuraMesh) {
        pleuraMesh.position.set(0.0002, 1.3308, 0.1807);
        pleuraMesh.scale.set(5.16, 5.48, 5.13);
      }

      scene.add(root);
      root.updateMatrixWorld(); // ← FORȚEAZĂ actualizarea matricelor de transformare

      const systemGroups = {};
      for (const sys of Object.keys(config.systems)) {
        systemGroups[sys] = {
          visible: config.systems[sys].visibleByDefault,
          meshes: meshes.filter(m => m.userData.system === sys)
        };
      }

      meshes.forEach(m => {
        const sys = m.userData.system;
        if (systemGroups[sys]) {
          m.visible = systemGroups[sys].visible;
        }
      });

      if (window.controls) {
        const bbox = new THREE.Box3().setFromObject(root);
        const sphere = new THREE.Sphere();
        bbox.getBoundingSphere(sphere);
        window.controls.target.copy(sphere.center);
      }

      console.log('✅ Model încărcat. Sisteme:',
        Object.entries(systemGroups).map(([k, v]) => `${k}: ${v.meshes.length}`).join(', ')
      );

      onReady({ systemGroups, config, meshes });
    },
    (xhr) => {
      if (xhr.lengthComputable) {
        onProgress(Math.round((xhr.loaded / xhr.total) * 100));
      }
    },
    (error) => console.error('Eroare la încărcarea modelului:', error)
  );
}