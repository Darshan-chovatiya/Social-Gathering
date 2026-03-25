import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Keeps the tab favicon correct on every route. Browsers often cache favicons
 * per URL (including hash routes), which can leave an old icon after client-side navigation.
 */
export default function FaviconSync() {
  const location = useLocation()

  useEffect(() => {
    const base = import.meta.env.BASE_URL || '/'
    const normalizedBase = base.endsWith('/') ? base : `${base}/`
    const routeKey = `${location.pathname}${location.search}${location.hash || ''}`
    const href = `${normalizedBase}logo.png?r=${encodeURIComponent(routeKey)}`

    document
      .querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
      .forEach((el) => el.remove())

    const addIcon = (sizes) => {
      const link = document.createElement('link')
      link.rel = 'icon'
      link.type = 'image/png'
      link.setAttribute('sizes', sizes)
      link.href = href
      document.head.appendChild(link)
    }

    addIcon('192x192')
    addIcon('48x48')
    addIcon('32x32')
    addIcon('16x16')

    const apple = document.createElement('link')
    apple.rel = 'apple-touch-icon'
    apple.setAttribute('sizes', '180x180')
    apple.href = href
    document.head.appendChild(apple)
  }, [location.pathname, location.search, location.hash])

  return null
}
