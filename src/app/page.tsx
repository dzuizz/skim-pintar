import { supabase } from '@/lib/supabase'
import { LandingContent } from '@/components/landing-content'

export default async function Home() {
  const { data: transparencyData } = await supabase
    .from('transparency_config')
    .select('category, percentage, description')
    .order('sort_order', { ascending: true })

  const categories = (transparencyData ?? []).map((t) => ({
    category: t.category,
    percentage: t.percentage,
    description: t.description,
  }))

  return <LandingContent categories={categories} />
}
