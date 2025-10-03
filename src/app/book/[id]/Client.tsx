'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

type Category = '株式・インデックス' | '不動産' | 'FIRE関連' | 'FX' | 'その他'
type BookStats = {
  id: string
  title: string
  author: string | null
  category: Category
  created_at: string
  updated_at: string
  avg_rating: number
  rec_count: number
}
type Recommendation = {
  id: string
  book_id: string
  user_id: string | null
  rating: number
  reason: string | null
  display_name: string | null
  source_url: string | null
  created_at: string
}

export default function BookDetailClient({ id }: { id: string }) {
  const [book, setBook] = useState<BookStats | null>(null)
  const [recs, setRecs] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: b }, { data: r }] = await Promise.all([
      supabase.from('book_stats').select('*').eq('id', id).maybeSingle(),
      supabase.from('recommendations').select('*').eq('book_id', id).order('created_at', { ascending: false })
    ])
    setBook(b || null)
    setRecs(r || [])
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm underline" prefetch={false}>← 一覧へ戻る</Link>

      {loading && <p>読み込み中…</p>}

      {book && (
        <section className="rounded-xl border bg-white p-5">
          <h2 className="text-2xl font-bold">{book.title}</h2>
          <p className="text-gray-600">{book.author || '著者不明'}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center rounded-full border px-2 py-0.5">{book.category}</span>
            <span>平均評価: <strong>{book.avg_rating.toFixed(2)}</strong></span>
            <span>投稿: <strong>{book.rec_count}</strong> 件</span>
            <span className="text-gray-500">登録: {new Date(book.created_at).toLocaleString()}</span>
            <span className="text-gray-500">最終更新: {new Date(book.updated_at).toLocaleString()}</span>
          </div>
        </section>
      )}

      <section className="rounded-xl border bg-white p-5">
        <h3 className="mb-3 text-lg font-semibold">みんなのおすすめ理由</h3>
        <ul className="divide-y">
          {recs.map(r => (
            <li key={r.id} className="py-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-yellow-600">
                    {'★'.repeat(r.rating)}
                    <span className="text-gray-300">{'★'.repeat(5 - r.rating)}</span>
                  </div>
                  {r.reason && <p className="mt-1 whitespace-pre-wrap text-sm">{r.reason}</p>}
                  <div className="mt-1 text-xs text-gray-600">
                    {r.display_name && <span>投稿者: {r.display_name}　</span>}
                    {r.source_url && (
                      <a href={r.source_url} target="_blank" className="underline break-all" rel="noreferrer">URL</a>
                    )}
                  </div>
                </div>
                <time className="text-xs text-gray-500">{new Date(r.created_at).toLocaleString()}</time>
              </div>
            </li>
          ))}
          {recs.length === 0 && <li className="py-6 text-center text-gray-500">まだ投稿がありません</li>}
        </ul>
      </section>

      <section className="rounded-xl border bg-white p-5">
        <h3 className="mb-3 text-lg font-semibold">この本に評価を追加</h3>
        <AddRecForm bookId={id} onDone={load} />
      </section>
    </div>
  )
}

function AddRecForm({ bookId, onDone }: { bookId: string, onDone: () => void }) {
  const [rating, setRating] = useState(5)
  const [reason, setReason] = useState('')
  const [name, setName] = useState('') // 任意の投稿者名
  const [url, setUrl] = useState('')   // 参考URL（任意）
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    try {
      setSubmitting(true); setError(null)
      const { error } = await supabase.from('recommendations').insert({
        book_id: bookId,
        rating,
        reason: reason || null,
        user_id: null,                 // 匿名
        display_name: name || null,
        source_url: url || null
      })
      if (error) throw error
      setRating(5); setReason(''); setName(''); setUrl('')
      onDone()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm mb-1">評価（★1〜5）</label>
        <input type="number" min={1} max={5} value={rating}
               onChange={e=>setRating(Number(e.target.value))}
               className="w-24 rounded border px-2 py-2" />
      </div>
      <div>
        <label className="block text-sm mb-1">おすすめ理由（任意）</label>
        <textarea value={reason} onChange={e=>setReason(e.target.value)}
                  rows={3} className="w-full rounded border px-3 py-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">あなたの名前（任意）</label>
          <input value={name} onChange={e=>setName(e.target.value)}
                 className="w-full rounded border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">参考URL（任意）</label>
          <input value={url} onChange={e=>setUrl(e.target.value)}
                 className="w-full rounded border px-3 py-2" />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={submitting}
              onClick={submit}
              className="rounded-lg border px-4 py-2 disabled:opacity-50">投稿</button>
    </div>
  )
}
