const timerText = document.getElementById("timerText");
const miniTimerText = document.getElementById("miniTimerText");
const progress = document.querySelector(".progress");

const startPauseBtn = document.getElementById("startPauseBtn");
const skipBtn = document.getElementById("skipBtn");
const resetBtn = document.getElementById("resetBtn");
const settingsBtn = document.getElementById("settingsBtn");
const stopAlarmBtn = document.getElementById("stopAlarmBtn");

const minusBtn = document.getElementById("minusBtn");
const plusBtn = document.getElementById("plusBtn");

const miniPlayBtn = document.getElementById("miniPlayBtn");
const miniSkipBtn = document.getElementById("miniSkipBtn");
const miniMinusBtn = document.getElementById("miniMinusBtn");
const miniPlusBtn = document.getElementById("miniPlusBtn");
const miniStopAlarmBtn = document.getElementById("miniStopAlarmBtn");

const pipBtn = document.getElementById("pipBtn");
const focusInput = document.getElementById("focusInput");
const calendarGrid = document.getElementById("calendarGrid");
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
let timerInterval = null;
let isRunning = false;
let selectedDay = new Date().getDate();

let sessions = JSON.parse(localStorage.getItem("focusTimerSessions")) || [
  { task: "Study – Math", minutes: 25, time: "10:00 AM", day: 16 },
  { task: "Read – Chapter 5", minutes: 25, time: "1:00 PM", day: 16 },
  { task: "Workout", minutes: 25, time: "6:00 PM", day: 16 }
];

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

  localStorage.setItem("focusTimerTime", formatTime(remainingSeconds));
}

function startTimer() {
  if (isRunning) return;

  isRunning = true;
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
  updateTimerUI();
}

function stopAlarm() {
  alarmSound.pause();
  alarmSound.currentTime = 0;
}

function addFiveMinutes() {
  totalSeconds += 300;
  remainingSeconds = totalSeconds;
  updateTimerUI();
}

function subtractFiveMinutes() {
  totalSeconds = Math.max(300, totalSeconds - 300);
  remainingSeconds = totalSeconds;
  updateTimerUI();
}

function finishTimer() {
  pauseTimer();
  remainingSeconds = 0;
  updateTimerUI();

  alarmSound.currentTime = 0;
  alarmSound.play().catch(() => {});

  const task = focusInput.value.trim() || "Focus Session";
  addSession(task, Math.round(totalSeconds / 60));
}

function addSession(task, minutes) {
  const now = new Date();

  sessions.push({
    task,
    minutes,
    day: selectedDay,
    time: now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  });

  saveSessions();
  renderCalendar();
  renderSessions();
  updateStats();
}

startPauseBtn.onclick = () => isRunning ? pauseTimer() : startTimer();
resetBtn.onclick = resetTimer;
skipBtn.onclick = finishTimer;
stopAlarmBtn.onclick = stopAlarm;

plusBtn.onclick = addFiveMinutes;
minusBtn.onclick = subtractFiveMinutes;

miniPlayBtn.onclick = () => isRunning ? pauseTimer() : startTimer();
miniSkipBtn.onclick = finishTimer;
miniPlusBtn.onclick = addFiveMinutes;
miniMinusBtn.onclick = subtractFiveMinutes;
miniStopAlarmBtn.onclick = stopAlarm;

settingsBtn.onclick = () => {
  switchView("settingsPanel");
};

function switchView(viewId) {
  document.querySelectorAll(".main-view").forEach(view => {
    view.classList.remove("active");
    view.style.display = "none";
  });

  const target = document.getElementById(viewId);
  if (target) {
    target.classList.add("active");
    target.style.display = "block";
  }

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

  for (let day = 1; day <= 31; day++) {
    const dayEl = document.createElement("div");
    dayEl.className = "day";
    dayEl.textContent = day;

    if (day === selectedDay) dayEl.classList.add("selected");
    if (sessions.some(session => session.day === day)) {
      dayEl.classList.add("has-session");
    }

    dayEl.onclick = () => {
      selectedDay = day;
      renderCalendar();
      renderSessions();
      renderCalendarPanel();
    };

    calendarGrid.appendChild(dayEl);
  }
}

function renderSessions() {
  sessionList.innerHTML = "";

  const daySessions = sessions.filter(session => session.day === selectedDay);

  if (daySessions.length === 0) {
    sessionList.innerHTML = `<p style="color:#9aa0b6;">No sessions yet.</p>`;
    return;
  }

  daySessions.forEach(session => {
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
  if (!calendarSessionList) return;

  const daySessions = sessions.filter(session => session.day === selectedDay);

  if (daySessions.length === 0) {
    calendarSessionList.innerHTML = `<p>No saved sessions for May ${selectedDay}.</p>`;
    return;
  }

  calendarSessionList.innerHTML = daySessions.map(session => `
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

    totalSeconds = Number(button.dataset.minutes) * 60;
    remainingSeconds = totalSeconds;
    document.getElementById("modeLabel").textContent = button.dataset.label;
    resetTimer();
  };
});

function updateStats() {
  const totalSessions = sessions.length;
  const totalMinutes = sessions.reduce((sum, session) => sum + Number(session.minutes), 0);
  const today = new Date().getDate();
  const todayMinutes = sessions
    .filter(session => session.day === today)
    .reduce((sum, session) => sum + Number(session.minutes), 0);

  totalSessionsEl.textContent = totalSessions;
  totalMinutesEl.textContent = totalMinutes;
  todayMinutesEl.textContent = todayMinutes;
}

settingsMinus.onclick = () => {
  settingsMinutes.value = Math.max(5, Number(settingsMinutes.value) - 5);
};

settingsPlus.onclick = () => {
  settingsMinutes.value = Number(settingsMinutes.value) + 5;
};

applySettingsBtn.onclick = () => {
  const minutes = Math.max(5, Number(settingsMinutes.value));
  totalSeconds = minutes * 60;
  remainingSeconds = totalSeconds;
  resetTimer();
  switchView("timerView");
};

clearSessionsBtn.onclick = () => {
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
  const mini = window.open("", "FocusTimerMiniplayer", "width=320,height=360");

  mini.document.write(`
    <html>
      <head>
        <title>FocusTimer Miniplayer</title>
        <style>
          body {
            margin: 0;
            height: 100vh;
            background: #111426;
            color: #6f86ff;
            font-family: Arial, sans-serif;
            display: grid;
            place-items: center;
          }

          .box {
            width: 280px;
            padding: 18px;
            border-radius: 18px;
            background: rgba(255,255,255,.05);
            border: 1px solid rgba(255,255,255,.12);
            text-align: center;
          }

          .ring {
            width: 150px;
            height: 150px;
            border: 18px solid #6f86ff;
            border-radius: 50%;
            display: grid;
            place-items: center;
            margin: 10px auto 18px;
            box-shadow: 0 0 30px rgba(111,134,255,.55);
          }

          #time {
            font-size: 30px;
            font-weight: 900;
          }

          button {
            background: rgba(255,255,255,.09);
            color: white;
            border: 1px solid rgba(255,255,255,.1);
            border-radius: 8px;
            padding: 10px 12px;
            margin: 4px;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <div class="box">
          <h3>FocusTimer</h3>
          <div class="ring">
            <div id="time">25:00</div>
          </div>

          <button onclick="window.opener.postMessage('toggleTimer', '*')">▷ / Ⅱ</button>
          <button onclick="window.opener.postMessage('skipTimer', '*')">▷|</button>
          <button onclick="window.opener.postMessage('minusTimer', '*')">−</button>
          <button onclick="window.opener.postMessage('plusTimer', '*')">+</button>
          <button onclick="window.opener.postMessage('stopAlarm', '*')">🔕</button>
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
  if (event.data === "skipTimer") finishTimer();
  if (event.data === "minusTimer") subtractFiveMinutes();
  if (event.data === "plusTimer") addFiveMinutes();
  if (event.data === "stopAlarm") stopAlarm();
});

switchView("timerView");
renderCalendar();
renderSessions();
renderCalendarPanel();
updateStats();
updateTimerUI();
rotateQuote();
