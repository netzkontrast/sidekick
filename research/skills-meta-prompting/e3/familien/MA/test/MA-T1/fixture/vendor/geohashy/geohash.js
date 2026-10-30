// geohashy 3.1 (synthetisches Fremdpaket), Lizenz: MIT
const DEFAULT_PRECISION = 9;

function encode(lat, lon, precision = DEFAULT_PRECISION) {
  if (precision < 1 || precision > 12) throw new RangeError("precision 1..12");
  return interleave(lat, lon).slice(0, precision);
}

module.exports = { encode, DEFAULT_PRECISION };
