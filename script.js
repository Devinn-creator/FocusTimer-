const timerText = document.getElementById("timerText");
const miniTimerText = document.getElementById("miniTimerText");
const progress = document.querySelector(".progress");
const miniProgress = document.querySelector(".mini-progress");

const startPauseBtn = document.getElementById("startPauseBtn");
const finishBtn = document.getElementById("finishBtn");
const resetBtn = document.getElementById("resetBtn");
const settingsBtn = document.getElementById("settingsBtn");
const stopAlarmBtn = document.getElementById("stopAlarmBtn");

const minusBtn = document.getElementById("minusBtn");
const plusBtn = document.getElementById("plusBtn");
const manualMinutes = document.getElementById("manualMinutes");
const setManualBtn = document.getElementById("setManualBtn");

const miniPlayBtn = document.getElementById("miniPlayBtn");
const miniFinishBtn = document.getElementById("miniFinishBtn");
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

const settingsMinutes = document.getElementById("settingsMinutes");
const settingsMinus = document.getElementById("settingsMinus");
const settingsPlus = document.getElementById("settingsPlus");
const applySettingsBtn = document.getElementById("applySettingsBtn");
const clearSessionsBtn = document.getElementById("clearSessionsBtn");

let totalSeconds = 25 * 60;
let remainingSeconds = totalSeconds;
let sessionStartedAtSeconds = totalSeconds;
let timerInterval = null;
let isRunning = false;

const today = new Date();
let visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

let sessions = JSON.parse(localStorage.getItem("focusTimerSessions")) || [];

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTimer(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, "0");
  const secs = (safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

function saveSessions() {
  localStorage.setItem("focusTimerSessions", JSON.stringify(sessions));
}

function updateTimerUI() {
  timerText.textContent = formatTimer(remainingSeconds);
  miniTimerText.textContent = formatTimer(remainingSeconds);

  const circumference = 659.73;
  const percentLeft = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const offset = circumference * (1 - percentLeft);

  progress.style.strokeDasharray = circumference;
  progress.style.strokeDashoffset = offset;

  miniProgress.style.strokeDasharray = circumference;
  miniProgress.style.strokeDashoffset = offset;

  localStorage.setItem("focusTimerTime", formatTimer(remainingSeconds));
}

function setTimerMinutes(minutes) {
  const cleanMinutes = Math.max(1, Math.round(Number(minutes) || 25));

  totalSeconds = cleanMinutes * 60;
  remainingSeconds = totalSeconds;
  sessionStartedAtSeconds = totalSeconds;

  manualMinutes.value = cleanMinutes;
  settingsMinutes.value = cleanMinutes;

  pauseTimer();
  updateTimerUI();
}

function startTimer() {
  if (isRunning) return;

  isRunning = true;
  sessionStartedAtSeconds = remainingSeconds;

  startPauseBtn.textContent = "Ⅱ";
  miniPlayBtn.textContent = "Ⅱ";

  timerInterval = setInterval(() => {
    remainingSeconds -= 1;

    if (remainingSeconds <= 0) {
      remainingSeconds = 0;
      updateTimerUI();
      finishSession(true);
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
  sessionStartedAtSeconds = totalSeconds;
  updateTimerUI();
}

function stopAlarm() {
  alarmSound.pause();
  alarmSound.currentTime = 0;
}

function addFiveMinutes() {
  setTimerMinutes(Math.round(totalSeconds / 60) + 5);
}

function subtractFiveMinutes() {
  setTimerMinutes(Math.max(1, Math.round(totalSeconds / 60) - 5));
}

function logSession(minutesUsed) {
  const task = focusInput.value.trim() || "Focus Session";
  const now = new Date();

  sessions.push({
    id: Date.now(),
    task,
    minutes: minutesUsed,
    date: getDateKey(selectedDate),
    time: now.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    })
  });

  saveSessions();
  focusInput.value = "";

  renderCalendar();
  renderSessions();
  renderCalendarPanel();
  updateStats();
}

function finishSession(playAlarm = true) {
  const usedSeconds = Math.max(1, sessionStartedAtSeconds - remainingSeconds);
  const usedMinutes = Math.max(1, Math.round(usedSeconds / 60));

  pauseTimer();

  if (playAlarm) {
    alarmSound.currentTime = 0;
    alarmSound.play().catch(() => {});
  }

  logSession(usedMinutes);

  remainingSeconds = totalSeconds;
  sessionStartedAtSeconds = totalSeconds;
  updateTimerUI();
}

startPauseBtn.addEventListener("click", () => {
  isRunning ? pauseTimer() : startTimer();
});

finishBtn.addEventListener("click", () => {
  finishSession(false);
});

resetBtn.addEventListener("click", resetTimer);
settingsBtn.addEventListener("click", () => switchView("settingsView"));
stopAlarmBtn.addEventListener("click", stopAlarm);

minusBtn.addEventListener("click", subtractFiveMinutes);
plusBtn.addEventListener("click", addFiveMinutes);

setManualBtn.addEventListener("click", () => {
  setTimerMinutes(manualMinutes.value);
});

manualMinutes.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    setTimerMinutes(manualMinutes.value);
  }
});

miniPlayBtn.addEventListener("click", () => {
  isRunning ? pauseTimer() : startTimer();
});

miniFinishBtn.addEventListener("click", () => {
  finishSession(false);
});

miniMinusBtn.addEventListener("click", subtractFiveMinutes);
miniPlusBtn.addEventListener("click", addFiveMinutes);
miniStopAlarmBtn.addEventListener("click", stopAlarm);

function switchView(viewId) {
  document.querySelectorAll(".main-view").forEach((view) => {
    view.classList.remove("active");
  });

  const target = document.getElementById(viewId);
  if (target) target.classList.add("active");

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === viewId);
  });

  if (viewId === "calendarView") renderCalendarPanel();
  if (viewId === "statsView") updateStats();
}

document.querySelectorAll(".nav-btn").forEach((button) => {
  button.addEventListener("click", () => {
    switchView(button.dataset.view);
  });
});

function renderCalendar() {
  calendarGrid.innerHTML = "";

  monthLabel.textContent = visibleMonth.toLocaleString("default", {
    month: "long",
    year: "numeric"
  });

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPreviousMonth = new Date(year, month, 0).getDate();

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const mutedDay = document.createElement("button");
    mutedDay.className = "day muted";
    mutedDay.textContent = daysInPreviousMonth - i;
    mutedDay.type = "button";
    calendarGrid.appendChild(mutedDay);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const thisDate = new Date(year, month, day);
    const key = getDateKey(thisDate);

    const dayButton = document.createElement("button");
    dayButton.className = "day";
    dayButton.type = "button";
    dayButton.textContent = day;

    if (key === getDateKey(selectedDate)) {
      dayButton.classList.add("selected");
    }

    if (sessions.some((session) => session.date === key)) {
      dayButton.classList.add("has-session");
    }

    dayButton.addEventListener("click", () => {
      selectedDate = thisDate;
      renderCalendar();
      renderSessions();
      renderCalendarPanel();
      updateStats();
    });

    calendarGrid.appendChild(dayButton);
  }

  const cellsUsed = calendarGrid.children.length;
  const remainingCells = 42 - cellsUsed;

  for (let i = 1; i <= remainingCells; i++) {
    const mutedDay = document.createElement("button");
    mutedDay.className = "day muted";
    mutedDay.type = "button";
    mutedDay.textContent = i;
    calendarGrid.appendChild(mutedDay);
  }
}

document.getElementById("prevMonth").addEventListener("click", () => {
  visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
  renderCalendar();
});

document.getElementById("nextMonth").addEventListener("click", () => {
  visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
  renderCalendar();
});

function renderSessionItem(session) {
  return `
    <div class="session-item">
      <div class="dot"></div>
      <div>
        <strong>${session.task}</strong>
        <small>${session.time}</small>
      </div>
      <div>${session.minutes} min</div>
    </div>
  `;
}

function renderSessions() {
  const selectedKey = getDateKey(selectedDate);
  const daySessions = sessions.filter((session) => session.date === selectedKey);

  if (!daySessions.length) {
    sessionList.innerHTML = `<p style="color:#9aa0b6;">No sessions yet.</p>`;
    return;
  }

  sessionList.innerHTML = daySessions.map(renderSessionItem).join("");
}

function renderCalendarPanel() {
  const selectedKey = getDateKey(selectedDate);
  const daySessions = sessions.filter((session) => session.date === selectedKey);

  if (!calendarSessionList) return;

  if (!daySessions.length) {
    calendarSessionList.innerHTML = `<p>No saved sessions for ${selectedDate.toLocaleDateString()}.</p>`;
    return;
  }

  calendarSessionList.innerHTML = daySessions.map(renderSessionItem).join("");
}

document.getElementById("addSessionBtn").addEventListener("click", () => {
  const task = prompt("What is this session for?");
  if (!task || !task.trim()) return;

  const minutes = Number(prompt("How many minutes?", "25"));
  if (!minutes || minutes <= 0) return;

  sessions.push({
    id: Date.now(),
    task: task.trim(),
    minutes: Math.round(minutes),
    date: getDateKey(selectedDate),
    time: new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    })
  });

  saveSessions();
  renderCalendar();
  renderSessions();
  renderCalendarPanel();
  updateStats();
});

focusInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && focusInput.value.trim()) {
    logSession(Math.round(totalSeconds / 60));
  }
});

document.querySelectorAll(".break").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".break").forEach((item) => {
      item.classList.remove("active");
    });

    button.classList.add("active");
    setTimerMinutes(Number(button.dataset.minutes));
  });
});

function updateStats() {
  const totalSessions = sessions.length;
  const totalMinutes = sessions.reduce((sum, session) => {
    return sum + Number(session.minutes);
  }, 0);

  const todayKey = getDateKey(new Date());
  const todayMinutes = sessions
    .filter((session) => session.date === todayKey)
    .reduce((sum, session) => sum + Number(session.minutes), 0);

  totalSessionsEl.textContent = totalSessions;
  totalMinutesEl.textContent = totalMinutes;
  todayMinutesEl.textContent = todayMinutes;
}

settingsMinus.addEventListener("click", () => {
  settingsMinutes.value = Math.max(1, Number(settingsMinutes.value) - 5);
});

settingsPlus.addEventListener("click", () => {
  settingsMinutes.value = Number(settingsMinutes.value) + 5;
});

applySettingsBtn.addEventListener("click", () => {
  setTimerMinutes(settingsMinutes.value);
  switchView("timerView");
});

clearSessionsBtn.addEventListener("click", () => {
  if (!confirm("Clear all saved sessions?")) return;

  sessions = [];
  saveSessions();

  renderCalendar();
  renderSessions();
  renderCalendarPanel();
  updateStats();
});

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

pipBtn.addEventListener("click", () => {
  const mini = window.open("", "FocusTimerMiniplayer", "width=410,height=500");

  mini.document.write(`
    <html>
      <head>
        <title>FocusTimer Miniplayer</title>
        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            width: 100vw;
            height: 100vh;
            overflow: hidden;
            background:
              radial-gradient(circle at center, rgba(80, 95, 210, 0.2), transparent 42%),
              linear-gradient(135deg, #101426, #050815);
            color: #6f86ff;
            font-family: Arial, sans-serif;
            display: grid;
            place-items: center;
          }

          .wrap {
            text-align: center;
          }

          .ring {
            width: 285px;
            height: 285px;
            border: 30px solid #6f86ff;
            border-radius: 50%;
            display: grid;
            place-items: center;
            margin: 0 auto 24px;
            box-shadow: 0 0 35px rgba(111, 134, 255, 0.65);
          }

          #time {
            font-size: 54px;
            font-weight: 900;
            letter-spacing: 2px;
          }

          .controls {
            display: flex;
            justify-content: center;
            gap: 10px;
          }

          button {
            width: 64px;
            height: 44px;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,.12);
            background: rgba(255,255,255,.09);
            color: white;
            font-size: 18px;
            cursor: pointer;
          }

          button:hover {
            background: rgba(111,134,255,.26);
          }
        </style>
      </head>

      <body>
        <div class="wrap">
          <div class="ring">
            <div id="time">25:00</div>
          </div>

          <div class="controls">
            <button onclick="window.opener.postMessage('toggleTimer','*')">▷</button>
            <button onclick="window.opener.postMessage('finishTimer','*')">▷|</button>
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
});

window.addEventListener("message", (event) => {
  if (event.data === "toggleTimer") {
    isRunning ? pauseTimer() : startTimer();
  }

  if (event.data === "finishTimer") {
    finishSession(false);
  }

  if (event.data === "minusTimer") {
    subtractFiveMinutes();
  }

  if (event.data === "plusTimer") {
    addFiveMinutes();
  }

  if (event.data === "stopAlarm") {
    stopAlarm();
  }
});

manualMinutes.value = 25;
settingsMinutes.value = 25;

switchView("timerView");
renderCalendar();
renderSessions();
renderCalendarPanel();
updateStats();
updateTimerUI();
rotateQuote();
