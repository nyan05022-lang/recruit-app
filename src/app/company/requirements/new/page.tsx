'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const QUALIFICATIONS = [
  'TOEIC 600点以上', 'TOEIC 700点以上', 'TOEIC 800点以上', 'TOEIC 900点以上',
  '英検準1級', '英検1級', '普通自動車免許', '簿記3級', '簿記2級', '簿記1級',
  '応用情報技術者', '基本情報技術者', 'ITパスポート', 'AWS認定', 'Python3認定',
]

export default function NewRequirementPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    required_qualifications: [] as string[],
    graduation_year_min: new Date().getFullYear(),
    graduation_year_max: new Date().getFullYear() + 2,
  })

  function toggleQual(q: string) {
    setForm(f => ({
      ...f,
      required_qualifications: f.required_qualifications.includes(q)
        ? f.required_qualifications.filter(x => x !== q)
        : [...f.required_qualifications, q],
    }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('job_requirements')
      .insert({ ...form, company_id: user.id })
      .select()
      .single()

    if (!error && data) {
      // Generate embedding for this requirement
      await fetch('/api/company/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirementId: data.id }),
      })
      router.push(`/company/requirements/${data.id}/match`)
    } else {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-blue-600">RecruitMatch</Link>
        <Link href="/company/dashboard" className="text-sm text-gray-500 hover:text-gray-900">← ダッシュボード</Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h2 className="text-xl font-bold mb-6">求人要件を作成</h2>
        <form onSubmit={handleSave} className="space-y-6">

          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-700">基本情報</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">求人タイトル *</label>
              <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className={inp} placeholder="例: 営業職 2026年新卒採用" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">求める人材像・仕事内容 *</label>
              <textarea required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className={`${inp} h-40 resize-none`}
                placeholder="どんな人材を求めているか、仕事内容、カルチャー、強みなど詳しく記載してください。AIがこの内容をもとにマッチングします。" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">卒業予定年（最小）</label>
                <input type="number" value={form.graduation_year_min}
                  onChange={e => setForm(f => ({ ...f, graduation_year_min: Number(e.target.value) }))}
                  className={inp} min={2024} max={2030} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">卒業予定年（最大）</label>
                <input type="number" value={form.graduation_year_max}
                  onChange={e => setForm(f => ({ ...f, graduation_year_max: Number(e.target.value) }))}
                  className={inp} min={2024} max={2030} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-700 mb-3">求める資格・スキル（任意）</h3>
            <div className="flex flex-wrap gap-2">
              {QUALIFICATIONS.map(q => (
                <button key={q} type="button" onClick={() => toggleQual(q)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition ${
                    form.required_qualifications.includes(q)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}>
                  {q}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition">
            {saving ? 'AIマッチング準備中...' : '作成してAIマッチングへ →'}
          </button>
        </form>
      </main>
    </div>
  )
}

const inp = 'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
