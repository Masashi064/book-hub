'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

type Category = '株式・インデックス' | '不動産' | 'FIRE関連' | 'FX' | 'その他'
const categories: Category[] = ['株式・インデックス','不動産','FIRE関連','FX','その他']

export default function SubmitPage(){
  // 入力
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [category, setCategory] = useState<Category>('株式・インデックス')
  const [rating, setRating] = useState(5)
  const [reason, setReason] = useState('')
  const [name, setName]   = useState('') // 任意表示名
  const [url, setUrl]     = useState('') // 任意URL

  // サジェスト
  const [similar, setSimilar] = useState<{id:string,title:string,author:string|null,similarity_score:number,levenshtein_distance:number}[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // タイトル入力 → 類似本サジェスト
  useEffect(()=>{
    const run = setTimeout(async ()=>{
      if(!title.trim()) { setSimilar([]); return }
      const { data, error } = await supabase.rpc('search_similar_books', { q: title })
      if (!error) setSimilar(data || [])
    }, 250)
    return ()=>clearTimeout(run)
  },[title])

  const canSubmit = useMemo(()=> !!title.trim() && rating>=1 && rating<=5 && !!category, [title, rating, category])

  const submit = async () => {
    setSubmitting(true); setError('')
    try {
      // 1) 既存の完全一致があればそれを使う
      const { data: exists } = await supabase.from('books').select('id').ilike('title', title).limit(1)
      let bookId = exists?.[0]?.id

      // 2) なければ作成（匿名可：RLSを緩めてある想定）
      if(!bookId){
        const { data: inserted, error: e1 } = await supabase
          .from('books').insert({ title, author: author || null, category })
          .select('id').single()
        if(e1) throw e1
        bookId = inserted.id
      }

      // 3) 同時におすすめ理由（匿名）を追加
      const { error: e2 } = await supabase.from('recommendations').insert({
        book_id: bookId,
        rating,
        reason: reason || null,
        user_id: null,
        display_name: name || null,
        source_url: url || null
      })
      if(e2) throw e2

      // 完了 → 詳細へ
      location.href = `/book/${bookId}`
    } catch(e:any){
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* 左カラム：入力フォーム */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">あなたのおすすめの本を登録する</h2>

        <label className="block text-sm">タイトル（必須）</label>
        <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full rounded border px-3 py-2" />

        <label className="block text-sm">著者（任意）</label>
        <input value={author} onChange={e=>setAuthor(e.target.value)} className="w-full rounded border px-3 py-2" />

        <label className="block text-sm">カテゴリ（必須）</label>
        <select value={category} onChange={e=>setCategory(e.target.value as Category)} className="w-full rounded border px-3 py-2">
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <label className="block text-sm">オススメ度（★1〜5）</label>
        <input type="number" min={1} max={5} value={rating} onChange={e=>setRating(Number(e.target.value))} className="w-24 rounded border px-3 py-2" />

        <label className="block text-sm">おすすめ理由（任意）</label>
        <textarea value={reason} onChange={e=>setReason(e.target.value)} rows={4} className="w-full rounded border px-3 py-2" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm">あなたの名前（任意）</label>
            <input value={name} onChange={e=>setName(e.target.value)} className="w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm">参考URL（任意）</label>
            <input value={url} onChange={e=>setUrl(e.target.value)} className="w-full rounded border px-3 py-2" />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button onClick={submit} disabled={!canSubmit || submitting} className="rounded-lg border px-4 py-2 disabled:opacity-50">
          登録
        </button>

        <p className="text-xs text-gray-500">
          ※ 投稿は審査なく公開されます。
        </p>
      </div>

      {/* 右カラム：重複候補 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">すでに登録されているかも？</h3>
        <ul className="divide-y rounded-xl border bg-white">
          {similar.map(s => (
            <li key={s.id} className="p-3 text-sm">
              <Link href={`/book/${s.id}`} className="font-medium hover:underline" prefetch={false}>
                {s.title}
              </Link>
              <div className="text-gray-600">{s.author || '著者不明'}</div>
              <div className="text-xs text-gray-500">similarity: {s.similarity_score.toFixed(2)} / lev: {s.levenshtein_distance}</div>
            </li>
          ))}
          {similar.length===0 && <li className="p-3 text-gray-500 text-sm">タイトルを入力すると自動ですでに登録されている本からタイトル類似候補を表示</li>}
        </ul>
      </div>
    </div>
  )
}
