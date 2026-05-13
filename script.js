const MODES = {
    focus: 25 * 60,
    short: 5 * 60,
    long: 30 * 60
};

let currentMode = 'focus';
let timeLeft = MODES.focus;
let timer = null;
let isRunning = false;
let sessionsCompleted = 0;

const timeDisplay = document.getElementById('time-display');
const mainBtn = document.getElementById('main-btn');
const resetBtn = document.getElementById('reset-btn');
const modeCards = document.querySelectorAll('.mode-card');
const rockets = document.querySelectorAll('.rocket');
const noteInput = document.getElementById('note-input');

noteInput.value = localStorage.getItem('focsy_space_note') || '';
noteInput.addEventListener('input', (e) => {
    localStorage.setItem('focsy_space_note', e.target.value);
});

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const seconds = (timeLeft % 60).toString().padStart(2, '0');
    timeDisplay.innerText = `${minutes}:${seconds}`;
    document.title = `${minutes}:${seconds} - Focsy`;
}

mainBtn.addEventListener('click', () => {
    if (isRunning) {
        clearInterval(timer);
        mainBtn.innerText = 'Start';
        isRunning = false;
    } else {
        mainBtn.innerText = 'Pause';
        isRunning = true;
        
        timer = setInterval(() => {
            timeLeft--;
            updateDisplay();

            if (timeLeft <= 0) {
                handleSessionEnd();
            }
        }, 1000);
    }
});


resetBtn.addEventListener('click', () => {
    clearInterval(timer);
    isRunning = false;
    mainBtn.innerText = 'Start';
    timeLeft = MODES[currentMode];
    updateDisplay();
});

modeCards.forEach(card => {
    card.addEventListener('click', () => {
        if (isRunning) return; 
        
        modeCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        
        currentMode = card.dataset.mode;
        timeLeft = MODES[currentMode];
        updateDisplay();
    });
});

function handleSessionEnd() {
    clearInterval(timer);
    isRunning = false;
    mainBtn.innerText = 'Start';
    playBeep();

    if (currentMode === 'focus') {
        sessionsCompleted++;
        updateRockets();
        
        if (sessionsCompleted % 4 === 0) {
            switchModeUI('long');
        } else {
            switchModeUI('short');
        }
    } else {
        switchModeUI('focus');
        
        if (sessionsCompleted % 4 === 0 && currentMode === 'focus') {
            sessionsCompleted = 0;
            updateRockets();
        }
    }
}

function switchModeUI(modeTarget) {
    modeCards.forEach(c => c.classList.remove('active'));
    const targetCard = document.querySelector(`.mode-card[data-mode="${modeTarget}"]`);
    if(targetCard) targetCard.classList.add('active');
    
    currentMode = modeTarget;
    timeLeft = MODES[currentMode];
    updateDisplay();
}

function updateRockets() {
    const activeCount = sessionsCompleted % 4 === 0 && sessionsCompleted > 0 ? 4 : sessionsCompleted % 4;
    rockets.forEach((rocket, index) => {
        if (index < activeCount) {
            rocket.classList.add('active');
            rocket.classList.remove('inactive');
        } else {
            rocket.classList.remove('active');
            rocket.classList.add('inactive');
        }
    });
}

function playBeep() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 1);
    osc.stop(ctx.currentTime + 1);
}

// Render awal
updateDisplay();