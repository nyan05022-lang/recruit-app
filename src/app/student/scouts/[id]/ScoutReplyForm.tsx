'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ScoutReplyForm({ scoutId }: { scoutId: string }) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  async function handleReply(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    const supabase = createClient()
    await supabase.from('scouts').update({ reply_message: message, status: 'replied' }).eq('id', scoutId)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="font-semibold mb-3">返信する</h3>
      <form onSubmit={handleReply} className="space-y-3">
        <textarea
          required
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
          placeholder="企業へのメッセージを入力してください"
        />
        <button type="submit" disabled={sending}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition">
          {sending ? '送信中...' : '返信を送る'}
        </button>
      </form>
    </div>
  )
}
