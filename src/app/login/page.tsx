'use client'

import { useEffect, useState } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const [origin, setOrigin] = useState<string | null>(null)

  useEffect(() => {
    // CSR でだけ origin を使う（SSR では触らない）
    setOrigin(window.location.origin)
  }, [])

  return (
    <div className="mx-auto max-w-md rounded-xl border bg-white p-6">
      <h1 className="mb-4 text-xl font-semibold">ログイン</h1>
      {/* origin がまだ取れてない最初の 1render では何も表示しない */}
      {origin && (
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}             // まずは Email/Password のみ
          redirectTo={`${origin}/`}  // ログイン後はトップへ
          view="sign_in"
          localization={{
            variables: {
              sign_in:  { email_label: 'メールアドレス', password_label: 'パスワード' },
              sign_up:  { email_label: 'メールアドレス', password_label: 'パスワード' },
            }
          }}
        />
      )}
      {!origin && <p className="text-sm text-gray-500">読み込み中…</p>}
      <p className="mt-3 text-sm text-gray-600">
        初回は「Sign up」からアカウント作成してください。
      </p>
    </div>
  )
}
