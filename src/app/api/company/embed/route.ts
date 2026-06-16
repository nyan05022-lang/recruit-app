import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? 'dummy' })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { requirementId } = await request.json()

  const { data: req } = await supabase
    .from('job_requirements')
    .select('*')
    .eq('id', requirementId)
    .eq('company_id', user.id)
    .single()

  if (!req) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const text = [
    `求人タイトル: ${req.title}`,
    `求める人材・仕事内容: ${req.description}`,
    req.required_qualifications?.length ? `必要資格: ${req.required_qualifications.join(', ')}` : '',
    req.graduation_year_min ? `卒業予定年: ${req.graduation_year_min}〜${req.graduation_year_max}年` : '',
  ].filter(Boolean).join('\n')

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })

  await supabase
    .from('job_requirements')
    .update({ embedding: response.data[0].embedding })
    .eq('id', requirementId)

  return NextResponse.json({ success: true })
}
