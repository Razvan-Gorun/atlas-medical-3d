export class QuizManager {
  constructor(systemGroups, config, interactionManager) {
    this.systemGroups = systemGroups;
    this.config = config;
    this.interactionManager = interactionManager;
    this.allQuestionsCache = {};  // cache pentru fiecare sistem
    this.currentQuestions = [];
    this.currentIndex = 0;
    this.score = 0;
    this.selectedSystem = null;
    this.quizActive = false;

    this.panel = document.getElementById('quizPanel');
    this.startScreen = document.getElementById('quizStart');
    this.questionScreen = document.getElementById('quizQuestion');
    this.resultScreen = document.getElementById('quizResult');
    this.systemSelect = document.getElementById('quizSystemSelect');
    this.startBtn = document.getElementById('quizStartBtn');
    this.closeBtn = document.getElementById('quizClose');
    this.nextBtn = document.getElementById('quizNextBtn');
    this.showStructureBtn = document.getElementById('quizShowStructureBtn');
    this.retryBtn = document.getElementById('quizRetryBtn');
    this.questionText = document.getElementById('quizQuestionText');
    this.optionsContainer = document.getElementById('quizOptions');
    this.feedbackContainer = document.getElementById('quizFeedback');
    this.scoreText = document.getElementById('quizScore');

    this.init();
  }

  async init() {
    this.closeBtn.addEventListener('click', () => this.hideQuiz());
    document.getElementById('toggleQuiz').addEventListener('click', () => this.toggleQuiz());
    this.startBtn.addEventListener('click', () => this.startQuiz());
    this.nextBtn.addEventListener('click', () => this.nextQuestion());
    this.retryBtn.addEventListener('click', () => this.showSystemSelection());
    this.showStructureBtn.addEventListener('click', () => this.highlightCurrentStructure());

    this.panel.addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('click', (e) => {
      if (this.quizActive && !this.panel.contains(e.target) && e.target.id !== 'toggleQuiz') {
        this.hideQuiz();
      }
    });

    this.makeDraggable(this.panel);
    this.buildSystemButtons();
  }

  makeDraggable(element) {
    const header = element.querySelector('.quiz-header');
    if (!header) return;
    let isDragging = false, startX, startY, initX, initY;
    header.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('quiz-close')) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initX = element.offsetLeft;
      initY = element.offsetTop;
      e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      element.style.left = (initX + e.clientX - startX) + 'px';
      element.style.top = (initY + e.clientY - startY) + 'px';
    });
    window.addEventListener('mouseup', () => { isDragging = false; });
  }

  buildSystemButtons() {
    const systems = Object.keys(this.config.systems).filter(s => s !== 'other');
    this.systemSelect.innerHTML = '';
    const allBtn = document.createElement('button');
    allBtn.textContent = 'Toate sistemele';
    allBtn.dataset.system = 'all';
    allBtn.addEventListener('click', () => this.selectSystem('all'));
    this.systemSelect.appendChild(allBtn);

    systems.forEach(sys => {
      const btn = document.createElement('button');
      btn.textContent = this.config.systems[sys].name;
      btn.dataset.system = sys;
      btn.addEventListener('click', () => this.selectSystem(sys));
      this.systemSelect.appendChild(btn);
    });
  }

  selectSystem(sys) {
    this.selectedSystem = sys;
    this.systemSelect.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
    this.systemSelect.querySelector(`button[data-system="${sys}"]`).classList.add('selected');
  }

  async loadQuestionsForSystem(sys) {
    if (this.allQuestionsCache[sys]) {
      return this.allQuestionsCache[sys];
    }
    try {
      const resp = await fetch(`./data/quizzes/${sys}.json`);
      if (resp.ok) {
        const data = await resp.json();
        // Fișierele conțin direct array-ul de întrebări, nu un obiect cu cheia sistemului
        this.allQuestionsCache[sys] = data;
        return data;
      }
    } catch (e) {
      console.warn(`Nu s-a putut încărca fișierul pentru ${sys}:`, e);
    }
    return [];
  }

  async loadAllQuestions() {
    const systems = Object.keys(this.config.systems).filter(s => s !== 'other');
    const promises = systems.map(sys => this.loadQuestionsForSystem(sys));
    const results = await Promise.all(promises);
    return results.flat();
  }

  toggleQuiz() {
    if (this.panel.classList.contains('hidden')) {
      this.showSystemSelection();
      this.panel.classList.remove('hidden');
      this.quizActive = true;
      document.getElementById('infoPanel')?.classList.remove('open');
    } else {
      this.hideQuiz();
    }
  }

  hideQuiz() {
    this.panel.classList.add('hidden');
    this.quizActive = false;
  }

  showSystemSelection() {
    this.startScreen.classList.remove('hidden');
    this.questionScreen.classList.add('hidden');
    this.resultScreen.classList.add('hidden');
    this.selectSystem('all');
  }

  async startQuiz() {
    if (!this.selectedSystem) return;

    if (this.selectedSystem === 'all') {
      this.currentQuestions = await this.loadAllQuestions();
    } else {
      this.currentQuestions = await this.loadQuestionsForSystem(this.selectedSystem);
    }

    if (this.currentQuestions.length === 0) {
      alert('Nu există încă întrebări pentru acest sistem.');
      return;
    }

    this.currentQuestions = this.shuffleArray(this.currentQuestions);
    this.currentIndex = 0;
    this.score = 0;
    this.startScreen.classList.add('hidden');
    this.questionScreen.classList.remove('hidden');
    this.resultScreen.classList.add('hidden');
    this.showQuestion();
  }

  shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  showQuestion() {
    const q = this.currentQuestions[this.currentIndex];
    this.questionText.textContent = `${this.currentIndex + 1}/${this.currentQuestions.length}. ${q.question}`;
    this.optionsContainer.innerHTML = '';
    q.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.textContent = opt;
      btn.addEventListener('click', () => this.checkAnswer(idx));
      this.optionsContainer.appendChild(btn);
    });
    this.feedbackContainer.classList.add('hidden');
    this.nextBtn.classList.add('hidden');
    this.showStructureBtn.classList.add('hidden');
  }

  checkAnswer(chosenIndex) {
    const q = this.currentQuestions[this.currentIndex];
    const correct = chosenIndex === q.correctIndex;

    const buttons = this.optionsContainer.querySelectorAll('button');
    buttons.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === q.correctIndex) btn.classList.add('correct');
      if (idx === chosenIndex && !correct) btn.classList.add('wrong');
    });

    if (correct) {
      this.score++;
      this.feedbackContainer.innerHTML = `✅ Corect! ${q.explanation}`;
    } else {
      this.feedbackContainer.innerHTML = `❌ Greșit. Răspunsul corect este: <strong>${q.options[q.correctIndex]}</strong>. ${q.explanation}`;
    }
    this.feedbackContainer.classList.remove('hidden');

    if (q.structureId) {
      this.showStructureBtn.classList.remove('hidden');
    }

    if (this.currentIndex < this.currentQuestions.length - 1) {
      this.nextBtn.textContent = 'Următoarea întrebare';
      this.nextBtn.classList.remove('hidden');
      this.nextBtn.onclick = () => this.nextQuestion();
    } else {
      this.nextBtn.textContent = 'Vezi rezultatul';
      this.nextBtn.classList.remove('hidden');
      this.nextBtn.onclick = () => this.showResult();
    }
  }

  nextQuestion() {
    this.currentIndex++;
    this.showQuestion();
  }

  showResult() {
    this.questionScreen.classList.add('hidden');
    this.resultScreen.classList.remove('hidden');
    const total = this.currentQuestions.length;
    this.scoreText.textContent = `Ai răspuns corect la ${this.score} din ${total} întrebări.`;
  }

  highlightCurrentStructure() {
    const q = this.currentQuestions[this.currentIndex];
    if (!q.structureId) return;
    const mesh = window.allMeshes?.find(m => m.userData.structure?.id === q.structureId);
    if (mesh && this.interactionManager) {
      this.interactionManager.focusOnStructure(mesh);
    }
  }
}