/* ================= ELEMENTS ================= */
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
const miniSkipBtn = document.getElementById("miniSkipBtn");
const miniMinusBtn = document.getElementById("miniMinusBtn");
const miniPlusBtn = document.getElementById("miniPlusBtn");
const miniStopAlarmBtn = document.getElementById("miniStopAlarmBtn");

const pipBtn = document.getElementById("pipBtn");
const focusInput = document.getElementById("focusInput");

const calendarGrid = document.getElementById("calendarGrid");
const sessionList = document.getElementById("sessionList");
const calendarSessionList = document.getElementById("calendarSessionList");

const alarm = document.getElementById("alarmSound");

/* ================= STATE ================= */
let totalSeconds = 1500;
let remaining = totalSeconds;
let running = false;
let interval = null;

let selectedDay = new Date().getDate();
let sessions = JSON.parse(localStorage.getItem("sessions")) || [];

/* ================= TIME ================= */
function format(sec){
  const m = Math.floor(sec/60).toString().padStart(2,"0");
  const s = (sec%60).toString().padStart(2,"0");
  return `${m}:${s}`;
}

function updateUI(){
  timerText.textContent = format(remaining);
  miniTimerText.textContent = format(remaining);

  const circumference = 659.73;
  progress.style.strokeDashoffset =
    circumference * (1 - remaining / totalSeconds);

  localStorage.setItem("time", format(remaining));
}

/* ================= TIMER ================= */
function start(){
  if(running) return;
  running = true;
  startPauseBtn.textContent = "Ⅱ";

  interval = setInterval(()=>{
    remaining--;
    updateUI();

    if(remaining <= 0){
      finish();
    }
  },1000);
}

function pause(){
  running = false;
  startPauseBtn.textContent = "▷";
  clearInterval(interval);
}

function reset(){
  pause();
  remaining = totalSeconds;
  updateUI();
}

function finish(){
  pause();
  alarm.currentTime = 0;
  alarm.play().catch(()=>{});
  saveSession();
}

/* ================= BUTTONS ================= */
startPauseBtn.onclick = () => running ? pause() : start();
resetBtn.onclick = reset;
skipBtn.onclick = finish;

plusBtn.onclick = () => {
  totalSeconds += 300;
  remaining = totalSeconds;
  updateUI();
};

minusBtn.onclick = () => {
  totalSeconds = Math.max(300, totalSeconds - 300);
  remaining = totalSeconds;
  updateUI();
};

stopAlarmBtn.onclick = () => {
  alarm.pause();
  alarm.currentTime = 0;
};

/* MINI */
miniPlayBtn.onclick = startPauseBtn.onclick;
miniSkipBtn.onclick = skipBtn.onclick;
miniPlusBtn.onclick = plusBtn.onclick;
miniMinusBtn.onclick = minusBtn.onclick;
miniStopAlarmBtn.onclick = stopAlarmBtn.onclick;

/* ================= NAV FIX ================= */
function showView(id){
  document.querySelectorAll(".main-view").forEach(v=>{
    v.classList.remove("active");
  });

  document.getElementById(id).classList.add("active");
}

document.querySelectorAll(".nav-btn").forEach(btn=>{
  btn.onclick = ()=>{
    document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    showView(btn.dataset.view);
  };
});

/* ================= CALENDAR ================= */
function renderCalendar(){
  calendarGrid.innerHTML = "";

  for(let i=1;i<=31;i++){
    const d = document.createElement("div");
    d.className = "day";
    d.textContent = i;

    if(i === selectedDay) d.classList.add("selected");
    if(sessions.some(s=>s.day===i)) d.classList.add("has-session");

    d.onclick = ()=>{
      selectedDay = i;
      renderCalendar();
      renderSessions();
      renderCalendarPanel();
    };

    calendarGrid.appendChild(d);
  }
}

/* ================= SESSIONS ================= */
function renderSessions(){
  sessionList.innerHTML = "";

  const list = sessions.filter(s=>s.day===selectedDay);

  if(list.length===0){
    sessionList.innerHTML = "<p>No sessions</p>";
    return;
  }

  list.forEach(s=>{
    const el = document.createElement("div");
    el.className = "session-item";
    el.innerHTML = `
      <div class="dot"></div>
      <div>
        <strong>${s.task}</strong>
        <small>${s.time}</small>
      </div>
      <div>${s.minutes} min</div>
    `;
    sessionList.appendChild(el);
  });
}

function renderCalendarPanel(){
  if(!calendarSessionList) return;

  const list = sessions.filter(s=>s.day===selectedDay);

  calendarSessionList.innerHTML = list.map(s=>`
    <div class="session-item">
      <div class="dot"></div>
      <div>
        <strong>${s.task}</strong>
        <small>${s.time}</small>
      </div>
      <div>${s.minutes} min</div>
    </div>
  `).join("");
}

/* ================= SAVE ================= */
function saveSession(){
  const task = focusInput.value || "Focus Session";

  sessions.push({
    task,
    minutes: totalSeconds/60,
    day: selectedDay,
    time: new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})
  });

  localStorage.setItem("sessions", JSON.stringify(sessions));

  renderCalendar();
  renderSessions();
}

/* ================= MINIPLAYER ================= */
pipBtn.onclick = ()=>{
  const w = window.open("", "mini", "width=300,height=300");

  w.document.write(`
    <body style="background:#111;color:#6f86ff;text-align:center;font-family:sans-serif">
      <h2 id="t">00:00</h2>
      <button onclick="window.opener.postMessage('toggle')">Play</button>
      <button onclick="window.opener.postMessage('minus')">-5</button>
      <button onclick="window.opener.postMessage('plus')">+5</button>
      <button onclick="window.opener.postMessage('alarm')">Stop</button>

      <script>
        setInterval(()=>{
          document.getElementById("t").innerText =
          localStorage.getItem("time");
        },300);
      <\/script>
    </body>
  `);
};

window.addEventListener("message", e=>{
  if(e.data==="toggle") startPauseBtn.onclick();
  if(e.data==="minus") minusBtn.onclick();
  if(e.data==="plus") plusBtn.onclick();
  if(e.data==="alarm") stopAlarmBtn.onclick();
});

/* ================= INIT ================= */
updateUI();
renderCalendar();
renderSessions();
renderCalendarPanel();
showView("timerView");
