import { createClient } from '@/lib/supabase/server'

export interface PageContent {
  banner_image_url: string | null
  banner_eyebrow: string | null
  banner_title: string | null
  banner_subtitle: string | null
  banner_cta_text: string | null
  banner_cta_href: string | null
}

export async function getPageContent(pageKey: string): Promise<PageContent | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('page_content')
      .select('banner_image_url, banner_eyebrow, banner_title, banner_subtitle, banner_cta_text, banner_cta_href')
      .eq('page_key', pageKey)
      .single()
    return data as PageContent | null
  } catch {
    return null
  }
}
