const SUPABASE_URL = "https://kmgoawqcjgctfedmmrpd.supabase.co/rest/v1/
";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZ29hd3FjamdjdGZlZG1tcnBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MDM2MzUsImV4cCI6MjA5MzQ3OTYzNX0.Tlm8F5wz5MtajGs47nPJX9VRtMxQBw2zgJvM_hrHU2E
";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
async function checkUser() {
  const { data } = await supabaseClient.auth.getUser();
  currentUser = data.user;
  loadSessions();
}

document.getElementById("signupBtn").addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabaseClient.auth.signUp({
    email,
    password
  });

  if (error) {
    alert(error.message);
  } else {
    alert("Account created. Check your email.");
  }
});

document.getElementById("loginBtn").addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  currentUser = data.user;
  alert("Logged in");
  loadSessions();
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  currentUser = null;
  alert("Logged out");
});
async function saveSession(focusTitle, minutes) {
  if (!currentUser) {
    alert("Please log in first.");
    return;
  }

  const { error } = await supabaseClient.from("sessions").insert({
    user_id: currentUser.id,
    title: focusTitle,
    minutes: minutes,
    completed_at: new Date().toISOString()
  });

  if (error) {
    alert(error.message);
  } else {
    loadSessions();
  }
}
async function loadSessions() {
  if (!currentUser) return;

  const { data, error } = await supabaseClient
    .from("sessions")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("completed_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const list = document.getElementById("sessionsList");
  if (!list) return;

  list.innerHTML = "";

  data.forEach(session => {
    const item = document.createElement("div");
    item.className = "session-item";
    item.innerHTML = `
      <strong>${session.title || "Focus Session"}</strong>
      <span>${session.minutes} min</span>
    `;

    list.appendChild(item);
  });
}

checkUser();

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
