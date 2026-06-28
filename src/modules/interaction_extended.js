import { InteractionManager } from './interaction.js';
import * as THREE from 'three';

export class InteractionManagerExtended extends InteractionManager {

  constructor(...args) {
    super(...args);
    this._initDirectionButtons();
    this.detailNote = null;
    this.imageNote = null;
    this.descriptionsCache = {};

    // ═══ NOU: Inițializare meniu tactil ═══
    this.contextMenu = null;
    this.longPressTimer = null;
    this._initTouchContextMenu();
  }

  getVisibleMeshes() {
    const all = Object.values(this.systemGroups).flatMap(sys => sys.meshes);
    return all.filter(m => m.visible === true && !this.hiddenMeshes.has(m));
  }

  showStructureInfo(structure) {
    super.showStructureInfo(structure);

    const btnDesc = document.getElementById('btnDescription');
    const btnImg = document.getElementById('btnImage');

    if (btnDesc) {
      if (structure && this.highlightedMesh) {
        btnDesc.style.display = 'inline-block';
        btnDesc.onclick = () => this.openDetailedDescription(structure);
      } else {
        btnDesc.style.display = 'none';
      }
    }

    if (btnImg && structure && this.highlightedMesh) {
      const system = structure.system;
      const normalizedId = this._normalizeAnatomyId(structure.id);

      const checkAndUpdateBtn = (info) => {
        if (info && info.image) {
          btnImg.style.display = 'inline-block';
          btnImg.onclick = () => this.openImageViewer(info.image, structure.name || info.name);
        } else {
          btnImg.style.display = 'none';
        }
      };

      if (this.descriptionsCache[system]) {
        const info = this.descriptionsCache[system][normalizedId];
        checkAndUpdateBtn(info);
      } else {
        this._loadDescriptions(system).then(() => {
          const info = this.descriptionsCache[system]?.[normalizedId];
          if (this.highlightedMesh?.userData.structure?.id === structure.id) {
            checkAndUpdateBtn(info);
          }
        });
      }
    } else if (btnImg) {
      btnImg.style.display = 'none';
    }

    if (this.detailNote) this.closeDetailNote();
    if (this.imageNote) this.closeImageViewer();
  }

  async _loadDescriptions(system) {
    if (this.descriptionsCache[system]) return;
    try {
      const resp = await fetch(`./data/descriptions/${system}.json`);
      if (!resp.ok) {
        console.warn(`Fișierul ${system}.json lipsește`);
        return;
      }
      const data = await resp.json();
      this.descriptionsCache[system] = data;
    } catch (e) {
      console.warn('Eroare la încărcarea descrierilor', e);
    }
  }

  // ═══════════════ Fereastra de descriere detaliată ═══════════════
  async openDetailedDescription(structure) {
    try {
      const system = structure.system;
      if (!system) return;

      const normalizedId = this._normalizeAnatomyId(structure.id);
      await this._loadDescriptions(system);

      const descriptions = this.descriptionsCache[system];
      if (!descriptions) {
        console.error('❌ Cache-ul pentru', system, 'nu există.');
        alert('Eroare: datele nu s‑au încărcat.');
        return;
      }

      const info = descriptions[normalizedId];
      if (!info) {
        console.warn('⚠️ Fișa anatomică lipsește pentru:');
        console.log('  ID brut:', structure.id);
        console.log('  ID normalizat:', normalizedId);
        console.log('  Sistem:', system);
        const keys = Object.keys(descriptions);
        console.log('  Chei disponibile (primele 5):', keys.slice(0, 5));
        console.log('  Număr total de chei:', keys.length);
        alert('Nu există fișă anatomică pentru această structură.');
        return;
      }

      if (this.detailNote) this.closeDetailNote();

      // ═══ ÎNCĂRCAREA NOTIȚELOR DE PE SERVER (GET) ═══
      let savedNotes = localStorage.getItem('notes_' + structure.id) || '';
      try {
        const resp = await fetch(`http://localhost:3000/api/notes/${structure.id}`);
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.content) {
            savedNotes = data.content;
            localStorage.setItem('notes_' + structure.id, savedNotes);
          }
        }
      } catch (e) {
        console.warn('Serverul de notițe nu este disponibil. Se folosește localStorage.');
      }

      const defRow = (label, value, useBullet = false) => {
        if (!value) return '';
        const strValue = Array.isArray(value) ? value.join(', ') : value;
        if (useBullet) {
          const items = strValue.split(',').map(s => s.trim()).filter(s => s.length > 0);
          if (items.length === 0) return '';
          return `
            <div class="def-row">
              <span class="def-label">${label}:</span>
              <ul class="def-list">
                ${items.map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>
          `;
        }
        return `
          <div class="def-row">
            <span class="def-label">${label}:</span>
            <span class="def-value">${strValue}</span>
          </div>
        `;
      };

      let html = '';

      if (info.localizare || info.tip) {
        html += `<div class="note-section"><h4>📌 Localizare și Tip</h4>${defRow('Localizare', info.localizare)}${defRow('Tip', info.tip)}</div>`;
      }
      if (info.descriere) {
        html += `<div class="note-section"><h4>📖 Descriere</h4><p>${info.descriere}</p></div>`;
      }
      if (info.repere_anatomice || info.articulatii || info.insertii || info.functie) {
        html += `<div class="note-section"><h4>🦴 Anatomie descriptivă</h4>${defRow('Repere anatomice', info.repere_anatomice, true)}${defRow('Articulații', info.articulatii, true)}${defRow('Inserții', info.insertii, true)}${defRow('Funcție', info.functie)}</div>`;
      }
      if (info.drenaj || info.varsare || info.afluenti || info.origine || info.traiect || info.ramuri || info.teritoriu_irigare) {
        html += `<div class="note-section"><h4>🩸 Vascularizație</h4>${defRow('Drenaj', info.drenaj, true)}${defRow('Vărsare', info.varsare)}${defRow('Afluenți', info.afluenti, true)}${defRow('Origine', info.origine)}${defRow('Traiect', info.traiect)}${defRow('Ramuri', info.ramuri, true)}${defRow('Teritoriu de irigare', info.teritoriu_irigare, true)}</div>`;
      }
      if (info.teritoriu_inervare || info.anestezii) {
        html += `<div class="note-section"><h4>🧠 Inervație</h4>${defRow('Teritoriu de inervare', info.teritoriu_inervare, true)}${defRow('Anestezii', info.anestezii, true)}</div>`;
      }
      if (
        (Array.isArray(info.tip_fibre) && info.tip_fibre.length) ||
        (Array.isArray(info.functie) && info.functie.length) ||
        (Array.isArray(info.functie_motorie) && info.functie_motorie.length) ||
        (Array.isArray(info.functie_senzitiva) && info.functie_senzitiva.length) ||
        (Array.isArray(info.functie_parasimpatic) && info.functie_parasimpatic.length) ||
        (Array.isArray(info.structuri_inervate) && info.structuri_inervate.length) ||
        (Array.isArray(info.ramuri) && info.ramuri.length)
      ) {
        html += `<div class="note-section"><h4>🧠 Funcții neurologice</h4>${defRow('Tip fibre', info.tip_fibre, true)}${defRow('Funcție generală', info.functie, true)}${defRow('Funcție motorie', info.functie_motorie, true)}${defRow('Funcție senzitivă', info.functie_senzitiva, true)}${defRow('Funcție parasimpatică', info.functie_parasimpatic, true)}${defRow('Structuri inervate', info.structuri_inervate, true)}${defRow('Ramuri', info.ramuri, true)}</div>`;
      }
      if (info.irigare || info.inervatie) {
        html += `<div class="note-section"><h4>🩸 Vascularizație și Inervație</h4>${defRow('Irigare', info.irigare, true)}${defRow('Inervație', info.inervatie, true)}</div>`;
      }
      if (info.dezvoltare) {
        html += `<div class="note-section"><h4>🧬 Dezvoltare</h4><p>${info.dezvoltare}</p></div>`;
      }
      if (info.histologie) {
        html += `<div class="note-section"><h4>🔬 Histologie</h4><p>${info.histologie}</p></div>`;
      }
      if (info.clinic) {
        html += `<div class="note-section"><h4>⚕️ Notă clinică</h4><p>${info.clinic}</p></div>`;
      }
      if (info.anestezie) {
        const an = info.anestezie;
        html += `<div class="note-section"><h4>💉 Anestezie</h4><div class="def-row"><span class="def-label">Se poate efectua:</span><span class="def-value">${an.se_poate ? 'Da' : 'Nu'}</span></div>${an.tip ? defRow('Tip bloc', an.tip) : ''}${an.utilizare ? defRow('Utilizare', an.utilizare, true) : ''}${an.tehnica ? `<div class="def-row"><span class="def-label">Tehnică:</span><span class="def-value">${an.tehnica}</span></div>` : ''}${an.risc ? defRow('Riscuri', an.risc, true) : ''}${an.motiv ? defRow('Motiv', an.motiv, true) : ''}</div>`;
      }
      if (info.relations && info.relations.length) {
        html += `<div class="note-section"><h4>🔗 Relații anatomice</h4><ul class="def-list">${info.relations.map(r => `<li>${r}</li>`).join('')}</ul></div>`;
      }

      // ═══ NOUL note.innerHTML (cu toolbar, editor, bară de căutare și indicator de salvare) ═══
      const note = document.createElement('div');
      note.className = 'floating-desc-note';
      note.innerHTML = `
        <div class="note-header"><span>📖 ${info.name || structure.name}</span><button class="note-close">✖</button></div>
        <div class="note-body">
          <h3 style="margin-bottom:4px;">${info.name || structure.name}</h3>
          <div class="latin" style="font-style:italic; color:var(--text-muted); margin-bottom:16px;">${info.latin || ''}</div>
          ${html}
          <hr style="margin:16px 0 12px; border-color: var(--border);">
          
          <!-- BARA DE UNELTE -->
          <div class="notes-toolbar">
            <button class="note-btn" data-cmd="bold" title="Bold"><b>B</b></button>
            <button class="note-btn" data-cmd="italic" title="Italic"><i>I</i></button>
            <button class="note-btn" data-cmd="underline" title="Subliniat"><u>U</u></button>
            <input type="color" class="note-color-picker" title="Culoare text" value="#e8f0fb">
            <button class="note-btn" data-cmd="insertImage" title="Adaugă imagine">🖼️</button>
            <input type="file" id="noteImageUpload" accept="image/*" style="display:none">
          </div>
          
          <!-- EDITORUL RICH TEXT -->
          <div class="user-notes-editor" contenteditable="true" data-structure-id="${structure.id}">${savedNotes}</div>
          
          <!-- INDICATOR SALVARE -->
          <div style="display:flex; justify-content:space-between; margin-top:4px;">
            <span style="font-size:10px; color:var(--text-muted);">Notițele se salvează automat</span>
            <span id="saveStatus" style="font-size:11px; color:var(--text-muted);">💾</span>
          </div>

          <!-- BARA DE CĂUTARE -->
          <div class="notes-search-bar">
            <input type="text" class="notes-search-input" placeholder="🔍 Caută în notițe...">
            <button class="notes-search-prev" title="Rezultat anterior">▲</button>
            <button class="notes-search-next" title="Rezultat următor">▼</button>
            <span class="notes-match-count">0/0</span>
          </div>
        </div>
      `;

      // Poziționare
      const noteWidth = 400;
      const noteHeight = 300;
      const rect = this.canvas.getBoundingClientRect();
      let left = rect.right - noteWidth;
      let top = rect.top + 50;
      if (!isFinite(left) || !isFinite(top) || left < 0 || left + noteWidth > window.innerWidth || top < 0 || top + noteHeight > window.innerHeight) {
        left = (window.innerWidth - noteWidth) / 2;
        top = (window.innerHeight - noteHeight) / 2;
      }
      note.style.left = Math.max(0, left) + 'px';
      note.style.top = Math.max(0, top) + 'px';
      note.style.zIndex = '99999';

      document.body.appendChild(note);
      note.style.display = 'flex';

      // Drag, resize, close
      const header = note.querySelector('.note-header');
      let drag = false, startX, startY, initialLeft, initialTop;
      header.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('note-close')) return;
        drag = true;
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = note.offsetLeft;
        initialTop = note.offsetTop;
        e.preventDefault();
      });
      window.addEventListener('mousemove', (e) => {
        if (!drag) return;
        note.style.left = (initialLeft + e.clientX - startX) + 'px';
        note.style.top = (initialTop + e.clientY - startY) + 'px';
      });
      window.addEventListener('mouseup', () => { drag = false; });

      const resizer = document.createElement('div');
      resizer.className = 'note-resizer';
      note.appendChild(resizer);
      let resizing = false, startW, startH, startRX, startRY;
      resizer.addEventListener('mousedown', (e) => {
        resizing = true;
        startW = note.offsetWidth;
        startH = note.offsetHeight;
        startRX = e.clientX;
        startRY = e.clientY;
        e.preventDefault();
      });
      window.addEventListener('mousemove', (e) => {
        if (!resizing) return;
        const newW = Math.max(300, startW + e.clientX - startRX);
        const newH = Math.max(150, startH + e.clientY - startRY);
        note.style.width = newW + 'px';
        note.style.height = newH + 'px';
      });
      window.addEventListener('mouseup', () => { resizing = false; });

      note.querySelector('.note-close').onclick = () => this.closeDetailNote();

      // Setăm detailNote imediat
      this.detailNote = note;

      // ═══ EDITOR RICH TEXT ═══
      const editor = note.querySelector('.user-notes-editor');
      const toolbar = note.querySelector('.notes-toolbar');
      const colorPicker = note.querySelector('.note-color-picker');
      const fileInput = note.querySelector('#noteImageUpload');

      toolbar.querySelectorAll('.note-btn').forEach(btn => {
        btn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          const cmd = btn.dataset.cmd;
          if (cmd === 'insertImage') {
            fileInput.click();
          } else {
            document.execCommand(cmd, false, null);
          }
        });
      });

      colorPicker.addEventListener('input', (e) => {
        document.execCommand('foreColor', false, e.target.value);
      });

      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          document.execCommand('insertImage', false, event.target.result);
          fileInput.value = '';
        };
        reader.readAsDataURL(file);
      });

      // ═══ LOGICA DE CĂUTARE (pe contentEditable) ═══
      const searchInput = note.querySelector('.notes-search-input');
      const searchPrev = note.querySelector('.notes-search-prev');
      const searchNext = note.querySelector('.notes-search-next');
      const matchCount = note.querySelector('.notes-match-count');

      let matches = [];
      let currentMatchIndex = -1;

      function performSearch(direction) {
        const query = searchInput.value.toLowerCase();
        const text = editor.innerText;
        if (!query) {
          matchCount.textContent = '0/0';
          window.getSelection().removeAllRanges();
          return;
        }

        if (!searchInput.dataset.lastQuery || searchInput.dataset.lastQuery !== query) {
          searchInput.dataset.lastQuery = query;
          matches = [];
          currentMatchIndex = -1;
          let idx = text.toLowerCase().indexOf(query);
          while (idx !== -1) {
            matches.push(idx);
            idx = text.toLowerCase().indexOf(query, idx + 1);
          }
        }

        if (matches.length === 0) {
          matchCount.textContent = '0/0';
          return;
        }

        if (direction === 'next') {
          currentMatchIndex = (currentMatchIndex + 1) % matches.length;
        } else if (direction === 'prev') {
          currentMatchIndex = (currentMatchIndex - 1 + matches.length) % matches.length;
        } else {
          currentMatchIndex = 0;
        }

        const range = document.createRange();
        const sel = window.getSelection();
        const pos = matches[currentMatchIndex];

        let foundNode = null;
        let foundOffset = 0;
        let charCount = 0;
        const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, null, false);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          const nodeText = node.textContent;
          const start = charCount;
          const end = charCount + nodeText.length;
          if (pos >= start && pos < end) {
            foundNode = node;
            foundOffset = pos - start;
            break;
          }
          charCount += nodeText.length;
        }

        if (foundNode) {
          range.setStart(foundNode, foundOffset);
          range.setEnd(foundNode, foundOffset + query.length);
          sel.removeAllRanges();
          sel.addRange(range);
          const rect = range.getBoundingClientRect();
          if (rect.top < editor.getBoundingClientRect().top || rect.bottom > editor.getBoundingClientRect().bottom) {
            editor.scrollTop += rect.top - editor.getBoundingClientRect().top - 20;
          }
          matchCount.textContent = `${currentMatchIndex + 1}/${matches.length}`;
        }
      }

      searchInput.addEventListener('input', () => performSearch('first'));
      searchNext.addEventListener('click', () => performSearch('next'));
      searchPrev.addEventListener('click', () => performSearch('prev'));
      searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); performSearch('next'); } });

      // ═══ SALVAREA (cu status vizual) ═══
      const saveStatus = note.querySelector('#saveStatus');
      let saveTimeout;
      editor.addEventListener('input', () => {
        const html = editor.innerHTML;
        localStorage.setItem('notes_' + structure.id, html);
        
        saveStatus.textContent = '💾 Salvând...';

        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          fetch(`http://localhost:3000/api/notes/${structure.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: html })
          })
          .then(() => {
            saveStatus.textContent = '✅ Salvat';
            setTimeout(() => { saveStatus.textContent = '💾'; }, 2000);
          })
          .catch(() => {
            saveStatus.textContent = '⚠️ Offline';
            setTimeout(() => { saveStatus.textContent = '💾'; }, 3000);
          });
        }, 800);
      });

    } catch (error) {
      console.error('❌ Eroare în openDetailedDescription:', error);
      alert('A apărut o eroare la afișarea fișei anatomice. Vezi consola pentru detalii.');
    }
  }

  closeDetailNote() {
    if (this.detailNote) {
      this.detailNote.remove();
      this.detailNote = null;
    }
  }

  openImageViewer(imageUrl, name) {
    if (this.imageNote) this.closeImageViewer();

    const note = document.createElement('div');
    note.className = 'floating-image-note';
    note.innerHTML = `
      <div class="note-header"><span>🖼️ ${name}</span><button class="note-close">✖</button></div>
      <div class="note-body"><img src="${imageUrl}" alt="${name}"></div>
    `;
    document.body.appendChild(note);

    note.style.left = '200px';
    note.style.top = '150px';
    note.style.display = 'flex';
    note.style.zIndex = '99999';

    const header = note.querySelector('.note-header');
    let drag = false, startX, startY, initLeft, initTop;
    header.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('note-close')) return;
      drag = true;
      startX = e.clientX;
      startY = e.clientY;
      initLeft = note.offsetLeft;
      initTop = note.offsetTop;
      e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => {
      if (!drag) return;
      note.style.left = (initLeft + e.clientX - startX) + 'px';
      note.style.top = (initTop + e.clientY - startY) + 'px';
    });
    window.addEventListener('mouseup', () => { drag = false; });

    const resizer = document.createElement('div');
    resizer.className = 'note-resizer';
    note.appendChild(resizer);
    let resizing = false, startW, startH, startRX, startRY;
    resizer.addEventListener('mousedown', (e) => {
      resizing = true;
      startW = note.offsetWidth;
      startH = note.offsetHeight;
      startRX = e.clientX;
      startRY = e.clientY;
      e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => {
      if (!resizing) return;
      const newW = Math.max(300, startW + e.clientX - startRX);
      const newH = Math.max(200, startH + e.clientY - startRY);
      note.style.width = newW + 'px';
      note.style.height = newH + 'px';
    });
    window.addEventListener('mouseup', () => { resizing = false; });

    note.querySelector('.note-close').onclick = () => this.closeImageViewer();
    this.imageNote = note;
  }

  closeImageViewer() {
    if (this.imageNote) {
      this.imageNote.remove();
      this.imageNote = null;
    }
  }

  getDescriptionTemplate() {
    if (!this.highlightedMesh) {
      console.warn('Nicio structură selectată. Click pe un obiect 3D mai întâi.');
      return;
    }
    const struct = this.highlightedMesh.userData.structure;
    const system = this.highlightedMesh.userData.system;
    if (!struct || !system) {
      console.warn('Structura nu are date suficiente.');
      return;
    }
    const normalizedId = this._normalizeAnatomyId(struct.id);
    const template = { [normalizedId]: { description: "", function: "", facts: [] } };
    console.log(`Șablon pentru ${struct.name} (sistem: ${system})`);
    console.log(JSON.stringify(template, null, 2));
    return template;
  }

  centerCameraOnMesh(mesh, duration = 800, forcedDirection = null) {
    if (!window.controls || !this.camera) return;
    const worldPos = mesh.getWorldPosition(new THREE.Vector3());
    const startTarget = window.controls.target.clone();
    const startCamPos = this.camera.position.clone();
    const box = new THREE.Box3().setFromObject(mesh);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    let distance;
    if (maxDim < 0.5) distance = maxDim * 4.0 + 0.6;
    else if (maxDim < 2.0) distance = maxDim * 3.0 + 1.0;
    else distance = maxDim * 2.5 + 1.5;
    let direction = new THREE.Vector3();
    if (forcedDirection) {
      switch (forcedDirection) {
        case 'front': direction.set(0, 0, 1); break;
        case 'back': direction.set(0, 0, -1); break;
        case 'left': direction.set(-1, 0, 0); break;
        case 'right': direction.set(1, 0, 0); break;
        default: direction.set(0, 0, 1);
      }
      direction.y += 0.35;
      direction.normalize();
    } else {
      const absX = Math.abs(worldPos.x), absZ = Math.abs(worldPos.z);
      if (absX > absZ) direction.set(worldPos.x > 0 ? 1 : -1, 0, 0);
      else direction.set(0, 0, worldPos.z > 0.3 ? 1 : worldPos.z < -0.3 ? -1 : -1);
      direction.y += 0.35;
      direction.normalize();
    }
    const endCamPos = worldPos.clone().addScaledVector(direction, distance);
    const endTarget = worldPos.clone();
    const startTime = performance.now();
    const animateCamera = (currentTime) => {
      const elapsed = currentTime - startTime;
      const t = Math.min(elapsed / duration, 1.0);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      this.camera.position.lerpVectors(startCamPos, endCamPos, eased);
      window.controls.target.lerpVectors(startTarget, endTarget, eased);
      window.controls.update();
      if (t < 1.0) requestAnimationFrame(animateCamera);
    };
    requestAnimationFrame(animateCamera);
  }

  focusOnStructureFromDirection(mesh, direction) {
    if (!mesh) return;
    if (this.highlightedMesh !== mesh) {
      if (this.highlightedMesh) this.resetMeshEmissive(this.highlightedMesh);
      this.highlightedMesh = mesh;
      this.setMeshEmissive(mesh, this.highlightColor, 0.8);
      this.showStructureInfo(mesh.userData.structure || null);
    }
    if (this.focusedMesh) this.exitFocusMode();
    this.applyFocusHighlight(mesh);
    this.focusedMesh = mesh;
    const system = mesh.userData.system;
    this.restoreGroupOpacity(system);
    const group = this.systemGroups[system];
    if (group) {
      group.meshes.forEach(m => { if (m !== mesh && m.visible) this.setOpacity(m, 0.25); });
    }
    this.centerCameraOnMesh(mesh, 800, direction);
    this.showDynamicRelations(mesh);
  }

  // ═══════ NOU: LOGICA PENTRU TABLETĂ / TELEFON ═══════
  _initTouchContextMenu() {
    // Creăm elementul meniului (inițial ascuns)
    this.contextMenu = document.createElement('div');
    this.contextMenu.className = 'touch-context-menu hidden';
    this.contextMenu.innerHTML = `
      <button class="ctx-btn" data-action="focus">🔍 Evidențiază</button>
      <button class="ctx-btn" data-action="hide">👻 Ascunde</button>
      <button class="ctx-btn" data-action="info">📖 Fișă</button>
    `;
    document.body.appendChild(this.contextMenu);

    // Evenimente pentru butoanele meniului
    this.contextMenu.addEventListener('click', (e) => {
      const btn = e.target.closest('.ctx-btn');
      if (!btn) return;
      const action = btn.dataset.action;
      const mesh = this.contextMenu.dataset.targetMesh ? this._findMeshByUuid(this.contextMenu.dataset.targetMesh) : null;
      
      if (action === 'focus' && mesh) {
        this.focusOnStructure(mesh);
      } else if (action === 'hide' && mesh) {
        this.hideMesh(mesh);
      } else if (action === 'info' && mesh) {
        this.showStructureInfo(mesh.userData.structure);
        this.highlightedMesh = mesh;
      }
      this.contextMenu.classList.add('hidden');
    });

    // Ascundem meniul când utilizatorul atinge în altă parte
    document.addEventListener('touchstart', (e) => {
      if (!this.contextMenu.classList.contains('hidden') && 
          !this.contextMenu.contains(e.target) && 
          e.target.id !== 'mobileInfoToggle') {
        this.contextMenu.classList.add('hidden');
        clearTimeout(this.longPressTimer);
      }
    });
  }

  _findMeshByUuid(uuid) {
    return window.allMeshes?.find(m => m.uuid === uuid) || null;
  }

  // Suprascriem inițializarea evenimentelor pentru a adăuga long-press
  initEvents() {
    super.initEvents(); // Păstrăm logica existentă pentru mouse
    
    // Adăugăm logica de LONG-PRESS (pentru tabletă și telefon)
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      
      clearTimeout(this.longPressTimer);
      this.longPressTimer = setTimeout(() => {
        // Declanșăm un eveniment de click pentru a găsi structura
        const fakeEvent = { clientX: touch.clientX, clientY: touch.clientY, altKey: false };
        this._simulateClick(fakeEvent, true); // true = este long press
      }, 600); // 600ms = atingere lungă
    });

    this.canvas.addEventListener('touchmove', (e) => {
      clearTimeout(this.longPressTimer); // Anulăm dacă utilizatorul mută degetul
    });

    this.canvas.addEventListener('touchend', (e) => {
      clearTimeout(this.longPressTimer);
    });
  }

  // Metodă ajutătoare pentru a simula click-ul
  _simulateClick(e, isLongPress) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const visibleMeshes = this.getVisibleMeshes();
    const intersects = this.raycaster.intersectObjects(visibleMeshes);
    const hit = intersects.length > 0 ? intersects[0].object : null;

    if (!hit) return;

    if (isLongPress) {
      // Deschidem meniul contextual
      this.contextMenu.dataset.targetMesh = hit.uuid;
      this.contextMenu.classList.remove('hidden');
      
      // Poziționăm meniul lângă deget (sau în centru)
      const menuWidth = 140;
      let left = e.clientX - menuWidth / 2;
      let top = e.clientY - 60;
      // Nu lăsăm meniul să iasă din ecran
      left = Math.max(10, Math.min(left, window.innerWidth - menuWidth - 10));
      top = Math.max(10, Math.min(top, window.innerHeight - 120));
      this.contextMenu.style.left = left + 'px';
      this.contextMenu.style.top = top + 'px';

      // Evidențiem structura pentru vizibilitate
      if (this.highlightedMesh) this._restoreMeshColor(this.highlightedMesh);
      this.highlightedMesh = hit;
      this._applyColorToMesh(hit, this.highlightColor);
    } else {
      // Click normal (tap scurt) -> selectează structura
      if (this.highlightedMesh) this._restoreMeshColor(this.highlightedMesh);
      this.highlightedMesh = hit;
      this._applyColorToMesh(hit, this.highlightColor);
      this.showStructureInfo(hit.userData.structure || null);
    }
  }

  _initDirectionButtons() {
    const ready = () => {
      const btns = document.querySelectorAll('.dir-btn');
      btns.forEach(btn => {
        btn.addEventListener('click', () => {
          const dir = btn.dataset.dir;
          if (this.highlightedMesh) this.focusOnStructureFromDirection(this.highlightedMesh, dir);
        });
      });
    };
    document.readyState === 'complete' ? ready() : window.addEventListener('load', ready);
  }

  // ═══════════════ METODA ACTUALIZATĂ DE NORMALIZARE ═══════════════
  _normalizeAnatomyId(id) {
  return id
    .replace(/[*'.]/g, '')
    .replace(/[()]/g, '')
    .replace(/_?([lr])$/i, '')
    .replace(/_[0-9]+$/i, '')
    .replace(/_t$/i, '')
    .replace(/_?[lr]$/i, '')
    .replace(/([a-z])l$/i, '$1')
    .replace(/([a-z])r$/i, '$1')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
}

  // ═══════════════ METODA getNearbyStructures MODIFICATĂ ═══════════════
  getNearbyStructures(mesh, maxDist = 0.05, maxPerSystem = 15) {
    const allMeshes = window.allMeshes || [];
    const result = {};
    if (!mesh) return result;
    const box = new THREE.Box3().setFromObject(mesh);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const radius = Math.max(size.x, size.y, size.z) / 2;
    const candidates = [];
    allMeshes.forEach(other => {
      if (other === mesh) return;
      const sys = other.userData.system;
      if (!sys || sys === 'other' || !other.visible) return;
      const otherBox = new THREE.Box3().setFromObject(other);
      const otherCenter = otherBox.getCenter(new THREE.Vector3());
      const otherSize = otherBox.getSize(new THREE.Vector3());
      const otherRadius = Math.max(otherSize.x, otherSize.y, otherSize.z) / 2;
      const dist = Math.max(0, center.distanceTo(otherCenter) - radius - otherRadius);
      if (dist <= maxDist) candidates.push({ sys, dist, other });
    });
    candidates.sort((a, b) => a.dist - b.dist);
    const countPerSystem = {};
    const addedIds = new Set();

    candidates.forEach(({ sys, other }) => {
      if (!countPerSystem[sys]) countPerSystem[sys] = 0;
      if (countPerSystem[sys] >= maxPerSystem) return;

      const structId = other.userData.structure?.id;
      if (!structId) return;

      const normalizedId = this._normalizeAnatomyId(structId);
      if (addedIds.has(normalizedId)) return;

      const name = normalizedId;
      if (!result[sys]) result[sys] = [];
      result[sys].push(name);
      addedIds.add(normalizedId);
      countPerSystem[sys]++;
    });

    return result;
  }

  getActiveFilterSystems() {
    const activeBtn = document.querySelector('.filter-btn.active');
    if (!activeBtn) return Object.keys(this.config.systems);
    const system = activeBtn.dataset.system;
    return system === 'all' ? Object.keys(this.config.systems) : [system];
  }

  showDynamicRelations(mesh) {
    let container = document.getElementById('relationsContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'relationsContainer';
      container.className = 'panel-section';
      container.innerHTML = '<h3>🔗 Relații anatomice</h3><div id="relationsList"></div>';
      this.panelContent.appendChild(container);
    }
    const list = document.getElementById('relationsList');
    list.innerHTML = '';
    if (!mesh) { container.classList.add('hidden'); return; }
    const nearby = this.getNearbyStructures(mesh, 0.01, 12);
    const activeSystems = this.getActiveFilterSystems();
    let hasAny = false;
    for (const [sys, ids] of Object.entries(nearby)) {
      if (!activeSystems.includes(sys) || ids.length === 0) continue;
      hasAny = true;
      const sysName = this.config.systems[sys]?.name || sys;
      const sysColor = this.config.systems[sys]?.color || '#888';
      const section = document.createElement('div');
      section.className = 'relations-system';
      section.innerHTML = `
        <div class="relations-header">
          <span class="relations-dot" style="background-color: ${sysColor}"></span>
          <span class="relations-system-name">${sysName} (${ids.length})</span>
        </div>
        <ul class="relations-list">
          ${ids.map(id => {
            const struct = this.findStructureById(sys, id);
            const name = struct?.name || id;
            return `<li>${name}</li>`;
          }).join('')}
        </ul>
      `;
      list.appendChild(section);
    }
    container.classList.toggle('hidden', !hasAny);
  }
}