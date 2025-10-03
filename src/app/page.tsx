'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { BookStats, Category } from '@/types'

const categories: Category[] = ['株式・インデックス','不動産','FIRE関連','FX','その他']
type SortKey = 'rating' | 'new' | 'count'

export default function Home() {
  const [items, setItems] = useState<BookStats[]>([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState<'' | Category>('')
  const [minStar, setMinStar] = useState(0)
  const [sort, setSort] = useState<SortKey>('rating')
  const [q, setQ] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      let query = supabase.from('book_stats').select('*')
      if (cat) query = query.eq('category', cat)
      const { data, error } = await query.limit(200)
      if (error) console.error(error)
      setItems(data || [])
      setLoading(false)
    }
    fetchData()
  }, [cat])

  const filtered = useMemo(() => {
    return items
      .filter(x => x.avg_rating >= (minStar || 0))
      .filter(x => (q ? (x.title + (x.author||'')).toLowerCase().includes(q.toLowerCase()) : true))
      .sort((a,b) => {
        if (sort === 'rating') return (b.avg_rating - a.avg_rating) || (b.rec_count - a.rec_count)
        if (sort === 'new') return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        if (sort === 'count') return (b.rec_count - a.rec_count) || (b.avg_rating - a.avg_rating)
        return 0
      })
  }, [items, minStar, sort, q])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="検索（タイトル・著者）" className="md:col-span-2 rounded border px-3 py-2" />
        <select
          value={cat}
          onChange={e => setCat(e.target.value as '' | Category)}
          className="rounded border px-3 py-2"
        >
          <option value="">カテゴリ（すべて）</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-sm whitespace-nowrap">★ 最低</label>
          <input type="number" min={0} max={5} value={minStar} onChange={e=>setMinStar(Number(e.target.value))} className="w-20 rounded border px-2 py-2" />
        </div>
        <div className="md:col-span-4 flex items-center gap-2">
          <label className="text-sm">ソート:</label>
          <select value={sort} onChange={e=>setSort(e.target.value as SortKey)} className="rounded border px-3 py-2">
            <option value="rating">評価が高い順</option>
            <option value="new">登録/更新が新しい順</option>
            <option value="count">投稿数が多い順</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p>読み込み中…</p>
      ) : (
        <ul className="divide-y rounded-xl border bg-white">
          {filtered.map(b => (
            <li key={b.id} className="p-4 hover:bg-gray-50">
              <a href={`/book/${b.id}`} className="block">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-lg">{b.title}</h3>
                    <p className="text-sm text-gray-600">{b.author || '著者不明'}</p>
                    <div className="mt-1 flex items-center gap-2 text-sm">
                      <span className="inline-flex items-center rounded-full border px-2 py-0.5">{b.category}</span>
                      <span className="text-gray-500">投稿 {b.rec_count} 件</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl">
                      {'★'.repeat(Math.round(b.avg_rating))}
                      <span className="text-gray-400">{'★'.repeat(5 - Math.round(b.avg_rating))}</span>
                    </div>
                    <div className="text-xs text-gray-500">平均 {b.avg_rating.toFixed(2)}</div>
                  </div>
                </div>
              </a>
            </li>
          ))}
          {filtered.length===0 && (
            <li className="p-6 text-center text-gray-500">条件に一致する本がありません</li>
          )}
        </ul>
      )}
    </div>
  )
}
