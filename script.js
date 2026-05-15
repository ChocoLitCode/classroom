let lightsOn = true;
let doorLocked = false;

function updateClock() {
  const now = new Date();
  let h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  document.getElementById('time-display').textContent = h + ':' + m + ampm;

  const days = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now2 = new Date();
  document.getElementById('date-display').textContent =
    days[now2.getDay()] + ' | ' + months[now2.getMonth()] + ' ' +
    now2.getDate() + ', ' + now2.getFullYear();
}

function setPrompt(msg) {
  const el = document.getElementById('system-prompt');
  el.innerHTML = '<span style="color:#111;">' + msg + '</span>';
  setTimeout(() => {
    el.innerHTML = '<span style="opacity:0.6">System prompt appears here…</span>';
  }, 3000);
}

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
  setPrompt('Lights turned ON.');
} else {
  val.textContent = 'Off';
  chip.className  = 'chip off';
  btn.className   = 'ctrl-btn';
  lbl.textContent = 'Turn on lights';
  icon.src        = 'assets/light-off.svg';   
  setPrompt('Lights turned OFF.');
}
}

function toggleDoor() {
  doorLocked = !doorLocked;
  const chip = document.getElementById('door-chip');
  const val  = document.getElementById('door-val');
  const btn  = document.getElementById('btn-door');
  const icon = document.getElementById('btn-door-icon');
  const lbl  = document.getElementById('btn-door-label');

  if (doorLocked) {
    val.textContent  = 'Locked';
    chip.className   = 'chip locked';
    btn.className    = 'ctrl-btn active-locked';
    icon.src = 'assets/lock-close.svg';
    lbl.textContent  = 'Unlock door';
    setPrompt('Door locked successfully.');
  } else {
    val.textContent  = 'Unlocked';
    chip.className   = 'chip';
    btn.className    = 'ctrl-btn';
    icon.src = 'assets/lock-open.svg';
    lbl.textContent  = 'Lock door';
    setPrompt('Door unlocked.');
  }
}

updateClock();
setInterval(updateClock, 10000);