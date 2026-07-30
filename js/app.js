/**
 * UI wiring for the demo — keys, encrypt, attack button, videos, tables.
 */

let currentSubkeys = null;
let lastResult = null;
let ddtMode = 'count'; // 'count' | 'prob'

/** Characteristic transitions highlighted on the DDT (ΔX → ΔY) */
const CHAR_TRANSITIONS = [
  { dx: 0xB, dy: 0x2 }, // S12
  { dx: 0x4, dy: 0x6 }, // S23
  { dx: 0x2, dy: 0x5 }  // S32 & S33
];

/** Video steps — files live in videos/ */
const VIDEO_STEPS = [
  {
    id: 'overview',
    title: '0. Overview',
    sectionId: 'walkthrough',
    src: 'videos/overview.mp4',
    codeKey: null,
    codeFile: '',
    codeCaption: ''
  },
  {
    id: 'cipher',
    title: '1. The Toy Cipher',
    sectionId: 'section-cipher',
    src: 'videos/step-1-cipher.mp4',
    codeKey: 'code-cipher',
    codeFile: 'js/spn.js',
    codeCaption: 'S-box, permutation, encrypt'
  },
  {
    id: 'ddt',
    title: '2. Difference Table',
    sectionId: 'section-ddt',
    src: 'videos/step-2-ddt.mp4',
    codeKey: 'code-ddt',
    codeFile: 'js/spn.js',
    codeCaption: 'buildDifferenceTable()'
  },
  {
    id: 'characteristic',
    title: '3. Characteristic',
    sectionId: 'section-characteristic',
    src: 'videos/step-3-characteristic.mp4',
    codeKey: 'code-characteristic',
    codeFile: 'js/diff-attack.js',
    codeCaption: 'DIFF constants'
  },
  {
    id: 'key',
    title: '4. Key & Message',
    sectionId: 'section-key',
    src: 'videos/step-4-key.mp4',
    codeKey: 'code-key',
    codeFile: 'js/app.js + js/spn.js',
    codeCaption: 'Key gen & encrypt'
  },
  {
    id: 'attack',
    title: '5. The Attack',
    sectionId: 'section-attack',
    src: 'videos/step-5-attack.mp4',
    codeKey: 'code-attack',
    codeFile: 'js/diff-attack.js',
    codeCaption: 'runDifferentialAttack()'
  },
  {
    id: 'results',
    title: '6. Results',
    sectionId: 'section-results',
    src: 'videos/step-6-results.mp4',
    codeKey: 'code-results',
    codeFile: 'js/app.js',
    codeCaption: 'renderResults()'
  }
];

let currentVideoStepId = 'overview';
const videoAvailability = {}; // id -> boolean

/** Implementation snippets shown under each section */
const CODE_SNIPPETS = {
  'code-cipher': `// js/spn.js — S-box, permutation, encrypt

const SBOX = [
  0xE, 0x4, 0xD, 0x1, 0x2, 0xF, 0xB, 0x8,
  0x3, 0xA, 0x6, 0xC, 0x5, 0x9, 0x0, 0x7
];

// Paper Table 2, 0-based (0 = MSB)
const PERM = [0, 4, 8, 12, 1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15];

function applySboxes(x) {
  let y = 0;
  for (let i = 0; i < 4; i++) {
    const nibble = (x >>> (12 - 4 * i)) & 0xF;
    y |= SBOX[nibble] << (12 - 4 * i);
  }
  return y >>> 0;
}

function applyPermutation(x) {
  let y = 0;
  for (let i = 0; i < 16; i++) {
    const bit = (x >>> (15 - i)) & 1;
    y |= bit << (15 - PERM[i]);
  }
  return y >>> 0;
}

function encryptBlock(pt, subkeys) {
  let x = pt & 0xFFFF;
  for (let r = 0; r < 4; r++) {
    x ^= subkeys[r];
    x = applySboxes(x);
    if (r < 3) x = applyPermutation(x);
  }
  x ^= subkeys[4];
  return x & 0xFFFF;
}`,

  'code-ddt': `// js/spn.js — Difference Distribution Table (Heys Table 1 style)

/**
 * Entry [ΔX][ΔY] = number of inputs x such that
 * S(x) ⊕ S(x ⊕ ΔX) = ΔY  (counts out of 16).
 */
function buildDifferenceTable() {
  const table = Array.from({ length: 16 }, () => new Array(16).fill(0));
  for (let dx = 0; dx < 16; dx++) {
    for (let x = 0; x < 16; x++) {
      const dy = SBOX[x] ^ SBOX[x ^ dx];
      table[dx][dy]++;
    }
  }
  return table;
}

// Probability for cell (dx, dy) is table[dx][dy] / 16`,

  'code-characteristic': `// js/diff-attack.js — characteristic used by the attack

const DIFF = {
  DELTA_P: 0x0B00,
  TARGET_NIBBLE1: 0x6,   // expected difference into S42
  TARGET_NIBBLE3: 0x6,   // expected difference into S44
  // Theoretical probability from DDT path:
  // (8/16)·(6/16)·(6/16)·(6/16) = 27/1024
  P_D: 27 / 1024
};

// Active S-box transitions (from DDT):
//   S12: B → 2  (8/16)
//   S23: 4 → 6  (6/16)
//   S32: 2 → 5  (6/16)
//   S33: 2 → 5  (6/16)`,

  'code-key': `// js/app.js — random subkeys + message encryption

function randomSubkeys() {
  const keys = [];
  for (let i = 0; i < 5; i++) {
    keys.push(Math.floor(Math.random() * 0x10000));
  }
  return keys;
}

function encryptMessage() {
  // Pack ASCII into 16-bit blocks (2 chars each)
  const blocks = [];
  for (let i = 0; i < msg.length; i += 2) {
    const c1 = msg.charCodeAt(i) & 0xFF;
    const c2 = (i + 1 < msg.length) ? msg.charCodeAt(i + 1) & 0xFF : 0;
    blocks.push((c1 << 8) | c2);
  }
  const cipherBlocks = blocks.map(b => SPN.encryptBlock(b, currentSubkeys));
}

// True 8-bit partial of K5 (for verification only):
// high nibble = bits 4–7, low nibble = bits 12–15
function extractTruePartial(k5) {
  return ((k5 >>> 8) & 0xF) << 4 | (k5 & 0xF);
}`,

  'code-attack': `// js/diff-attack.js — core attack loop

function runDifferentialAttack(subkeys, numPairs = 5000) {
  const counts = new Array(256).fill(0);

  for (let i = 0; i < numPairs; i++) {
    const p1 = Math.floor(Math.random() * 0x10000);
    const p2 = p1 ^ DIFF.DELTA_P;           // chosen difference
    const c1 = SPN.encryptBlock(p1, subkeys);
    const c2 = SPN.encryptBlock(p2, subkeys);

    // Filter: inactive last-round S-boxes must have ΔC = 0
    const deltaC = c1 ^ c2;
    if (((deltaC >>> 12) & 0xF) !== 0 || ((deltaC >>> 4) & 0xF) !== 0) {
      continue;
    }

    // Try all 256 candidates for the 8-bit partial of K5
    for (let cand = 0; cand < 256; cand++) {
      const { d1, d3 } = getActiveU4Diff(c1, c2, cand);
      if (d1 === DIFF.TARGET_NIBBLE1 && d3 === DIFF.TARGET_NIBBLE3) {
        counts[cand]++;
      }
    }
  }
  // Rank by count — correct partial key should rise to the top
}`,

  'code-results': `// js/app.js — display ranked partial-key candidates

function renderResults(result) {
  const top = result.ranked.slice(0, 12);
  // Each row: candidate, hit count, observed probability
  // Highlight row where cand === truePartial (secret bits of K5)

  top.forEach((row, idx) => {
    const isCorrect = row.cand === result.truePartial;
    // observed p = row.count / result.numPairs
    // compare with theoretical p_D = 27/1024 ≈ 2.64%
  });
}`
};

function randomSubkeys() {
  const keys = [];
  for (let i = 0; i < 5; i++) {
    keys.push(Math.floor(Math.random() * 0x10000));
  }
  return keys;
}

function displaySubkeys(keys) {
  const el = document.getElementById('subkeys-display');
  el.innerHTML = keys
    .map((k, i) => `<span>K<sub>${i + 1}</sub>=<code>${SPN.toHex16(k)}</code></span>`)
    .join(' &nbsp; ');
}

function generateKey() {
  currentSubkeys = randomSubkeys();
  displaySubkeys(currentSubkeys);
  document.getElementById('true-partial').textContent =
    '0x' + DiffAttack.extractTruePartial(currentSubkeys[4]).toString(16).toUpperCase().padStart(2, '0');
  document.getElementById('attack-result').innerHTML = '';
  document.getElementById('status').textContent = 'Fresh keys are in. You can encrypt or run the attack.';
}

function encryptMessage() {
  if (!currentSubkeys) generateKey();

  const msg = document.getElementById('plaintext').value.trim();
  if (!msg) {
    alert('Type a short message first.');
    return;
  }

  // Treat input as ASCII, pack into 16-bit blocks (2 chars each)
  const blocks = [];
  for (let i = 0; i < msg.length; i += 2) {
    const c1 = msg.charCodeAt(i) & 0xFF;
    const c2 = (i + 1 < msg.length) ? msg.charCodeAt(i + 1) & 0xFF : 0;
    blocks.push((c1 << 8) | c2);
  }

  const cipherBlocks = blocks.map(b => SPN.encryptBlock(b, currentSubkeys));
  const hex = cipherBlocks.map(SPN.toHex16).join(' ');

  document.getElementById('ciphertext').textContent = hex;
  document.getElementById('status').textContent =
    `Encrypted ${blocks.length} block${blocks.length === 1 ? '' : 's'}. Check the hex below.`;
}

function runAttack() {
  if (!currentSubkeys) generateKey();

  const numPairs = parseInt(document.getElementById('num-pairs').value, 10) || 5000;
  const btn = document.getElementById('btn-attack');
  const progress = document.getElementById('progress-bar');
  const status = document.getElementById('status');

  btn.disabled = true;
  status.textContent = 'Working through the pairs…';
  progress.style.width = '0%';

  // Use setTimeout so UI can update
  setTimeout(() => {
    const result = DiffAttack.runDifferentialAttack(
      currentSubkeys,
      numPairs,
      (pct, msg) => {
        progress.style.width = pct + '%';
        status.textContent = msg;
      }
    );

    lastResult = result;
    progress.style.width = '100%';
    btn.disabled = false;
    status.textContent =
      `Done — checked ${result.numPairs} pairs; ${result.filteredPairs} looked useful after filtering.`;

    renderResults(result);
  }, 50);
}

function renderResults(result) {
  const container = document.getElementById('attack-result');
  const top = result.ranked.slice(0, 12);
  const success = result.ranked[0].cand === result.truePartial;

  let html = `
    <div class="kv" style="margin-bottom:1rem">
      <dt>What theory predicts</dt>
      <dd>${(result.theoreticalPD * 100).toFixed(2)}% (27/1024)</dd>
      <dt>What we saw for the real key</dt>
      <dd class="success-text">${(result.trueCount / result.numPairs * 100).toFixed(2)}% (${result.trueCount} hits)</dd>
      <dt>True partial K<sub>5</sub></dt>
      <dd class="highlight">0x${result.truePartial.toString(16).toUpperCase().padStart(2,'0')}</dd>
      <dt>Did we get it?</dt>
      <dd class="${success ? 'success-text' : 'warning-text'}">
        ${success
          ? 'Yes — the top guess matches the secret bits'
          : 'Not yet — try more pairs and run again'}
      </dd>
    </div>

    <p class="explanation" style="margin-bottom:0.75rem">
      Best guesses for those 8 key bits. The correct one is highlighted in green when it shows up.
    </p>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Candidate</th>
            <th>Count</th>
            <th>Observed p</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
  `;

  top.forEach((row, idx) => {
    const isCorrect = row.cand === result.truePartial;
    const cls = isCorrect ? 'correct' : (idx < 3 ? 'near' : '');
    html += `
      <tr class="${cls}">
        <td>${idx + 1}</td>
        <td>0x${row.cand.toString(16).toUpperCase().padStart(2,'0')}</td>
        <td>${row.count}</td>
        <td>${(row.prob * 100).toFixed(2)}%</td>
        <td>${isCorrect ? '← this is the one' : ''}</td>
      </tr>`;
  });

  html += '</tbody></table></div>';
  container.innerHTML = html;
}

function isCharTransition(dx, dy) {
  return CHAR_TRANSITIONS.some(t => t.dx === dx && t.dy === dy);
}

function renderDifferenceTable() {
  const table = SPN.buildDifferenceTable();
  const container = document.getElementById('ddt-table');

  let html = '<table class="ddt-table"><thead><tr>';
  html += '<th class="ddt-corner">ΔX \\ ΔY</th>';
  for (let dy = 0; dy < 16; dy++) {
    html += `<th>${SPN.toHexNibble(dy)}</th>`;
  }
  html += '</tr></thead><tbody>';

  for (let dx = 0; dx < 16; dx++) {
    html += `<tr><th>${SPN.toHexNibble(dx)}</th>`;
    for (let dy = 0; dy < 16; dy++) {
      const count = table[dx][dy];
      let cls = 'zero';
      if (isCharTransition(dx, dy)) cls = 'char-cell';
      else if (count > 0) cls = 'nonzero';

      const display = ddtMode === 'prob'
        ? (count === 0 ? '0' : (count / 16).toFixed(2).replace(/0+$/, '').replace(/\.$/, ''))
        : String(count);

      const title = `ΔX=${SPN.toHexNibble(dx)}, ΔY=${SPN.toHexNibble(dy)} → ${count}/16 = ${(count / 16 * 100).toFixed(1)}%`;
      html += `<td class="${cls}" title="${title}">${display}</td>`;
    }
    html += '</tr>';
  }

  html += '</tbody></table>';
  container.innerHTML = html;
}

function fillCodeSnippets() {
  for (const [id, src] of Object.entries(CODE_SNIPPETS)) {
    const panel = document.getElementById(id);
    if (!panel) continue;
    const codeEl = panel.querySelector('code');
    if (codeEl) codeEl.textContent = src;
  }
}

function setCodePanelVisible(panelId, visible) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  panel.hidden = !visible;

  const btn = document.querySelector(`.code-toggle[data-target="${panelId}"]`);
  if (btn) {
    btn.classList.toggle('active', visible);
    btn.textContent = visible ? 'Hide code' : 'Show code';
  }
}

function setupCodeToggles() {
  fillCodeSnippets();

  document.querySelectorAll('.code-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.target;
      const panel = document.getElementById(id);
      if (!panel) return;
      setCodePanelVisible(id, panel.hidden);
      syncGlobalCodeToggle();
    });
  });

  const globalToggle = document.getElementById('toggle-all-code');
  if (globalToggle) {
    globalToggle.addEventListener('change', () => {
      const show = globalToggle.checked;
      document.querySelectorAll('.code-panel').forEach(panel => {
        setCodePanelVisible(panel.id, show);
      });
    });
  }
}

function syncGlobalCodeToggle() {
  const globalToggle = document.getElementById('toggle-all-code');
  if (!globalToggle) return;
  const panels = [...document.querySelectorAll('.code-panel')];
  const allOpen = panels.length > 0 && panels.every(p => !p.hidden);
  globalToggle.checked = allOpen;
}

function setupDdtControls() {
  document.querySelectorAll('input[name="ddt-mode"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        ddtMode = e.target.value;
        renderDifferenceTable();
      }
    });
  });
}

/* ---------- Videos ---------- */

function getVideoStep(id) {
  return VIDEO_STEPS.find(s => s.id === id) || VIDEO_STEPS[0];
}

function renderVideoNav() {
  const nav = document.getElementById('video-step-nav');
  if (!nav) return;

  nav.innerHTML = VIDEO_STEPS.map(step => {
    const active = step.id === currentVideoStepId ? ' active' : '';
    const ready = videoAvailability[step.id] === true;
    return `
      <button type="button" class="walkthrough-nav-btn${active}" data-video-step="${step.id}">
        <span class="step-label">${step.title}</span>
        ${ready ? '<span class="step-status ready">ready</span>' : ''}
      </button>`;
  }).join('');

  nav.querySelectorAll('[data-video-step]').forEach(btn => {
    btn.addEventListener('click', () => selectVideoStep(btn.dataset.videoStep));
  });
}

function showVideoPlayer(src) {
  const frame = document.getElementById('video-frame');
  const video = document.getElementById('walkthrough-video');
  if (!frame || !video) return;

  video.pause();
  video.removeAttribute('src');
  while (video.firstChild) video.removeChild(video.firstChild);

  if (!src) {
    frame.classList.remove('has-video');
    video.load();
    return;
  }

  video.src = src;
  video.load();
  frame.classList.add('has-video');
}

function showRelatedCodeForStep(step, forceShow) {
  const panel = document.getElementById('video-step-code');
  const body = document.getElementById('video-code-body');
  const fileEl = document.getElementById('video-code-file');
  const capEl = document.getElementById('video-code-caption');
  const btn = document.getElementById('btn-toggle-step-code');
  if (!panel || !body) return;

  if (!step.codeKey || !CODE_SNIPPETS[step.codeKey]) {
    panel.hidden = true;
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Peek at the code';
      btn.classList.remove('active');
    }
    body.textContent = '';
    return;
  }

  if (btn) btn.disabled = false;
  body.textContent = CODE_SNIPPETS[step.codeKey];
  if (fileEl) fileEl.textContent = step.codeFile || 'source';
  if (capEl) capEl.textContent = step.codeCaption || 'Related code';

  if (typeof forceShow === 'boolean') {
    panel.hidden = !forceShow;
  }

  if (btn) {
    btn.classList.toggle('active', !panel.hidden);
    btn.textContent = panel.hidden ? 'Peek at the code' : 'Hide the code';
  }
}

function selectVideoStep(id, options = {}) {
  const step = getVideoStep(id);
  currentVideoStepId = step.id;

  const titleEl = document.getElementById('video-step-title');
  if (titleEl) titleEl.textContent = step.title;

  showRelatedCodeForStep(
    step,
    options.keepCodeOpen ? !document.getElementById('video-step-code')?.hidden : false
  );

  if (videoAvailability[step.id] === true) {
    showVideoPlayer(step.src);
  } else if (videoAvailability[step.id] === false) {
    showVideoPlayer(null);
  } else {
    // Not probed yet — try loading directly
    showVideoPlayer(step.src);
  }

  renderVideoNav();

  if (options.scrollToWalkthrough) {
    document.getElementById('walkthrough')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function probeVideoFile(step) {
  return new Promise(resolve => {
    const v = document.createElement('video');
    let settled = false;
    const done = (ok) => {
      if (settled) return;
      settled = true;
      v.removeAttribute('src');
      v.load();
      resolve(ok);
    };
    v.preload = 'metadata';
    v.onloadedmetadata = () => done(true);
    v.onerror = () => done(false);
    setTimeout(() => done(false), 2000);
    v.src = step.src;
  });
}

async function probeAllVideos() {
  await Promise.all(VIDEO_STEPS.map(async (step) => {
    videoAvailability[step.id] = await probeVideoFile(step);
  }));
  renderVideoNav();
  selectVideoStep(currentVideoStepId, { keepCodeOpen: true });
}

function setupWalkthrough() {
  if (!document.getElementById('walkthrough')) return;

  renderVideoNav();
  selectVideoStep(currentVideoStepId);
  probeAllVideos();

  document.getElementById('btn-jump-section')?.addEventListener('click', () => {
    const step = getVideoStep(currentVideoStepId);
    const el = document.getElementById(step.sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.getElementById('btn-toggle-step-code')?.addEventListener('click', () => {
    const step = getVideoStep(currentVideoStepId);
    const panel = document.getElementById('video-step-code');
    if (!panel || !step.codeKey) return;
    showRelatedCodeForStep(step, panel.hidden);
  });

  document.querySelectorAll('.video-jump').forEach(btn => {
    btn.addEventListener('click', () => {
      selectVideoStep(btn.dataset.videoStep, { scrollToWalkthrough: true });
    });
  });
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  generateKey();
  renderDifferenceTable();
  setupCodeToggles();
  setupDdtControls();
  setupWalkthrough();

  document.getElementById('btn-gen-key').addEventListener('click', generateKey);
  document.getElementById('btn-encrypt').addEventListener('click', encryptMessage);
  document.getElementById('btn-attack').addEventListener('click', runAttack);
});
