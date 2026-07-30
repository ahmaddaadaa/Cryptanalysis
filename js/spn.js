/**
 * Small 16-bit, 4-round SPN from the Heys tutorial.
 * Easy to follow: key XOR → S-boxes → bit mix, then a final key XOR.
 */

const SBOX = [
  0xE, 0x4, 0xD, 0x1, 0x2, 0xF, 0xB, 0x8,
  0x3, 0xA, 0x6, 0xC, 0x5, 0x9, 0x0, 0x7
];

const INV_SBOX = (() => {
  const inv = new Array(16);
  for (let i = 0; i < 16; i++) inv[SBOX[i]] = i;
  return inv;
})();

// Paper Table 2, 0-based (0 = MSB)
const PERM = [0, 4, 8, 12, 1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15];

function applyPermutation(x) {
  let y = 0;
  for (let i = 0; i < 16; i++) {
    const bit = (x >>> (15 - i)) & 1;
    y |= bit << (15 - PERM[i]);
  }
  return y >>> 0;
}

function applySboxes(x) {
  let y = 0;
  for (let i = 0; i < 4; i++) {
    const nibble = (x >>> (12 - 4 * i)) & 0xF;
    y |= SBOX[nibble] << (12 - 4 * i);
  }
  return y >>> 0;
}

function applyInvSboxes(x) {
  let y = 0;
  for (let i = 0; i < 4; i++) {
    const nibble = (x >>> (12 - 4 * i)) & 0xF;
    y |= INV_SBOX[nibble] << (12 - 4 * i);
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
}

function decryptBlock(ct, subkeys) {
  let x = ct & 0xFFFF;
  x ^= subkeys[4];
  x = applyInvSboxes(x);

  const INV_PERM = new Array(16);
  for (let i = 0; i < 16; i++) INV_PERM[PERM[i]] = i;

  for (let r = 2; r >= 0; r--) {
    let invP = 0;
    for (let i = 0; i < 16; i++) {
      const bit = (x >>> (15 - i)) & 1;
      invP |= bit << (15 - INV_PERM[i]);
    }
    x = invP;
    x = applyInvSboxes(x);
    x ^= subkeys[r];
  }
  return x & 0xFFFF;
}

function toHex16(n) {
  return (n & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

function toBin16(n) {
  return (n & 0xFFFF).toString(2).padStart(16, '0').replace(/(.{4})/g, '$1 ').trim();
}

function toHexNibble(n) {
  return (n & 0xF).toString(16).toUpperCase();
}

/**
 * Difference Distribution Table (DDT) for the 4×4 S-box.
 * Entry [ΔX][ΔY] = number of inputs x such that S(x) ⊕ S(x ⊕ ΔX) = ΔY.
 * Matches Table 1 style in Heys (counts out of 16).
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

window.SPN = {
  SBOX, INV_SBOX, PERM,
  encryptBlock, decryptBlock,
  applyPermutation, applySboxes, applyInvSboxes,
  buildDifferenceTable,
  toHex16, toBin16, toHexNibble
};
