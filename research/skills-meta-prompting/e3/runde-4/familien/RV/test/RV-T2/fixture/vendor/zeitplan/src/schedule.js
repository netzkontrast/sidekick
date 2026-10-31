function parse(expr) {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(`zeitplan: expected 5 fields, got ${parts.length}`);
  }
  const [minute, hour, day, month, weekday] = parts;
  return { minute, hour, day, month, weekday };
}

function matches(field, value) {
  return field === '*' || Number(field) === value;
}

export function schedule(expr, job, options = {}) {
  const spec = parse(expr);
  let running = false;
  const timer = setInterval(async () => {
    const now = new Date();
    if (!matches(spec.minute, now.getMinutes()) || !matches(spec.hour, now.getHours())) return;
    running = true;
    await job();
    running = false;
  }, 60000);
  return () => clearInterval(timer);
}
