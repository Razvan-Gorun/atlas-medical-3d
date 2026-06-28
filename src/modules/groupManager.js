// ==================================================
// GROUP MANAGER – doar pentru ferestrele plutitoare
// ==================================================

export class GroupManager {
  constructor(systemGroups, allMeshes, config) {
    this.systemGroups = systemGroups;
    this.allMeshes = allMeshes;
    this.config = config;
    this.currentGroupData = null;
    this.activeLayers = new Set();
    this.onUpdate = null; // callback către main.js (applyFloatingOverlay)
  }

  applyGroupFilter() {
    if (!this.currentGroupData) return;

    const layers = this.currentGroupData.layers || {};
    const baseIds = this.currentGroupData.base || [];

    const allowedIds = new Set([...baseIds]);
    for (const layerKey of this.activeLayers) {
      if (layers[layerKey]?.ids) {
        layers[layerKey].ids.forEach(id => allowedIds.add(id));
      }
    }

    // Facem vizibile doar obiectele permise + părinții (fără a reseta scala/emisia)
    this.allMeshes.forEach(m => {
      const struct = m.userData.structure;
      if (struct && allowedIds.has(struct.id)) {
        m.visible = true;
        let parent = m.parent;
        while (parent) {
          parent.visible = true;
          parent = parent.parent;
        }
      }
    });

    if (this.onUpdate) this.onUpdate(); // anunțăm main.js
  }

  layerChangeHandler(e) {
    const checkbox = e.target;
    if (!checkbox.matches('input[type="checkbox"]')) return;
    const key = checkbox.dataset.layer;
    const label = checkbox.closest('label');
    if (checkbox.checked) {
      this.activeLayers.add(key);
      if (label) label.classList.add('active');
    } else {
      this.activeLayers.delete(key);
      if (label) label.classList.remove('active');
    }
    this.applyGroupFilter();

    // Zoom automat pe primul obiect din ultimul strat activ (dacă e mic)
    if (this.activeLayers.size > 0 && this.currentGroupData) {
      const lastLayerKey = [...this.activeLayers][this.activeLayers.size - 1];
      const firstId = this.currentGroupData.layers[lastLayerKey]?.ids?.[0];
      const mesh = this.allMeshes.find(m => m.userData.structure.id === firstId);
      if (mesh) {
        const posX = mesh.matrixWorld.elements[12];
        const posY = mesh.matrixWorld.elements[13];
        const posZ = mesh.matrixWorld.elements[14];
        if (window.controls && window.camera) {
          window.controls.target.set(posX, posY, posZ);
          window.camera.position.set(posX + 0.3, posY + 0.3, posZ + 0.3);
          window.controls.update();
        } else if (window.interactionManager) {
          window.interactionManager.centerCameraOnMesh(mesh, 600);
        }
      }
    }
  }

  loadGroupData(groupData, container) {
    this.currentGroupData = groupData;
    this.activeLayers.clear();

    container.innerHTML = '';
    container.removeEventListener('change', this._boundHandler);
    this._boundHandler = this.layerChangeHandler.bind(this);
    container.addEventListener('change', this._boundHandler);

    for (const [key, layer] of Object.entries(groupData.layers)) {
      const label = document.createElement('label');
      label.className = 'layer-checkbox';
      label.innerHTML = `<input type="checkbox" data-layer="${key}"> <span>${layer.icon || ''} ${layer.label}</span>`;
      container.appendChild(label);
    }

    this.applyGroupFilter();
  }

  reset() {
    this.currentGroupData = null;
    this.activeLayers.clear();
    if (this._boundHandler) {
      const container = document.querySelector('.group-layers');
      if (container) container.removeEventListener('change', this._boundHandler);
    }
  }
}

// Păstrăm doar funcția de inițializare necesară main.js
let globalSystemGroups, globalAllMeshes, globalConfig;
export function initGroupManager(sysGroups, meshes, cfg) {
  globalSystemGroups = sysGroups;
  globalAllMeshes = meshes;
  globalConfig = cfg;
}