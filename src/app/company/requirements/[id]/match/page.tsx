import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import MatchRunner from './MatchRunner'

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: req } = await supabase
    .from('job_requirements')
    .select('*')
    .eq('id', id)
    .eq('company_id', user.id)
    .single()

  if (!req) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-blue-600">RecruitMatch</Link>
        <Link href="/company/dashboard" className="text-sm text-gray-500 hover:text-gray-900">← ダッシュボード</Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-6">
          <h2 className="text-xl font-bold">{req.title}</h2>
          <p className="text-sm text-gray-500 mt-1">AIマッチング結果</p>
        </div>
        <MatchRunner requirementId={id} />
      </main>
    </div>
  )
}
