const SUPABASE_URL = "https://kmgoawqcjgctfedmmrpd.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "sb_publishable_nTJ835cKc9LnxkWcNzf4rA_1q90q1OL";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State Variables
let currentUser = null;
let sessions = []; // Fetched from Supabase

// DOM Elements - Auth
const authContainer = document.getElementById("authContainer");
const appContainer = document.getElementById("appContainer");
const authMessage = document.getElementById("authMessage");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

// Set up Broadcast Channel to replace localStorage for Miniplayer sync
const timerChannel = new BroadcastChannel('timer_sync');

/* AUTH LOGIC */
supabaseClient.auth.onAuthStateChange((event, session) => {
  if (session) {
    currentUser = session.user;
    authContainer.style.display = "none";
    appContainer.style.display = "grid";
    loadSessionsFromSupabase();
  } else {
    currentUser = null;
    authContainer.style.display = "flex";
    appContainer.style.display = "none";
  }
});

document.getElementById("signupBtn").addEventListener("click", async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  authMessage.textContent = "Loading...";

  const { error } = await supabaseClient.auth.signUp({ email, password });
  if (error) {
    authMessage.textContent = error.message;
  } else {
    authMessage.textContent = "Success! Please log in (or check email for confirmation).";
  }
});

document.getElementById("loginBtn").addEventListener("click", async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  authMessage.textContent = "Loading...";

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    authMessage.textContent = error.message;
  }
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  emailInput.value = "";
  passwordInput.value = "";
  authMessage.textContent = "";
});

/* SUPABASE DATA LOGIC */
async function loadSessionsFromSupabase() {
  if (!currentUser) return;

  const { data, error } = await supabaseClient
    .from("sessions")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading sessions:", error);
    return;
  }

  sessions = data || [];
  renderCalendar();
  renderSessions();
  updateStats();
}

async function saveSessionToSupabase(task, minutes, dateString, timeString) {
  if (!currentUser) return;

  const { error } = await supabaseClient.from("sessions").insert({
    user_id: currentUser.id,
    task: task,
    minutes: minutes,
    date_string: dateString,
    time_string: timeString
  });

  if (error) {
    console.error("Error saving session:", error);
  } else {
    loadSessionsFromSupabase();
  }
}

document.getElementById("clearSessionsBtn").addEventListener("click", async () => {
  if (!currentUser || !confirm("Are you sure you want to delete all your sessions?")) return;
  
  const { error } = await supabaseClient
    .from('sessions')
    .delete()
    .eq('user_id', currentUser.id);
    
  if (error) {
    console.error("Error clearing sessions:", error);
  } else {
    loadSessionsFromSupabase();
  }
});


// DOM Elements - App
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
const calendarSessionList = document.getElementById("calendarSessionList");

const alarmSound = document.getElementById("alarmSound");

/* VIEW NAVIGATION */
const navBtns = document.querySelectorAll(".nav-btn[data-view]");
const mainViews = document.querySelectorAll(".main-view");

navBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    navBtns.forEach(b => b.classList.remove("active"));
    mainViews.forEach(v => v.classList.remove("active"));
    
    btn.classList.add("active");
    document.getElementById(btn.dataset.view).classList.add("active");
  });
});

/* TIMER STATE */
let totalSeconds = 1500;
let remainingSeconds = totalSeconds;
let running = false;
let interval;

/* CALENDAR STATE */
let today = new Date();
let visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDate = new Date();

/* UTIL */
function formatTime(s){
  let m = Math.floor(s/60).toString().padStart(2,"0");
  let sec = (s%60).toString().padStart(2,"0");
  return `${m}:${sec}`;
}

/* TIMER UI */
function updateUI(){
  const formatted = formatTime(remainingSeconds);
  timerText.textContent = formatted;
  miniTimerText.textContent = formatted;

  const circumference = 659.73;
  const offset = circumference * (1 - remainingSeconds / totalSeconds);

  progress.style.strokeDashoffset = offset;
  miniProgress.style.strokeDashoffset = offset;

  // Broadcast the time to the miniplayer instead of using localStorage
  timerChannel.postMessage({ time: formatted });
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

  if (used > 0) {
    const dateStr = selectedDate.toDateString();
    const timeStr = new Date().toLocaleTimeString();
    
    // Save to Supabase (this will trigger a re-render automatically on success)
    saveSessionToSupabase(task, used, dateStr, timeStr);
  }

  if(playSound){
    alarmSound.play().catch(()=>{});
  }

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

/* BREAK BUTTONS */
document.querySelectorAll(".break").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".break").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    setTime(parseInt(btn.dataset.minutes));
  });
});

/* MINI BUTTONS */
miniPlayBtn.onclick = startPauseBtn.onclick;
miniFinishBtn.onclick = finishBtn.onclick;
miniPlusBtn.onclick = plusBtn.onclick;
miniMinusBtn.onclick = minusBtn.onclick;
miniStopAlarmBtn.onclick = stopAlarm;

/* SET TIME */
function setTime(min){
  if (!min || isNaN(min)) return;
  totalSeconds = min * 60;
  remainingSeconds = totalSeconds;
  updateUI();
}

/* STATS */
function updateStats() {
  const totalSessionsEl = document.getElementById("totalSessions");
  const totalMinutesEl = document.getElementById("totalMinutes");
  const todayMinutesEl = document.getElementById("todayMinutes");

  totalSessionsEl.textContent = sessions.length;
  
  const totalMin = sessions.reduce((acc, s) => acc + s.minutes, 0);
  totalMinutesEl.textContent = totalMin;

  const todayStr = new Date().toDateString();
  const todayMin = sessions
    .filter(s => s.date_string === todayStr)
    .reduce((acc, s) => acc + s.minutes, 0);
  
  todayMinutesEl.textContent = todayMin;
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

    if(sessions.some(s => s.date_string === dateObj.toDateString())){
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
  if (calendarSessionList) calendarSessionList.innerHTML = "";

  let list = sessions.filter(s => s.date_string === selectedDate.toDateString());

  if (list.length === 0 && calendarSessionList) {
    calendarSessionList.innerHTML = "<p>No sessions recorded for this day.</p>";
  }

  list.forEach(s=>{
    let html = `
      <div class="dot"></div>
      <div>
        <strong>${s.task}</strong>
        <small>${s.time_string}</small>
      </div>
      <div>${s.minutes} min</div>
    `;

    // Sidebar list
    let el = document.createElement("div");
    el.className="session-item";
    el.innerHTML = html;
    sessionList.appendChild(el);

    // Calendar view list
    if (calendarSessionList) {
      let calEl = document.createElement("div");
      calEl.className="session-item";
      calEl.innerHTML = html;
      calendarSessionList.appendChild(calEl);
    }
  });
}

/* MINIPLAYER (SMALL CLOCK) - using BroadcastChannel instead of localStorage */
pipBtn.onclick = ()=>{
  const mini = window.open("", "", "width=260,height=150");

  mini.document.write(`
    <body style="margin:0;background:#1e5edb;display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;">
      <div style="width:220px;height:100px;background:#0a1422;border-radius:30px;display:flex;align-items:center;justify-content:center;color:#8eeaff;font-size:32px;">
        <span id="t">${formatTime(remainingSeconds)}</span>
      </div>

      <script>
        const channel = new BroadcastChannel('timer_sync');
        channel.onmessage = (event) => {
          document.getElementById("t").innerText = event.data.time;
        };
      <\/script>
    </body>
  `);
};

/* INIT */
updateUI();
renderCalendar();
