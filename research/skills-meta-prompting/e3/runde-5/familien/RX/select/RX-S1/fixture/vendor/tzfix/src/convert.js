import { ZONES } from './zones.js';

function offsetFor(zone) {
  if (!(zone in ZONES)) throw new Error(`unknown zone: ${zone}`);
  return ZONES[zone];
}

export function toUtc(localIso, zone) {
  const ms = Date.parse(localIso + 'Z');
  return new Date(ms - offsetFor(zone) * 60000).toISOString();
}

export function fromUtc(utcIso, zone) {
  const ms = Date.parse(utcIso);
  return new Date(ms + offsetFor(zone) * 60000).toISOString().slice(0, 16);
}
