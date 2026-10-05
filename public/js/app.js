import { MC } from './data/months.js';
import { TL } from './data/timeline.js';
import { SAL } from './data/salary.js';
import './components/theme.js';
import { ENV } from './config/env.js';
import { isAuthenticated, getToken, getUsername, createAuthModal, logout } from './components/auth.js';



// --- ORIGINAL DATA ARRAYS --- //






const td=document.getElementById('trDots');
const pr=document.getElementById('pillsRow');
const cc=document.getElementById('cardsContainer');

MC.forEach((m,i)=>{
  const d=document.createElement('div');
  d.className='tr-dot'+(i===0?' current':'');
  d.onclick=()=>scrollToMonth(i);
  td.appendChild(d);

  const pill=document.createElement('div');
  pill.className='pill'+(i===0?' active':'');
  pill.style.setProperty('--mc',m.c);
  pill.textContent=`M${m.n}: ${m.title.split('+')[0].trim()}`;
  pill.onclick=()=>showMonth(i, pill);
  pr.appendChild(pill);

  const totalTasks = m.weeks.reduce((acc, wk) => acc + wk.tasks.length, 0);

  const card=document.createElement('div');
  card.className='month-card'+(i===0?' show':'');
  card.style.setProperty('--mc',m.c);
  card.id=`mc${i}`;

  const weeksHTML=m.weeks.map((wk,wi)=>`
    <div class="week-block" id="wk${i}_${wi}">
      <div class="week-hdr" onclick="toggleWeek('wk${i}_${wi}')">
        <span class="w-num">${wk.lbl}</span>
        <span class="w-focus">${wk.focus}</span>
        <span class="w-hrs">${wk.hrs}</span>
        <span class="tog">+</span>
      </div>
      <div class="week-body">
        <div class="task-list">
          ${wk.tasks.map((t, ti) => {
            const taskId = `task_${i}_${wi}_${ti}`;
            return `<label class="task-label" id="label_${taskId}">
              <input type="checkbox" id="${taskId}" onchange="toggleTask('${taskId}', ${i})">
              <span>${t}</span>
            </label>`;
          }).join('')}
        </div>
      </div>
    </div>`).join('');

  const resHTML=m.resources.map(r=>`<div class="res-item">${r}</div>`).join('');
  const projHTML=m.projects.map((p,pi)=>`<div class="proj-item"><span class="pn">${String(pi+1).padStart(2,'0')}</span>${p}</div>`).join('');

  card.innerHTML=`
    <div class="mc-header">
      <div class="m-num">0${m.n}</div>
      <h2>${m.title}</h2>
      <div class="m-period"><span>🗓 ${m.period}</span> <span class="m-intensity">⚡ ${m.intensity}</span></div>
      <div class="mc-progress-wrap">
        <div class="mc-progress-text">
          <span id="prog-text-m${i}">0 / ${totalTasks} Tasks Completed</span>
          <span class="pct" id="prog-pct-m${i}">0%</span>
        </div>
        <div class="mc-progress-bg"><div class="mc-progress-fill" id="prog-fill-m${i}"></div></div>
      </div>
    </div>
    <div class="mc-goal">🎯 ${m.goal}</div>
    <div class="weeks-wrap">${weeksHTML}</div>
    <div class="bottom-grid">
      <div class="grid-box res-box"><div class="box-label">📚 Resources</div>${resHTML}</div>
      <div class="grid-box proj-box"><div class="box-label">🏗 Projects</div>${projHTML}</div>
      <div class="grid-box chk-box"><div class="box-label">✅ Checkpoint</div><div class="chk-text">${m.checkpoint}</div></div>
      <div class="grid-box urg-box"><div class="box-label">⚠️ Urgent</div><div class="urg-text">${m.urgent}</div></div>
    </div>`;
  cc.appendChild(card);
});

// Timeline build
const tl=document.getElementById('tlWrap');
TL.forEach(t=>{
  const row=document.createElement('div');
  row.className='tl-row anim-on-scroll';
  row.style.setProperty('--tc',t.c);
  row.innerHTML=`<div class="tl-dot" style="border-color:${t.c}"></div>
    <div class="tl-content"><div class="tl-month">${t.mo}</div><div class="tl-text">${t.txt}</div></div>`;
  tl.appendChild(row);
});

// Salary build
const sr=document.getElementById('salRows');
SAL.forEach(s=>{
  const row=document.createElement('div');
  row.className='sal-row anim-on-scroll';
  row.innerHTML=`<div class="sal-yr">${s.yr}</div>
    <div class="sal-role">${s.role}</div>
    <div class="sal-bar-w"><div class="sal-bar" data-w="${s.pct}"></div></div>
    <div class="sal-amt">${s.india}</div>`;
  sr.appendChild(row);
});

// Intersection Observer for scroll animations
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      const bar = e.target.querySelector('.sal-bar');
      if (bar) setTimeout(() => { bar.style.width = bar.dataset.w + '%'; }, 300);
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.2 });
document.querySelectorAll('.anim-on-scroll').forEach(el => observer.observe(el));

function showMonth(i, pillEl){
  document.querySelectorAll('.pill').forEach((p,pi)=>p.classList.toggle('active',pi===i));
  document.querySelectorAll('.month-card').forEach((c,ci)=>c.classList.toggle('show',ci===i));
  if(pillEl && window.innerWidth < 850) { pillEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); }
  document.querySelectorAll('.tr-dot').forEach((d,di)=>{
    d.classList.remove('done','current');
    if(di<i) d.classList.add('done'); else if(di===i) d.classList.add('current');
  });
}

function toggleWeek(id){
  const el = document.getElementById(id);
  const wasOpen = el.classList.contains('open');
  el.parentElement.querySelectorAll('.week-block').forEach(w => w.classList.remove('open'));
  if(!wasOpen) el.classList.add('open');
}

function scrollToMonth(i){
  showMonth(i, document.querySelectorAll('.pill')[i]);
  const offset = window.innerWidth < 768 ? 100 : 150;
  const y = document.getElementById('months-strip').getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({top: y, behavior: 'smooth'});
}
document.getElementById('wk0_0')?.classList.add('open');

function updateLiveTime() {
  const now = new Date();
  document.getElementById('liveClock').innerText = now.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric'}) + ' • ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit'});
  const diff = (10 * 30 * 24 * 60 * 60 * 1000) - ((typeof savedTasks !== "undefined" ? savedTasks.length : 0) * 24 * 60 * 60 * 1000); // Mock target based on progress
  document.getElementById('liveCountdown').innerText = diff > 0 ? `Target (10 Months): ${Math.floor(diff / 86400000)} days go` : "Target Reached! 🚀";
}
setInterval(updateLiveTime, 1000); updateLiveTime();

// --- AUTH & TASK TRACKING LOGIC --- //
var savedTasks = [];

async function loadProgressFromAPI() {
  if (!isAuthenticated()) {
    return;
  }
  try {
    const response = await fetch('/api/progress', {
      headers: { 'Authorization': 'Bearer ' + getToken() }
    });
    if (!response.ok) throw new Error("Failed to load progress.");
    const data = await response.json();
    savedTasks = data.tasks || [];
    savedTasks.forEach(taskId => {
      const cb = document.getElementById(taskId);
      if(cb) { cb.checked = true; document.getElementById('label_' + taskId).classList.add('completed'); }
    });
    MC.forEach((_, i) => updateMonthProgress(i));
    
    // Enable admin mode visually for the user
    document.querySelectorAll('.task-label').forEach(lbl => lbl.classList.add('admin-mode'));
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) {
        adminBtn.classList.add('active');
        adminBtn.innerText = `Logged in as ${getUsername()} [Logout]`;
        adminBtn.onclick = logout;
    }
  } catch (error) { console.error("Cloud load failed.", error); }
}

window.enableAdmin = function() {
  if(!isAuthenticated()) createAuthModal();
};

window.toggleTask = async function(taskId, monthIndex) {
  if (!isAuthenticated()) {
    createAuthModal();
    const cb = document.getElementById(taskId);
    cb.checked = !cb.checked; // revert
    return;
  }

  const cb = document.getElementById(taskId);
  const label = document.getElementById('label_' + taskId);
  if(cb.checked) { label.classList.add('completed'); playClickSound(); } else { label.classList.remove('completed'); }
  
  if(cb.checked) { if (!savedTasks.includes(taskId)) savedTasks.push(taskId); } else { savedTasks = savedTasks.filter(id => id !== taskId); }

  updateMonthProgress(monthIndex);

  if (cb.checked) {
    const parts = taskId.split('_');
    const weekId = `wk${parts[1]}_${parts[2]}`; 
    const weekBlock = document.getElementById(weekId);
    if (weekBlock) {
      const allWeekTasks = Array.from(weekBlock.querySelectorAll('input[type="checkbox"]'));
      const allChecked = allWeekTasks.every(checkbox => checkbox.checked);
      if (allChecked) {
        playLevelUpSound();
        var duration = 3000; var end = Date.now() + duration;
        (function frame() {
          confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0, y: 0.8 }, colors: ['#3b82f6', '#8b5cf6', '#10b981'] });
          confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1, y: 0.8 }, colors: ['#ec4899', '#06b6d4', '#f59e0b'] });
          if (Date.now() < end) requestAnimationFrame(frame);
        }());
      }
    }
  }

  const adminBtn = document.getElementById('adminBtn');
  adminBtn.innerText = "Saving... ⏳";
  try {
    const response = await fetch('/api/progress', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() }, 
      body: JSON.stringify({ tasks: savedTasks })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    adminBtn.innerText = `Logged in as ${getUsername()} [Logout]`;
  } catch (err) { 
    console.error(err);
    adminBtn.innerText = "Save Error ⚠️"; 
  }
};

window.updateMonthProgress = function(monthIndex) {
  const month = MC[monthIndex];
  const totalTasks = month.weeks.reduce((acc, wk) => acc + wk.tasks.length, 0);
  let completedTasks = 0;
  month.weeks.forEach((wk, wi) => { wk.tasks.forEach((t, ti) => {
      if(savedTasks.includes(`task_${monthIndex}_${wi}_${ti}`)) completedTasks++;
  }); });
  const pct = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const textEl = document.getElementById(`prog-text-m${monthIndex}`);
  const pctEl = document.getElementById(`prog-pct-m${monthIndex}`);
  const fillEl = document.getElementById(`prog-fill-m${monthIndex}`);
  if(textEl) textEl.textContent = `${completedTasks} / ${totalTasks} Tasks Completed`;
  if(pctEl) pctEl.textContent = `${pct}%`;
  if(fillEl) fillEl.style.width = `${pct}%`;
  updatePlayerStats();
  if(typeof updateSkillRadar === 'function') updateSkillRadar();
  if(typeof updateDeathClock === 'function') updateDeathClock();
};

window.updatePlayerStats = function() {
  let totalPossibleTasks = 0;
  MC.forEach(m => { m.weeks.forEach(w => { totalPossibleTasks += w.tasks.length; }); });
  const xpPerTask = 10;
  const maxXP = totalPossibleTasks * xpPerTask;
  const currentXP = savedTasks.length * xpPerTask;
  const level = Math.floor(currentXP / 35) + 1;
  
  let title = "CSE Student";
  if (level >= 5)  title = "Script Kiddie";
  if (level >= 10) title = "Data Wrangler";
  if (level >= 18) title = "Feature Engineer";
  if (level >= 25) title = "Model Builder";
  if (level >= 35) title = "Tensor Tamer";
  if (level >= 42) title = "Deep Learning Knight";
  if (level >= 50) title = "AI Architect";
  
  document.getElementById('pl-lvl').innerText = level;
  document.getElementById('pl-title').innerText = title;
  document.getElementById('pl-xp').innerText = currentXP;
  document.getElementById('pl-max').innerText = maxXP;
  
  const pct = Math.min((currentXP / maxXP) * 100, 100);
  document.getElementById('pl-bar').style.width = pct + '%';
};

loadProgressFromAPI();

// --- RESPONSIVE POMODORO LOGIC & DRAG --- //
let pomoTime = 50 * 60; 
let isPomoRunning = false;
let pomoInterval;
let isWorkMode = true;

const timeDisplay = document.getElementById('pomoTime');
const btnStart = document.getElementById('pomoStart');
const btnMode = document.getElementById('pomoMode');
const widget = document.getElementById('pomoWidget');
const toggleIconBtn = document.getElementById('pomoToggleIcon');
const closeBtn = document.getElementById('pomoClose');

function checkMobilePomo() {
  if (window.innerWidth <= 768) { widget.classList.add('mobile-collapsed'); } 
  else { widget.classList.remove('mobile-collapsed'); }
}
checkMobilePomo(); window.addEventListener('resize', checkMobilePomo);

toggleIconBtn.onclick = (e) => {
  e.stopPropagation(); widget.classList.remove('mobile-collapsed'); playClickSound();
};
closeBtn.onclick = (e) => {
  e.stopPropagation(); if (window.innerWidth <= 768) { widget.classList.add('mobile-collapsed'); }
};

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

btnStart.onclick = () => {
  if (isPomoRunning) {
    clearInterval(pomoInterval);
    btnStart.innerText = "Start"; btnStart.classList.remove('running');
    widget.classList.remove('active'); document.body.classList.remove('focus-mode');
  } else {
    btnStart.innerText = "Pause"; btnStart.classList.add('running');
    if (isWorkMode) { widget.classList.add('active'); document.body.classList.add('focus-mode'); }
    pomoInterval = setInterval(() => {
      pomoTime--; timeDisplay.innerText = formatTime(pomoTime);
      if (pomoTime <= 0) {
        clearInterval(pomoInterval); playLevelUpSound(); 
        alert(isWorkMode ? "Deep Work Complete! Take a break." : "Break over! Back to war.");
        btnStart.click(); 
      }
    }, 1000);
  }
  isPomoRunning = !isPomoRunning;
};

document.getElementById('pomoReset').onclick = () => {
  clearInterval(pomoInterval); isPomoRunning = false;
  btnStart.innerText = "Start"; btnStart.classList.remove('running');
  widget.classList.remove('active'); document.body.classList.remove('focus-mode');
  pomoTime = isWorkMode ? 50 * 60 : 10 * 60; timeDisplay.innerText = formatTime(pomoTime);
};

btnMode.onclick = () => {
  isWorkMode = !isWorkMode; btnMode.innerText = isWorkMode ? "Break" : "Work";
  document.getElementById('pomoReset').click();
};

const header = document.getElementById('pomoHeader');
let isDragging = false, currentX = 0, currentY = 0, initialX, initialY, xOffset = 0, yOffset = 0;

header.addEventListener('mousedown', dragStart); header.addEventListener('touchstart', dragStart, {passive: true});
document.addEventListener('mouseup', dragEnd); document.addEventListener('touchend', dragEnd);
document.addEventListener('mousemove', drag); document.addEventListener('touchmove', drag, {passive: false});

function dragStart(e) {
  if (window.innerWidth <= 768) return; 
  if (e.type === "touchstart") { initialX = e.touches[0].clientX - xOffset; initialY = e.touches[0].clientY - yOffset; } 
  else { initialX = e.clientX - xOffset; initialY = e.clientY - yOffset; }
  if (e.target === header || header.contains(e.target)) isDragging = true;
}
function dragEnd() { initialX = currentX; initialY = currentY; isDragging = false; }
function drag(e) {
  if (isDragging) {
    e.preventDefault();
    if (e.type === "touchmove") { currentX = e.touches[0].clientX - initialX; currentY = e.touches[0].clientY - initialY; } 
    else { currentX = e.clientX - initialX; currentY = e.clientY - initialY; }
    xOffset = currentX; yOffset = currentY;
    widget.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
  }
}

// --- SCI-FI AUDIO ENGINE --- //
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
window.playClickSound = function() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator(); const gainNode = audioCtx.createGain();
  osc.connect(gainNode); gainNode.connect(audioCtx.destination);
  osc.type = 'sine'; osc.frequency.setValueAtTime(800, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);
  gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
  osc.start(); osc.stop(audioCtx.currentTime + 0.1);
};
window.playLevelUpSound = function() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator(); const gainNode = audioCtx.createGain();
  osc.connect(gainNode); gainNode.connect(audioCtx.destination);
  osc.type = 'triangle'; const now = audioCtx.currentTime;
  osc.frequency.setValueAtTime(440, now); osc.frequency.setValueAtTime(554.37, now + 0.1); osc.frequency.setValueAtTime(659.25, now + 0.2); osc.frequency.setValueAtTime(880, now + 0.3);
  gainNode.gain.setValueAtTime(0, now); gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05); gainNode.gain.setValueAtTime(0.2, now + 0.3); gainNode.gain.linearRampToValueAtTime(0, now + 0.8);
  osc.start(now); osc.stop(now + 0.8);
};

// --- SKILL RADAR ENGINE --- //
let skillChart;
function initSkillRadar() {
  const ctx = document.getElementById('skillRadar').getContext('2d');
  skillChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Math & Theory', 'Model Architecture', 'Data Engineering', 'MLOps', 'Deployment'],
      datasets: [{
        label: 'Current Skill Level', data: [0, 0, 0, 0, 0],
        backgroundColor: 'rgba(6, 182, 212, 0.2)', borderColor: '#06b6d4',
        pointBackgroundColor: '#ef4444', pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff', pointHoverBorderColor: '#ef4444', borderWidth: 2,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        r: {
          angleLines: { color: 'rgba(255, 255, 255, 0.1)' }, grid: { color: 'rgba(255, 255, 255, 0.1)' },
          pointLabels: { color: '#94a3b8', font: { family: "'Space Grotesk', sans-serif", size: window.innerWidth < 768 ? 9 : 11, weight: 'bold' } },
          ticks: { display: false, min: 0, max: 100 }
        }
      },
      plugins: { legend: { display: false } }
    }
  });
}

function updateSkillRadar() {
  if (!skillChart) return;
  let skills = { math: 0, models: 0, data: 0, mlops: 0, deploy: 0 };
  let maxSkills = { math: 0, models: 0, data: 0, mlops: 0, deploy: 0 };
  const categoryMap = { 0: 'math', 1: 'models', 2: 'models', 3: 'models', 4: 'data', 5: 'mlops', 6: 'models', 7: 'deploy', 8: 'math', 9: 'deploy' };

  MC.forEach((month, mIdx) => {
    const cat = categoryMap[mIdx];
    month.weeks.forEach((wk, wIdx) => {
      wk.tasks.forEach((t, tIdx) => {
        maxSkills[cat]++;
        if (savedTasks.includes(`task_${mIdx}_${wIdx}_${tIdx}`)) skills[cat]++;
      });
    });
  });

  const mathPct = maxSkills.math ? (skills.math / maxSkills.math) * 100 : 0;
  const modelPct = maxSkills.models ? (skills.models / maxSkills.models) * 100 : 0;
  const dataPct = maxSkills.data ? (skills.data / maxSkills.data) * 100 : 0;
  const mlopsPct = maxSkills.mlops ? (skills.mlops / maxSkills.mlops) * 100 : 0;
  const deployPct = maxSkills.deploy ? (skills.deploy / maxSkills.deploy) * 100 : 0;

  skillChart.data.datasets[0].data = [mathPct, modelPct, dataPct, mlopsPct, deployPct];
  skillChart.update();
}
setTimeout(() => { initSkillRadar(); updateSkillRadar(); }, 500);

// --- DEATH CLOCK ENGINE --- //
window.updateDeathClock = function() {
  const startDate = localStorage.getItem('roadmap_start') || new Date().getTime(); if(!localStorage.getItem('roadmap_start')) localStorage.setItem('roadmap_start', startDate);
  const endDate = parseInt(startDate) + (10 * 30 * 24 * 60 * 60 * 1000);
  const now = new Date().getTime();
  
  const totalDuration = endDate - startDate;
  let timePassed = now - parseInt(startDate);
  if (timePassed < 0) timePassed = 0; 
  if (timePassed > totalDuration) timePassed = totalDuration;
  
  const timePct = (timePassed / totalDuration) * 100;
  let totalPossibleTasks = 0;
  MC.forEach(m => { m.weeks.forEach(w => { totalPossibleTasks += w.tasks.length; }); });
  const taskPct = (savedTasks.length / totalPossibleTasks) * 100;
  
  document.getElementById('timeFill').style.width = timePct + '%';
  document.getElementById('timeBurnPct').innerText = timePct.toFixed(2) + '%';
  document.getElementById('taskFill').style.width = taskPct + '%';
  document.getElementById('taskVelPct').innerText = taskPct.toFixed(2) + '%';
  
  const dcStatus = document.getElementById('dcStatus');
  if (timePct > (taskPct + 0.5) && timePct > 0) {
    document.body.classList.add('behind-schedule');
    dcStatus.innerText = "⚠️ BEHIND SCHEDULE";
  } else {
    document.body.classList.remove('behind-schedule');
    dcStatus.innerText = "ON TRACK ⚡";
  }
};
// Expose globals for inline HTML event handlers
window.showMonth = typeof showMonth !== 'undefined' ? showMonth : window.showMonth;
window.toggleWeek = typeof toggleWeek !== 'undefined' ? toggleWeek : window.toggleWeek;
window.scrollToMonth = typeof scrollToMonth !== 'undefined' ? scrollToMonth : window.scrollToMonth;
window.enableAdmin = typeof enableAdmin !== 'undefined' ? enableAdmin : window.enableAdmin;
window.toggleTask = typeof toggleTask !== 'undefined' ? toggleTask : window.toggleTask;
window.updateMonthProgress = typeof updateMonthProgress !== 'undefined' ? updateMonthProgress : window.updateMonthProgress;
window.updatePlayerStats = typeof updatePlayerStats !== 'undefined' ? updatePlayerStats : window.updatePlayerStats;
window.playClickSound = typeof playClickSound !== 'undefined' ? playClickSound : window.playClickSound;
window.playLevelUpSound = typeof playLevelUpSound !== 'undefined' ? playLevelUpSound : window.playLevelUpSound;
window.updateDeathClock = typeof updateDeathClock !== 'undefined' ? updateDeathClock : window.updateDeathClock;
