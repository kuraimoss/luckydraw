// app.js - Random Name Picker Wheel (frontend)

const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const wheelCanvas = canvas;

// ==== RESOLUSI & UKURAN WHEEL (HD) ====
const DPR = window.devicePixelRatio || 1;
const VIEW_SIZE = 800; // ukuran logis / tampilan (px)

wheelCanvas.width = VIEW_SIZE * DPR;
wheelCanvas.height = VIEW_SIZE * DPR;
wheelCanvas.style.width = VIEW_SIZE + 'px';
wheelCanvas.style.height = VIEW_SIZE + 'px';

// skalakan context ke koordinat logis (0..VIEW_SIZE)
ctx.scale(DPR, DPR);

// Input & kontrol peserta
const singleNameInput = document.getElementById('singleNameInput');
const addSingleBtn = document.getElementById('addSingleBtn');
const bulkNames = document.getElementById('bulkNames');
const addBulkBtn = document.getElementById('addBulkBtn');
const clearBtn = document.getElementById('clearBtn');
const participantsList = document.getElementById('participantsList');
const countLabel = document.getElementById('countLabel');

// Wheel & hasil
const resultBox = document.getElementById('resultBox');
const pointerButton = document.getElementById('pointerButton');
const shuffleBtn = document.getElementById('shuffleBtn');

// Pengaturan wheel
const speedRange = document.getElementById('speedRange');
const speedLabel = document.getElementById('speedLabel');
const fullscreenBtn = document.getElementById('fullscreenBtn');

// Sidebar pengaturan
const settingsSidebar = document.getElementById('settingsSidebar');
const settingsOpenFab = document.getElementById('settingsOpenFab');
const settingsCloseBtn = document.getElementById('settingsCloseBtn');

// Winner modal
const winnerModal = document.getElementById('winnerModal');
const winnerNameEl = document.getElementById('winnerName');
const closeModalBtn = document.getElementById('closeModal');
const removeWinnerBtn = document.getElementById('removeWinnerBtn');
let currentWinner = null;

// History modal
const historyModal = document.getElementById('historyModal');
const trophyButton = document.getElementById('trophyButton');
const closeHistoryModalBtn = document.getElementById('closeHistoryModal');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// Message modal
const messageModal = document.getElementById('messageModal');
const messageText = document.getElementById('messageText');
const closeMessageBtn = document.getElementById('closeMessage');

let participants = [];
let isSpinning = false;
let currentRotation = 0; // radians
let winnerHistory = [];
let spinAudioContext = null;
let spinSoundInterval = null;


// buffer canvas buat wheel (segmen + teks) biar pas animasi cuma muter gambar
let wheelBufferCanvas = null;
let wheelBufferCtx = null;

// Durasi spin (ms) dikontrol oleh slider (3–9 detik)
let spinDurationMs = Number(speedRange.value) * 1000;

// Palet warna slice elegan (Natal / akhir tahun)
const sliceColors = [
  '#b91c1c', // merah tua
  '#14532d', // hijau gelap
  '#eab308', // emas
  '#1e3a8a', // midnight blue
  '#7c2d12', // coklat hangat
  '#9d174d'  // wine
];

// ========== Local Storage helpers ==========

function loadParticipants() {
  const saved = localStorage.getItem('participants');
  if (saved) {
    participants = JSON.parse(saved);
  } else {
    participants = [];
  }
  renderParticipantsList();
}

function saveParticipants() {
  localStorage.setItem('participants', JSON.stringify(participants));
}

function addSingleParticipant() {
  const name = singleNameInput.value.trim();
  if (!name) return;

  const newParticipant = { id: Date.now().toString(), name };
  participants.push(newParticipant);
  saveParticipants();
  singleNameInput.value = '';
  renderParticipantsList();
}

function addBulkParticipants() {
  const raw = bulkNames.value;
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (!lines.length) return;

  const newParticipants = lines.map(name => ({ id: Date.now().toString() + Math.random(), name }));
  participants.push(...newParticipants);
  saveParticipants();
  bulkNames.value = '';
  renderParticipantsList();
}

function removeParticipant(id) {
  participants = participants.filter(p => p.id !== id);
  saveParticipants();
  renderParticipantsList();
}

function clearParticipants() {
  if (!participants.length) return;
  if (!confirm('Hapus semua peserta?')) return;

  participants = [];
  saveParticipants();
  currentRotation = 0;
  renderParticipantsList();
}

function shuffleParticipants() {
  if (participants.length < 2) {
    showMessage('Minimal 2 peserta untuk diacak.');
    return;
  }

  // Shuffle the participants array
  participants.sort(() => Math.random() - 0.5);
  saveParticipants();
  renderParticipantsList();
}

// ========== Render list & wheel ==========

function renderParticipantsList() {
  countLabel.textContent = participants.length.toString();
  participantsList.innerHTML = '';

  participants.forEach((p) => {
    const li = document.createElement('li');

    const span = document.createElement('span');
    span.className = 'participant-name';
    span.textContent = p.name;

    const btn = document.createElement('button');
    btn.className = 'remove-btn';
    btn.textContent = 'Hapus';
    btn.addEventListener('click', () => removeParticipant(p.id));

    li.appendChild(span);
    li.appendChild(btn);
    participantsList.appendChild(li);
  });

  // rebuild wheel image (segmen + teks) sekali saja setiap peserta berubah
  rebuildWheelBuffer();
  drawWheel(currentRotation);
}

function truncateText(context, text, maxWidth) {
  // saat ini tidak dipakai untuk motong, tapi kita tetap kirim context biar fleksibel
  return text;
}

// gambar wheel utama dengan memutar buffer
function drawWheel(rotation = 0) {
  const w = VIEW_SIZE;
  const h = VIEW_SIZE;
  const cx = w / 2;
  const cy = h / 2;

  ctx.clearRect(0, 0, w, h);

  const radius = Math.min(cx, cy) - 10;

  // Jika belum ada peserta atau buffer belum dibuat, gambar wheel kosong
  if (!participants.length || !wheelBufferCanvas) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#111827';
    ctx.fill();
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 3;
    ctx.stroke();

    if (!participants.length) {
      ctx.fillStyle = '#6b7280';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Tambah peserta dulu', cx, cy);
    }
    return;
  }

  // Putar satu gambar wheel statis (segmen + teks) yang sudah dipre-render
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  // penting: pakai VIEW_SIZE biar tidak ke-scale 2x oleh DPR
  ctx.drawImage(wheelBufferCanvas, -cx, -cy, VIEW_SIZE, VIEW_SIZE);
  ctx.restore();
}

// pre-render wheel (segmen + teks) ke offscreen canvas
function rebuildWheelBuffer() {
  const w = VIEW_SIZE;
  const h = VIEW_SIZE;
  const cx = w / 2;
  const cy = h / 2;

  if (!participants.length) {
    wheelBufferCanvas = null;
    wheelBufferCtx = null;
    return;
  }

  if (!wheelBufferCanvas) {
    wheelBufferCanvas = document.createElement('canvas');
  }

  // backing store hi-res
  wheelBufferCanvas.width = VIEW_SIZE * DPR;
  wheelBufferCanvas.height = VIEW_SIZE * DPR;
  wheelBufferCtx = wheelBufferCanvas.getContext('2d');
  wheelBufferCtx.scale(DPR, DPR); // supaya koordinat logis 0..VIEW_SIZE

  const bctx = wheelBufferCtx;
  bctx.clearRect(0, 0, w, h);

  const radius = Math.min(cx, cy) - 10;
  const sliceCount = participants.length;
  const sliceAngle = (Math.PI * 2) / sliceCount;

  for (let i = 0; i < sliceCount; i++) {
    const startAngle = i * sliceAngle;
    const endAngle = startAngle + sliceAngle;

    const color = sliceColors[i % sliceColors.length];

    // gambar segmen
    bctx.beginPath();
    bctx.moveTo(cx, cy);
    bctx.arc(cx, cy, radius, startAngle, endAngle);
    bctx.closePath();
    bctx.fillStyle = color;
    bctx.fill();
    bctx.strokeStyle = '#020617';
    bctx.lineWidth = 2;
    bctx.stroke();

    // posisi teks (horizontal, 1 line)
    const textAngle = startAngle + sliceAngle / 2;

    // ===== FONT DINAMIS & LEBIH BESAR =====
    let fontSize;
    if (sliceCount <= 30) {
      fontSize = 18;
    } else if (sliceCount <= 60) {
      fontSize = 15;
    } else if (sliceCount <= 100) {
      fontSize = 12;
    } else {
      fontSize = 11; // masih kebaca utk 100+ peserta
    }

    // radius teks: nempel ke ujung segmen tapi tetap di dalam
    // outer bound teks = textRadius + fontSize/2  <= radius
    const textRadius = radius - Math.ceil(fontSize / 2) - 1;

    const tx = cx + Math.cos(textAngle) * textRadius;
    const ty = cy + Math.sin(textAngle) * textRadius;

    bctx.save();
    bctx.fillStyle = '#f9fafb';
    bctx.font = `bold ${fontSize}px "Segoe UI", sans-serif`;
    bctx.textAlign = 'right';
    bctx.textBaseline = 'middle';

    const maxWidth = Math.max(30, radius * sliceAngle * 0.9);
    const name = participants[i].name;
    const clipped = truncateText(bctx, name, maxWidth);

    // teks mengikuti segmen
    bctx.translate(tx, ty);
    bctx.rotate(textAngle);
    bctx.fillText(clipped, 0, 0);
    bctx.restore();
  }

  // inner hub (lingkaran tengah)
  bctx.beginPath();
  bctx.arc(cx, cy, radius * 0.25, 0, Math.PI * 2);
  bctx.fillStyle = '#020617';
  bctx.fill();
  bctx.strokeStyle = '#facc15';
  bctx.lineWidth = 3;
  bctx.stroke();
}

// ========== Spin logic ==========

function spin() {
  if (isSpinning) return;
  if (participants.length < 2) {
    showMessage('Minimal 2 peserta untuk spin.');
    return;
  }

  isSpinning = true;
  pointerButton.disabled = true;
  pointerButton.classList.add('spinning');
  wheelCanvas.classList.add('spinning');
  resultBox.textContent = 'Memutar...';

  // Pick random winner
  const winnerIndex = Math.floor(Math.random() * participants.length);
  const winner = participants[winnerIndex];

  renderParticipantsList(); // rebuild buffer + redraw wheel

  animateSpinToIndex(winnerIndex, () => {
    const winnerName = winner.name || 'Unknown';
    addWinnerToHistory(winner);
    showWinnerModal(winnerName);
    isSpinning = false;
    pointerButton.disabled = false;
    pointerButton.classList.remove('spinning');
    wheelCanvas.classList.remove('spinning');
  });
}

function animateSpinToIndex(winnerIndex, onDone) {
  if (!participants.length) return;

  const sliceCount = participants.length;
  const sliceAngle = (Math.PI * 2) / sliceCount;

  // Pointer mengarah ke kanan (0 radian / 3 o'clock)
  const pointerAngle = 0;

  // Offset posisi pointer di dalam segmen:
  //   tidak di tengah, tidak dekat batas, kiri/kanan acak
  const halfWidth = sliceAngle / 2;
  const minFromCenter = halfWidth * 0.25;
  const maxFromCenter = halfWidth * 0.8;

  const sign = Math.random() < 0.5 ? -1 : 1;
  const mag =
    minFromCenter + Math.random() * (maxFromCenter - minFromCenter);
  const offset = sign * mag;

  const baseAngleForWinner =
    winnerIndex * sliceAngle + sliceAngle / 2 + offset;

  const rotationForWinner = pointerAngle - baseAngleForWinner;

  const extraSpins = 5;
  const targetRotation = extraSpins * (Math.PI * 2) + rotationForWinner;

  const startTime = performance.now();
  const duration = spinDurationMs;

  currentRotation = 0;
  let lastSegment = -1;

  function frame(now) {
    const elapsed = now - startTime;
    const t = Math.min(1, elapsed / duration);

    const easeOutCubic = 1 - Math.pow(1 - t, 3);

    const prevRotation = currentRotation;
    currentRotation = easeOutCubic * targetRotation;
    drawWheel(currentRotation);

    // Play sound every segment passed
    const currentSegment = Math.floor(currentRotation / sliceAngle) % sliceCount;
    if (currentSegment !== lastSegment && currentSegment !== Math.floor(prevRotation / sliceAngle) % sliceCount) {
      playTickSound();
      lastSegment = currentSegment;
    }

    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      currentRotation = targetRotation;
      drawWheel(currentRotation);
      if (typeof onDone === 'function') onDone();
    }
  }

  requestAnimationFrame(frame);
}

// ========== Floating Particles ==========

function createFloatingParticles() {
  const container = document.getElementById('floating-particles');
  const particleCount = 50;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + 'vw';
    particle.style.top = Math.random() * 100 + 'vh';
    particle.style.animationDelay = Math.random() * 6 + 's';
    container.appendChild(particle);
  }
}

// ========== Winner History ==========

function loadWinnerHistory() {
  const saved = localStorage.getItem('winnerHistory');
  if (saved) {
    winnerHistory = JSON.parse(saved);
  }
  renderWinnerHistory();
}

function saveWinnerHistory() {
  localStorage.setItem('winnerHistory', JSON.stringify(winnerHistory));
}

function addWinnerToHistory(winner) {
  if (!winner) return;

  const winnerEntry = {
    name: winner.name || 'Unknown',
    time: new Date().toLocaleString('id-ID'),
    timestamp: Date.now()
  };
  winnerHistory.unshift(winnerEntry); // Add to beginning

  // Keep only last 10 winners
  if (winnerHistory.length > 10) {
    winnerHistory = winnerHistory.slice(0, 10);
  }

  saveWinnerHistory();
  renderWinnerHistory();
}

function renderWinnerHistory() {
  const container = document.getElementById('winnerHistory');

  if (winnerHistory.length === 0) {
    container.innerHTML = '<p class="no-winners">Belum ada pemenang</p>';
    return;
  }

  container.innerHTML = winnerHistory.map((winner) => `
    <div class="winner-item">
      <span class="winner-name">${winner.name}</span>
      <span class="winner-time">${winner.time}</span>
    </div>
  `).join('');
}

function clearWinnerHistory() {
  winnerHistory = [];
  saveWinnerHistory();
  renderWinnerHistory();
}

// ========== Sound Effects ==========

function initAudioContext() {
  if (!spinAudioContext) {
    spinAudioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return spinAudioContext;
}

function playTickSound() {
  try {
    const audioContext = initAudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Create a short tick sound
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (error) {
    // Silently fail if audio is not supported
    console.log('Audio not supported');
  }
}

function startSpinSounds() {
  // Play initial sound
  playTickSound();

  // Play tick sounds at decreasing intervals to simulate slowing down
  let interval = 50; // Start fast
  const minInterval = 200; // Slow down to this
  const intervalIncrease = 10; // How much to slow down each time

  spinSoundInterval = setInterval(() => {
    playTickSound();
    interval += intervalIncrease;
    if (interval >= minInterval) {
      clearInterval(spinSoundInterval);
      spinSoundInterval = null;
    }
  }, interval);
}

function stopSpinSounds() {
  if (spinSoundInterval) {
    clearInterval(spinSoundInterval);
    spinSoundInterval = null;
  }
}

// ========== Winner Modal & Confetti ==========

function showWinnerModal(winnerName) {
  currentWinner = winnerName;
  winnerNameEl.textContent = winnerName;
  winnerModal.classList.add('show');
  startConfetti();
}

function hideWinnerModal() {
  winnerModal.classList.remove('show');
  stopConfetti();
  currentWinner = null;
}

function removeWinnerFromList() {
  const winnerName = winnerNameEl.textContent;
  if (!winnerName) return;

  participants = participants.filter(p => p.name !== winnerName);
  saveParticipants();
  renderParticipantsList();
  hideWinnerModal();
  showMessage(`"${winnerName}" telah dihapus dari daftar peserta.`);
}

function showHistoryModal() {
  renderWinnerHistory();
  historyModal.classList.add('show');
}

function hideHistoryModal() {
  historyModal.classList.remove('show');
}

function showMessage(msg) {
  messageText.textContent = msg;
  messageModal.classList.add('show');
}

function hideMessageModal() {
  messageModal.classList.remove('show');
}

function startConfetti() {
  const confettiContainer = document.createElement('div');
  confettiContainer.id = 'confetti-container';
  confettiContainer.style.position = 'fixed';
  confettiContainer.style.inset = '0';
  confettiContainer.style.pointerEvents = 'none';
  confettiContainer.style.zIndex = '45';
  document.body.appendChild(confettiContainer);

  const colors = ['#facc15', '#f97316', '#22c55e', '#38bdf8', '#ef4444', '#a855f7', '#ec4899', '#06b6d4'];

  for (let i = 0; i < 150; i++) {
    const confetti = document.createElement('div');
    confetti.style.position = 'absolute';
    confetti.style.width = '10px';
    confetti.style.height = '10px';
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.top = '-10px';
    confetti.style.animation = `fall ${Math.random() * 3 + 2}s linear forwards`;
    confettiContainer.appendChild(confetti);

    setTimeout(() => confetti.remove(), 5000);
  }
}

function stopConfetti() {
  const container = document.getElementById('confetti-container');
  if (container) container.remove();
}

// ========== Settings & fullscreen ==========

speedRange.addEventListener('input', () => {
  spinDurationMs = Number(speedRange.value) * 1000;
  speedLabel.textContent = speedRange.value;
});

fullscreenBtn.addEventListener('click', () => {
  toggleFullscreen();
});

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

// ========== Sidebar open / close (tanpa overlay) ==========

function openSettingsSidebar() {
  settingsSidebar.classList.add('open');
}

function closeSettingsSidebar() {
  settingsSidebar.classList.remove('open');
}

settingsOpenFab.addEventListener('click', () => {
  if (settingsSidebar.classList.contains('open')) {
    closeSettingsSidebar();
  } else {
    openSettingsSidebar();
  }
});

settingsCloseBtn.addEventListener('click', closeSettingsSidebar);

// ========== Event listeners utama ==========

addSingleBtn.addEventListener('click', addSingleParticipant);
singleNameInput.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') {
    addSingleParticipant();
  }
});
addBulkBtn.addEventListener('click', addBulkParticipants);
clearBtn.addEventListener('click', clearParticipants);

// Shuffle button
shuffleBtn.addEventListener('click', shuffleParticipants);

// Pointer SVG di tengah jadi tombol spin
pointerButton.addEventListener('click', spin);

// Winner modal
closeModalBtn.addEventListener('click', hideWinnerModal);
removeWinnerBtn.addEventListener('click', removeWinnerFromList);
winnerModal.addEventListener('click', (e) => {
  if (e.target === winnerModal || e.target.classList.contains('modal-overlay')) {
    hideWinnerModal();
  }
});

// History modal
trophyButton.addEventListener('click', () => {
  console.log('Trophy button clicked');
  showHistoryModal();
});
closeHistoryModalBtn.addEventListener('click', hideHistoryModal);
clearHistoryBtn.addEventListener('click', () => {
  if (confirm('Hapus semua riwayat pemenang?')) {
    clearWinnerHistory();
    showMessage('Riwayat pemenang telah dihapus.');
  }
});
historyModal.addEventListener('click', (e) => {
  if (e.target === historyModal || e.target.classList.contains('modal-overlay')) {
    hideHistoryModal();
  }
});

// Message modal
closeMessageBtn.addEventListener('click', hideMessageModal);
messageModal.addEventListener('click', (e) => {
  if (e.target === messageModal || e.target.classList.contains('modal-overlay')) {
    hideMessageModal();
  }
});

// Init
window.addEventListener('load', () => {
  createFloatingParticles();
  loadParticipants();
  loadWinnerHistory();
});
