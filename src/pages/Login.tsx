import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Mail, Lock, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const { error: err } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })

    if (err) setError(err.message)
    setLoading(false)
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    })

    if (err) {
      setError(err.message)
    } else {
      setSuccess('Email de redefinição enviado! Verifique sua caixa de entrada.')
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithOAuth({ provider: 'google' })
    if (err) setError(err.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark p-4 fade-in">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/favicon.png" alt="Leitura da Bíblia" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-primary">Leitura da Bíblia</h1>
          <p className="text-text-muted text-sm mt-1">Plano de leitura em 1 ano • TNM</p>
        </div>

        {mode === 'reset' ? (
          <form onSubmit={handleReset} className="space-y-4">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setSuccess('') }}
              className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              <ArrowLeft size={14} />
              Voltar ao login
            </button>

            <p className="text-sm text-text-muted">
              Digite seu email para receber um link de redefinição de senha.
            </p>

            <div>
              <label className="block text-sm text-text-secondary mb-1">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-bg-card border border-white/10 rounded-xl px-10 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50"
                  placeholder="seu@email.com" required
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-green-400 text-sm">{success}</p>}

            <button
              type="submit" disabled={loading}
              className="w-full bg-accent hover:bg-accent-light text-bg-dark font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 btn-primary"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              Enviar link de redefinição
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full bg-bg-card border border-white/10 rounded-xl px-10 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50"
                    placeholder="seu@email.com" required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-1">Senha</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full bg-bg-card border border-white/10 rounded-xl px-10 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50"
                    placeholder="••••••••" required minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => { setMode('reset'); setError(''); setSuccess('') }}
                  className="text-xs text-accent hover:underline"
                >
                  Esqueceu a senha?
                </button>
              )}

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit" disabled={loading}
                className="w-full bg-accent hover:bg-accent-light text-bg-dark font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 btn-primary"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {mode === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
              <div className="relative flex justify-center"><span className="bg-bg-dark px-3 text-xs text-text-muted">ou</span></div>
            </div>

            <button
              onClick={handleGoogle} disabled={loading}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-text-primary py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm btn-ghost"
            >
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Entrar com Google
            </button>

            <p className="text-center text-sm text-text-muted mt-6">
              {mode === 'login' ? (
                <>Não tem conta? <button onClick={() => setMode('register')} className="text-accent hover:underline btn-ghost">Criar</button></>
              ) : (
                <>Já tem conta? <button onClick={() => setMode('login')} className="text-accent hover:underline btn-ghost">Entrar</button></>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  )
}