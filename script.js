const timerText = document.getElementById("timerText");
const miniTimerText = document.getElementById("miniTimerText");
const progress = document.querySelector(".progress");
const miniProgress = document.querySelector(".mini-progress");

const startPauseBtn = document.getElementById("startPauseBtn");
const finishBtn = document.getElementById("finishBtn");
const resetBtn = document.getElementById("resetBtn");
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

const alarmSound = document.getElementById("alarmSound");

/* TIMER */
let totalSeconds = 1500;
let remainingSeconds = totalSeconds;
let running = false;
let interval;

/* CALENDAR */
let today = new Date();
let visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDate = new Date();

let sessions = JSON.parse(localStorage.getItem("sessions")) || [];

/* UTIL */
function formatTime(s){
  let m = Math.floor(s/60).toString().padStart(2,"0");
  let sec = (s%60).toString().padStart(2,"0");
  return `${m}:${sec}`;
}

/* TIMER UI */
function updateUI(){
  timerText.textContent = formatTime(remainingSeconds);
  miniTimerText.textContent = formatTime(remainingSeconds);

  const circumference = 659.73;
  const offset = circumference * (1 - remainingSeconds / totalSeconds);

  progress.style.strokeDashoffset = offset;
  miniProgress.style.strokeDashoffset = offset;

  localStorage.setItem("focusTimerTime", formatTime(remainingSeconds));
}

/* TIMER LOGIC */
function start(){
  if(running) return;
  running = true;
  interval = setInterval(()=>{
    remainingSeconds--;
    updateUI();
    if(remainingSeconds <= 0){
      finish(true);
    }
  },1000);
}

function pause(){
  running = false;
  clearInterval(interval);
}

function reset(){
  pause();
  remainingSeconds = totalSeconds;
  updateUI();
}

function finish(playSound=false){
  pause();

  let used = Math.round((totalSeconds - remainingSeconds)/60);
  let task = focusInput.value || "Session";

  sessions.push({
    task,
    minutes: used,
    date: selectedDate.toDateString(),
    time: new Date().toLocaleTimeString()
  });

  localStorage.setItem("sessions", JSON.stringify(sessions));

  if(playSound){
    alarmSound.play().catch(()=>{});
  }

  renderSessions();
  renderCalendar();
  remainingSeconds = totalSeconds;
  updateUI();
}

function stopAlarm(){
  alarmSound.pause();
  alarmSound.currentTime = 0;
}

/* BUTTONS */
startPauseBtn.onclick = ()=> running ? pause() : start();
finishBtn.onclick = ()=> finish(false);
resetBtn.onclick = reset;
stopAlarmBtn.onclick = stopAlarm;

plusBtn.onclick = ()=> setTime(totalSeconds/60 + 5);
minusBtn.onclick = ()=> setTime(Math.max(1,totalSeconds/60 - 5));

setManualBtn.onclick = ()=> setTime(manualMinutes.value);

/* MINI BUTTONS */
miniPlayBtn.onclick = startPauseBtn.onclick;
miniFinishBtn.onclick = finishBtn.onclick;
miniPlusBtn.onclick = plusBtn.onclick;
miniMinusBtn.onclick = minusBtn.onclick;
miniStopAlarmBtn.onclick = stopAlarm;

/* SET TIME */
function setTime(min){
  totalSeconds = min * 60;
  remainingSeconds = totalSeconds;
  updateUI();
}

/* CALENDAR */
function renderCalendar(){
  calendarGrid.innerHTML = "";

  monthLabel.textContent = visibleMonth.toLocaleString("default", {
    month: "long",
    year: "numeric"
  });

  let year = visibleMonth.getFullYear();
  let month = visibleMonth.getMonth();

  let firstDay = new Date(year,month,1).getDay();
  let days = new Date(year,month+1,0).getDate();

  for(let i=0;i<firstDay;i++){
    let d = document.createElement("div");
    d.className="day muted";
    calendarGrid.appendChild(d);
  }

  for(let d=1; d<=days; d++){
    let el = document.createElement("div");
    el.className="day";
    el.textContent = d;

    let dateObj = new Date(year,month,d);

    if(dateObj.toDateString() === selectedDate.toDateString()){
      el.classList.add("selected");
    }

    if(sessions.some(s=> new Date(s.date).toDateString()===dateObj.toDateString())){
      el.classList.add("has-session");
    }

    el.onclick = ()=>{
      selectedDate = dateObj;
      renderCalendar();
      renderSessions();
    };

    calendarGrid.appendChild(el);
  }
}

document.getElementById("prevMonth").onclick = ()=>{
  visibleMonth.setMonth(visibleMonth.getMonth()-1);
  renderCalendar();
};

document.getElementById("nextMonth").onclick = ()=>{
  visibleMonth.setMonth(visibleMonth.getMonth()+1);
  renderCalendar();
};

/* SESSIONS */
function renderSessions(){
  sessionList.innerHTML = "";

  let list = sessions.filter(s=> new Date(s.date).toDateString()===selectedDate.toDateString());

  list.forEach(s=>{
    let el = document.createElement("div");
    el.className="session-item";
    el.innerHTML=`
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

/* MINIPLAYER (SMALL CLOCK) */
pipBtn.onclick = ()=>{
  const mini = window.open("", "", "width=260,height=150");

  mini.document.write(`
    <body style="margin:0;background:#1e5edb;display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;">
      <div style="width:220px;height:100px;background:#0a1422;border-radius:30px;display:flex;align-items:center;justify-content:center;color:#8eeaff;font-size:32px;">
        <span id="t">25:00</span>
      </div>

      <script>
        setInterval(()=>{
          document.getElementById("t").innerText =
          localStorage.getItem("focusTimerTime");
        },200);
      <\/script>
    </body>
  `);
};

/* INIT */
updateUI();
renderCalendar();
renderSessions();
