export function getUserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Local";
  } catch {
    return "Local";
  }
}

export function getShortTimeZoneLabel(date: Date | string | number = new Date(), timeZone = getUserTimeZone()) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone === "Local" ? undefined : timeZone,
      timeZoneName: "short"
    }).formatToParts(new Date(date));
    return parts.find((part) => part.type === "timeZoneName")?.value ?? "Local";
  } catch {
    return "Local";
  }
}

export function formatTimeInUserTimeZone(date: Date | string | number, timeZone = getUserTimeZone()) {
  try {
    const value = new Date(date);
    return `${new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: timeZone === "Local" ? undefined : timeZone
    }).format(value)} ${getShortTimeZoneLabel(value, timeZone)}`;
  } catch {
    return "Time unavailable";
  }
}

export function formatDateTimeInUserTimeZone(date: Date | string | number, timeZone = getUserTimeZone()) {
  try {
    const value = new Date(date);
    return `${new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: timeZone === "Local" ? undefined : timeZone
    }).format(value)} ${getShortTimeZoneLabel(value, timeZone)}`;
  } catch {
    return "Time unavailable";
  }
}

export function formatTimestampLocal(date: Date | string | number) {
  return formatDateTimeInUserTimeZone(date);
}

export function formatTimeLocal(date: Date | string | number) {
  return formatTimeInUserTimeZone(date);
}
