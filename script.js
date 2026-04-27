/* ELEMENTS */
const timerText = document.getElementById("timerText");
const miniTimerText = document.getElementById("miniTimerText");
const progress = document.querySelector(".progress");

const startPauseBtn = document.getElementById("startPauseBtn");
const skipBtn = document.getElementById("skipBtn");
const resetBtn = document.getElementById("resetBtn");
const stopAlarmBtn = document.getElementById("stopAlarmBtn");

const minusBtn = document.getElementById("minusBtn");
const plusBtn = document.getElementById("plusBtn");

const miniPlayBtn = document.getElementById("miniPlayBtn");
const miniMinusBtn = document.getElementById("miniMinusBtn");
const miniPlusBtn = document.getElementById("miniPlusBtn");
const miniStopAlarmBtn = document.getElementById("miniStopAlarmBtn");

const pipBtn = document.getElementById("pipBtn");

const focusInput = document.getElementById("focusInput");
const saveFocusBtn = document.getElementById("saveFocusBtn");

const calendarGrid = document.getElementById("calendarGrid");
const sessionList = document.getElementById("sessionList");

const alarm = document.getElementById("alarmSound");

/* TIMER STATE */
let totalSeconds = 1500;
let remaining = totalSeconds;
let running = false;
let interval;

/* FORMAT TIME */
function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/* UPDATE UI */
function updateUI() {
  timerText.innerText = formatTime(remaining);
  miniTimerText.innerText = formatTime(remaining);

  const circumference = 660;
  const offset = circumference * (1 - remaining / totalSeconds);
  progress.style.strokeDashoffset = offset;

  localStorage.setItem("pipTime", formatTime(remaining));
}

/* TIMER CONTROLS */
function start() {
  if (running) return;
  running = true;
  startPauseBtn.innerText = "Ⅱ";

  interval = setInterval(() => {
    remaining--;
    updateUI();

    if (remaining <= 0) {
      finish();
    }
  }, 1000);
}

function pause() {
  running = false;
  startPauseBtn.innerText = "▷";
  clearInterval(interval);
}

function reset() {
  pause();
  remaining = totalSeconds;
  updateUI();
}

function finish() {
  pause();
  alarm.currentTime = 0;
  alarm.play().catch(()=>{});

  saveSession();
}

startPauseBtn.onclick = () => running ? pause() : start();
resetBtn.onclick = reset;
skipBtn.onclick = finish;

/* TIME ADJUST */
minusBtn.onclick = () => {
  totalSeconds = Math.max(300, totalSeconds - 300);
  remaining = totalSeconds;
  updateUI();
};

plusBtn.onclick = () => {
  totalSeconds += 300;
  remaining = totalSeconds;
  updateUI();
};

/* ALARM STOP */
stopAlarmBtn.onclick = () => {
  alarm.pause();
  alarm.currentTime = 0;
};

/* MINI PLAYER CONTROLS */
miniPlayBtn.onclick = () => running ? pause() : start();
miniMinusBtn.onclick = minusBtn.onclick;
miniPlusBtn.onclick = plusBtn.onclick;
miniStopAlarmBtn.onclick = stopAlarmBtn.onclick;

/* NAVIGATION */
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));

    document.getElementById(btn.dataset.view + "View").classList.add("active");
  };
});

/* CALENDAR + SESSIONS */
let sessions = JSON.parse(localStorage.getItem("sessions")) || [];
let selectedDay = new Date().getDate();

function renderCalendar() {
  calendarGrid.innerHTML = "";

  for (let i = 1; i <= 30; i++) {
    const day = document.createElement("div");
    day.className = "day";
    day.innerText = i;

    if (sessions.some(s => s.day === i)) {
      day.classList.add("has-session");
    }

    if (i === selectedDay) {
      day.classList.add("selected");
    }

    day.onclick = () => {
      selectedDay = i;
      renderCalendar();
      renderSessions();
    };

    calendarGrid.appendChild(day);
  }
}

function renderSessions() {
  sessionList.innerHTML = "";

  const today = sessions.filter(s => s.day === selectedDay);

  if (today.length === 0) {
    sessionList.innerHTML = `<p style="color:#888;">No sessions</p>`;
    return;
  }

  today.forEach(s => {
    const el = document.createElement("div");
    el.className = "session-item";
    el.innerText = `${s.task} (${s.minutes}m)`;
    sessionList.appendChild(el);
  });
}

/* SAVE SESSION */
function saveSession() {
  if (!focusInput.value) return;

  sessions.push({
    task: focusInput.value,
    minutes: totalSeconds / 60,
    day: selectedDay
  });

  localStorage.setItem("sessions", JSON.stringify(sessions));
  renderCalendar();
  renderSessions();
}

saveFocusBtn.onclick = () => {
  saveSession();
  focusInput.value = "";
};

/* STATS */
function updateStats() {
  const total = sessions.length;
  const minutes = sessions.reduce((a, s) => a + s.minutes, 0);

  document.getElementById("totalSessions").innerText = total;
  document.getElementById("totalMinutes").innerText = minutes;
}

/* QUOTES */
const quotes = [
  ["We suffer more in imagination than reality","Seneca"],
  ["The unexamined life is not worth living","Socrates"],
  ["Happiness depends upon ourselves","Aristotle"],
  ["He who has a why can bear almost any how","Nietzsche"]
];

function rotateQuote() {
  const q = quotes[Math.floor(Math.random() * quotes.length)];
  document.getElementById("quote").innerText = `"${q[0]}" — ${q[1]}`;
}

setInterval(rotateQuote, 8000);

/* MINIPLAYER WINDOW */
pipBtn.onclick = () => {
  const w = window.open("", "mini", "width=260,height=260");

  w.document.write(`
    <body style="background:#0b0f1f;color:#6f86ff;
    display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;">
      <h2 id="t">00:00</h2>

      <button onclick="window.opener.postMessage('toggle')">Play/Pause</button>
      <button onclick="window.opener.postMessage('minus')">-5</button>
      <button onclick="window.opener.postMessage('plus')">+5</button>
      <button onclick="window.opener.postMessage('alarm')">Stop Alarm</button>

      <script>
        setInterval(()=>{
          document.getElementById("t").innerText =
          localStorage.getItem("pipTime");
        },300);
      <\/script>
    </body>
  `);
};

/* RECEIVE MINIPLAYER COMMANDS */
window.addEventListener("message", (e) => {
  if (e.data === "toggle") running ? pause() : start();
  if (e.data === "minus") minusBtn.onclick();
  if (e.data === "plus") plusBtn.onclick();
  if (e.data === "alarm") stopAlarmBtn.onclick();
});

/* INIT */
updateUI();
renderCalendar();
renderSessions();
updateStats();
rotateQuote();
