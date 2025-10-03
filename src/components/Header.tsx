'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function Header() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    let unsub: (() => void) | undefined
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
    const listener = supabase.auth.onAuthStateChange((_e, s) => {
      setEmail(s?.user?.email ?? null)
    })
    unsub = () => listener.data?.subscription?.unsubscribe()
    return () => { try { unsub?.() } catch {} }
  }, [])

  return (
    <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">📚 おすすめ本まとめ</Link>
        <nav className="text-sm flex items-center gap-4">
          <Link href="/submit" className="hover:underline" prefetch={false}>あなたのおすすめの本を投稿する</Link>
        </nav>
      </div>
    </header>
  )
}
