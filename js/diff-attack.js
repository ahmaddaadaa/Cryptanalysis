/**
 * Differential attack on the Heys SPN (the fun part).
 *
 * We use this characteristic:
 *   ΔP  = 0x0B00
 *   Active S-boxes: S12 (B→2), S23 (4→6), S32 (2→5), S33 (2→5)
 *   Expected ΔU4 active nibbles = 0x6 and 0x6
 *   Probability ≈ 27/1024 ≈ 0.0264
 *
 * Goal: recover 8 bits of K5.
 */

const DIFF = {
  DELTA_P: 0x0B00,
  TARGET_NIBBLE1: 0x6,   // expected difference into S42
  TARGET_NIBBLE3: 0x6,   // expected difference into S44
  // Theoretical probability
  P_D: 27 / 1024
};

/**
 * Given a candidate 8-bit partial key and a ciphertext pair,
 * compute the difference of the two active input nibbles to the last round.
 * cand layout: high 4 bits = candidate for K5 nibble1 (bits 4-7)
 *              low  4 bits = candidate for K5 nibble3 (bits 12-15)
 */
function getActiveU4Diff(ct1, ct2, cand) {
  const k_n1 = (cand >>> 4) & 0xF;
  const k_n3 = cand & 0xF;

  // Nibble 1 of CT (bits 4-7) and nibble 3 (bits 12-15)
  const c1_n1 = (ct1 >>> 8) & 0xF;
  const c1_n3 = ct1 & 0xF;
  const c2_n1 = (ct2 >>> 8) & 0xF;
  const c2_n3 = ct2 & 0xF;

  const u1_n1 = SPN.INV_SBOX[c1_n1 ^ k_n1];
  const u1_n3 = SPN.INV_SBOX[c1_n3 ^ k_n3];
  const u2_n1 = SPN.INV_SBOX[c2_n1 ^ k_n1];
  const u2_n3 = SPN.INV_SBOX[c2_n3 ^ k_n3];

  return {
    d1: u1_n1 ^ u2_n1,
    d3: u1_n3 ^ u2_n3
  };
}

/**
 * Run the full differential attack.
 * @param {number[]} subkeys - the secret 5 subkeys (only used to encrypt; attacker does not know them)
 * @param {number} numPairs - how many chosen plaintext pairs to generate
 * @param {function} onProgress - optional callback(percent, message)
 * @returns {object} results
 */
function runDifferentialAttack(subkeys, numPairs = 5000, onProgress = null) {
  const counts = new Array(256).fill(0);
  let filteredPairs = 0;

  for (let i = 0; i < numPairs; i++) {
    if (onProgress && i % 200 === 0) {
      onProgress(Math.round((i / numPairs) * 100), `Encrypting pairs… ${i} / ${numPairs}`);
    }

    // Random plaintext pair with fixed difference
    const p1 = Math.floor(Math.random() * 0x10000);
    const p2 = p1 ^ DIFF.DELTA_P;

    const c1 = SPN.encryptBlock(p1, subkeys);
    const c2 = SPN.encryptBlock(p2, subkeys);

    // Filtering (paper Section 4.4): inactive last-round S-boxes must have Δ = 0
    // i.e. nibble 0 and nibble 2 of ciphertext difference must be zero
    const deltaC = c1 ^ c2;
    if (((deltaC >>> 12) & 0xF) !== 0 || ((deltaC >>> 4) & 0xF) !== 0) {
      continue; // wrong pair
    }
    filteredPairs++;

    // Try every possible 8-bit partial subkey
    for (let cand = 0; cand < 256; cand++) {
      const { d1, d3 } = getActiveU4Diff(c1, c2, cand);
      if (d1 === DIFF.TARGET_NIBBLE1 && d3 === DIFF.TARGET_NIBBLE3) {
        counts[cand]++;
      }
    }
  }

  // Rank candidates
  const ranked = counts
    .map((cnt, cand) => ({ cand, count: cnt, prob: cnt / numPairs }))
    .sort((a, b) => b.count - a.count);

  // True partial key (for evaluation only – attacker would not know this)
  const truePartial = ((subkeys[4] >>> 8) & 0xF) << 4 | (subkeys[4] & 0xF);

  return {
    counts,
    ranked,
    truePartial,
    trueCount: counts[truePartial],
    filteredPairs,
    numPairs,
    theoreticalPD: DIFF.P_D
  };
}

/**
 * Helper: extract the true 8-bit partial from a full K5
 */
function extractTruePartial(k5) {
  return ((k5 >>> 8) & 0xF) << 4 | (k5 & 0xF);
}

window.DiffAttack = {
  DIFF,
  getActiveU4Diff,
  runDifferentialAttack,
  extractTruePartial
};
