export const dynamic = 'force-dynamic'

import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ScoutReplyForm from './ScoutReplyForm'

export default async function ScoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: scout } = await supabase
    .from('scouts')
    .select('*, company_profiles(company_name, industry, description)')
    .eq('id', id)
    .eq('student_id', user.id)
    .single()

  if (!scout) notFound()

  // Mark as read
  if (scout.status === 'sent') {
    await supabase.from('scouts').update({ status: 'read' }).eq('id', id)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-blue-600">RecruitMatch</Link>
        <Link href="/student/dashboard" className="text-sm text-gray-500 hover:text-gray-900">← ダッシュボード</Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">スカウト元</p>
            <h2 className="text-xl font-bold">{scout.company_profiles?.company_name}</h2>
            <p className="text-sm text-gray-500">{scout.company_profiles?.industry}</p>
          </div>
          {scout.company_profiles?.description && (
            <p className="text-sm text-gray-700 mb-4 p-3 bg-gray-50 rounded-lg">{scout.company_profiles.description}</p>
          )}
          {scout.match_score && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.round(scout.match_score * 100)}%` }} />
              </div>
              <span className="text-xs text-blue-600 font-medium">マッチ度 {Math.round(scout.match_score * 100)}%</span>
            </div>
          )}
          {scout.match_reason && (
            <div className="text-sm text-gray-600 p-3 bg-blue-50 rounded-lg mb-4">
              <p className="font-medium text-blue-800 mb-1">AIマッチング理由</p>
              {scout.match_reason}
            </div>
          )}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-500 mb-2">企業からのメッセージ</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{scout.message}</p>
          </div>
        </div>

        {scout.reply_message ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-xs text-gray-500 mb-2">あなたの返信</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{scout.reply_message}</p>
          </div>
        ) : (
          <ScoutReplyForm scoutId={id} />
        )}
      </main>
    </div>
  )
}
