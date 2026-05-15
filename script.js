let lightsOn = true;
let doorLocked = false;

/* ── Clock ── */
function updateClock() {
  const now = new Date();
  let h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  document.getElementById('time-display').textContent = h + ':' + m + ampm;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now2 = new Date();
  document.getElementById('date-display').textContent =
    months[now2.getMonth()] + ' ' + now2.getDate() + ', ' + now2.getFullYear();
}

/* ── Lights Toggle ── */
function toggleLights() {
  lightsOn = !lightsOn;
  const chip = document.getElementById('lights-chip');
  const val  = document.getElementById('lights-val');
  const btn  = document.getElementById('btn-lights');
  const lbl  = document.getElementById('btn-lights-label');
  const icon = document.getElementById('btn-lights-icon');

  if (lightsOn) {
    val.textContent = 'On';
    chip.className  = 'chip';
    btn.className   = 'ctrl-btn active-light';
    lbl.textContent = 'Turn off lights';
    icon.src        = 'assets/light-on.svg';
  } else {
    val.textContent = 'Off';
    chip.className  = 'chip off';
    btn.className   = 'ctrl-btn';
    lbl.textContent = 'Turn on lights';
    icon.src        = 'assets/light-off.svg';
  }
}

/* ── Door Toggle ── */
function toggleDoor() {
  doorLocked = !doorLocked;
  const chip = document.getElementById('door-chip');
  const val  = document.getElementById('door-val');
  const btn  = document.getElementById('btn-door');
  const icon = document.getElementById('btn-door-icon');
  const lbl  = document.getElementById('btn-door-label');

  if (doorLocked) {
    val.textContent = 'Locked';
    chip.className  = 'chip locked';
    btn.className   = 'ctrl-btn active-locked';
    icon.src        = 'assets/lock-close.svg';
    lbl.textContent = 'Unlock door';
  } else {
    val.textContent = 'Unlocked';
    chip.className  = 'chip';
    btn.className   = 'ctrl-btn';
    icon.src        = 'assets/lock-open.svg';
    lbl.textContent = 'Lock door';
  }
}

/* ── Schedule Data ── */
const schedule = {
  M: [
    { subject: 'Mathematics',    meta: '7:00AM – 8:30AM  |  Prof. Santos' },
    { subject: 'English',        meta: '9:00AM – 10:00AM  |  Prof. Reyes' },
    { subject: 'Contemporary',             meta: '11:00AM – 12:00PM  |  Prof. Cruz' },
  ],
  T: [
    { subject: 'Science',        meta: '7:00AM – 8:30AM  |  Prof. Lim' },
    { subject: 'History',        meta: '9:00AM – 10:00AM  |  Prof. Gomez' },
    { subject: 'Art',            meta: '11:00AM – 12:00PM  |  Prof. Tan' },
    { subject: 'Music',          meta: '1:00PM – 2:00PM  |  Prof. Vega' },
  ],
  W: [
    { subject: 'Mathematics',    meta: '7:00AM – 8:30AM  |  Prof. Santos' },
    { subject: 'Music',          meta: '9:00AM – 10:00AM  |   Vega' },
    { subject: 'Science',        meta: '11:00AM – 12:00PM  |  Prof. Lim' },
  ],
  Th: [
    { subject: 'Microprocessor', meta: '9:00AM – 10:00AM  |  Prof. Brenda Maxine' },
    { subject: 'English',        meta: '10:00AM – 11:00AM  |  Prof. Reyes' },
    { subject: 'History',        meta: '1:00PM – 2:00PM  |  Prof. Gomez' },
    { subject: 'Contemporary',             meta: '2:00PM – 3:00PM  |  Prof. Cruz' },
  ],
  F: [
    { subject: 'Art',            meta: '7:00AM – 8:30AM  |  Prof. Tan' },
    { subject: 'Mathematics',    meta: '9:00AM – 10:00AM  |  Prof. Santos' },
    { subject: 'Music',          meta: '11:00AM – 12:00PM  |  Prof. Vega' },
  ],
  Sat: [
    { subject: 'Mathematics',    meta: '7:00AM – 8:30AM  |  Prof. Santos' },
  ],
};

/* ── Today's Day Key ── */
const dayMap = { 0: null, 1: 'M', 2: 'T', 3: 'W', 4: 'Th', 5: 'F', 6: 'Sat' };
const todayKey = dayMap[new Date().getDay()];

/* ── Show Schedule ── */
function showSchedule(event, day) {
  const popup   = document.getElementById('schedule-popup');
  const allBtns = document.querySelectorAll('.day-btn');
  const clicked = event.target;

  const alreadyActive = clicked.classList.contains('active') && popup.classList.contains('open');

  // Reset all, then always restore today's teal
  allBtns.forEach(b => {
    b.classList.remove('active');
    if (b.textContent.trim() === todayKey) b.classList.add('active');
  });

  if (alreadyActive) {
    popup.classList.remove('open');
    return;
  }

  if (clicked.textContent.trim() !== todayKey) {
    clicked.classList.add('active');
  }

  // Position popup centered under the clicked button
  const section = document.querySelector('.schedule-section');
  const btnRect  = clicked.getBoundingClientRect();
  const secRect  = section.getBoundingClientRect();
  const centerX  = btnRect.left + btnRect.width / 2 - secRect.left;
  popup.style.left      = centerX + 'px';
  popup.style.transform = 'translateX(-50%)';

  // Render schedule items
  const list = document.getElementById('schedule-list');
  list.innerHTML = schedule[day].map(c => `
  <div class="schedule-item">
    <span class="schedule-subject">${c.subject}</span>
    <span class="schedule-meta">${c.meta}</span>
  </div>
`).join('');

  popup.classList.add('open');
}
/* ── Auto-highlight Today on Load ── */
window.addEventListener('DOMContentLoaded', () => {
  if (todayKey) {
    const todayBtn = [...document.querySelectorAll('.day-btn')]
      .find(b => b.textContent.trim() === todayKey);
    if (todayBtn) todayBtn.classList.add('active');
  }
});

updateClock();
setInterval(updateClock, 10000);