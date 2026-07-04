/**
 * Step text formatting helpers.
 */

/**
 * Truncate text to maxLen chars, appending ellipsis.
 * @param {string} text
 * @param {number} maxLen
 * @returns {string}
 */
export function truncate(text, maxLen = 120) {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen - 1) + '…'
}

/**
 * Format a score (0.0–1.0) as a percentage string.
 * @param {number} score
 * @returns {string}
 */
export function pct(score) {
  return `${Math.round(score * 100)}%`
}
