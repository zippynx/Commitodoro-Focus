const MODES = {
  focus: {
    minutes: 25,
    label: 'SESI FOKUS',
    info: 'Waktu untuk fokus!',
    modeClass: ''
  },

  short: {
    minutes: 5,
    label: 'ISTIRAHAT SINGKAT',
    info: 'Ambil napas sejenak 🧃',
    modeClass: 'mode--short'
  },

  long: {
    minutes: 30,
    label: 'ISTIRAHAT PANJANG',
    info: 'Rehat panjang, kamu keren! ☕',
    modeClass: 'mode--long'
  }
};

const STORAGE_KEY_TASKS = 'commitodoro_tasks_v2';
const STORAGE_KEY_STATS = 'commitodoro_stats_v2';

let currentMode     = 'focus';
let totalSeconds    = MODES.focus.minutes * 60;
let timeLeft        = totalSeconds;

let isRunning       = false;
let intervalId      = null;
let endTime         = null;

let sessionsToday   = 0;
let minutesToday    = 0;
let sessionsInCycle = 0;

let colonVisible    = true;
let tasks           = [];

const appEl         = document.querySelector('.app');
const timerCard     = document.querySelector('.timer-card');

const sessionLabel  = document.getElementById('sessionLabel');
const sessionNum    = document.getElementById('sessionNum');
const sessionInfo   = document.getElementById('sessionInfo');

const todayCount    = document.getElementById('todayCount');
const todayMinutes  = document.getElementById('todayMinutes');

const progressFill  = document.getElementById('progressFill');
const progressGlow  = document.getElementById('progressGlow');

const dots          = document.querySelectorAll('.dot');

const minTensVal    = document.getElementById('minTensVal');
const minOnesVal    = document.getElementById('minOnesVal');

const secTensVal    = document.getElementById('secTensVal');
const secOnesVal    = document.getElementById('secOnesVal');

const colonDots     = document.querySelectorAll('.colon-dot');

const mainBtn       = document.getElementById('mainBtn');
const resetBtn      = document.getElementById('resetBtn');
const skipBtn       = document.getElementById('skipBtn');

const iconPlay      = mainBtn.querySelector('.icon-play');
const iconPause     = mainBtn.querySelector('.icon-pause');

const modeTabs      = document.querySelectorAll('.mode-tab');

const taskInput     = document.getElementById('taskInput');
const addTaskBtn    = document.getElementById('addTaskBtn');

const taskList      = document.getElementById('taskList');
const taskEmpty     = document.getElementById('taskEmpty');

const clearDoneBtn  = document.getElementById('clearDoneBtn');

function setMode(modeKey, resetSession = true) {
  currentMode  = modeKey;
  totalSeconds = MODES[modeKey].minutes * 60;

  if (resetSession) {
    timeLeft = totalSeconds;
  }

  sessionLabel.textContent = MODES[modeKey].label;
  sessionInfo.textContent  = MODES[modeKey].info;

  appEl.classList.remove(
    'mode--short',
    'mode--long'
  );

  if (MODES[modeKey].modeClass) {
    appEl.classList.add(MODES[modeKey].modeClass);
  }

  modeTabs.forEach(tab => {
    tab.classList.toggle(
      'active',
      tab.dataset.mode === modeKey
    );
  });

  updateDisplay();
  updateProgress();
}

function tick() {
  const remaining = Math.max(
    0,
    Math.round((endTime - Date.now()) / 1000)
  );

  timeLeft = remaining;

  colonVisible = !colonVisible;

  colonDots.forEach(dot => {
    dot.classList.toggle('dim', !colonVisible);
  });

  updateDisplay();
  updateProgress();

  if (timeLeft <= 0 && isRunning) {
    handleSessionEnd();
  }
}

function start() {
  if (isRunning) return;

  if (
    'Notification' in window &&
    Notification.permission === 'default'
  ) {
    Notification.requestPermission();
  }

  isRunning = true;

  timerCard.classList.add('running');

  iconPlay.classList.add('hidden');
  iconPause.classList.remove('hidden');

  endTime = Date.now() + (timeLeft * 1000);

  intervalId = setInterval(tick, 250);
}

function pause() {
  if (!isRunning) return;

  isRunning = false;

  timerCard.classList.remove('running');

  iconPlay.classList.remove('hidden');
  iconPause.classList.add('hidden');

  clearInterval(intervalId);
  intervalId = null;
}

function resetTimer() {
  pause();

  timeLeft = totalSeconds;
  colonVisible = true;

  colonDots.forEach(dot => {
    dot.classList.remove('dim');
  });

  updateDisplay();
  updateProgress();
}

function skipSession() {
  pause();
  handleSessionEnd(true);
}

function handleSessionEnd(skipped = false) {
  pause();

  ringTimer();

  if (currentMode === 'focus' && !skipped) {

    showNotification(
      'Focus session completed',
      'Time for a break ☕'
    );

    sessionsInCycle++;
    sessionsToday++;

    minutesToday += MODES.focus.minutes;

    saveStats();

    updateStatsDisplay();
    updateDots();

    if (sessionsInCycle >= 4) {
      sessionsInCycle = 0;
      setMode('long');
    } else {
      setMode('short');
    }

  } else {

    showNotification(
      'Break finished',
      'Ready to focus again 🚀'
    );

    setMode('focus');
  }

  updateSessionCounter();
}

function updateDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const minutesStr = String(minutes).padStart(2, '0');
  const secondsStr = String(seconds).padStart(2, '0');

  setDigit(minTensVal, minutesStr[0]);
  setDigit(minOnesVal, minutesStr[1]);

  setDigit(secTensVal, secondsStr[0]);
  setDigit(secOnesVal, secondsStr[1]);

  document.title = `${minutesStr}:${secondsStr} — Timer`;
}

function setDigit(el, value) {
  if (el.textContent !== value) {
    el.classList.remove('flash');

    void el.offsetWidth;

    el.classList.add('flash');
    el.textContent = value;
  }
}

function updateProgress() {
  const percentage =
    totalSeconds > 0
      ? (timeLeft / totalSeconds) * 100
      : 0;

  progressFill.style.width = `${percentage}%`;
  progressGlow.style.width = `${percentage}%`;
}

function updateDots() {
  dots.forEach((dot, index) => {
    const activeDots =
      sessionsInCycle === 0 && sessionsToday > 0
        ? 4
        : sessionsInCycle;

    dot.classList.toggle(
      'filled',
      index < activeDots
    );
  });
}

function updateSessionCounter() {
  const currentPomodoro =
    sessionsInCycle === 0 && sessionsToday === 0
      ? 1
      : sessionsInCycle === 0
        ? 4
        : sessionsInCycle;

  sessionNum.textContent = `#${currentPomodoro} / 4`;
}

function updateStatsDisplay() {
  todayCount.textContent   = sessionsToday;
  todayMinutes.textContent = minutesToday.toFixed(1);
}

function ringTimer() {
  try {
    const ctx = new (
      window.AudioContext ||
      window.webkitAudioContext
    )();

    setTimeout(() => {
      ctx.close();
    }, 1000);

    const playTone = (
      frequency,
      startTime,
      duration
    ) => {

      const oscillator = ctx.createOscillator();
      const gainNode   = ctx.createGain();

      oscillator.type = 'sine';

      oscillator.frequency.setValueAtTime(
        frequency,
        ctx.currentTime + startTime
      );

      gainNode.gain.setValueAtTime(
        0.25,
        ctx.currentTime + startTime
      );

      gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        ctx.currentTime + startTime + duration
      );

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime + startTime);
      oscillator.stop(ctx.currentTime + startTime + duration);
    };

    playTone(880, 0,    0.15);
    playTone(1100, 0.18, 0.15);
    playTone(1320, 0.36, 0.3);

  } catch (error) {

    console.warn(
      'Audio not available',
      error
    );
  }

  timerCard.classList.remove('session-end-ring');

  void timerCard.offsetWidth;

  timerCard.classList.add('session-end-ring');

  setTimeout(() => {
    timerCard.classList.remove('session-end-ring');
  }, 2500);
}

function showNotification(title, body) {
  if (
    'Notification' in window &&
    Notification.permission === 'granted'
  ) {
    new Notification(title, {
      body,
      icon: 'assets/favicon/favicon-32x32.png'
    });
  }
}

function saveStats() {
  const today = new Date().toDateString();

  localStorage.setItem(
    STORAGE_KEY_STATS,
    JSON.stringify({
      date: today,
      sessions: sessionsToday,
      minutes: minutesToday
    })
  );
}

function loadStats() {
  try {

    const raw = localStorage.getItem(
      STORAGE_KEY_STATS
    );

    if (!raw) return;

    const data  = JSON.parse(raw);
    const today = new Date().toDateString();

    if (data.date === today) {
      sessionsToday = data.sessions || 0;
      minutesToday  = data.minutes  || 0;
    }

  } catch (error) {

    console.warn(
      'Failed to load stats',
      error
    );
  }
}

function saveTasks() {
  localStorage.setItem(
    STORAGE_KEY_TASKS,
    JSON.stringify(tasks)
  );
}

function loadTasks() {
  try {

    tasks = JSON.parse(
      localStorage.getItem(STORAGE_KEY_TASKS)
    ) || [];

  } catch (error) {

    tasks = [];

    console.warn(
      'Failed to load tasks',
      error
    );
  }

  renderTasks();
}

function addTask(text) {
  const cleanText = text.trim();

  if (!cleanText) return;

  tasks.unshift({
    id: Date.now(),
    text: cleanText,
    done: false
  });

  saveTasks();
  renderTasks();
}

function toggleTask(id) {
  const task = tasks.find(
    task => task.id === id
  );

  if (task) {
    task.done = !task.done;
  }

  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter(
    task => task.id !== id
  );

  saveTasks();
  renderTasks();
}

function clearDone() {
  tasks = tasks.filter(
    task => !task.done
  );

  saveTasks();
  renderTasks();
}

function renderTasks() {
  taskList.innerHTML = '';

  if (tasks.length === 0) {
    taskEmpty.style.display = 'block';
    return;
  }

  taskEmpty.style.display = 'none';

  tasks.forEach(task => {

    const li = document.createElement('li');

    li.className =
      `task-item${task.done ? ' done' : ''}`;

    const check = document.createElement('input');

    check.type      = 'checkbox';
    check.className = 'task-check';
    check.checked   = task.done;

    check.addEventListener(
      'change',
      () => toggleTask(task.id)
    );

    const span = document.createElement('span');

    span.className   = 'task-text';
    span.textContent = task.text;

    const del = document.createElement('button');

    del.className   = 'task-del';
    del.textContent = '×';
    del.title       = 'Hapus';

    del.addEventListener(
      'click',
      () => deleteTask(task.id)
    );

    li.append(check, span, del);

    taskList.appendChild(li);
  });
}

mainBtn.addEventListener('click', () => {
  isRunning ? pause() : start();
});

resetBtn.addEventListener(
  'click',
  resetTimer
);

skipBtn.addEventListener(
  'click',
  skipSession
);

modeTabs.forEach(tab => {
  tab.addEventListener('click', () => {

    if (tab.dataset.mode === currentMode) {
      return;
    }

    pause();
    setMode(tab.dataset.mode);
  });
});

document.addEventListener('keydown', event => {

  if (
    event.code === 'Space' &&
    event.target.tagName !== 'INPUT'
  ) {
    event.preventDefault();

    isRunning ? pause() : start();
  }
});

addTaskBtn.addEventListener('click', () => {
  addTask(taskInput.value);

  taskInput.value = '';
  taskInput.focus();
});

taskInput.addEventListener('keydown', event => {

  if (event.key === 'Enter') {
    addTask(taskInput.value);

    taskInput.value = '';
  }
});

clearDoneBtn.addEventListener(
  'click',
  clearDone
);

loadStats();
loadTasks();

updateDisplay();
updateProgress();

updateStatsDisplay();
updateSessionCounter();
updateDots();
