export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: scouts } = await supabase
    .from('scouts')
    .select('*, company_profiles(company_name)')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-blue-600">RecruitMatch</Link>
        <span className="text-sm text-gray-600">{profile?.full_name} さん</span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-semibold">{profile?.full_name}</h2>
              <p className="text-sm text-gray-500">{profile?.university} {profile?.faculty}</p>
            </div>
            <Link href="/student/profile/edit" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              編集
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">卒業予定年</span>
              <p className="font-medium">{profile?.graduation_year ?? '未設定'}年</p>
            </div>
            <div>
              <span className="text-gray-500">身分</span>
              <p className="font-medium">
                {profile?.status === 'undergraduate' ? '学部生' : profile?.status === 'graduate' ? '大学院生' : profile?.status ?? '未設定'}
              </p>
            </div>
          </div>
          {profile?.qualifications && profile.qualifications.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">保有資格</p>
              <div className="flex flex-wrap gap-2">
                {profile.qualifications.map((q: string) => (
                  <span key={q} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{q}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Scouts */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold mb-4">受信したスカウト</h3>
          {scouts && scouts.length > 0 ? (
            <div className="space-y-3">
              {scouts.map((s: any) => (
                <Link key={s.id} href={`/student/scouts/${s.id}`}
                  className="block border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{s.company_profiles?.company_name}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{s.message}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      s.status === 'sent' ? 'bg-yellow-50 text-yellow-700' :
                      s.status === 'read' ? 'bg-blue-50 text-blue-700' :
                      'bg-green-50 text-green-700'
                    }`}>
                      {s.status === 'sent' ? '未読' : s.status === 'read' ? '既読' : '返信済み'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">まだスカウトは届いていません。プロフィールを充実させましょう。</p>
          )}
        </div>
      </main>
    </div>
  )
}
