/* ── WAVE BACKGROUND ── */
const canvas = document.getElementById('waves');
const ctx = canvas.getContext('2d');
let W, H, t = 0;

function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
resize();
window.addEventListener('resize', resize);

function drawWaves() {
  ctx.clearRect(0, 0, W, H);
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#5ba3e8');
  sky.addColorStop(.5, '#3d7fc4');
  sky.addColorStop(1, '#2a5fa0');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  [
    {amp:28, freq:.012, speed:.018, y:H*.55, a:.10},
    {amp:22, freq:.018, speed:.024, y:H*.62, a:.08},
    {amp:18, freq:.022, speed:.030, y:H*.70, a:.06},
    {amp:14, freq:.030, speed:.040, y:H*.78, a:.05}
  ].forEach(w => {
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 4) {
      const y = w.y + Math.sin(x * w.freq + t * w.speed) * w.amp + Math.sin(x * w.freq * 1.6 + t * w.speed * 1.3) * w.amp * .5;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fillStyle = `rgba(255,255,255,${w.a})`;
    ctx.fill();
  });
  t++;
  requestAnimationFrame(drawWaves);
}
drawWaves();

/* ── CLOCK ── */
function updateClock() {
  const d = new Date();
  const h = d.getHours() % 12 || 12;
  const m = String(d.getMinutes()).padStart(2, '0');
  const a = d.getHours() >= 12 ? 'PM' : 'AM';
  const str = `${h}:${m} ${a}`;
  document.getElementById('clock').textContent = str;
  const hc = document.getElementById('home-clock');
  if (hc) hc.textContent = `online · seoul · ${str}`;
}
updateClock();
setInterval(updateClock, 10000);

/* ── WINDOW MANAGEMENT ── */
let zTop = 100;
const winIdx = {
  'win-home': 0, 'win-writing': 1, 'win-projects': 2,
  'win-papers': 3, 'win-diary': 4, 'win-about': 5, 'win-mail': 6
};
const winPrev = {};

function focusWin(id) {
  document.querySelectorAll('.win').forEach(w => w.classList.remove('focused'));
  const w = document.getElementById(id);
  if (w) { w.classList.add('focused'); w.style.zIndex = ++zTop; }
}

function openWin(id) {
  const w = document.getElementById(id);
  if (!w) return;
  if (!w.classList.contains('open')) {
    w.classList.add('open');
    const i = winIdx[id];
    if (i !== undefined) {
      const dots = document.querySelectorAll('.d-dot');
      if (dots[i]) dots[i].classList.add('open');
    }
  }
  focusWin(id);
}

/* window buttons */
document.querySelectorAll('.wc').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const act = btn.dataset.action, wid = btn.dataset.win;
    const w = document.getElementById(wid);
    if (!w) return;
    if (act === 'close') {
      w.classList.remove('open', 'focused');
      const i = winIdx[wid];
      if (i !== undefined) {
        const dots = document.querySelectorAll('.d-dot');
        if (dots[i]) dots[i].classList.remove('open');
      }
      delete winPrev[wid];
      w._maximized = false;
    } else if (act === 'max') {
      if (w._maximized) {
        Object.assign(w.style, winPrev[wid]);
        w._maximized = false;
      } else {
        winPrev[wid] = { top: w.style.top, left: w.style.left, width: w.style.width, height: w.style.height || '' };
        const mb = 22, dock = document.getElementById('dock').offsetHeight + 16;
        Object.assign(w.style, { top: mb + 'px', left: '0px', width: '100vw', height: `calc(100vh - ${mb + dock}px)` });
        w._maximized = true;
      }
    }
  });
});

document.querySelectorAll('.win').forEach(w => {
  w.addEventListener('mousedown', () => focusWin(w.id));
});

/* ── DRAG ── */
document.querySelectorAll('.win-bar').forEach(bar => {
  let drag = false, ox = 0, oy = 0;
  bar.addEventListener('mousedown', e => {
    if (e.target.classList.contains('wc')) return;
    const w = document.getElementById(bar.dataset.win);
    if (w._maximized) return;
    drag = true;
    focusWin(bar.dataset.win);
    const r = w.getBoundingClientRect();
    ox = e.clientX - r.left;
    oy = e.clientY - r.top;
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!drag) return;
    const w = document.getElementById(bar.dataset.win);
    w.style.left = (e.clientX - ox) + 'px';
    w.style.top = Math.max(22, e.clientY - oy) + 'px';
  });
  document.addEventListener('mouseup', () => { drag = false; });
});

/* ── DOCK DOUBLE-CLICK + SELECT ── */
let selIco = null;
document.querySelectorAll('.d-ico').forEach(ico => {
  let clicks = 0, timer = null;
  ico.addEventListener('click', () => {
    clicks++;
    if (clicks === 1) {
      if (selIco) selIco.classList.remove('selected');
      selIco = ico;
      ico.classList.add('selected');
      timer = setTimeout(() => { clicks = 0; }, 350);
    } else {
      clearTimeout(timer);
      clicks = 0;
      const wid = ico.dataset.win;
      const href = ico.dataset.href;
      if (wid) openWin(wid);
      else if (href) window.open(href, '_blank');
    }
  });
});

document.getElementById('desktop').addEventListener('click', e => {
  if (!e.target.closest('.d-ico') && selIco) {
    selIco.classList.remove('selected');
    selIco = null;
  }
});

/* ── DOCK MAGNIFICATION ── */
const BASE = 40, PEAK = 64;
document.getElementById('dock').addEventListener('mousemove', e => {
  document.querySelectorAll('.d-ico-img').forEach(img => {
    const r = img.closest('.d-ico').getBoundingClientRect();
    const dist = Math.abs(e.clientX - (r.left + r.width / 2));
    const sz = dist < 80 ? BASE + (PEAK - BASE) * Math.cos((dist / 80) * (Math.PI / 2)) : BASE;
    img.style.fontSize = sz + 'px';
  });
});
document.getElementById('dock').addEventListener('mouseleave', () => {
  document.querySelectorAll('.d-ico-img').forEach(i => i.style.fontSize = BASE + 'px');
});

/* ── MAIL ── */
function sendMail() {
  const from = document.getElementById('mail-from').value.trim();
  const subj = document.getElementById('mail-subj').value.trim();
  const body = document.getElementById('mail-body').value.trim();
  if (!body) { alert('메시지를 입력해줘!'); return; }
  const mailto = `mailto:sorakim.lab@gmail.com?subject=${encodeURIComponent(subj || '(no subject)')}&body=${encodeURIComponent(body + (from ? '\n\nfrom: ' + from : ''))}`;
  window.open(mailto);
}
