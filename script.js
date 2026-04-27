let time = 1500;
let interval;
let running=false;

const timerText=document.getElementById("timerText");
const progress=document.querySelector(".progress");
const alarm=document.getElementById("alarm");

function update(){
let m=Math.floor(time/60);
let s=time%60;
timerText.textContent=
`${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;

localStorage.setItem("pipTime",timerText.textContent);
}

function start(){
if(running) return;
running=true;

interval=setInterval(()=>{
time--;
update();

if(time<=0){
alarm.play();
clearInterval(interval);
running=false;
}
},1000);
}

function pause(){
running=false;
clearInterval(interval);
}

document.getElementById("startPauseBtn").onclick=()=>{
running?pause():start();
};

document.getElementById("resetBtn").onclick=()=>{
pause();
time=1500;
update();
};

document.getElementById("minusBtn").onclick=()=>{
time-=300;
update();
};

document.getElementById("plusBtn").onclick=()=>{
time+=300;
update();
};

document.getElementById("stopAlarmBtn").onclick=()=>{
alarm.pause();
alarm.currentTime=0;
};

document.getElementById("pipBtn").onclick=()=>{
let w=window.open("","pip","width=250,height=250");

w.document.write(`
<body style="background:#111;color:#6f86ff;
display:flex;align-items:center;justify-content:center;
font-size:30px;">
<span id="t">00:00</span>
<script>
setInterval(()=>{
document.getElementById("t").innerText=
localStorage.getItem("pipTime");
},200);
<\/script>
</body>
`);
};

/* NAVIGATION */

document.querySelectorAll(".nav-btn").forEach(btn=>{
btn.onclick=()=>{
document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
btn.classList.add("active");

document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));

let view=btn.dataset.view+"View";
document.getElementById(view).classList.add("active");
};
});

/* CALENDAR */

const grid=document.getElementById("calendarGrid");

for(let i=1;i<=30;i++){
let d=document.createElement("div");
d.innerText=i;
grid.appendChild(d);
}

/* QUOTES */

const quotes=[
["The unexamined life is not worth living","Socrates"],
["Happiness depends upon ourselves","Aristotle"],
["He who has a why can bear almost any how","Nietzsche"],
["We suffer more in imagination than reality","Seneca"]
];

setInterval(()=>{
let q=quotes[Math.floor(Math.random()*quotes.length)];
document.getElementById("quote").innerText=`"${q[0]}" — ${q[1]}`;
},5000);

update();
