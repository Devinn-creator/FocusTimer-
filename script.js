const timerText = document.getElementById("timerText");
const miniTimerText = document.getElementById("miniTimerText");
const progress = document.querySelector(".progress");
const miniProgress = document.querySelector(".mini-progress");

const startPauseBtn = document.getElementById("startPauseBtn");
const skipBtn = document.getElementById("skipBtn");
const resetBtn = document.getElementById("resetBtn");
const settingsBtn = document.getElementById("settingsBtn");
const stopAlarmBtn = document.getElementById("stopAlarmBtn");

const minusBtn = document.getElementById("minusBtn");
const plusBtn = document.getElementById("plusBtn");
const manualMinutes = document.getElementById("manualMinutes");
const setManualBtn = document.getElementById("setManualBtn");

const miniPlayBtn = document.getElementById("miniPlayBtn");
const miniSkipBtn = document.getElementById("miniSkipBtn");
const miniMinusBtn = document.getElementById("miniMinusBtn");
const miniPlusBtn = document.getElementById("miniPlusBtn");
const miniStopAlarmBtn = document.getElementById("miniStopAlarmBtn");

const pipBtn = document.getElementById("pipBtn");
const focusInput = document.getElementById("focusInput");
const calendarGrid = document.getElementById("calendarGrid");
const monthLabel = document.getElementById("monthLabel");
const sessionList = document.getElementById("sessionList");
const calendarSessionList = document.getElementById("calendarSessionList");
const alarmSound = document.getElementById("alarmSound");

const totalSessionsEl = document.getElementById("totalSessions");
const totalMinutesEl = document.getElementById("totalMinutes");
const todayMinutesEl = document.getElementById("todayMinutes");

let totalSeconds = 25 * 60;
let remainingSeconds = totalSeconds;
let startingSeconds = totalSeconds;
let timerInterval = null;
let isRunning = false;

let today = new Date();
let visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

let sessions = JSON.parse(localStorage.getItem("focusTimerSessions")) || [];

function dateKey(date) {
  return date.toISOString().split("T")[0];
}

function formatTime(seconds) {
  const min = Math.floor(seconds / 60).toString().padStart(2, "0");
  const sec = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
}

function saveSessions() {
  localStorage.setItem("focusTimerSessions", JSON.stringify(sessions));
}

function updateTimerUI() {
  timerText.textContent = formatTime(remainingSeconds);
  miniTimerText.textContent = formatTime(remainingSeconds);

  const circumference = 659.73;
  const percentLeft = remainingSeconds / totalSeconds;

  progress.style.strokeDasharray = circumference;
  progress.style.strokeDashoffset = circumference * (1 - percentLeft);

  miniProgress.style.strokeDasharray = circumference;
  miniProgress.style.strokeDashoffset = circumference * (1 - percentLeft);

  localStorage.setItem("focusTimerTime", formatTime(remainingSeconds));
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  startingSeconds = remainingSeconds;
  startPauseBtn.textContent = "Ⅱ";
  miniPlayBtn.textContent = "Ⅱ";

  timerInterval = setInterval(() => {
    remainingSeconds--;

    if (remainingSeconds <= 0) {
      finishTimer();
      return;
    }

    updateTimerUI();
  }, 1000);
}

function pauseTimer() {
  isRunning = false;
  clearInterval(timerInterval);
  startPauseBtn.textContent = "▷";
  miniPlayBtn.textContent = "▷";
}

function resetTimer() {
  pauseTimer();
  remainingSeconds = totalSeconds;
  startingSeconds = totalSeconds;
  updateTimerUI();
}

function stopAlarm() {
  alarmSound.pause();
  alarmSound.currentTime = 0;
}

function setTimerMinutes(minutes) {
  const safeMinutes = Math.max(1, Number(minutes));
  totalSeconds = safeMinutes * 60;
  remainingSeconds = totalSeconds;
  startingSeconds = totalSeconds;
  manualMinutes.value = safeMinutes;
  document.getElementById("settingsMinutes").value = safeMinutes;
  resetTimer();
}

function addFiveMinutes() {
  setTimerMinutes(Math.round(totalSeconds / 60) + 5);
}

function subtractFiveMinutes() {
  setTimerMinutes(Math.max(1, Math.round(totalSeconds / 60) - 5));
}

function finishTimer() {
  const usedSeconds = Math.max(1, startingSeconds - remainingSeconds);
  const usedMinutes = Math.max(1, Math.round(usedSeconds / 60));
  const task = focusInput.value.trim() || "Focus Session";

  pauseTimer();
  remainingSeconds = 0;
  updateTimerUI();

  alarmSound.currentTime = 0;
  alarmSound.play().catch(() => {});

  addSession(task, usedMinutes);
  focusInput.value = "";

  setTimeout(resetTimer, 800);
}

function addSession(task, minutes) {
  const now = new Date();

  sessions.push({
    task,
    minutes,
    date: dateKey(selectedDate),
    time: now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  });

  saveSessions();
  renderCalendar();
  renderSessions();
  renderCalendarPanel();
  updateStats();
}

startPauseBtn.onclick = () => isRunning ? pauseTimer() : startTimer();
resetBtn.onclick = resetTimer;
skipBtn.onclick = finishTimer;
stopAlarmBtn.onclick = stopAlarm;

plusBtn.onclick = addFiveMinutes;
minusBtn.onclick = subtractFiveMinutes;

setManualBtn.onclick = () => setTimerMinutes(manualMinutes.value);
manualMinutes.addEventListener("keydown", e => {
  if (e.key === "Enter") setTimerMinutes(manualMinutes.value);
});

miniPlayBtn.onclick = () => isRunning ? pauseTimer() : startTimer();
miniSkipBtn.onclick = finishTimer;
miniPlusBtn.onclick = addFiveMinutes;
miniMinusBtn.onclick = subtractFiveMinutes;
miniStopAlarmBtn.onclick = stopAlarm;

settingsBtn.onclick = () => switchView("settingsPanel");

function switchView(viewId) {
  document.querySelectorAll(".main-view").forEach(view => view.classList.remove("active"));
  document.getElementById(viewId).classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === viewId);
  });

  if (viewId === "statsPanel") updateStats();
  if (viewId === "calendarPanel") renderCalendarPanel();
}

document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.onclick = () => switchView(btn.dataset.view);
});

function renderCalendar() {
  calendarGrid.innerHTML = "";

  monthLabel.textContent = visibleMonth.toLocaleString("default", {
    month: "long",
    year: "numeric"
  });

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  for (let i = firstDay - 1; i >= 0; i--) {
    const muted = document.createElement("div");
    muted.className = "day muted";
    muted.textContent = prevMonthDays - i;
    calendarGrid.appendChild(muted);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const key = dateKey(date);

    const dayEl = document.createElement("div");
    dayEl.className = "day";
    dayEl.textContent = day;

    if (key === dateKey(selectedDate)) dayEl.classList.add("selected");
    if (sessions.some(session => session.date === key)) dayEl.classList.add("has-session");

    dayEl.onclick = () => {
      selectedDate = date;
      renderCalendar();
      renderSessions();
      renderCalendarPanel();
      updateStats();
    };

    calendarGrid.appendChild(dayEl);
  }
}

document.getElementById("prevMonth").onclick = () => {
  visibleMonth.setMonth(visibleMonth.getMonth() - 1);
  renderCalendar();
};

document.getElementById("nextMonth").onclick = () => {
  visibleMonth.setMonth(visibleMonth.getMonth() + 1);
  renderCalendar();
};

function renderSessions() {
  sessionList.innerHTML = "";
  const list = sessions.filter(session => session.date === dateKey(selectedDate));

  if (list.length === 0) {
    sessionList.innerHTML = `<p style="color:#9aa0b6;">No sessions yet.</p>`;
    return;
  }

  list.forEach(session => {
    const item = document.createElement("div");
    item.className = "session-item";
    item.innerHTML = `
      <div class="dot"></div>
      <div>
        <strong>${session.task}</strong>
        <small>${session.time}</small>
      </div>
      <div>${session.minutes} min</div>
    `;
    sessionList.appendChild(item);
  });
}

function renderCalendarPanel() {
  const list = sessions.filter(session => session.date === dateKey(selectedDate));

  if (!list.length) {
    calendarSessionList.innerHTML = `<p>No saved sessions for this date.</p>`;
    return;
  }

  calendarSessionList.innerHTML = list.map(session => `
    <div class="session-item">
      <div class="dot"></div>
      <div>
        <strong>${session.task}</strong>
        <small>${session.time}</small>
      </div>
      <div>${session.minutes} min</div>
    </div>
  `).join("");
}

document.getElementById("addSessionBtn").onclick = () => {
  const task = prompt("What is this session for?");
  if (!task) return;

  const minutes = Number(prompt("How many minutes?", "25"));
  if (!minutes || minutes <= 0) return;

  addSession(task, minutes);
};

focusInput.addEventListener("keydown", event => {
  if (event.key === "Enter" && focusInput.value.trim()) {
    addSession(focusInput.value.trim(), Math.round(totalSeconds / 60));
    focusInput.value = "";
  }
});

document.querySelectorAll(".break").forEach(button => {
  button.onclick = () => {
    document.querySelectorAll(".break").forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    setTimerMinutes(Number(button.dataset.minutes));
  };
});

function updateStats() {
  const totalSessions = sessions.length;
  const totalMinutes = sessions.reduce((sum, session) => sum + Number(session.minutes), 0);
  const todayKey = dateKey(new Date());
  const todayMinutes = sessions
    .filter(session => session.date === todayKey)
    .reduce((sum, session) => sum + Number(session.minutes), 0);

  totalSessionsEl.textContent = totalSessions;
  totalMinutesEl.textContent = totalMinutes;
  todayMinutesEl.textContent = todayMinutes;
}

const settingsMinutes = document.getElementById("settingsMinutes");

document.getElementById("settingsMinus").onclick = () => {
  settingsMinutes.value = Math.max(1, Number(settingsMinutes.value) - 5);
};

document.getElementById("settingsPlus").onclick = () => {
  settingsMinutes.value = Number(settingsMinutes.value) + 5;
};

document.getElementById("applySettingsBtn").onclick = () => {
  setTimerMinutes(settingsMinutes.value);
  switchView("timerView");
};

document.getElementById("clearSessionsBtn").onclick = () => {
  if (!confirm("Clear all saved sessions?")) return;
  sessions = [];
  saveSessions();
  renderCalendar();
  renderSessions();
  renderCalendarPanel();
  updateStats();
};

const quotes = [
  ["We suffer more often in imagination than in reality.", "Seneca"],
  ["The unexamined life is not worth living.", "Socrates"],
  ["Happiness depends upon ourselves.", "Aristotle"],
  ["He who has a why can bear almost any how.", "Friedrich Nietzsche"],
  ["Waste no more time arguing what a good man should be. Be one.", "Marcus Aurelius"]
];

function rotateQuote() {
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  document.getElementById("quote").textContent = `“${quote[0]}” — ${quote[1]}`;
}

setInterval(rotateQuote, 10000);

pipBtn.onclick = () => {
  const mini = window.open("", "FocusTimerMiniplayer", "width=390,height=460");

  mini.document.write(`
    <html>
      <head>
        <title>FocusTimer Miniplayer</title>
        <style>
          body {
            margin: 0;
            height: 100vh;
            background: radial-gradient(circle at center, rgba(74,90,190,.18), transparent 40%), #0b0f1f;
            color: #6f86ff;
            font-family: Arial, sans-serif;
            display: grid;
            place-items: center;
          }
          .ring {
            width: 260px;
            height: 260px;
            border: 28px solid #6f86ff;
            border-radius: 50%;
            display: grid;
            place-items: center;
            margin-bottom: 20px;
            box-shadow: 0 0 35px rgba(111,134,255,.6);
          }
          #time {
            font-size: 52px;
            font-weight: 900;
          }
          .controls {
            display: flex;
            gap: 10px;
            justify-content: center;
          }
          button {
            width: 58px;
            height: 42px;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,.15);
            background: rgba(255,255,255,.1);
            color: white;
            font-size: 18px;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <div>
          <div class="ring"><div id="time">25:00</div></div>
          <div class="controls">
            <button onclick="window.opener.postMessage('toggleTimer','*')">▷</button>
            <button onclick="window.opener.postMessage('minusTimer','*')">−</button>
            <button onclick="window.opener.postMessage('plusTimer','*')">+</button>
            <button onclick="window.opener.postMessage('stopAlarm','*')">🔕</button>
          </div>
        </div>
        <script>
          setInterval(() => {
            document.getElementById("time").textContent =
              localStorage.getItem("focusTimerTime") || "25:00";
          }, 250);
        <\/script>
      </body>
    </html>
  `);

  mini.document.close();
};

window.addEventListener("message", event => {
  if (event.data === "toggleTimer") isRunning ? pauseTimer() : startTimer();
  if (event.data === "minusTimer") subtractFiveMinutes();
  if (event.data === "plusTimer") addFiveMinutes();
  if (event.data === "stopAlarm") stopAlarm();
});

manualMinutes.value = 25;
switchView("timerView");
renderCalendar();
renderSessions();
renderCalendarPanel();
updateStats();
updateTimerUI();
rotateQuote();
