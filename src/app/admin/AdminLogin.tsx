'use client'
import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'
export function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        setError('Invalid credentials.')
        setLoading(false)
        return
      }

      setPassword('')
      router.refresh()
      window.location.reload()
    } catch {
      setError('Connection error.')
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#080604] text-orange-50/70 select-none">
      <form
        onSubmit={submit}
        className="flex w-[min(24rem,90vw)] flex-col items-center gap-4 rounded-2xl border border-orange-300/25 bg-[#140a05]/95 p-8 text-center shadow-2xl backdrop-blur-lg"
      >
        <ShieldAlert className="h-12 w-12 text-[#f97316]" />
        <div>
          <h1 className="text-base font-black uppercase tracking-[.18em] text-white">BALAA Admin Access</h1>
          <p className="text-xs text-orange-200/60 mt-1">Authentication required to operate studio</p>
        </div>

        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          autoFocus
          autoComplete="current-password"
          className="w-full rounded-lg border border-orange-300/30 bg-black/60 px-4 py-2.5 text-sm text-white outline-none focus:border-orange-400 placeholder:text-slate-600 text-center font-mono"
          placeholder="Enter admin password"
        />

        {error && <p className="text-xs text-rose-400 font-bold">{error}</p>}

        <button
          disabled={loading || !password}
          className="w-full rounded-lg bg-[#f97316] hover:bg-[#fb923c] disabled:opacity-50 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#160904] transition shadow-lg shadow-orange-500/20"
        >
          {loading ? 'Authenticating…' : 'Sign in to Studio'}
        </button>
      </form>
    </div>
  )
}
