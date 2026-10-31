// Typdefinitionen für sammelabruf 1.5 (synthetisches Fremdpaket)
export interface FetchAllOptions {
  /** Anzahl gleichzeitiger Anfragen (Standard: 4). */
  concurrency?: number;
  /** Zeitlimit je Anfrage in Millisekunden (Standard: 10000). */
  timeoutMs?: number;
  /** Bricht alle laufenden und wartenden Anfragen ab. */
  signal?: AbortSignal;
}

export function fetchAll(
  urls: string[],
  options?: FetchAllOptions
): Promise<Response[]>;
