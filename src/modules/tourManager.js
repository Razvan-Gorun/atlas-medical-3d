/**
 * TourManager – Tur ghidat pas cu pas
 * ------------------------------------------------------------
 * Afișează un panou plutitor cu pași educaționali.
 * Dacă un pas nu specifică o structură, se comportă ca o carte digitală.
 */
export class TourManager {
  constructor(interactionManager, systemGroups) {
    this.interactionManager = interactionManager;
    this.systemGroups = systemGroups;
    this.steps = [];
    this.currentIndex = 0;
    this.active = false;

    // Elemente panou
    this.panel = null;
    this.titleEl = null;
    this.descEl = null;
    this.prevBtn = null;
    this.nextBtn = null;
    this.closeBtn = null;
    this.progressEl = null;

    this._createPanel();
  }

  /* ────────── CONSTRUCȚIA PANOULUI ────────── */
  _createPanel() {
    this.panel = document.createElement('div');
    this.panel.className = 'tour-panel hidden';
    this.panel.innerHTML = `
      <div class="tour-header">
        <span class="tour-title" id="tourTitle">Tur ghidat</span>
        <button class="tour-close" id="tourClose">✖</button>
      </div>
      <div class="tour-body">
        <p class="tour-desc" id="tourDesc"></p>
        <div class="tour-progress" id="tourProgress"></div>
      </div>
      <div class="tour-footer">
        <button class="tour-btn tour-btn-prev" id="tourPrev">← Înapoi</button>
        <button class="tour-btn tour-btn-next" id="tourNext">Înainte →</button>
      </div>
    `;
    document.body.appendChild(this.panel);

    this.titleEl = document.getElementById('tourTitle');
    this.descEl = document.getElementById('tourDesc');
    this.prevBtn = document.getElementById('tourPrev');
    this.nextBtn = document.getElementById('tourNext');
    this.closeBtn = document.getElementById('tourClose');
    this.progressEl = document.getElementById('tourProgress');

    this.closeBtn.addEventListener('click', () => this.endTour());
    this.prevBtn.addEventListener('click', () => this.prevStep());
    this.nextBtn.addEventListener('click', () => this.nextStep());
  }

  /* ────────── ÎNCĂRCARE ȘI CONTROL ────────── */
  loadTour(tourData) {
    this.steps = tourData.steps || [];
    this.tourName = tourData.name || 'Tur ghidat';
    this.currentIndex = 0;
  }

  startTour() {
    if (!this.steps.length) {
      console.warn('⚠️ Turul nu are pași definiți.');
      return;
    }
    this.active = true;
    this.currentIndex = 0;
    this.panel.classList.remove('hidden');
    // Ascundem panoul de informații standard cât timp turul e activ
    const infoPanel = document.getElementById('infoPanel');
    if (infoPanel) infoPanel.classList.add('hidden');
    this._showStep(0);
  }

  endTour() {
    this.active = false;
    this.panel.classList.add('hidden');
    // Restaurăm panoul de informații
    const infoPanel = document.getElementById('infoPanel');
    if (infoPanel) infoPanel.classList.remove('hidden');
    // Ieșim din orice focus rămas
    if (this.interactionManager?.exitFocusMode) {
      this.interactionManager.exitFocusMode();
    }
  }

  nextStep() {
    if (this.currentIndex < this.steps.length - 1) {
      this.currentIndex++;
      this._showStep(this.currentIndex);
    } else {
      this.endTour();
    }
  }

  prevStep() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this._showStep(this.currentIndex);
    }
  }

  /* ────────── LOGICA UNUI PAS ────────── */
  _showStep(index) {
    const step = this.steps[index];
    if (!step) return;

    // Actualizează textul panoului
    this.titleEl.textContent = `${this.tourName} (${index + 1}/${this.steps.length})`;
    this.descEl.innerHTML = `<strong>${step.title || ''}</strong><br>${step.description || ''}`;
    this.progressEl.textContent = `Pasul ${index + 1} din ${this.steps.length}`;

    // Dacă pasul are o structură țintă, facem focus pe ea
    if (step.structureId && step.system) {
      const mesh = this._findMesh(step.structureId, step.system);
      if (mesh) {
        this.interactionManager.focusOnStructure(mesh);
      } else {
        console.warn(`🔍 Nu s-a găsit structura "${step.structureId}" în sistemul "${step.system}"`);
      }
    } else {
      // Fără structură -> ne asigurăm că nu e niciun focus activ
      if (this.interactionManager?.exitFocusMode) {
        this.interactionManager.exitFocusMode();
      }
    }

    // Activăm/dezactivăm butoanele de navigare
    this.prevBtn.disabled = index === 0;
    this.nextBtn.textContent = index === this.steps.length - 1 ? 'Finalizează ✓' : 'Înainte →';
  }

  /* ────────── CĂUTARE MESH ────────── */
  _findMesh(structureId, system) {
    const all = window.allMeshes || [];
    return all.find(m => {
      const struct = m.userData?.structure;
      if (!struct) return false;
      const id = struct.id || '';
      return id === structureId || id.startsWith(structureId);
    });
  }
}