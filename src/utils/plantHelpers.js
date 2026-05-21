export function getWateringFrequencyLabel(days) {
  if (!days) return 'Unknown'
  if (days === 1) return 'Daily'
  if (days === 7) return 'Weekly'
  if (days === 14) return 'Every 2 weeks'
  return `Every ${days} days`
}

/**
 * Normalize AI identify response into form field shape.
 * Merges with existing form values — only overwrites if AI provides a value.
 */
export function normalizeAIResponse(data, existingForm = {}) {
  const normalized = {};

  if (data.name) normalized.name = data.name;
  if (data.latin || data.latin_name) normalized.latin = data.latin || data.latin_name;
  if (data.watering) normalized.watering = data.watering;
  if (data.watering_frequency_days) normalized.watering = `Every ${data.watering_frequency_days} day/s`;
  if (data.light) normalized.light = data.light;
  if (data.humidity) normalized.humidity = data.humidity;
  if (data.soil) normalized.soil = data.soil;
  if (data.notes || data.care_notes) normalized.notes = data.notes || data.care_notes;
  if (data.wateringDetail || data.watering_schedule_detail) {
    normalized.wateringDetail = data.wateringDetail || data.watering_schedule_detail;
  }
  if (data.emoji) normalized.emoji = data.emoji;

  return { ...existingForm, ...normalized };
}

export function getDaysUntilWatering(nextWateringAt) {
  if (!nextWateringAt) return null

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const next = new Date(nextWateringAt)
  next.setHours(0, 0, 0, 0)

  const diffMs = next - now
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

export function isOverdue(nextWateringAt) {
  const days = getDaysUntilWatering(nextWateringAt)
  return days !== null && days < 0
}

export function getOverdueDays(nextWateringAt) {
  const days = getDaysUntilWatering(nextWateringAt)
  if (days === null || days >= 0) return 0
  return Math.abs(days)
}

export function getTimingBucket(nextWateringAt) {
  const daysUntil = getDaysUntilWatering(nextWateringAt)

  if (daysUntil === null) return 'Later'
  if (daysUntil < 0) return 'Today'
  if (daysUntil === 0) return 'Today'
  if (daysUntil < 3) return '< 3 days'
  if (daysUntil <= 7) return 'This week'
  return 'Later'
}

export function getUrgencyLabel(nextWateringAt) {
  const days = getDaysUntilWatering(nextWateringAt)

  if (days === null) return 'No date'
  if (days < 0) return days === -1 ? '1 day overdue' : `${Math.abs(days)} days overdue`
  if (days === 0) return 'Today'
  if (days === 1) return '1 day'
  return `${days} days`
}

export function getUrgencyClass(nextWateringAt) {
  const days = getDaysUntilWatering(nextWateringAt)

  if (days === null) return 'urgency-low'
  if (days < 0) return 'urgency-overdue'
  if (days === 0) return 'urgency-high'
  if (days <= 4) return 'urgency-med'
  return 'urgency-low'
}

/**
 * Returns a thumbnail URL for Supabase storage images.
 * Appends render/image/public transform parameters for resizing.
 */
export function getThumbnailUrl(imageUrl, width = 200) {
  if (!imageUrl) return null
  return imageUrl
}