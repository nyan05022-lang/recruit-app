import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { requirementId } = await request.json()

  // Fetch job requirement
  const { data: req } = await supabase
    .from('job_requirements')
    .select('*')
    .eq('id', requirementId)
    .eq('company_id', user.id)
    .single()

  if (!req) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Generate embedding if missing
  let embedding = req.embedding
  if (!embedding) {
    const text = [
      req.title,
      req.description,
      req.required_qualifications?.join(', '),
    ].filter(Boolean).join('\n')

    const embRes = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    })
    embedding = embRes.data[0].embedding

    await supabase.from('job_requirements').update({ embedding }).eq('id', requirementId)
  }

  // Vector similarity search via Supabase RPC
  const { data: candidates } = await supabase.rpc('match_students', {
    query_embedding: embedding,
    match_threshold: 0.3,
    match_count: 20,
  })

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ results: [] })
  }

  // Filter by graduation year if set
  const filtered = candidates.filter((c: any) => {
    if (req.graduation_year_min && c.graduation_year < req.graduation_year_min) return false
    if (req.graduation_year_max && c.graduation_year > req.graduation_year_max) return false
    return true
  })

  // Get already scouted student ids for this requirement
  const { data: existingScouts } = await supabase
    .from('scouts')
    .select('student_id')
    .eq('requirement_id', requirementId)

  const scoutedIds = new Set((existingScouts ?? []).map((s: any) => s.student_id))

  // Generate match reasons with GPT-4o
  const resultsWithReasons = await Promise.all(
    filtered.slice(0, 10).map(async (candidate: any) => {
      let match_reason = ''
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: '就職活動のマッチングアシスタントです。企業の求める人材要件と候補者のプロフィールを比較し、なぜマッチするか1〜2文で簡潔に説明してください。日本語で回答してください。',
            },
            {
              role: 'user',
              content: `
求人: ${req.title}
求める人材: ${req.description}
必要資格: ${req.required_qualifications?.join(', ') || 'なし'}

候補者:
- 大学: ${candidate.university || '未設定'} ${candidate.faculty || ''}
- 卒業予定: ${candidate.graduation_year}年
- 保有資格: ${candidate.qualifications?.join(', ') || 'なし'}
- 自己PR: ${candidate.self_pr || 'なし'}
              `.trim(),
            },
          ],
          max_tokens: 150,
        })
        match_reason = completion.choices[0].message.content ?? ''
      } catch {
        match_reason = ''
      }

      return {
        ...candidate,
        match_reason,
        already_scouted: scoutedIds.has(candidate.id),
      }
    })
  )

  return NextResponse.json({ results: resultsWithReasons })
}
