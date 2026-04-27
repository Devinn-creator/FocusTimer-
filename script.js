const timerText = document.getElementById("timerText");
const progress = document.querySelector(".progress");
const startPauseBtn = document.getElementById("startPauseBtn");
const resetBtn = document.getElementById("resetBtn");
const minusBtn = document.getElementById("minusBtn");
const plusBtn = document.getElementById("plusBtn");
const stopAlarmBtn = document.getElementById("stopAlarmBtn");
const alarm = document.getElementById("alarm");
const pipBtn = document.getElementById("pipBtn");

/* TIMER */
let totalSeconds = 1500;
let remaining = totalSeconds;
let running = false;
let interval;

function format(t){
  let m = Math.floor(t/60).toString().padStart(2,"0");
  let s = (t%60).toString().padStart(2,"0");
  return `${m}:${s}`;
}

function updateUI(){
  timerText.innerText = format(remaining);

  const circumference = 660;
  const offset = circumference * (1 - remaining / totalSeconds);
  progress.style.strokeDashoffset = offset;

  localStorage.setItem("pipTime", format(remaining));
}

function start(){
  if(running) return;
  running = true;
  startPauseBtn.innerText = "Ⅱ";

  interval = setInterval(()=>{
    remaining--;
    updateUI();

    if(remaining <= 0){
      clearInterval(interval);
      running = false;
      alarm.play().catch(()=>{});
    }
  },1000);
}

function pause(){
  running = false;
  startPauseBtn.innerText = "▶";
  clearInterval(interval);
}

startPauseBtn.onclick = () => running ? pause() : start();

resetBtn.onclick = () => {
  pause();
  remaining = totalSeconds;
  updateUI();
};

minusBtn.onclick = () => {
  totalSeconds -= 300;
  if(totalSeconds < 300) totalSeconds = 300;
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

/* NAVIGATION (FIXED) */
document.querySelectorAll(".nav-btn").forEach(btn=>{
  btn.onclick = () => {
    document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");

    const view = btn.dataset.view;

    document.getElementById("timerView").style.display = view==="timer"?"block":"none";
    document.getElementById("calendarView").style.display = view==="calendar"?"block":"none";
    document.getElementById("statsView").style.display = view==="stats"?"block":"none";
    document.getElementById("settingsView").style.display = view==="settings"?"block":"block":"none";
  };
});

/* CALENDAR */
const calendarGrid = document.getElementById("calendarGrid");
let sessions = JSON.parse(localStorage.getItem("sessions")) || [];

function renderCalendar(){
  if(!calendarGrid) return;
  calendarGrid.innerHTML = "";

  for(let i=1;i<=30;i++){
    const day = document.createElement("div");
    day.className = "day";
    day.innerText = i;

    if(sessions.some(s=>s.day === i)){
      day.classList.add("has-session");
    }

    day.onclick = () => {
      alert("Sessions: " + sessions.filter(s=>s.day===i).map(s=>s.task).join(", "));
    };

    calendarGrid.appendChild(day);
  }
}

renderCalendar();

/* SAVE SESSION */
const focusInput = document.getElementById("focusInput");

startPauseBtn.addEventListener("dblclick", ()=>{
  if(!focusInput.value) return;

  sessions.push({
    task: focusInput.value,
    day: new Date().getDate()
  });

  localStorage.setItem("sessions", JSON.stringify(sessions));
  renderCalendar();
});

/* QUOTES (PHILOSOPHERS) */
const quotes = [
  ["The unexamined life is not worth living","Socrates"],
  ["Happiness depends upon ourselves","Aristotle"],
  ["He who has a why can bear almost any how","Nietzsche"],
  ["We suffer more often in imagination than reality","Seneca"],
  ["Man is condemned to be free","Jean-Paul Sartre"]
];

setInterval(()=>{
  const q = quotes[Math.floor(Math.random()*quotes.length)];
  document.getElementById("quote").innerText = `"${q[0]}" — ${q[1]}`;
},7000);

/* MINIPLAYER (UPGRADED) */
pipBtn.onclick = ()=>{
  const win = window.open("","mini","width=300,height=300");

  win.document.write(`
    <body style="background:#0b0f1f;color:#6f86ff;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;">
    <h2 id="time">00:00</h2>

    <button onclick="window.opener.postMessage('toggle')">▶/Ⅱ</button>
    <button onclick="window.opener.postMessage('reset')">Reset</button>
    <button onclick="window.opener.postMessage('alarm')">Stop Alarm</button>

    <script>
      setInterval(()=>{
        document.getElementById("time").innerText = localStorage.getItem("pipTime");
      },300);
    <\/script>
    </body>
  `);
};

/* RECEIVE PiP CONTROLS */
window.addEventListener("message",(e)=>{
  if(e.data==="toggle"){
    running ? pause() : start();
  }
  if(e.data==="reset"){
    remaining = totalSeconds;
    updateUI();
  }
  if(e.data==="alarm"){
    alarm.pause();
    alarm.currentTime=0;
  }
});

/* INIT */
updateUI();
