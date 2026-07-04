/**
 * Scoring threshold logic and colour assignment for step audit scores.
 * Returns CSS custom property strings (var(--neo-*)) for use in inline styles.
 */

export const THRESHOLDS = {
  logical_validity: 0.75,
  reference_integrity: 0.80,
  necessity_score: 0.65,
}

/**
 * Return CSS colour var for a step's left indicator based on audit scores.
 * @param {object|null} audit
 * @returns {string} CSS colour value
 */
export function stepIndicatorColor(audit) {
  if (!audit) return 'var(--neo-text-muted)'
  const { logical_validity, reference_integrity, necessity_score } = audit
  if (logical_validity < 0.45 || reference_integrity < 0.45 || necessity_score < 0.45) {
    return 'var(--neo-danger)'
  }
  if (audit.flagged) return 'var(--neo-warning)'
  return 'var(--neo-success)'
}

/**
 * Return combined box-shadow for a step card (neo-raised + optional inset border).
 * @param {object|null} audit
 * @returns {string} CSS box-shadow value
 */
export function stepCardShadow(audit) {
  const base = '6px 6px 14px var(--neo-shadow-dark), -6px -6px 14px var(--neo-shadow-light)'
  if (!audit) return base
  const { logical_validity, reference_integrity, necessity_score } = audit
  if (logical_validity < 0.45 || reference_integrity < 0.45 || necessity_score < 0.45) {
    return `${base}, inset 0 0 0 2px var(--neo-danger)`
  }
  if (audit.flagged) return `${base}, inset 0 0 0 2px var(--neo-warning)`
  return `${base}, inset 0 0 0 2px var(--neo-success)`
}

/**
 * Return CSS colour var for a score bar fill.
 * @param {number} score
 * @returns {string} CSS colour value
 */
export function scoreBarColor(score) {
  if (score < 0.45) return 'var(--neo-danger)'
  if (score < 0.75) return 'var(--neo-warning)'
  return 'var(--neo-success)'
}

/**
 * Determine which audit dimension is most problematic across audits.
 * @param {Array} audits
 * @returns {string} dimension name
 */
export function worstDimension(audits) {
  const dims = ['logical_validity', 'reference_integrity', 'necessity_score']
  const sums = Object.fromEntries(dims.map(d => [d, 0]))
  for (const a of audits) {
    for (const d of dims) sums[d] += a[d] ?? 1
  }
  return dims.reduce((worst, d) => sums[d] < sums[worst] ? d : worst, dims[0])
}
