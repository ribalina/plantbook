export function getWateringFrequencyLabel(days) {
  if (!days) return 'Unknown'
  if (days === 1) return 'Daily'
  if (days === 7) return 'Weekly'
  if (days === 14) return 'Every 2 weeks'
  return `Every ${days} days`
}

export function getDaysUntilWatering(nextWateringAt) {
  if (!nextWateringAt) return null

  const now = new Date()
  const next = new Date(nextWateringAt)

  const diffMs = next - now
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

export function getTimingBucket(nextWateringAt) {
  const daysUntil = getDaysUntilWatering(nextWateringAt)

  if (daysUntil === null) return 'Later'
  if (daysUntil <= 0) return 'Today'
  if (daysUntil < 3) return '< 3 days'
  if (daysUntil <= 7) return 'This week'
  return 'Later'
}

export function getUrgencyLabel(nextWateringAt) {
  const days = getDaysUntilWatering(nextWateringAt)

  if (days === null) return 'No date'
  if (days <= 0) return 'Today'
  if (days === 1) return '1 day'
  return `${days} days`
}

export function getUrgencyClass(nextWateringAt) {
  const days = getDaysUntilWatering(nextWateringAt)

  if (days === null) return 'urgency-low'
  if (days <= 1) return 'urgency-high'
  if (days <= 4) return 'urgency-med'
  return 'urgency-low'
}