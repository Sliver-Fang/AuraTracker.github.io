/**
 * Aura Habit Tracker - Core State Engine & Micro Interactions Controller
 */

// Offline Quote Database
const ZEN_QUOTES = [
  { text: "Your habits shape your identity. Build systems, not just goals.", author: "James Clear" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "He who has a why to live for can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius" },
  { text: "The secret of your future is hidden in your daily routine.", author: "Mike Murdock" },
  { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca" },
  { text: "Focus helper: Do first things first, and second things not at all.", author: "Peter Drucker" },
  { text: "Concentrate all your thoughts upon the work at hand. The sun's rays do not burn until brought to a focus.", author: "Alexander Graham Bell" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { text: "The chains of habit are too weak to be felt until they are too strong to be broken.", author: "Samuel Johnson" },
  { text: "It is easier to prevent bad habits than to break them.", author: "Benjamin Franklin" },
  { text: "Rule your mind or it will rule you.", author: "Horace" },
  { text: "Self-discipline is the master key to riches.", author: "Napoleon Hill" },
  { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
  { text: "Wellness of life is simply daily disciplines practiced over time.", author: "John C. Maxwell" },
  { text: "Don't wish it were easier. Wish you were better.", author: "Jim Rohn" },
  { text: "The only bad workout is the one that didn't happen. The same goes for habits.", author: "Unknown" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "Focus is a muscle, and you build it through daily intervals of quiet work.", author: "Cal Newport" }
];

// INITIAL STATE STRUCTURE
let state = {
  theme: 'light',
  palette: 'mint',
  isSleeping: false,
  sleepStartTime: null, // Timestamp when "Go to Sleep" clicked
  sleepStartTimeToday: null, // Actual wake timestamp for counter
  wakeStartTime: null, // Timestamp when "I'm Awake" clicked
  sleepHistory: [],
  tasks: [],
  vices: [],
  goals: [],
  history: [] // Historical performance for chart: { date: "YYYY-MM-DD", completed: X, tripped: Y, totalTasks: N, totalVices: V }
};

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  loadStateFromLocalStorage();
  applySavedStyles();
  initializeSystemTimers();
  loadNewQuote(false);
  
  // Render sub components
  renderTasks();
  renderVices();
  renderGoals();
  renderSleepUI();
  renderProgressChart();

  // Upgrade lucide icons
  updateIcons();
});

// Load persistent data from standard LocalStorage
function loadStateFromLocalStorage() {
  const localTheme = localStorage.getItem("aura-theme");
  if (localTheme) state.theme = localTheme;
  else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    state.theme = 'dark';
  }

  const localPalette = localStorage.getItem("aura-palette");
  if (localPalette) state.palette = localPalette;

  const localIsSleeping = localStorage.getItem("aura-is-sleeping");
  if (localIsSleeping) state.isSleeping = (localIsSleeping === "true");

  const localSleepStart = localStorage.getItem("aura-sleep-start");
  if (localSleepStart) state.sleepStartTime = parseInt(localSleepStart);

  const localWakeStart = localStorage.getItem("aura-wake-start");
  if (localWakeStart) state.wakeStartTime = parseInt(localWakeStart);

  const localSleepHistory = localStorage.getItem("aura-sleep-history");
  if (localSleepHistory) state.sleepHistory = JSON.parse(localSleepHistory);

  const localTasks = localStorage.getItem("aura-tasks");
  if (localTasks) state.tasks = JSON.parse(localTasks);

  const localVices = localStorage.getItem("aura-vices");
  if (localVices) state.vices = JSON.parse(localVices);

  const localGoals = localStorage.getItem("aura-goals");
  if (localGoals) state.goals = JSON.parse(localGoals);

  const localHistory = localStorage.getItem("aura-analytics-history");
  if (localHistory) state.history = JSON.parse(localHistory);
}

// Write to LocalStorage
function saveState() {
  localStorage.setItem("aura-theme", state.theme);
  localStorage.setItem("aura-palette", state.palette);
  localStorage.setItem("aura-is-sleeping", state.isSleeping);
  localStorage.setItem("aura-sleep-start", state.sleepStartTime || "");
  localStorage.setItem("aura-wake-start", state.wakeStartTime || "");
  localStorage.setItem("aura-sleep-history", JSON.stringify(state.sleepHistory));
  localStorage.setItem("aura-tasks", JSON.stringify(state.tasks));
  localStorage.setItem("aura-vices", JSON.stringify(state.vices));
  localStorage.setItem("aura-goals", JSON.stringify(state.goals));
  localStorage.setItem("aura-analytics-history", JSON.stringify(state.history));
}

// Modify classes on root HTML to support reactive layout changes
function applySavedStyles() {
  const root = document.documentElement;
  
  // Set dark/light class
  if (state.theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Set Palette attribute
  root.setAttribute('data-palette', state.palette);

  // Style highlit rings around palette buttons
  document.querySelectorAll("[id^='palette-']").forEach(btn => {
    btn.classList.remove("active-palette-ring");
  });
  const activeBtn = document.getElementById(`palette-${state.palette}`);
  if (activeBtn) activeBtn.classList.add("active-palette-ring");
}

function updateIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// --- DYNAMIC CORE CLOCK & TIMERS ---
function initializeSystemTimers() {
  // Update Live Time Indicator on header every second
  setInterval(() => {
    const timeNode = document.getElementById("live-time-indicator");
    if (timeNode) {
      const now = new Date();
      const options = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
      timeNode.textContent = now.toLocaleDateString('en-US', options);
    }

    // Refresh Awake / Sleeping duration ticking
    updateSleepWakeCounter();
  }, 1000);
}

// --- LIGHT / DARK & ACCENT CUSTOMIZER ---
function toggleDarkMode() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  saveState();
  applySavedStyles();
}

function setPalette(color) {
  state.palette = color;
  saveState();
  applySavedStyles();
}

// --- ZEN MOTIVATIONAL QUOTES ---
function loadNewQuote(isManual) {
  const textNode = document.getElementById("quote-text");
  const authorNode = document.getElementById("quote-author");
  
  if (!textNode || !authorNode) return;

  // Add standard smooth CSS face-out/fade-in transitions if triggered manually
  if (isManual) {
    textNode.parentElement.style.opacity = "0.3";
    setTimeout(() => {
      selectAndApplyQuote(textNode, authorNode);
      textNode.parentElement.style.opacity = "1";
    }, 180);
  } else {
    selectAndApplyQuote(textNode, authorNode);
  }
}

function selectAndApplyQuote(tNode, aNode) {
  const randomIndex = Math.floor(Math.random() * ZEN_QUOTES.length);
  const q = ZEN_QUOTES[randomIndex];
  tNode.textContent = `"${q.text}"`;
  aNode.textContent = `— ${q.author}`;
}

// --- INTERACTIVE SLEEP & WAKE TRACKER ---
// Triggered on waking up or sleeping toggled
function toggleSleepState() {
  const now = Date.now();
  
  if (state.isSleeping) {
    // CURRENT STATE: Sleeping -> ACTION: Wake up!
    const sleepDurationMs = now - (state.sleepStartTime || now);
    const sleptHours = parseFloat((sleepDurationMs / (1000 * 60 * 60)).toFixed(2));
    
    // Log previous sleep details
    state.isSleeping = false;
    state.wakeStartTime = now;
    
    // Unshift to list
    state.sleepHistory.unshift({
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      wakeTime: new Date(now).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      sleepTime: new Date(state.sleepStartTime || now).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      sleptHours: sleptHours,
      type: 'Sleep Cycle'
    });

    // Keep list clean (max 5 records)
    if (state.sleepHistory.length > 5) state.sleepHistory.pop();
    
    state.sleepStartTime = null;
  } else {
    // CURRENT STATE: Awake -> ACTION: Go to sleep!
    const awakeDurationMs = now - (state.wakeStartTime || now);
    const awakeHours = parseFloat((awakeDurationMs / (1000 * 60 * 60)).toFixed(2));

    state.isSleeping = true;
    state.sleepStartTime = now;

    // Log awake details
    state.sleepHistory.unshift({
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      type: 'Awake Record',
      wakeTime: new Date(state.wakeStartTime || now).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      sleepTime: new Date(now).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      awakeHours: awakeHours
    });

    if (state.sleepHistory.length > 5) state.sleepHistory.pop();
    state.wakeStartTime = null;
  }

  saveState();
  renderSleepUI();
  updateProgressHistory(); // Update progress analytics as habit shifts
}

function updateSleepWakeCounter() {
  const clockNode = document.getElementById("sleep-duration-clock");
  if (!clockNode) return;

  const now = Date.now();
  let deltaMs = 0;

  if (state.isSleeping) {
    // Sleeping timer: count elapsed hours since going to sleep
    const startTime = state.sleepStartTime || now;
    deltaMs = now - startTime;
  } else {
    // Awake timer: count hours awake since waking up
    const startTime = state.wakeStartTime || now;
    deltaMs = now - startTime;
  }

  // Format nicely as HH:MM:SS
  const totalSeconds = Math.floor(deltaMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num) => String(num).padStart(2, '0');
  clockNode.textContent = `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
}

function renderSleepUI() {
  const container = document.getElementById("sleep-visual-container");
  const statusBadge = document.getElementById("sleep-status-badge");
  const icon = document.getElementById("sleep-status-icon");
  const timerTitle = document.getElementById("sleep-timer-title");
  const btnText = document.getElementById("sleep-btn-text");
  const toggleBtn = document.getElementById("sleep-toggle-btn");
  const listContainer = document.getElementById("sleep-history-list");

  if (!container || !statusBadge || !icon || !timerTitle || !btnText || !toggleBtn || !listContainer) return;

  if (state.isSleeping) {
    // Mode: SLEEPING
    statusBadge.textContent = "Sleeping 🌙";
    statusBadge.className = "px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400";
    
    // Change icon to moon
    icon.setAttribute("data-lucide", "moon");
    container.className = "w-20 h-20 rounded-full flex items-center justify-center border-4 border-dashed border-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 dark:border-indigo-600/40 mb-4 animate-[spin_120s_linear_infinite]";
    
    timerTitle.textContent = "Time Asleep";
    btnText.textContent = "I'm Awake! ☀️";
    
    // Style toggle button differently for sleep
    toggleBtn.className = "w-full bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-medium shadow-md transition-all cursor-pointer";
  } else {
    // Mode: AWAKE
    statusBadge.textContent = "Awake ☀️";
    statusBadge.className = "px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400";
    
    // Change icon to sun
    icon.setAttribute("data-lucide", "sun");
    container.className = "w-20 h-20 rounded-full flex items-center justify-center border-4 border-dashed border-accent-light bg-accent-light/10 dark:bg-accent-dark/5 dark:border-accent-primary/40 mb-4 animate-[spin_60s_linear_infinite]";
    
    timerTitle.textContent = "Time Awake Today";
    btnText.textContent = "Go to Sleep 🌙";
    
    // Restore normal color state
    toggleBtn.className = "w-full bg-accent-primary hover:bg-accent-hover text-white py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-medium shadow-md shadow-accent-primary/20 hover:shadow-lg dark:shadow-none transition-all cursor-pointer";
  }

  // Render sleep/wake history list
  if (state.sleepHistory.length === 0) {
    listContainer.innerHTML = `<li class="text-xs text-slate-400 dark:text-slate-500 italic text-center py-2">No logging history recorded yet.</li>`;
  } else {
    listContainer.innerHTML = state.sleepHistory.map(log => {
      const isSleep = log.type === 'Sleep Cycle';
      const durationStr = isSleep ? `${log.sleptHours}h slept` : `${log.awakeHours}h awake`;
      const iconLogo = isSleep ? 'moon' : 'sun';
      const highlightBg = isSleep ? 'bg-indigo-500/10 text-indigo-500' : 'bg-amber-500/10 text-amber-500';

      return `
        <li class="flex items-center justify-between text-[11px] p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors">
          <div class="flex items-center gap-2">
            <span class="w-5 h-5 flex items-center justify-center rounded-md ${highlightBg}">
              <i data-lucide="${iconLogo}" class="w-3 h-3"></i>
            </span>
            <span class="font-medium text-slate-700 dark:text-slate-350">${log.date}</span>
          </div>
          <div class="text-right">
            <p class="font-mono text-slate-800 dark:text-slate-200 font-bold">${durationStr}</p>
            <p class="text-[9px] text-slate-400 dark:text-slate-500">${log.sleepTime} - ${log.wakeTime}</p>
          </div>
        </li>
      `;
    }).join("");
  }

  updateIcons();
}

function clearSleepHistory() {
  state.sleepHistory = [];
  saveState();
  renderSleepUI();
}

// --- FOCUS ROOM (POMODORO TIMER) ---
let focusSecondsLeft = 1500; // 25m
let focusTotalSeconds = 1500;
let focusIsRunning = false;
let focusInterval = null;
let focusPreset = 25;
let focusPhase = "work"; // "work" vs "break"

function setFocusPreset(minutes) {
  if (focusIsRunning) {
    const cancel = confirm("Active session in progress. Abandon focus?");
    if (!cancel) return;
    clearInterval(focusInterval);
    focusIsRunning = false;
  }

  focusPreset = minutes;
  focusPhase = minutes === 25 ? "work" : "break";
  focusSecondsLeft = minutes * 60;
  focusTotalSeconds = minutes * 60;

  // Sync controls UI
  document.querySelectorAll("[id^='preset-']").forEach(btn => {
    btn.className = "text-[10px] px-2 py-1 font-mono rounded cursor-pointer transition-all hover:bg-white dark:hover:bg-slate-700";
  });
  const activeBtn = document.getElementById(`preset-${minutes}`);
  if (activeBtn) activeBtn.className = "text-[10px] px-2 py-1 font-mono rounded bg-white dark:bg-slate-700 shadow-sm font-semibold cursor-pointer text-accent-primary dark:text-accent-light";

  updateFocusUI();
}

function toggleFocusTimer() {
  const btn = document.getElementById("focus-play-btn");
  const playIcon = document.getElementById("focus-play-icon");
  const playText = document.getElementById("focus-play-text");

  if (focusIsRunning) {
    // Pause
    clearInterval(focusInterval);
    focusIsRunning = false;
    playText.textContent = "Resume Focus";
    playIcon.setAttribute("data-lucide", "play");
  } else {
    // Start
    focusIsRunning = true;
    playText.textContent = "Pause Space";
    playIcon.setAttribute("data-lucide", "pause");

    focusInterval = setInterval(() => {
      focusSecondsLeft--;
      if (focusSecondsLeft <= 0) {
        clearInterval(focusInterval);
        focusIsRunning = false;
        triggerFocusFinishedBell();
        
        // Auto alternate cycles
        if (focusPhase === "work") {
          alert("Focus session complete! Great work. Take a break.");
          setFocusPreset(5);
        } else {
          alert("Break finished! Time to focus.");
          setFocusPreset(25);
        }
      }
      updateFocusUI();
    }, 1000);
  }

  updateIcons();
}

function resetFocusTimer() {
  clearInterval(focusInterval);
  focusIsRunning = false;
  focusSecondsLeft = focusPreset * 60;
  
  const playIcon = document.getElementById("focus-play-icon");
  const playText = document.getElementById("focus-play-text");
  if (playText && playIcon) {
    playText.textContent = "Start Focus";
    playIcon.setAttribute("data-lucide", "play");
  }
  
  updateFocusUI();
  updateIcons();
}

function updateFocusUI() {
  const timerTextNode = document.getElementById("focus-timer-text");
  const phaseNode = document.getElementById("focus-phase-label");
  const progressCircle = document.getElementById("focus-progress-circle");

  if (!timerTextNode || !phaseNode || !progressCircle) return;

  // Format seconds to mm:ss
  const m = Math.floor(focusSecondsLeft / 60);
  const s = focusSecondsLeft % 60;
  const pad = (num) => String(num).padStart(2, '0');
  timerTextNode.textContent = `${pad(m)}:${pad(s)}`;

  phaseNode.textContent = focusPhase;
  phaseNode.className = focusPhase === "work" 
    ? "text-[9px] font-mono uppercase tracking-widest text-[#64748b] dark:text-slate-400"
    : "text-[9px] font-mono uppercase tracking-widest text-emerald-500 dark:text-emerald-400 font-bold";

  // Circle dynamic stroke displacement
  const perimeter = 2 * Math.PI * 54; // r=54 -> 339.29
  const ratio = focusSecondsLeft / focusTotalSeconds;
  const dashoffset = perimeter - (ratio * perimeter);
  progressCircle.setAttribute("stroke-dashoffset", dashoffset);
}

// Solid Browser Web Audio API Zen Synthesizer (Works 100% locally and offline!)
function triggerFocusFinishedBell() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Synthesize warm resonant chime
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // High resonant C note
    
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // Resonant E note (makes a lovely major third interval)

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5); // long decay

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start();
    osc2.start();
    
    osc1.stop(ctx.currentTime + 2.6);
    osc2.stop(ctx.currentTime + 2.6);
  } catch (error) {
    console.warn("Web Audio chime could not synthesize: ", error);
  }
}

function testBeepSound() {
  triggerFocusFinishedBell();
}

// --- DUAL COLUMN TASKS LOGIC ---
function handleAddTask(e) {
  e.preventDefault();
  const input = document.getElementById("task-input");
  const prioritySelect = document.getElementById("task-priority");

  if (!input || !input.value.trim()) return;

  const newTask = {
    id: Date.now(),
    text: input.value.trim(),
    priority: parseInt(prioritySelect.value),
    completed: false,
    createdDate: new Date().toISOString().substring(0, 10)
  };

  state.tasks.unshift(newTask);
  input.value = "";
  
  saveState();
  renderTasks();
  updateProgressHistory();
}

function toggleTask(id) {
  state.tasks = state.tasks.map(t => {
    if (t.id === id) {
      return { ...t, completed: !t.completed };
    }
    return t;
  });

  saveState();
  renderTasks();
  updateProgressHistory();
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  saveState();
  renderTasks();
  updateProgressHistory();
}

function renderTasks() {
  const activeList = document.getElementById("active-tasks-list");
  const doneList = document.getElementById("done-tasks-list");
  const statsLabel = document.getElementById("task-completion-stats");

  if (!activeList || !doneList || !statsLabel) return;

  const actives = state.tasks.filter(t => !t.completed);
  const completed = state.tasks.filter(t => t.completed);

  // Render stats bubble
  statsLabel.textContent = `${completed.length}/${state.tasks.length} Completed`;

  // Render Underway items
  if (actives.length === 0) {
    activeList.innerHTML = `<li class="text-xs text-slate-400 dark:text-slate-500 italic text-center py-6">All set! No unfinished tasks.</li>`;
  } else {
    activeList.innerHTML = actives.map(t => {
      let priorityText = "Med";
      let priorityColor = "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400";
      if (t.priority === 3) {
        priorityText = "High";
        priorityColor = "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400";
      } else if (t.priority === 1) {
        priorityText = "Low";
        priorityColor = "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400";
      }

      return `
        <li class="task-item flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/60 dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-150 dark:border-slate-800 rounded-xl transition-all shadow-sm">
          <div class="flex items-center gap-2.5 flex-1 select-none cursor-pointer" onclick="toggleTask(${t.id})">
            <span class="w-5 h-5 rounded-md border border-slate-350 dark:border-slate-650 flex items-center justify-center hover:bg-accent-light/30 transition-colors">
              <i data-lucide="square" class="w-3.5 h-3.5 text-slate-400 opacity-60"></i>
            </span>
            <span class="text-xs text-slate-705 dark:text-slate-200 font-medium break-all truncate max-w-[150px] sm:max-w-xs">${t.text}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded border ${priorityColor}">${priorityText}</span>
            <button onclick="deleteTask(${t.id})" class="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/25 p-1 rounded-lg transition-colors cursor-pointer" title="Delete Task">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </li>
      `;
    }).join("");
  }

  // Render Accomplished items
  if (completed.length === 0) {
    doneList.innerHTML = `<li class="text-xs text-slate-400 dark:text-slate-500 italic text-center py-4">Completed items will group here.</li>`;
  } else {
    doneList.innerHTML = completed.map(t => {
      return `
        <li class="task-item flex items-center justify-between p-2 bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-955/20 rounded-xl transition-all shadow-sm">
          <div class="flex items-center gap-2.5 flex-1 select-none cursor-pointer" onclick="toggleTask(${t.id})">
            <span class="w-5 h-5 rounded-md bg-accent-primary flex items-center justify-center text-white scale-105 transition-all">
              <i data-lucide="check" class="w-3.5 h-3.5"></i>
            </span>
            <span class="text-xs strike-through text-slate-400 dark:text-slate-400 line-through truncate max-w-[170px] sm:max-w-xs">${t.text}</span>
          </div>
          <button onclick="deleteTask(${t.id})" class="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg transition-colors cursor-pointer" title="Delete Permanent">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </li>
      `;
    }).join("");
  }

  updateIcons();
}

// --- THINGS NOT TO DO TODAY (VICE AVOIDANCE LOGIC) ---
function handleAddVice(e) {
  e.preventDefault();
  const input = document.getElementById("vice-input");

  if (!input || !input.value.trim()) return;

  const newVice = {
    id: Date.now(),
    text: input.value.trim(),
    tripped: false, // Tripped means they DID the thing they shouldn't do. false = successful avoidance!
    createdDate: new Date().toISOString().substring(0, 10)
  };

  state.vices.unshift(newVice);
  input.value = "";

  saveState();
  renderVices();
  updateProgressHistory();
}

function toggleViceTripped(id) {
  state.vices = state.vices.map(v => {
    if (v.id === id) {
      return { ...v, tripped: !v.tripped };
    }
    return v;
  });

  saveState();
  renderVices();
  updateProgressHistory();
}

function deleteVice(id) {
  state.vices = state.vices.filter(v => v.id !== id);
  saveState();
  renderVices();
  updateProgressHistory();
}

function renderVices() {
  const activeList = document.getElementById("active-vices-list");
  const trippedList = document.getElementById("tripped-vices-list");
  const statsLabel = document.getElementById("vice-completion-stats");

  if (!activeList || !trippedList || !statsLabel) return;

  const activeVices = state.vices.filter(v => !v.tripped);
  const trippedVices = state.vices.filter(v => v.tripped);

  // Stats: avoided / total
  statsLabel.textContent = `${activeVices.length}/${state.vices.length} Avoided`;

  // Render Active / Avoided vices
  if (activeVices.length === 0) {
    activeList.innerHTML = `<li class="text-xs text-slate-400 dark:text-slate-500 italic text-center py-6">Add bad habits to avoid today!</li>`;
  } else {
    activeList.innerHTML = activeVices.map(v => {
      return `
        <li class="task-item flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/60 dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-150 dark:border-slate-800 rounded-xl transition-all shadow-sm">
          <div class="flex items-center gap-2.5 flex-1 select-none cursor-pointer" onclick="toggleViceTripped(${v.id})">
            <span class="w-5 h-5 rounded-md border-2 border-emerald-500/60 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner">
              <i data-lucide="shield" class="w-3.5 h-3.5"></i>
            </span>
            <div class="flex flex-col">
              <span class="text-xs text-slate-700 dark:text-slate-200 font-medium break-all text-ellipsis max-w-[150px] sm:max-w-xs">${v.text}</span>
              <span class="text-[9px] text-emerald-550 dark:text-emerald-400 font-mono tracking-tight uppercase">Successfully Avoided</span>
            </div>
          </div>
          <button onclick="deleteVice(${v.id})" class="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/25 p-1 rounded-lg transition-colors cursor-pointer" title="Delete Item">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </li>
      `;
    }).join("");
  }

  // Render Tripped (Broken) avoidances
  if (trippedVices.length === 0) {
    trippedList.innerHTML = `<li class="text-xs text-slate-400 dark:text-slate-500 italic text-center py-4">No avoidances tripped. Amazing control!</li>`;
  } else {
    trippedList.innerHTML = trippedVices.map(v => {
      return `
        <li class="task-item flex items-center justify-between p-2 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 rounded-xl transition-all">
          <div class="flex items-center gap-2.5 flex-1 select-none cursor-pointer" onclick="toggleViceTripped(${v.id})">
            <span class="w-5 h-5 rounded-md bg-rose-500 flex items-center justify-center text-white scale-105 transition-all">
              <i data-lucide="shield-off" class="w-3.5 h-3.5"></i>
            </span>
            <div class="flex flex-col">
              <span class="text-xs strike-through text-slate-400 dark:text-slate-500 line-through truncate max-w-[170px]">${v.text}</span>
              <span class="text-[9px] text-rose-500 dark:text-rose-400 font-semibold uppercase tracking-wider">Avoidance Broken</span>
            </div>
          </div>
          <button onclick="deleteVice(${v.id})" class="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-colors cursor-pointer">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </li>
      `;
    }).join("");
  }

  updateIcons();
}

// --- ASSIGNED BIG GOALS & STREAKS LOGIC ---
function handleNewGoal(e) {
  e.preventDefault();
  const nameInput = document.getElementById("goal-input");
  const targetInput = document.getElementById("goal-target");

  if (!nameInput || !nameInput.value.trim() || !targetInput) return;

  const newGoal = {
    id: Date.now(),
    name: nameInput.value.trim(),
    target: parseInt(targetInput.value) || 30,
    progress: 0,
    createdDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  };

  state.goals.unshift(newGoal);
  nameInput.value = "";
  targetInput.value = "";

  saveState();
  renderGoals();
}

function incrementGoal(id) {
  state.goals = state.goals.map(g => {
    if (g.id === id) {
      const nextProgress = Math.min(g.progress + 1, g.target);
      return { ...g, progress: nextProgress };
    }
    return g;
  });

  saveState();
  renderGoals();
}

function decrementGoal(id) {
  state.goals = state.goals.map(g => {
    if (g.id === id) {
      const nextProgress = Math.max(g.progress - 1, 0);
      return { ...g, progress: nextProgress };
    }
    return g;
  });

  saveState();
  renderGoals();
}

function deleteGoal(id) {
  state.goals = state.goals.filter(g => g.id !== id);
  saveState();
  renderGoals();
}

function renderGoals() {
  const container = document.getElementById("goals-list");
  if (!container) return;

  if (state.goals.length === 0) {
    container.innerHTML = `
      <div class="col-span-2 text-xs text-slate-400 dark:text-slate-500 italic text-center py-6">
        Create your first major long-term milestone above to track streaks and targets.
      </div>
    `;
    return;
  }

  container.innerHTML = state.goals.map(g => {
    const ratio = g.target > 0 ? (g.progress / g.target) : 0;
    const pct = Math.round(ratio * 100);
    const completed = g.progress >= g.target;

    return `
      <div class="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-150 dark:border-slate-800/80 hover:border-accent-light dark:hover:border-accent-dark/40 transition-all flex flex-col justify-between relative overflow-hidden">
        
        <!-- Quick Goal Data Header -->
        <div>
          <div class="flex items-start justify-between gap-1.5 mb-1.5">
            <h4 class="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide leading-tight break-words pr-4">${g.name}</h4>
            <button onclick="deleteGoal(${g.id})" class="text-slate-450 hover:text-rose-500 p-0.5 rounded transition-colors absolute top-2.5 right-2.5 cursor-pointer">
              <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
          </div>
          
          <div class="flex items-center justify-between text-[10px] font-mono mb-2 text-slate-450 dark:text-slate-400">
            <span>Progress: <strong>${g.progress}</strong> / ${g.target}</span>
            <span class="${completed ? 'text-emerald-500 font-bold' : ''}">${pct}%</span>
          </div>

          <!-- Progress bar -->
          <div class="w-full h-1.5 bg-slate-200 dark:bg-slate-700/60 rounded-full overflow-hidden mb-3.5">
            <div class="h-full bg-accent-primary transition-all duration-500 rounded-full" style="width: ${pct}%"></div>
          </div>
        </div>

        <!-- Increment controls -->
        <div class="flex items-center justify-between mt-auto">
          <span class="text-[9px] text-slate-400 dark:text-slate-500 font-mono">Added: ${g.createdDate}</span>
          <div class="flex items-center gap-1">
            <button onclick="decrementGoal(${g.id})" class="h-6 w-6 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200/50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs cursor-pointer select-none">
              -
            </button>
            <button onclick="incrementGoal(${g.id})" class="h-6 w-6 rounded-lg bg-accent-primary text-white hover:bg-accent-hover flex items-center justify-center font-bold text-xs cursor-pointer select-none shadow-sm shadow-accent-primary/20">
              +
            </button>
          </div>
        </div>

      </div>
    `;
  }).join("");

  updateIcons();
}

// --- DYNAMIC GRAPH COMPILER (SVG INTEGRATION) ---
// Save current day score performance to the 7-day history database.
function updateProgressHistory() {
  const todayStr = new Date().toISOString().substring(0, 10);
  
  // Calculate completed actions
  const totalTasks = state.tasks.length;
  const completedTasks = state.tasks.filter(t => t.completed).length;

  const totalVices = state.vices.length;
  const trippedVices = state.vices.filter(v => v.tripped).length;

  const todayIndex = state.history.findIndex(h => h.date === todayStr);

  const dayData = {
    date: todayStr,
    completed: completedTasks,
    tripped: trippedVices,
    totalTasks: totalTasks,
    totalVices: totalVices
  };

  if (todayIndex >= 0) {
    state.history[todayIndex] = dayData;
  } else {
    state.history.push(dayData);
    // Keep last 7 logs inside array
    if (state.history.length > 7) state.history.shift();
  }

  saveState();
  renderProgressChart();
}

// Draw fully custom, responsive, reactive SVG bar chart (100% Client-Side / Offline)
function renderProgressChart() {
  const chartSvg = document.getElementById("progress-svg-chart");
  if (!chartSvg) return;

  // Compute actual date arrays for last 7 weekdays starting from 6 days ago up to today
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().substring(0, 10);
    const label = d.toLocaleDateString('en-US', { weekday: 'short' });
    last7Days.push({ dateStr, label });
  }

  // Map history to our target dates list
  const chartData = last7Days.map(day => {
    const match = state.history.find(h => h.date === day.dateStr);
    if (match) {
      return {
        label: day.label,
        completed: match.completed,
        tripped: match.tripped,
        total: match.totalTasks
      };
    } else {
      // Empty fields placeholder
      return { label: day.label, completed: 0, tripped: 0, total: 0 };
    }
  });

  // SVG Chart Setup Settings (width = 600, height = 300)
  const svgWidth = 600;
  const svgHeight = 300;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 40;

  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  // Grid line levels (0%, 25%, 50%, 75%, 100% of standard max bar capacity: e.g. 10 items)
  // Let's dynamically find standard max capacity scale
  const maxCap = Math.max(
    ...chartData.map(d => d.completed + d.tripped), 
    6 // minimum grid scale of 6 items to avoid flat layout when empty
  );

  let gridLines = "";
  for (let idx = 0; idx <= 4; idx++) {
    const value = Math.round((maxCap / 4) * idx);
    const yPos = paddingTop + plotHeight - (plotHeight * (idx / 4));
    
    gridLines += `
      <!-- Grid lane ${idx} -->
      <line x1="${paddingLeft}" y1="${yPos}" x2="${svgWidth - paddingRight}" y2="${yPos}" stroke="currentColor" class="opacity-10 dark:opacity-20" stroke-width="1" stroke-dasharray="4,4" />
      <text x="${paddingLeft - 10}" y="${yPos + 4}" text-anchor="end" class="fill-slate-400 dark:fill-slate-500 font-mono" style="font-size: 10px">${value}</text>
    `;
  }

  // Draw chart columns
  const columnCount = 7;
  const colWidth = plotWidth / columnCount;
  
  let chartBars = "";

  chartData.forEach((day, index) => {
    const centerX = paddingLeft + (index * colWidth) + (colWidth / 2);
    const barWidth = Math.min(42, colWidth * 0.7);

    // Calc height indicators
    const completedHeight = (day.completed / maxCap) * plotHeight;
    const trippedHeight = (day.tripped / maxCap) * plotHeight;

    const baseLineY = paddingTop + plotHeight;

    // Completed tasks bar coordinates (Greenish/Accent)
    const yCompleted = baseLineY - completedHeight;
    
    // Tripped / broken avoidances bar stacked on top (Redish color)
    const yTripped = yCompleted - trippedHeight;

    // Background placeholder guide bar (subtle grey trace to make it clickable and visible)
    const traceHeight = plotHeight;
    const traceY = paddingTop;

    // Accumulating tooltips or stats
    const totalCountText = `Solved: ${day.completed} | Slipped: ${day.tripped}`;

    chartBars += `
      <g class="group/bar transition-all" cursor="pointer">
        <!-- Interactive Invisible full Column hover target -->
        <rect x="${centerX - barWidth/2}" y="${traceY}" width="${barWidth}" height="${traceHeight}" fill="currentColor" class="opacity-0 hover:opacity-[0.03] dark:hover:opacity-[0.05] transition-opacity rounded-t-lg" rx="6" />
        
        <!-- Thin gray bar outline so the chart stands out and isn't unresponsive when empty -->
        <rect x="${centerX - barWidth/2}" y="${traceY}" width="${barWidth}" height="${traceHeight}" fill="none" stroke="currentColor" class="opacity-5 dark:opacity-10" rx="6" stroke-dasharray="2,2" />

        <!-- Completed Tasks Segment (Accent Primary color) -->
        ${day.completed > 0 ? `
          <rect x="${centerX - barWidth/2}" y="${yCompleted}" width="${barWidth}" height="${completedHeight}" fill="var(--accent-primary)" class="transition-all duration-700 ease-out hover:brightness-105" rx="4" />
        ` : ''}

        <!-- Tripped (Broken Avoidance) Segment (Red-500 stacked on top) -->
        ${day.tripped > 0 ? `
          <rect x="${centerX - barWidth/2}" y="${yTripped}" width="${barWidth}" height="${trippedHeight}" fill="#ef4444" class="transition-all duration-700 ease-out hover:brightness-105" rx="4" />
        ` : ''}

        <!-- Label at bottom of columns -->
        <text x="${centerX}" y="${baseLineY + 22}" text-anchor="middle" class="fill-slate-600 dark:fill-slate-400 font-sans font-medium" style="font-size: 11px">${day.label}</text>
        
        <!-- Data Tooltip details on hover -->
        <g class="opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200 pointer-events-none">
          <rect x="${centerX - 65}" y="${Math.min(yTripped - 38, 200)}" width="130" height="28" fill="#1e293b" class="shadow-md" rx="6" />
          <text x="${centerX}" y="${Math.min(yTripped - 20, 218)}" text-anchor="middle" fill="#f8fafc" class="font-sans font-bold" style="font-size: 10px">${totalCountText}</text>
        </g>
      </g>
    `;
  });

  // Assemble full modular SVG DOM string
  chartSvg.innerHTML = `
    <!-- SVG Axes Base Line -->
    <line x1="${paddingLeft}" y1="${paddingTop + plotHeight}" x2="${svgWidth - paddingRight}" y2="${paddingTop + plotHeight}" stroke="currentColor" class="opacity-25" stroke-width="1.5" />
    
    <!-- Render Grid lanes -->
    ${gridLines}

    <!-- Render Dynamic Bars -->
    ${chartBars}
  `;
}

// Prepopulate 7 days of nice simulated progress histories to showcase chart's beauty!
function simulateProgressData() {
  const cleanHistory = [];
  const startDay = new Date();

  // Create simulated indices
  for (let idx = 6; idx >= 0; idx--) {
    const curDate = new Date();
    curDate.setDate(startDay.getDate() - idx);
    const dateStr = curDate.toISOString().substring(0, 10);

    // Pick random completed rates for tasks (e.g. 2 to 5) and tripped vices (0 to 2)
    const randomCompleted = Math.floor(Math.random() * 4) + 1; // 1-4 completed
    const randomTripped = Math.floor(Math.random() * 2); // 0-1 tripped

    cleanHistory.push({
      date: dateStr,
      completed: randomCompleted,
      tripped: randomTripped,
      totalTasks: randomCompleted + 2,
      totalVices: randomTripped + 1
    });
  }

  state.history = cleanHistory;
  saveState();
  renderProgressChart();
  alert("Prepopulated nice historical mock trends! Look at the comparison bars updated below. Clicking 'Reset' returns graph to empty state.");
}

function clearAnalyticsData() {
  state.history = [];
  saveState();
  renderProgressChart();
}

// --- MODULE ESM EXPORTS BINDING TO WINDOW OBJECT (REQUIRED FOR HTML INLINE EVENTS) ---
window.toggleDarkMode = toggleDarkMode;
window.setPalette = setPalette;
window.loadNewQuote = loadNewQuote;
window.toggleSleepState = toggleSleepState;
window.clearSleepHistory = clearSleepHistory;
window.setFocusPreset = setFocusPreset;
window.toggleFocusTimer = toggleFocusTimer;
window.resetFocusTimer = resetFocusTimer;
window.testBeepSound = testBeepSound;
window.handleAddTask = handleAddTask;
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.handleAddVice = handleAddVice;
window.toggleViceTripped = toggleViceTripped;
window.deleteVice = deleteVice;
window.handleNewGoal = handleNewGoal;
window.incrementGoal = incrementGoal;
window.decrementGoal = decrementGoal;
window.deleteGoal = deleteGoal;
window.simulateProgressData = simulateProgressData;
window.clearAnalyticsData = clearAnalyticsData;
