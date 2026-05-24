import { useState, useLayoutEffect, useRef } from 'react'
import { X, Eye, EyeOff, Mail, Lock, User, Hash } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

type AuthView = 'signin' | 'register'

interface Props {
  onClose:   () => void
  onSuccess: (type: 'login' | 'register') => void
}

interface FieldProps {
  icon:        React.ReactNode
  type:        string
  placeholder: string
  value:       string
  onChange:    (v: string) => void
  suffix?:     React.ReactNode
}

function Field({ icon, type, placeholder, value, onChange, suffix }: FieldProps) {
  return (
    <div className="auth-field">
      <span className="text-slate-400 shrink-0">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-1 bg-transparent text-slate-900 text-sm font-medium outline-none placeholder-slate-400"
      />
      {suffix}
    </div>
  )
}

function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className="text-slate-400 hover:text-slate-600 transition-colors shrink-0">
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  )
}

export default function AuthModal({ onClose, onSuccess }: Props) {
  const { login, register } = useAuth()

  const [view,            setView]            = useState<AuthView>('signin')
  const [email,           setEmail]           = useState('')
  const [password,        setPassword]        = useState('')
  const [firstName,       setFirstName]       = useState('')
  const [lastName,        setLastName]        = useState('')
  const [age,             setAge]             = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword,    setShowPassword]    = useState(false)
  const [error,           setError]           = useState('')
  const [loading,         setLoading]         = useState(false)

  const formRef   = useRef<HTMLDivElement>(null)
  const isMounted = useRef(false)

  useLayoutEffect(() => {
    const el = formRef.current
    if (!el) return

    if (!isMounted.current) {
      el.style.transition = 'none'
      el.style.height = `${el.scrollHeight}px`
      void el.offsetHeight
      el.style.transition = ''
      isMounted.current = true
      return
    }

    const prevHeight = el.offsetHeight
    el.style.transition = 'none'
    el.style.height = 'auto'
    const newHeight = el.scrollHeight
    el.style.height = `${prevHeight}px`
    void el.offsetHeight
    el.style.transition = ''
    el.style.height = `${newHeight}px`
  }, [view])

  const handleSignIn = async () => {
    setError('')
    setLoading(true)
    try {
      await login({ email, password })
      onSuccess('login')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    setError('')
    setLoading(true)
    try {
      await register({ email, password, firstName, lastName, age: Number(age) })
      onSuccess('register')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center">
      <div className="auth-overlay absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="auth-panel relative w-full max-w-md bg-white rounded-t-3xl px-8 pb-10 pt-5 shadow-2xl">
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />

        <button onClick={onClose} className="absolute top-5 right-6 text-slate-400 hover:text-slate-700 transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6">
          {(['signin', 'register'] as AuthView[]).map(v => (
            <button
              key={v}
              onClick={() => { setView(v); setError('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                view === v ? 'btn-tab-active text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {v === 'signin' ? 'Sign in' : 'Register'}
            </button>
          ))}
        </div>

        <div ref={formRef} className="auth-form-body">
          {view === 'signin' ? (
            <>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Welcome back</h2>
              <p className="text-slate-400 text-sm mb-6">Sign in to your SkyWave account</p>

              <div className="flex flex-col gap-3">
                <Field icon={<Mail className="w-4 h-4" />} type="email"
                  placeholder="Email address" value={email} onChange={setEmail} />
                <Field icon={<Lock className="w-4 h-4" />} type={showPassword ? 'text' : 'password'}
                  placeholder="Password" value={password} onChange={setPassword}
                  suffix={<EyeToggle show={showPassword} onToggle={() => setShowPassword(p => !p)} />} />
              </div>

              <button className="text-indigo-600 text-xs font-semibold hover:text-indigo-800 transition-colors mt-3 block">
                Forgot your password?
              </button>

              {error && <p className="text-red-500 text-xs mt-3">{error}</p>}

              <button
                onClick={handleSignIn}
                disabled={loading}
                className="btn-search w-full py-3.5 rounded-xl text-white font-semibold text-sm mt-4 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Join SkyWave</h2>
              <p className="text-slate-400 text-sm mb-6">Create your free account</p>

              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field icon={<User className="w-4 h-4" />} type="text"
                    placeholder="First name" value={firstName} onChange={setFirstName} />
                  <Field icon={<User className="w-4 h-4" />} type="text"
                    placeholder="Last name" value={lastName} onChange={setLastName} />
                </div>
                <Field icon={<Hash className="w-4 h-4" />} type="number"
                  placeholder="Age" value={age} onChange={setAge} />
                <Field icon={<Mail className="w-4 h-4" />} type="email"
                  placeholder="Email address" value={email} onChange={setEmail} />
                <Field icon={<Lock className="w-4 h-4" />} type={showPassword ? 'text' : 'password'}
                  placeholder="Password" value={password} onChange={setPassword}
                  suffix={<EyeToggle show={showPassword} onToggle={() => setShowPassword(p => !p)} />} />
                <Field icon={<Lock className="w-4 h-4" />} type="password"
                  placeholder="Confirm password" value={confirmPassword} onChange={setConfirmPassword} />
              </div>

              {error && <p className="text-red-500 text-xs mt-3">{error}</p>}

              <button
                onClick={handleRegister}
                disabled={loading}
                className="btn-search w-full py-3.5 rounded-xl text-white font-semibold text-sm mt-4 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
