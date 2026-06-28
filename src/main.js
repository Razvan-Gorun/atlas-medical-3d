import * as THREE from 'three';
window.THREE = THREE;
import { createScene } from './modules/scene.js';
import { loadAnatomy } from './modules/loader.js';
import { InteractionManagerExtended } from './modules/interaction_extended.js';
import {
  initGroupManager,
  GroupManager
} from './modules/groupManager.js';
import { QuizManager } from './modules/quiz.js';
import { TourManager } from './modules/tourManager.js';
import { loadAllDisplayNames, getDisplayName } from './modules/displayNames.js';
window.getDisplayName = getDisplayName; // ← ADAUGĂ ASTA

const canvas = document.getElementById('canvas3d');
const { renderer, scene, camera, controls } = createScene(canvas);

const statusEl = document.getElementById('loadingStatus');
const meshCountEl = document.getElementById('statusMeshCount');

let systemGroups = {};
let config = {};
let allMeshes = [];

window.systemGroups = systemGroups;
window.allMeshes = allMeshes;
window.controls = controls;
window.camera = camera;

// ---------- FERESTRE PLUTITOARE ----------
const organPanels = {};
let visibilitySnapshot = null;

function saveVisibilitySnapshot() {
  const map = new Map();
  allMeshes.forEach(m => {
    map.set(m, m.visible);
    let p = m.parent;
    while (p) {
      if (!map.has(p)) map.set(p, p.visible);
      p = p.parent;
    }
  });
  return map;
}

function restoreVisibilitySnapshot(snapshot) {
  snapshot.forEach((visible, obj) => {
    obj.visible = visible;
  });
}

function applyFloatingOverlay() {
  if (Object.keys(organPanels).length === 0) {
    if (visibilitySnapshot) {
      restoreVisibilitySnapshot(visibilitySnapshot);
      visibilitySnapshot = null;
    }
    return;
  }

  if (!visibilitySnapshot) {
    visibilitySnapshot = saveVisibilitySnapshot();
  }

  const allowedIds = new Set();
  Object.values(organPanels).forEach(panel => {
    const gm = panel.__groupManager;
    if (!gm || !gm.currentGroupData) return;

    const layers = gm.currentGroupData.layers || {};
    const baseIds = gm.currentGroupData.base || [];
    baseIds.forEach(id => allowedIds.add(id));

    for (const layerKey of gm.activeLayers) {
      if (layers[layerKey]?.ids) {
        layers[layerKey].ids.forEach(id => allowedIds.add(id));
      }
    }
  });

  allMeshes.forEach(m => m.visible = false);

  allMeshes.forEach(m => {
    const struct = m.userData?.structure;
    if (struct && allowedIds.has(struct.id)) {
      m.visible = true;
      let p = m.parent;
      while (p) {
        p.visible = true;
        p = p.parent;
      }
    }
  });
}

function openOrganPanel(buttonId, groupFile) {
  if (organPanels[buttonId]) {
    const panel = organPanels[buttonId];
    panel.style.display = 'flex';
    panel.style.zIndex = parseInt(panel.style.zIndex || 100) + 1;
    return;
  }

  const panel = document.createElement('div');
  panel.className = 'floating-organ-panel';
  panel.innerHTML = `
    <div class="floating-organ-header">
      <span>Organ</span>
      <button class="floating-organ-close">✖</button>
    </div>
    <div class="floating-organ-body">
      <div class="group-layers"></div>
      <button class="group-reset-btn">Ieși din grup</button>
    </div>
  `;
  document.body.appendChild(panel);

  panel.style.left = '200px';
  panel.style.top = '100px';
  panel.style.display = 'flex';
  panel.dataset.buttonId = buttonId;

  const header = panel.querySelector('.floating-organ-header');
  let isDragging = false, startX, startY, initLeft, initTop;
  header.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('floating-organ-close')) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    initLeft = panel.offsetLeft;
    initTop = panel.offsetTop;
    e.preventDefault();
  });
  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    panel.style.left = (initLeft + e.clientX - startX) + 'px';
    panel.style.top = (initTop + e.clientY - startY) + 'px';
  });
  window.addEventListener('mouseup', () => { isDragging = false; });

  const resizer = document.createElement('div');
  resizer.className = 'floating-organ-resizer';
  panel.appendChild(resizer);
  let isResizing = false, startW, startH, startRX, startRY;
  resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    startW = panel.offsetWidth;
    startH = panel.offsetHeight;
    startRX = e.clientX;
    startRY = e.clientY;
    e.preventDefault();
  });
  window.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const newW = Math.max(200, startW + e.clientX - startRX);
    const newH = Math.max(100, startH + e.clientY - startRY);
    panel.style.width = newW + 'px';
    panel.style.height = newH + 'px';
  });
  window.addEventListener('mouseup', () => { isResizing = false; });

  panel.querySelector('.floating-organ-close').addEventListener('click', () => {
    closeOrganPanel(buttonId);
  });

  const layersContainer = panel.querySelector('.group-layers');
  const gm = new GroupManager(systemGroups, allMeshes, config);
  gm.onUpdate = applyFloatingOverlay;
  panel.__groupManager = gm;

  fetch(`./data/groups/${groupFile}.json`)
    .then(r => r.json())
    .then(data => {
      gm.loadGroupData(data, layersContainer);
      panel.querySelector('.floating-organ-header span').textContent = data.icon + ' ' + data.name;
      applyFloatingOverlay();
    });

  panel.querySelector('.group-reset-btn').addEventListener('click', () => {
    gm.reset();
    closeOrganPanel(buttonId);
  });

  organPanels[buttonId] = panel;
}

function closeOrganPanel(buttonId) {
  const panel = organPanels[buttonId];
  if (panel) {
    panel.remove();
    delete organPanels[buttonId];
    applyFloatingOverlay();
  }
}

function toggleSystem(system) {
  if (visibilitySnapshot) return;
  const sys = systemGroups[system];
  if (sys) {
    sys.visible = !sys.visible;
    sys.meshes.forEach(mesh => mesh.visible = sys.visible);
    document.querySelectorAll('.filter-btn').forEach(btn => {
      if (btn.dataset.system === system) btn.classList.toggle('active', sys.visible);
    });
  }
}
window.toggleSystem = toggleSystem;

function createToggleButtons() {
  const container = document.getElementById('systemFilters');
  if (!container) return;
  container.innerHTML = '';
  for (const [sys, cfg] of Object.entries(config.systems)) {
    if (sys === 'other') continue;
    const btn = document.createElement('button');
    btn.className = `test-btn ${sys}`;
    btn.textContent = cfg.name;
    btn.dataset.system = sys;
    const group = systemGroups[sys];
    if (group && group.visible) btn.classList.add('active');
    btn.onclick = () => {
      toggleSystem(sys);
      btn.classList.toggle('active');
    };
    container.appendChild(btn);
  }
}

function resetView() {
  camera.position.set(4, 3, 8);
  controls.target.set(0, 1.2, 0);
  controls.update();
  if (window.interactionManager) window.interactionManager.exitFocusMode();
}
window.resetView = resetView;

// ---------- INIȚIALIZARE DUPĂ ÎNCĂRCARE ----------
loadAnatomy(
  scene,
  (pct) => { if (statusEl) statusEl.textContent = `⏳ Se încarcă modelul... ${pct}%`; },
  async ({ systemGroups: groups, config: cfg, meshes }) => {
    systemGroups = groups;
    config = cfg;
    allMeshes = meshes;
    window.systemGroups = systemGroups;
    window.allMeshes = allMeshes;

    initGroupManager(systemGroups, allMeshes, config);

    await loadAllDisplayNames(['skeletal','muscular','nervous','arterial','venous','visceral','joints','integumentary','other']);

    if (statusEl) statusEl.textContent = '✅ Model încărcat';
    if (meshCountEl) meshCountEl.textContent = `${allMeshes.length} mesh-uri`;

    const TEXT_KEYWORDS = /Node|Abduction|Adduction|Circumduction|Dorsiflexion|Eversion|Inversion|Rotation|Pronation|Supination|Flexion|Plane|Linesg|Caudal|Distal|Dorsal|Frontal|Occipital|Palmar|Plantar|Proximal|Radial|Ventral|Canal|Lacunar/i;
    allMeshes.forEach(m => {
      const name = m.userData?.structure?.name || m.name;
      if (name.length <= 3 || TEXT_KEYWORDS.test(name)) {
        m.visible = false;
      }
    });

    Object.entries(systemGroups).forEach(([key, group]) => {
      group.visible = (key === 'skeletal');
      group.meshes.forEach(m => m.visible = group.visible);
    });

    createToggleButtons();

    // ═══════════════ OPTIMIZARE DISPOZITIVE SLABE ═══════════════
    if (window.isLowEndDevice) {
      allMeshes.forEach(m => {
        if (m.material) {
          const isPleura = m.name.toLowerCase().includes('pleura');
          const apply = (mat) => {
            if (!mat || !mat.isMaterial) return;
            if (!isPleura) {
              mat.transparent = false;
              mat.opacity = 1.0;
              mat.depthWrite = true;
              mat.needsUpdate = true;
            }
          };
          if (Array.isArray(m.material)) m.material.forEach(apply);
          else apply(m.material);
        }
      });

      controls.dampingFactor = 0.25;
      controls.enableDamping = false;

      console.log('📱 Mod low-end activat: iluminare redusă, umbre oprite, sistem osos activ');
    }

    const interactionManager = new InteractionManagerExtended(canvas, camera, scene, systemGroups, config);
    window.interactionManager = interactionManager;
    window.resetHidden = () => interactionManager.resetHiddenMeshes();
    window.getDescriptionTemplate = () => interactionManager.getDescriptionTemplate();

    const originalShowInfo = interactionManager.showStructureInfo.bind(interactionManager);
    interactionManager.showStructureInfo = function(structure) {
  if (structure && structure.system) {
    structure.systemDisplayName = config.systems[structure.system]?.name || structure.system;
    structure.systemTagName = config.systems[structure.system]?.name || structure.system;
    structure.displayName = getDisplayName(structure);
    // FORȚEAZĂ numele românesc peste cel original
    if (structure.displayName && structure.displayName !== structure.name) {
      structure.name = structure.displayName;
    }
  }
  originalShowInfo(structure);
};

    const originalUpdateHover = interactionManager.updateHoverLabel.bind(interactionManager);
    interactionManager.updateHoverLabel = function(mesh, clientX, clientY) {
      if (!this.hoverLabel) return;
      if (mesh && mesh.userData.structure) {
        const struct = mesh.userData.structure;
        this.hoverLabel.textContent = getDisplayName(struct);
        this.hoverLabel.style.display = 'block';
        this.hoverLabel.style.left = (clientX + 15) + 'px';
        this.hoverLabel.style.top = (clientY - 10) + 'px';
      } else {
        this.hoverLabel.style.display = 'none';
      }
    };

    document.getElementById('btnHighlight').addEventListener('click', () => {
      if (interactionManager && interactionManager.highlightedMesh)
        interactionManager.focusOnStructure(interactionManager.highlightedMesh);
    });

    const resetBtn = document.getElementById('resetView');
    if (resetBtn) resetBtn.addEventListener('click', resetView);

    // ────────── TOOLBAR ──────────
    const toggleRotate = document.getElementById('toggleRotate');
    const toggleTransparency = document.getElementById('toggleTransparency');
    const toggleLabels = document.getElementById('toggleLabels');

    if (toggleRotate) {
      toggleRotate.addEventListener('click', () => {
        controls.autoRotate = !controls.autoRotate;
        toggleRotate.classList.toggle('active', controls.autoRotate);
      });
    }
    if (toggleTransparency) {
      let transparencyEnabled = false;
      toggleTransparency.addEventListener('click', () => {
        transparencyEnabled = !transparencyEnabled;
        toggleTransparency.classList.toggle('active', transparencyEnabled);
        allMeshes.forEach(m => {
          if (m.material) {
            const isPleura = m.name.toLowerCase().includes('pleura');
            const apply = (mat) => {
              if (!mat) return;
              if (isPleura) {
                mat.transparent = true;
                mat.opacity = 0.45;
                mat.depthWrite = false;
              } else {
                mat.transparent = transparencyEnabled;
                mat.opacity = transparencyEnabled ? 0.4 : 1.0;
                mat.depthWrite = !transparencyEnabled;
              }
              mat.needsUpdate = true;
            };
            if (Array.isArray(m.material)) m.material.forEach(apply);
            else apply(m.material);
          }
        });
      });
    }
    if (toggleLabels) {
      let labelsVisible = false;
      toggleLabels.addEventListener('click', () => {
        labelsVisible = !labelsVisible;
        toggleLabels.classList.toggle('active', labelsVisible);
      });
    }

    // ────────── CĂUTARE ÎMBUNĂTĂȚITĂ ──────────
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    function normalizeDiacritics(str) {
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ș/g, 's').replace(/ț/g, 't')
        .replace(/[^a-z0-9 ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    if (searchInput && searchResults) {
      searchInput.addEventListener('input', () => {
        const rawQuery = searchInput.value.trim();
        if (rawQuery.length < 2) {
          searchResults.classList.add('hidden');
          return;
        }

        const query = normalizeDiacritics(rawQuery);

        const scored = allMeshes
          .map(m => {
            const struct = m.userData?.structure;
            if (!struct) return null;
            const displayName = getDisplayName(struct);
            const normalized = normalizeDiacritics(displayName);
            return { mesh: m, displayName, normalized };
          })
          .filter(Boolean);

        const matches = scored
          .map(item => {
            let score = 0;
            if (item.normalized === query) {
              score = 3;
            } else if (item.normalized.startsWith(query)) {
              score = 2;
            } else if (item.normalized.includes(query)) {
              score = 1;
            }
            return { ...item, score };
          })
          .filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);

        searchResults.innerHTML = matches.length
          ? matches.map(({ mesh, displayName }) => {
              const struct = mesh.userData.structure;
              const sys = struct?.system || mesh.userData.system || 'other';
              const color = config.systems[sys]?.color || '#888';
              return `<div class="search-item" data-uuid="${mesh.uuid}">
                <span class="search-item-dot" style="background-color:${color}"></span>
                <span class="search-item-name">${displayName}</span>
                <span class="search-item-sys">${sys}</span>
              </div>`;
            }).join('')
          : '<div class="search-item" style="color: var(--text-muted);">Niciun rezultat</div>';

        searchResults.classList.remove('hidden');
      });

      document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target))
          searchResults.classList.add('hidden');
      });

      searchResults.addEventListener('click', (e) => {
        const item = e.target.closest('.search-item');
        if (!item) return;
        const uuid = item.dataset.uuid;
        const mesh = allMeshes.find(m => m.uuid === uuid);
        if (!mesh) return;
        const sys = mesh.userData.system;
        if (sys && systemGroups[sys] && !systemGroups[sys].visible) {
          systemGroups[sys].visible = true;
          systemGroups[sys].meshes.forEach(m => m.visible = true);
        }
        if (interactionManager && interactionManager.focusOnStructure) {
          interactionManager.highlightedMesh = mesh;
          interactionManager.setMeshEmissive(mesh, interactionManager.highlightColor, 0.8);
          interactionManager.showStructureInfo(mesh.userData.structure || null);
          interactionManager.focusOnStructure(mesh);
        } else {
          interactionManager.centerCameraOnMesh(mesh);
        }
        searchInput.value = '';
        searchResults.innerHTML = '';
        searchResults.classList.add('hidden');
      });
    }

    // ========== BUTOANE COPIL ==========
    function registerChildButton(buttonId, groupFile) {
      const btn = document.getElementById(buttonId);
      if (!btn) return;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const parent = btn.closest('.child-buttons');
        if (parent) parent.classList.add('hidden');
        const parentBtn = btn.closest('.group-toolbar')?.querySelector('.parent-btn.expanded');
        if (parentBtn) parentBtn.classList.remove('expanded');
        const toolbar = document.getElementById('groupToolbar');
        if (toolbar && !document.querySelector('.parent-btn.expanded')) {
          toolbar.classList.remove('has-open');
        }
        openOrganPanel(buttonId, groupFile);
      });
    }

    registerChildButton('btnRespiratorySystem', 'respiratory');
    registerChildButton('btnUpperRespiratory', 'upper_respiratory');
    registerChildButton('btnEar', 'ear');
    registerChildButton('btnLiver', 'liver');
    registerChildButton('btnSpleen', 'spleen');
    registerChildButton('btnHeart', 'heart');
    registerChildButton('btnKidneys', 'kidneys');
    registerChildButton('btnPancreas', 'pancreas');
    registerChildButton('btnStomach', 'stomach');
    registerChildButton('btnSmallIntestine', 'small_intestine');
    registerChildButton('btnLargeIntestine', 'large_intestine');
    registerChildButton('btnBladder', 'bladder');
    registerChildButton('btnMaleReproductive', 'male_reproductive');
    registerChildButton('btnAdrenals', 'adrenals');
    registerChildButton('btnThyroid', 'thyroid');
    registerChildButton('btnEye', 'eye');
    registerChildButton('btnBrain', 'brain');
    registerChildButton('btnKnee', 'knee');
    registerChildButton('btnHip', 'hip');
    registerChildButton('btnShoulder', 'shoulder');
    registerChildButton('btnElbow', 'elbow');
    registerChildButton('btnDental', 'dental');
    registerChildButton('btnUpperLimb', 'upper_limb');
    registerChildButton('btnHead', 'head');
    registerChildButton('btnNeck', 'neck');
    registerChildButton('btnBack', 'back');
    registerChildButton('btnThorax', 'thorax');
    registerChildButton('btnLowerLimb', 'lower_limb');
    registerChildButton('btnAbdomen', 'abdomen');
    registerChildButton('btnHand', 'hand');
    registerChildButton('btnFoot', 'foot');

    document.querySelectorAll('.parent-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const children = btn.nextElementSibling;
        if (!children || !children.classList.contains('child-buttons')) return;
        if (btn.classList.contains('expanded')) {
          children.classList.add('hidden');
          btn.classList.remove('expanded');
        } else {
          document.querySelectorAll('.parent-btn.expanded').forEach(other => {
            other.classList.remove('expanded');
            const otherChildren = other.nextElementSibling;
            if (otherChildren && otherChildren.classList.contains('child-buttons')) {
              otherChildren.classList.add('hidden');
            }
          });
          children.classList.remove('hidden');
          btn.classList.add('expanded');
        }
        const toolbar = document.getElementById('groupToolbar');
        if (toolbar) {
          const anyOpen = document.querySelector('.parent-btn.expanded');
          if (anyOpen) {
            toolbar.classList.add('has-open');
          } else {
            toolbar.classList.remove('has-open');
          }
        }
      });
    });

    // Mobile toggle
    const mobileToggleBtn = document.getElementById('mobileInfoToggle');
    const infoPanel = document.getElementById('infoPanel');
    if (mobileToggleBtn && infoPanel) {
      mobileToggleBtn.addEventListener('click', () => {
        infoPanel.classList.toggle('open');
      });
      document.addEventListener('click', (e) => {
        if (!infoPanel.contains(e.target) && e.target !== mobileToggleBtn) {
          infoPanel.classList.remove('open');
        }
      });
    }

    // ────────── INIȚIALIZARE QUIZ ──────────
    const quizManager = new QuizManager(systemGroups, config, interactionManager);
    window.quizManager = quizManager;

    // ═══════════════ OVERLAY BUN VENIT ═══════════════
    if (!localStorage.getItem('atlas_welcome_seen')) {
      const overlay = document.getElementById('welcomeOverlay');
      const closeBtn = document.getElementById('welcomeCloseBtn');
      if (overlay && closeBtn) {
        overlay.classList.remove('hidden');
        closeBtn.addEventListener('click', () => {
          overlay.classList.add('hidden');
          localStorage.setItem('atlas_welcome_seen', 'true');
        });
      }
    }

    // ═══════════════ TUR GHIDAT ═══════════════
    const tourManager = new TourManager(interactionManager, systemGroups);
    window.tourManager = tourManager;

    const demoAppTour = {
      name: "🧭 Cum folosești atlasul",
      steps: [
        {
          title: "🔍 Căutare",
          description: "Folosește bara de căutare din dreapta-sus pentru a găsi rapid orice structură anatomică (os, mușchi, vas, organ).",
          structureId: "heart",
          system: "visceral"
        },
        {
          title: "🖱️ Navigare 3D",
          description: "Trage pentru a roti modelul. Scroll pentru zoom. Click pe orice structură pentru informații detaliate.",
          structureId: "femur",
          system: "skeletal"
        },
        {
          title: "📋 Sisteme anatomice",
          description: "Butoanele din header activează/dezactivează vizibilitatea sistemelor (osos, muscular, nervos, etc.).",
          structureId: "brain",
          system: "nervous"
        },
        {
          title: "🧪 Quiz interactiv",
          description: "Testează-ți cunoștințele din butonul 'Testează' din toolbar. Alege un sistem și răspunde la întrebări.",
          structureId: "stomach",
          system: "visceral"
        },
        {
          title: "🫥 Structuri ascunse",
          description: "Alt+Click pe o structură o ascunde. Le poți readuce din panoul din dreapta-jos.",
          structureId: "liver",
          system: "visceral"
        },
        {
          title: "🔬 Fișe detaliate",
          description: "După selectare, apasă 'Fișă anatomică' pentru descrieri complete, vascularizație, inervație și note clinice.",
          structureId: "kidney",
          system: "visceral"
        },
        {
          title: "📱 Gata de explorat!",
          description: "Atlasul funcționează pe orice dispozitiv. Explorează liber și învață anatomia într-un mod interactiv!",
          structureId: "eye",
          system: "visceral"
        }
      ]
    };

    tourManager.loadTour(demoAppTour);

    const toolbar = document.querySelector('.toolbar');
    if (toolbar) {
      const tourBtn = document.createElement('button');
      tourBtn.className = 'tool-btn';
      tourBtn.id = 'startTourBtn';
      tourBtn.title = 'Tur ghidat';
      tourBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
      tourBtn.addEventListener('click', () => {
        if (tourManager.active) {
          tourManager.endTour();
        } else {
          tourManager.startTour();
        }
      });
      toolbar.appendChild(tourBtn);
    }

    // ────────── ANIMAȚIE ──────────
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();
  }
);