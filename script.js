const timerText = document.getElementById("timerText");
const miniTimerText = document.getElementById("miniTimerText");
const startPauseBtn = document.getElementById("startPauseBtn");
const skipBtn = document.getElementById("skipBtn");
const resetBtn = document.getElementById("resetBtn");
const settingsBtn = document.getElementById("settingsBtn");
const progress = document.querySelector(".progress");
const focusInput = document.getElementById("focusInput");
const saveFocusBtn = document.getElementById("saveFocusBtn");
const sessionList = document.getElementById("sessionList");
const calendarGrid = document.getElementById("calendarGrid");
const monthLabel = document.getElementById("monthLabel");
const prevMonth = document.getElementById("prevMonth");
const nextMonth = document.getElementById("nextMonth");
const pipBtn = document.getElementById("pipBtn");
const alarmSound = document.getElementById("alarmSound");
const breakButtons = document.querySelectorAll(".break");

let WORK_MINUTES = 25;
let totalSeconds = WORK_MINUTES * 60;
let remainingSeconds = totalSeconds;
let timerInterval = null;
let running = false;

let currentDate = new Date();
let selectedDate = new Date();

let sessions = JSON.parse(localStorage.getItem("focusTimerSessions")) || [];

const quotes = [
  "Discipline is choosing between what you want now and what you want most.",
  "Focus on being productive instead of busy.",
  "Small steps every day turn into big results.",
  "Your future is built by what you do today.",
  "Lock in now. Relax later."
];

function saveSessions() {
  localStorage.setItem("focusTimerSessions", JSON.stringify(sessions));
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function updateTimerDisplay() {
  timerText.textContent = formatTime(remainingSeconds);
  miniTimerText.textContent = formatTime(remainingSeconds);

  const circumference = 659.73;
  const progressAmount = remainingSeconds / totalSeconds;
  progress.style.strokeDashoffset = circumference * (1 - progressAmount);

  document.title = `${formatTime(remainingSeconds)} - FocusTimer`;
}

function startTimer() {
  if (running) return;

  running = true;
  startPauseBtn.textContent = "Ⅱ";

  timerInterval = setInterval(() => {
    remainingSeconds--;

    if (remainingSeconds <= 0) {
      finishTimer();
    }

    updateTimerDisplay();
  }, 1000);
}

function pauseTimer() {
  running = false;
  startPauseBtn.textContent = "▷";
  clearInterval(timerInterval);
}

function resetTimer() {
  pauseTimer();
  remainingSeconds = totalSeconds;
  updateTimerDisplay();
}

function finishTimer() {
  pauseTimer();
  remainingSeconds = 0;
  updateTimerDisplay();

  alarmSound.currentTime = 0;
  alarmSound.play().catch(() => {});

  const task = focusInput.value.trim() || "Focus Session";
  addSession(task, WORK_MINUTES);

  setTimeout(() => {
    remainingSeconds = totalSeconds;
    updateTimerDisplay();
  }, 1200);
}

function skipTimer() {
  finishTimer();
}

startPauseBtn.addEventListener("click", () => {
  running ? pauseTimer() : startTimer();
});

resetBtn.addEventListener("click", resetTimer);
skipBtn.addEventListener("click", skipTimer);

settingsBtn.addEventListener("click", () => {
  const minutes = prompt("Set focus timer minutes:", WORK_MINUTES);

  if (!minutes || isNaN(minutes) || Number(minutes) <= 0) return;

  WORK_MINUTES = Number(minutes);
  totalSeconds = WORK_MINUTES * 60;
  remainingSeconds = totalSeconds;
  resetTimer();
});

breakButtons.forEach(button => {
  button.addEventListener("click", () => {
    breakButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");

    WORK_MINUTES = Number(button.dataset.minutes);
    totalSeconds = WORK_MINUTES * 60;
    remainingSeconds = totalSeconds;
    resetTimer();

    document.getElementById("modeLabel").textContent =
      WORK_MINUTES === 5 ? "Short Break" : "Long Break";
  });
});

function addSession(title, minutes) {
  const now = new Date();

  sessions.push({
    id: Date.now(),
    title,
    minutes,
    time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    date: formatDate(selectedDate)
  });

  saveSessions();
  renderSessions();
  renderCalendar();
}

saveFocusBtn.addEventListener("click", () => {
  const title = focusInput.value.trim();

  if (!title) {
    alert("Type what the timer is for first.");
    return;
  }

  addSession(title, WORK_MINUTES);
  focusInput.value = "";
});

document.getElementById("addSessionBtn").addEventListener("click", () => {
  const title = prompt("What is this session for?");

  if (!title) return;

  const minutes = prompt("How many minutes?", "25");

  if (!minutes || isNaN(minutes)) return;

  addSession(title, Number(minutes));
});

function renderSessions() {
  sessionList.innerHTML = "";

  const selected = formatDate(selectedDate);
  const todaySessions = sessions.filter(session => session.date === selected);

  if (todaySessions.length === 0) {
    sessionList.innerHTML = `<p style="color:#9aa0b6;">No sessions yet.</p>`;
    return;
  }

  todaySessions.forEach(session => {
    const item = document.createElement("div");
    item.className = "session-item";

    item.innerHTML = `
      <div class="dot"></div>
      <div>
        <strong>${session.title}</strong>
        <small>${session.time}</small>
      </div>
      <div>${session.minutes} min</div>
    `;

    item.addEventListener("dblclick", () => {
      sessions = sessions.filter(s => s.id !== session.id);
      saveSessions();
      renderSessions();
      renderCalendar();
    });

    sessionList.appendChild(item);
  });
}

function renderCalendar() {
  calendarGrid.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  monthLabel.textContent = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric"
  });

  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previousMonthDays = new Date(year, month, 0).getDate();

  for (let i = startDay - 1; i >= 0; i--) {
    const muted = document.createElement("div");
    muted.className = "day muted";
    muted.textContent = previousMonthDays - i;
    calendarGrid.appendChild(muted);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateKey = formatDate(date);

    const dayEl = document.createElement("div");
    dayEl.className = "day";
    dayEl.textContent = day;

    if (dateKey === formatDate(selectedDate)) {
      dayEl.classList.add("selected");
    }

    if (sessions.some(session => session.date === dateKey)) {
      dayEl.classList.add("has-session");
    }

    dayEl.addEventListener("click", () => {
      selectedDate = date;
      renderCalendar();
      renderSessions();
    });

    calendarGrid.appendChild(dayEl);
  }

  const totalCells = calendarGrid.children.length;
  const nextDays = 42 - totalCells;

  for (let i = 1; i <= nextDays; i++) {
    const muted = document.createElement("div");
    muted.className = "day muted";
    muted.textContent = i;
    calendarGrid.appendChild(muted);
  }
}

prevMonth.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
});

nextMonth.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
});

async function openPiP() {
  const pipHTML = `
    <html>
      <head>
        <title>FocusTimer PiP</title>
        <style>
          body {
            margin: 0;
            background: #111426;
            color: #6f86ff;
            display: grid;
            place-items: center;
            height: 100vh;
            font-family: Arial, sans-serif;
          }

          .pip {
            width: 210px;
            height: 210px;
            border: 18px solid #6f86ff;
            border-radius: 50%;
            display: grid;
            place-items: center;
            box-shadow: 0 0 30px rgba(111,134,255,.65);
          }

          #pipTime {
            font-size: 42px;
            font-weight: 900;
            letter-spacing: 2px;
          }
        </style>
      </head>
      <body>
        <div class="pip">
          <div id="pipTime">${formatTime(remainingSeconds)}</div>
        </div>

        <script>
          setInterval(() => {
            document.getElementById("pipTime").textContent = localStorage.getItem("focusTimerCurrentTime") || "${formatTime(remainingSeconds)}";
          }, 300);
        <\/script>
      </body>
    </html>
  `;

  if ("documentPictureInPicture" in window) {
    const pipWindow = await window.documentPictureInPicture.requestWindow({
      width: 280,
      height: 280
    });

    pipWindow.document.open();
    pipWindow.document.write(pipHTML);
    pipWindow.document.close();
  } else {
    const popup = window.open("", "FocusTimer PiP", "width=300,height=330");
    popup.document.open();
    popup.document.write(pipHTML);
    popup.document.close();
  }
}

pipBtn.addEventListener("click", openPiP);

setInterval(() => {
  localStorage.setItem("focusTimerCurrentTime", formatTime(remainingSeconds));
}, 250);

setInterval(() => {
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  document.getElementById("quote").textContent = `“${randomQuote}”`;
}, 12000);

renderCalendar();
renderSessions();
updateTimerDisplay();
