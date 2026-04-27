/* ===================== ELEMENTS ===================== */
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

/* ===================== TIMER STATE ===================== */
let totalSeconds = 1500;
let remaining = totalSeconds;
let running = false;
let interval = null;

/* ===================== HELPERS ===================== */
function format(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function updateUI() {
  timerText.textContent = format(remaining);
  miniTimerText.textContent = format(remaining);

  const circumference = 659.73;
  const offset = circumference * (1 - remaining / totalSeconds);
  progress.style.strokeDashoffset = offset;

  localStorage.setItem("pipTime", format(remaining));
}

/* ===================== TIMER ===================== */
function start() {
  if (running) return;
  running = true;
  startPauseBtn.textContent = "Ⅱ";

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
  startPauseBtn.textContent = "▷";
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
  alarm.play().catch(() => {});
  saveSession();
}

/* ===================== BUTTON EVENTS ===================== */
startPauseBtn.onclick = () => running ? pause() : start();
resetBtn.onclick = reset;
skipBtn.onclick = finish;

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

stopAlarmBtn.onclick = () => {
  alarm.pause();
  alarm.currentTime = 0;
};

/* ===================== MINI CONTROLS ===================== */
miniPlayBtn.onclick = () => running ? pause() : start();
miniMinusBtn.onclick = () => minusBtn.onclick();
miniPlusBtn.onclick = () => plusBtn.onclick();
miniStopAlarmBtn.onclick = () => stopAlarmBtn.onclick();

/* ===================== NAV FIX ===================== */
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));

    const target = document.getElementById(btn.dataset.view + "View");
    if (target) target.classList.add("active");
  });
});

/* ===================== CALENDAR ===================== */
let sessions = JSON.parse(localStorage.getItem("focusSessions")) || [];
let selectedDay = new Date().getDate();

function renderCalendar() {
  calendarGrid.innerHTML = "";

  for (let i = 1; i <= 30; i++) {
    const day = document.createElement("div");
    day.className = "day";
    day.textContent = i;

    if (i === selectedDay) day.classList.add("selected");
    if (sessions.some(s => s.day === i)) day.classList.add("has-session");

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

  const list = sessions.filter(s => s.day === selectedDay);

  if (list.length === 0) {
    sessionList.innerHTML = `<p style="color:#9aa0b6;">No sessions</p>`;
    return;
  }

  list.forEach(s => {
    const el = document.createElement("div");
    el.className = "session-item";
    el.innerHTML = `<strong>${s.task}</strong><small>${s.minutes} min</small>`;
    sessionList.appendChild(el);
  });
}

/* ===================== SAVE SESSION ===================== */
function saveSession() {
  if (!focusInput.value.trim()) return;

  sessions.push({
    task: focusInput.value,
    minutes: totalSeconds / 60,
    day: selectedDay
  });

  localStorage.setItem("focusSessions", JSON.stringify(sessions));

  focusInput.value = "";
  renderCalendar();
  renderSessions();
}

saveFocusBtn.onclick = saveSession;

/* ===================== QUOTES ===================== */
const quotes = [
  ["We suffer more in imagination than reality","Seneca"],
  ["The unexamined life is not worth living","Socrates"],
  ["Happiness depends upon ourselves","Aristotle"],
  ["He who has a why can bear almost any how","Nietzsche"]
];

function rotateQuote() {
  const q = quotes[Math.floor(Math.random() * quotes.length)];
  document.getElementById("quote").textContent = `"${q[0]}" — ${q[1]}`;
}

setInterval(rotateQuote, 8000);

/* ===================== MINIPLAYER ===================== */
pipBtn.onclick = () => {
  const win = window.open("", "mini", "width=260,height=260");

  win.document.write(`
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

window.addEventListener("message", (e) => {
  if (e.data === "toggle") running ? pause() : start();
  if (e.data === "minus") minusBtn.onclick();
  if (e.data === "plus") plusBtn.onclick();
  if (e.data === "alarm") stopAlarmBtn.onclick();
});

/* ===================== INIT ===================== */
updateUI();
renderCalendar();
renderSessions();
rotateQuote();
