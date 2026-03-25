export function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getOrganizerNameFromEvent(event) {
  // Backends commonly shape organizer as:
  // - event.organizer.organizerId (populated object)
  // - event.organizer.name (string)
  // - event.organizerName (string)
  const orgId = event?.organizer?.organizerId
  if (orgId && typeof orgId === 'object' && orgId.name) return orgId.name
  if (event?.organizer?.name) return event.organizer.name
  if (event?.organizerName) return event.organizerName
  return ''
}

export function getOrganizerSlugFromEvent(event) {
  const name = getOrganizerNameFromEvent(event)
  return slugify(name) || 'organizer'
}

export function getEventDetailPath(eventOrId, organizerSlug) {
  const id = typeof eventOrId === 'string' ? eventOrId : eventOrId?._id
  if (!id) return '/events'
  const slug =
    slugify(organizerSlug) ||
    (typeof eventOrId === 'object' ? getOrganizerSlugFromEvent(eventOrId) : 'organizer')
  return `/events/${slug}/${id}`
}

