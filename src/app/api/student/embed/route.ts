import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const text = [
    `名前: ${profile.full_name}`,
    profile.university ? `大学: ${profile.university}` : '',
    profile.faculty ? `学部: ${profile.faculty}` : '',
    profile.graduation_year ? `卒業予定: ${profile.graduation_year}年` : '',
    profile.status === 'undergraduate' ? '身分: 学部生' : profile.status === 'graduate' ? '身分: 大学院生' : '',
    profile.qualifications?.length ? `資格: ${profile.qualifications.join(', ')}` : '',
    profile.self_pr ? `自己PR: ${profile.self_pr}` : '',
    profile.es_text ? `ES: ${profile.es_text}` : '',
  ].filter(Boolean).join('\n')

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })

  await supabase
    .from('student_profiles')
    .update({ embedding: response.data[0].embedding })
    .eq('id', user.id)

  return NextResponse.json({ success: true })
}
