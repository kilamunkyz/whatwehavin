import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface SearchResult {
  title: string
  url: string
  image_url: string | null
  description: string | null
}

// BBC Good Food exposes a clean internal search API (same data as __NEXT_DATA__)
const BBC_SEARCH_API =
  'https://www.bbcgoodfood.com/api/search-frontend/search'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ error: 'q is required' }, { status: 400 })

  try {
    const apiUrl = new URL(BBC_SEARCH_API)
    apiUrl.searchParams.set('tab', 'recipe')
    apiUrl.searchParams.set('search', q)
    apiUrl.searchParams.set('page', '1')

    const res = await fetch(apiUrl.toString(), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json',
        'Accept-Language': 'en-GB,en;q=0.9',
        Referer: 'https://www.bbcgoodfood.com/',
      },
      next: { revalidate: 0 },
    })

    if (!res.ok) {
      throw new Error(`BBC Good Food search returned HTTP ${res.status}`)
    }

    const data = await res.json()

    // The response shape: { searchResults: { items: [...], totalItems, limit, nextUrl }, ... }
    const searchResults = data.searchResults ?? data
    const items: BBCSearchItem[] = Array.isArray(searchResults.items) ? searchResults.items : []

    const results: SearchResult[] = items
      .filter((item) => item.postType === 'recipe' && item.url)
      .slice(0, 12)
      .map((item) => {
        // Strip HTML tags from description
        const rawDesc = item.description ?? ''
        const description = rawDesc.replace(/<[^>]+>/g, '').trim() || null

        return {
          title: item.title ?? 'Untitled',
          url: item.url.startsWith('http')
            ? item.url
            : `https://www.bbcgoodfood.com${item.url}`,
          image_url: item.image?.url ?? null,
          description,
        }
      })

    return NextResponse.json({ results })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Search failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// Minimal type for BBC search API items
interface BBCSearchItem {
  id?: string
  title?: string
  url: string
  description?: string
  postType?: string
  isPremium?: boolean
  image?: { url: string; alt?: string }
  rating?: { ratingValue?: number; ratingCount?: number }
}
