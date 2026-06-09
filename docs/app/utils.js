export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function formatNumber(value, options = {}) {
  const abs = Math.abs(value);
  if (abs < 1000) {
    if (options.fixedDecimal) {
      return value.toLocaleString("ja-JP", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    if (options.integer) {
      return Math.floor(value).toLocaleString("ja-JP", { maximumFractionDigits: 0 });
    }
    const digits = options.precise
      ? (abs < 100 ? 2 : 1)
      : 0;
    return value.toLocaleString("ja-JP", {
      minimumFractionDigits: options.precise && abs > 0 && abs < 10 ? 2 : 0,
      maximumFractionDigits: digits
    });
  }

  const units = ["k", "M", "G", "T", "P", "E"];
  let scaled = value;
  let unitIndex = -1;
  while (Math.abs(scaled) >= 1000 && unitIndex < units.length - 1) {
    scaled /= 1000;
    unitIndex += 1;
  }

  return `${scaled.toLocaleString("ja-JP", {
    minimumFractionDigits: options.fixedCompact ? 3 : 0,
    maximumFractionDigits: options.fixedCompact ? 3 : (Math.abs(scaled) < 10 ? 1 : 0)
  })}${units[unitIndex]}`;
}

export function formatRabbits(value, options = {}) {
  return `${formatNumber(value, options)}羽`;
}

export function formatRabbitCount(value) {
  return `${formatNumber(value, { integer: true, fixedCompact: true })}羽`;
}

export function formatRate(value) {
  return `${formatNumber(value, { fixedDecimal: true, fixedCompact: true })}羽`;
}
