export type Category = '株式・インデックス' | '不動産' | 'FIRE関連' | 'FX' | 'その他'

export type BookStats = {
  id: string
  title: string
  author: string | null
  category: Category
  created_at: string
  updated_at: string
  avg_rating: number
  rec_count: number
}
