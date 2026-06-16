'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const QUALIFICATIONS = [
  'TOEIC 600点以上', 'TOEIC 700点以上', 'TOEIC 800点以上', 'TOEIC 900点以上',
  '英検準1級', '英検1級', '普通自動車免許', '簿記3級', '簿記2級', '簿記1級',
  '応用情報技術者', '基本情報技術者', 'ITパスポート', 'AWS認定', 'Python3認定',
]

export default function StudentProfileEdit() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    university: '',
    faculty: '',
    graduation_year: new Date().getFullYear() + 1,
    status: 'undergraduate',
    es_text: '',
    self_pr: '',
    qualifications: [] as string[],
    is_public: true,
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase.from('student_profiles').select('*').eq('id', user.id).single()
      if (data) {
        setForm({
          full_name: data.full_name ?? '',
          university: data.university ?? '',
          faculty: data.faculty ?? '',
          graduation_year: data.graduation_year ?? new Date().getFullYear() + 1,
          status: data.status ?? 'undergraduate',
          es_text: data.es_text ?? '',
          self_pr: data.self_pr ?? '',
          qualifications: data.qualifications ?? [],
          is_public: data.is_public ?? true,
        })
      }
      setLoading(false)
    }
    load()
  }, [router])

  function toggleQual(q: string) {
    setForm(f => ({
      ...f,
      qualifications: f.qualifications.includes(q)
        ? f.qualifications.filter(x => x !== q)
        : [...f.qualifications, q],
    }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Save profile
    await supabase.from('student_profiles').upsert({ id: user.id, ...form })

    // Generate embedding for AI matching
    await fetch('/api/student/embed', { method: 'POST' })

    router.push('/student/dashboard')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">読み込み中...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-blue-600">RecruitMatch</Link>
        <Link href="/student/dashboard" className="text-sm text-gray-500 hover:text-gray-900">← ダッシュボード</Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h2 className="text-xl font-bold mb-6">プロフィール編集</h2>
        <form onSubmit={handleSave} className="space-y-6">

          {/* Basic info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-700">基本情報</h3>
            <Field label="お名前 *">
              <input required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                className={input} placeholder="山田 太郎" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="大学名">
                <input value={form.university} onChange={e => setForm(f => ({ ...f, university: e.target.value }))}
                  className={input} placeholder="〇〇大学" />
              </Field>
              <Field label="学部・学科">
                <input value={form.faculty} onChange={e => setForm(f => ({ ...f, faculty: e.target.value }))}
                  className={input} placeholder="経済学部" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="卒業予定年">
                <input type="number" value={form.graduation_year}
                  onChange={e => setForm(f => ({ ...f, graduation_year: Number(e.target.value) }))}
                  className={input} min={2024} max={2030} />
              </Field>
              <Field label="身分">
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={input}>
                  <option value="undergraduate">学部生</option>
                  <option value="graduate">大学院生</option>
                  <option value="other">その他</option>
                </select>
              </Field>
            </div>
          </div>

          {/* ES */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-700">エントリーシート (ES)</h3>
            <Field label="自己PR">
              <textarea value={form.self_pr} onChange={e => setForm(f => ({ ...f, self_pr: e.target.value }))}
                className={`${input} h-28 resize-none`} placeholder="あなたの強みや経験をアピールしてください" />
            </Field>
            <Field label="志望理由・ES本文">
              <textarea value={form.es_text} onChange={e => setForm(f => ({ ...f, es_text: e.target.value }))}
                className={`${input} h-40 resize-none`} placeholder="ESの内容、ガクチカ、志望動機など自由に記載してください" />
            </Field>
          </div>

          {/* Qualifications */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-700 mb-3">保有資格・スキル</h3>
            <div className="flex flex-wrap gap-2">
              {QUALIFICATIONS.map(q => (
                <button key={q} type="button" onClick={() => toggleQual(q)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition ${
                    form.qualifications.includes(q)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}>
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Public toggle */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 flex justify-between items-center">
            <div>
              <p className="font-medium text-sm">プロフィールを公開する</p>
              <p className="text-xs text-gray-500 mt-1">公開するとAIマッチングの対象になります</p>
            </div>
            <button type="button" onClick={() => setForm(f => ({ ...f, is_public: !f.is_public }))}
              className={`w-12 h-6 rounded-full transition ${form.is_public ? 'bg-blue-600' : 'bg-gray-300'}`}>
              <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.is_public ? 'translate-x-6' : ''}`} />
            </button>
          </div>

          <button type="submit" disabled={saving}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition">
            {saving ? '保存中...' : '保存する'}
          </button>
        </form>
      </main>
    </div>
  )
}

const input = 'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}
