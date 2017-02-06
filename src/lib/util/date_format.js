/**
 * Returns a formatted string describing the time elapsed since the given date
 * in natural language.
 *
 * @param {Date} scanTime - Time in the past to use for comparison.
 *
 * @returns {string} String description of the elapsed time.
 */
export function timeSince(scanTime) {
  const now = new Date();
  const timeDiffInMs = now.getTime() - scanTime.getTime();
  const timeDiffInHours = timeDiffInMs / 1000 / 60 / 60;

  if (timeDiffInHours < 0) {
    return 'in the future';
  }

  if (timeDiffInHours < 24) {
    if (now.getDate() == scanTime.getDate()) {
      return formatTimeToday(scanTime);
    } else {
      return formatTimeYesterday(scanTime);
    }
  }

  const timeDiffInDays = timeDiffInHours / 24;
  if (timeDiffInDays < 7) {
    return formatTimeInDays(timeDiffInDays);
  }

  const timeDiffInWeeks = timeDiffInDays / 7;
  return formatTimeInWeeks(timeDiffInWeeks);
}

/**
 * @param {Date} scanTime - Time in the past to use for comparison.
 *
 * @returns {string} String description of the elapsed time.
 */
function formatTimeToday(scanTime) {
  const hours = scanTime.getHours();
  const minutesString = zeroPad(scanTime.getMinutes());
  return `today at ${hours}:${minutesString}`;
}

/**
 * @param {Date} scanTime - Time in the past to use for comparison.
 *
 * @returns {string} String description of the elapsed time.
 */
function formatTimeYesterday(scanTime) {
  const hours = scanTime.getHours();
  const minutesString = zeroPad(scanTime.getMinutes());
  return `yesterday at ${hours}:${minutesString}`;
}

/**
 * @param {number} timeDiffInDays - Number of days elapsed.
 *
 * @returns {string} String description of the elapsed time.
 */
function formatTimeInDays(timeDiffInDays) {
  const days = Math.floor(timeDiffInDays);
  if (days == 1) {
    return 'one day ago';
  } else {
    return `${days} days ago`;
  }
}

/**
 * @param {number} timeDiffInWeeks - Number of weeks elapsed.
 *
 * @returns {string} String description of the elapsed time.
 */
function formatTimeInWeeks(timeDiffInWeeks) {
  const weeks = Math.floor(timeDiffInWeeks);
  if (weeks == 1) {
    return 'one week ago';
  } else {
    return `${weeks} weeks ago`;
  }
}

/**
 * @param {integer} minutes - The minutes portion of the time.
 *
 * @returns {string} The minutes portion of the time, zero-padded to two digits.
 */
function zeroPad(minutes) {
  const minutesString = minutes.toString();
  if (minutesString.length == 1) {
    return '0' + minutesString;
  }
  return minutesString;
}
