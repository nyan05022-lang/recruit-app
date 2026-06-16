'use client'

import { useState } from 'react'

type MatchResult = {
  id: string
  full_name: string
  university: string
  faculty: string
  graduation_year: number
  qualifications: string[]
  self_pr: string
  similarity: number
  match_reason: string
  already_scouted: boolean
}

export default function MatchRunner({ requirementId }: { requirementId: string }) {
  const [results, setResults] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [scoutMessage, setScoutMessage] = useState('あなたのプロフィールを拝見し、弊社の求める人材に非常にマッチしていると感じました。ぜひ一度お話しできればと思い、ご連絡いたしました。')
  const [scouting, setScouting] = useState<Record<string, boolean>>({})
  const [scouted, setScouted] = useState<Record<string, boolean>>({})

  async function runMatch() {
    setLoading(true)
    const res = await fetch('/api/ai/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requirementId }),
    })
    const data = await res.json()
    setResults(data.results ?? [])
    setLoading(false)
  }

  async function sendScout(studentId: string) {
    setScouting(s => ({ ...s, [studentId]: true }))
    await fetch('/api/scout/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requirementId, studentId, message: scoutMessage }),
    })
    setScouted(s => ({ ...s, [studentId]: true }))
    setScouting(s => ({ ...s, [studentId]: false }))
  }

  return (
    <div className="space-y-6">
      {results.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <p className="text-gray-600 mb-6">求人要件をもとにAIが候補者を検索します</p>
          <button onClick={runMatch} disabled={loading}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                AIマッチング中...
              </span>
            ) : '🤖 AIマッチングを実行'}
          </button>
        </div>
      )}

      {results.length > 0 && (
        <>
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">スカウトメッセージ（全員共通）</label>
            <textarea
              value={scoutMessage}
              onChange={e => setScoutMessage(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
            />
          </div>

          <p className="text-sm text-gray-500">{results.length}名の候補者が見つかりました</p>

          {results.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{r.full_name}</h3>
                  <p className="text-sm text-gray-500">{r.university} {r.faculty} / {r.graduation_year}年卒見込み</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{Math.round(r.similarity * 100)}%</div>
                  <div className="text-xs text-gray-400">マッチ度</div>
                </div>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${Math.round(r.similarity * 100)}%` }} />
              </div>

              {r.qualifications?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {r.qualifications.map(q => (
                    <span key={q} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{q}</span>
                  ))}
                </div>
              )}

              {r.self_pr && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">{r.self_pr}</p>
              )}

              {r.match_reason && (
                <div className="text-xs text-indigo-700 bg-indigo-50 p-3 rounded-lg mb-4">
                  <span className="font-medium">AIコメント: </span>{r.match_reason}
                </div>
              )}

              {r.already_scouted || scouted[r.id] ? (
                <div className="text-sm text-green-600 font-medium">✓ スカウト送信済み</div>
              ) : (
                <button
                  onClick={() => sendScout(r.id)}
                  disabled={scouting[r.id]}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {scouting[r.id] ? '送信中...' : 'スカウトを送る'}
                </button>
              )}
            </div>
          ))}

          <button onClick={runMatch} disabled={loading}
            className="w-full text-sm text-indigo-600 border border-indigo-300 py-2.5 rounded-xl hover:bg-indigo-50 transition">
            再マッチング
          </button>
        </>
      )}
    </div>
  )
}
