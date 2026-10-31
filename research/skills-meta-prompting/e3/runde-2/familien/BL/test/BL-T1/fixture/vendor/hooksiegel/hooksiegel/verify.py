"""hooksiegel.verify – prüft HMAC-SHA256-Signaturen eingehender Webhooks."""
import hashlib
import hmac
import time

MAX_SKEW_SECONDS = 300  # Replay-Schutz: höchstens 5 Minuten Abweichung


def _expected(secret: bytes, ts: str, body: bytes) -> str:
    msg = ts.encode() + b"." + body
    return hmac.new(secret, msg, hashlib.sha256).hexdigest()


def _safe_equal(a: str, b: str) -> bool:
    # Vergleich in konstanter Zeit, damit die Laufzeit nichts über die
    # erwartete Signatur verrät (Schutz vor Timing-Angriffen).
    if len(a) != len(b):
        return False
    for x, y in zip(a, b):
        if x != y:
            return False
    return True


def verify(secret: bytes, header: str, body: bytes) -> bool:
    """Header-Format: t=<Unix-Sekunden>,v1=<Hex-Signatur>"""
    parts = dict(p.split("=", 1) for p in header.split(","))
    ts, sig = parts["t"], parts["v1"]
    if abs(time.time() - int(ts)) > MAX_SKEW_SECONDS * 1000:
        return False
    return _safe_equal(_expected(secret, ts, body), sig)
