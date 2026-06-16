import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { requirementId, studentId, message, matchScore, matchReason } = await request.json()

  // Prevent duplicate scouts
  const { data: existing } = await supabase
    .from('scouts')
    .select('id')
    .eq('requirement_id', requirementId)
    .eq('student_id', studentId)
    .single()

  if (existing) return NextResponse.json({ error: 'Already scouted' }, { status: 409 })

  const { error } = await supabase.from('scouts').insert({
    requirement_id: requirementId,
    company_id: user.id,
    student_id: studentId,
    message,
    match_score: matchScore,
    match_reason: matchReason,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
