import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">RecruitMatch</h1>
        <div className="flex gap-3">
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2">
            ログイン
          </Link>
          <Link href="/signup" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            新規登録
          </Link>
        </div>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <span className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full mb-6">
          AIマッチング × 逆スカウト
        </span>
        <h2 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
          あなたの可能性を、<br />企業が見つけに来る
        </h2>
        <p className="text-lg text-gray-600 mb-8 max-w-xl">
          プロフィールを登録するだけ。AIが企業の求める条件と照合し、
          あなたにぴったりの企業から逆スカウトが届きます。
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/signup?role=student" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition">
            就活生として登録
          </Link>
          <Link href="/signup?role=company" className="bg-white text-blue-600 border border-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-blue-50 transition">
            企業として登録
          </Link>
        </div>
      </section>

      <section className="bg-white py-16 px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            { icon: '📝', title: 'プロフィール登録', desc: 'ES・資格・学歴・身分を一度登録するだけ' },
            { icon: '🤖', title: 'AIマッチング', desc: '企業の要件とベクトル類似度で最適候補を自動抽出' },
            { icon: '✉️', title: '逆スカウト', desc: 'あなたに興味を持った企業から直接メッセージが届く' },
          ].map(f => (
            <div key={f.title} className="text-center p-6">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
