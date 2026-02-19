import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as cheerio from 'cheerio'

export interface SearchResult {
  title: string
  url: string
  image_url: string | null
  description: string | null
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ error: 'q is required' }, { status: 400 })

  try {
    const searchUrl = `https://www.bbcgoodfood.com/search?q=${encodeURIComponent(q)}&tab=recipe`
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
      },
      next: { revalidate: 0 },
    })

    if (!res.ok) {
      throw new Error(`BBC Good Food returned HTTP ${res.status}`)
    }

    const html = await res.text()
    const $ = cheerio.load(html)

    const results: SearchResult[] = []

    // BBC Good Food search results — recipe cards
    // They use a card component with a link, image, and title
    $('a[href*="/recipes/"]').each((_, el) => {
      if (results.length >= 12) return false

      const href = $(el).attr('href') || ''

      // Only pick actual recipe paths: /recipes/SLUG (not /recipes/collection/...)
      if (!/^\/recipes\/[a-z0-9-]+$/.test(href)) return

      const fullUrl = `https://www.bbcgoodfood.com${href}`

      // Avoid duplicates
      if (results.some((r) => r.url === fullUrl)) return

      // Title: look inside the link for a heading or the link text itself
      const headingEl = $(el).find('h2, h3, [class*="title"], [class*="heading"]').first()
      const title = headingEl.length ? headingEl.text().trim() : $(el).text().trim()
      if (!title || title.length < 3) return

      // Image: look for an img inside the card (which may be the parent)
      const cardEl = $(el).closest('[class*="card"], article, li, div').first()
      let image_url: string | null = null

      const imgEl = cardEl.find('img').first()
      if (imgEl.length) {
        image_url =
          imgEl.attr('src') ||
          imgEl.attr('data-src') ||
          imgEl.attr('data-lazy-src') ||
          null
        // Skip tiny placeholder images (base64 or very short)
        if (image_url && (image_url.startsWith('data:') || image_url.length < 20)) {
          image_url = null
        }
      }

      // Description: look for a <p> in the card
      const descEl = cardEl.find('p').first()
      const description = descEl.length ? descEl.text().trim() || null : null

      results.push({ title, url: fullUrl, image_url, description })
    })

    return NextResponse.json({ results })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Search failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
