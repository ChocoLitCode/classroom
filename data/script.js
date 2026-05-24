
let lightsOn = true;
let doorLocked = false;
let systemUnlocked = false;

const socket = new WebSocket(`ws://${location.hostname}/ws`);

socket.onopen = () => {
  console.log("ESP32 Connected");

  // Request sync
  if (socket.readyState === WebSocket.OPEN) {
    console.log("Waiting for state sync...");
  }
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  console.log(data);

  if (data.light) {
    lightsOn = data.light === "ON";
    toggleLightsUI(lightsOn);

  }

  if (data.rfid) {
    systemUnlocked = data.rfid === "UNLOCKED";
    doorLocked = !systemUnlocked;
    if (data.user) {
      document.getElementById('door-by').textContent = `by ${data.user}`;
    }
    updateDoorUI();
    console.log("RFID STATUS:", data.rfid);
  }

  if (data.door) {
    const status = document.getElementById('door-status');
    status.textContent = data.door === "OPEN" ? "Door Open" : "Door Closed";
  }

};

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
  if (!systemUnlocked) {
    console.log("RFID LOCKED");
    return;

  }
  if (socket.readyState === WebSocket.OPEN) {
    socket.send("LIGHT");
    console.log("LIGHT COMMAND SENT");
  } else {
    console.log("WEBSOCKET NOT CONNECTED");
  }

}

function toggleLightsUI(state) {
  lightsOn = state;
  lightsSince = Date.now();

  const chip = document.getElementById('lights-chip');
  const val = document.getElementById('lights-val');
  const btn = document.getElementById('btn-lights');
  const lbl = document.getElementById('btn-lights-label');
  const icon = document.getElementById('btn-lights-icon');
  chip.classList.remove('off');
  btn.classList.remove('active-light');

  if (lightsOn) {
    val.textContent = 'On';
    lbl.textContent = 'Turn off lights';
    icon.src = './assets/light-on.svg';
    btn.classList.add('active-light');

  } else {
    val.textContent = 'Off';
    lbl.textContent = 'Turn on lights';
    icon.src = './assets/light-off.svg';
    chip.classList.add('off');
  }

}

// Track when lights state last changed
let lightsSince = Date.now();

function updateLightsSince() {
  const elapsed = Date.now() - lightsSince;
  const totalSeconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  let duration = '';
  if (days > 0) duration = `${days}d ${hours % 24}hrs`;
  else if (hours > 0) duration = `${hours}hrs ${minutes % 60}min`;
  else if (minutes > 0) duration = `${minutes}min`;
  else duration = 'just now';

  const text = duration === 'just now'
    ? `just now`
    : `for ${duration}`;

  document.querySelector('#lights-chip .chip-since').textContent = text;
}

/* ── Door Toggle ── */
function toggleDoor() {
  // Instead of toggling directly, open RFID prompt first
  if (doorLocked) {
    const action = doorLocked ? 'Unlock' : 'Lock';
    document.getElementById('rfid-title').textContent = `Tap or Enter RFID to ${action} Door`;
    document.getElementById('rfid-input').value = '';
    document.getElementById('rfid-overlay').classList.add('open');
    return;
  }

  if (socket.readyState === WebSocket.OPEN) {
    socket.send("LOCK");
    console.log("LOCK COMMAND SENT");
  }
}

/* ── Door Toggle ── */
function updateDoorUI() {
  const status = document.getElementById('door-status');
  const chip = document.getElementById('door-chip');
  const val = document.getElementById('door-val');
  const btn = document.getElementById('btn-door');
  const lbl = document.getElementById('btn-door-label');
  const icon = document.getElementById('btn-door-icon');

  if (doorLocked) {
    val.textContent = 'Locked';
    chip.className = 'chip locked';
    btn.className = 'ctrl-btn active-locked';
    lbl.textContent = 'Unlock door';
    icon.src = './assets/lock-close.svg';

  }

  else {
    val.textContent = 'Unlocked';
    chip.className = 'chip';
    btn.className = 'ctrl-btn';
    lbl.textContent = 'Lock door';
    icon.src = './assets/lock-open.svg';

  }

}

function closeRFID() {
  document.getElementById('rfid-overlay').classList.remove('open');
  document.getElementById('rfid-input').value = '';
}

function rfidType(char) {
  const input = document.getElementById('rfid-input');
  input.value += char;
}

function rfidClear() {
  const input = document.getElementById('rfid-input');
  input.value = input.value.slice(0, -1);
}

function rfidSubmit() {
  const input = document.getElementById('rfid-input');
  const val = input.value.trim();
  const popup = document.getElementById('rfid-popup');

  // Validate — empty or too short
  if (val === '' || val.length < 4) {
    // Trigger wiggle + red outline
    popup.classList.remove('error');         // reset first in case it's already on
    void popup.offsetWidth;                  // force reflow so animation restarts
    popup.classList.add('error');

    // Remove error state after animation finishes
    setTimeout(() => popup.classList.remove('error'), 600);
    return;
  }

  socket.send(`RFID:${val}`);
  closeRFID();

}


/* ── Today's Day Key ── */
const dayMap = { 0: null, 1: 'M', 2: 'T', 3: 'W', 4: 'Th', 5: 'F', 6: 'Sat' };
const todayKey = dayMap[new Date().getDay()];

/* ── Show Schedule ── */
function showSchedule(event, day) {
  const popup = document.getElementById('schedule-popup');
  const allBtns = document.querySelectorAll('.day-btn');
  const clicked = event.target;

  const alreadyActive = clicked.classList.contains('active') && popup.classList.contains('open');

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

  // Position popup centered under clicked button
  const section = document.querySelector('.schedule-section');
  const btnRect = clicked.getBoundingClientRect();
  const secRect = section.getBoundingClientRect();
  const centerX = btnRect.left + btnRect.width / 2 - secRect.left;
  popup.style.left = centerX + 'px';
  popup.style.transform = 'translateX(-50%)';

  // Read schedule from HTML data attributes
  const dayData = document.querySelector(`.schedule-data [data-day="${day}"]`);
  const items = dayData ? [...dayData.children] : [];

  const list = document.getElementById('schedule-list');
  list.innerHTML = items.map(item => `
    <div class="schedule-item">
      <span class="schedule-subject">${item.dataset.subject}</span>
      <span class="schedule-meta">${item.dataset.meta}</span>
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
updateLightsSince();
setInterval(updateClock, 10000);
setInterval(updateLightsSince, 1000);