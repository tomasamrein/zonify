import { useEffect } from 'react'

interface SEOConfig {
  title?: string
  description?: string
  image?: string
  url?: string
}

export function useSEO({ title = 'Zonify — Software para distribuidoras mayoristas', description = 'Plataforma SaaS offline-first para preventa, stock y logística', image = '/og-image.svg', url = 'https://zonify.com.ar' }: SEOConfig = {}) {
  useEffect(() => {
    document.title = title

    const updateMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`)
      if (!meta) {
        meta = document.createElement('meta')
        if (name.startsWith('og:')) {
          meta.setAttribute('property', name)
        } else {
          meta.setAttribute('name', name)
        }
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', content)
    }

    updateMeta('description', description)
    updateMeta('og:title', title)
    updateMeta('og:description', description)
    updateMeta('og:image', image)
    updateMeta('og:url', url)
    updateMeta('twitter:title', title)
    updateMeta('twitter:description', description)
    updateMeta('twitter:image', image)
  }, [title, description, image, url])
}
