const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
const MAX_PRECISION = 9;

export function encode(lat, lon, precision = 9) {
  const p = Math.min(precision, MAX_PRECISION);
  let latR = [-90, 90], lonR = [-180, 180], hash = '', bit = 0, ch = 0, even = true;
  while (hash.length < p) {
    const r = even ? lonR : latR, v = even ? lon : lat, mid = (r[0] + r[1]) / 2;
    if (v >= mid) { ch = (ch << 1) | 1; r[0] = mid; } else { ch <<= 1; r[1] = mid; }
    even = !even;
    if (++bit === 5) { hash += BASE32[ch]; bit = 0; ch = 0; }
  }
  return hash;
}
