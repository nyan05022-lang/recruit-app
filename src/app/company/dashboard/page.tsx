import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function CompanyDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase
    .from('company_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: requirements } = await supabase
    .from('job_requirements')
    .select('*, scouts(count)')
    .eq('company_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-blue-600">RecruitMatch</Link>
        <span className="text-sm text-gray-600">{company?.company_name}</span>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">求人要件一覧</h2>
          <Link href="/company/requirements/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
            + 新しい要件を作成
          </Link>
        </div>

        {requirements && requirements.length > 0 ? (
          <div className="space-y-4">
            {requirements.map((req: any) => (
              <div key={req.id} className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold">{req.title}</h3>
                  <Link href={`/company/requirements/${req.id}/match`}
                    className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition">
                    🤖 AIマッチング実行
                  </Link>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{req.description}</p>
                {req.required_qualifications?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {req.required_qualifications.map((q: string) => (
                      <span key={q} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{q}</span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-3">
                  スカウト送信数: {req.scouts?.[0]?.count ?? 0}件
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500 mb-4">まだ求人要件がありません</p>
            <Link href="/company/requirements/new"
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
              最初の要件を作成する
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
