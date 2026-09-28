import { useEffect } from 'react'

const SITE = 'ЯРУСКА'
const BASE = 'https://yaruska.ru'
const DEFAULT_IMAGE = `${BASE}/Photos/Hero_desktop.jpg`
const DEFAULT_DESC = 'Авторские свечи ручной работы из гипса и соевого воска. Свечи-шкатулки в русском стиле — матрёшки, самовары, караваи. Доставка по России.'

type SeoOptions = {
  title?: string
  description?: string
  canonical?: string
  image?: string
  noindex?: boolean
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

function setMeta(selector: string, attrs: Record<string, string>, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function useSeo({ title, description, canonical, image, noindex, jsonLd }: SeoOptions) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE}` : `${SITE} — авторские свечи ручной работы`
    const desc = description || DEFAULT_DESC
    const url = `${BASE}${canonical || window.location.pathname}`
    const img = image ? (image.startsWith('http') ? image : `${BASE}${image}`) : DEFAULT_IMAGE

    document.title = fullTitle
    setMeta('meta[name="description"]', { name: 'description' }, desc)
    setMeta('meta[name="robots"]', { name: 'robots' }, noindex ? 'noindex, nofollow' : 'index, follow')
    setMeta('meta[property="og:title"]', { property: 'og:title' }, fullTitle)
    setMeta('meta[property="og:description"]', { property: 'og:description' }, desc)
    setMeta('meta[property="og:url"]', { property: 'og:url' }, url)
    setMeta('meta[property="og:image"]', { property: 'og:image' }, img)
    setMeta('meta[property="og:type"]', { property: 'og:type' }, 'website')
    setMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image')
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, fullTitle)
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, desc)
    setMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, img)

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'canonical'
      document.head.appendChild(link)
    }
    link.href = url

    let script: HTMLScriptElement | null = null
    if (jsonLd) {
      script = document.createElement('script')
      script.type = 'application/ld+json'
      script.dataset.seo = 'page'
      script.textContent = JSON.stringify(jsonLd)
      document.head.appendChild(script)
    }
    return () => { script?.remove() }
  }, [title, description, canonical, image, noindex, JSON.stringify(jsonLd)])
}
