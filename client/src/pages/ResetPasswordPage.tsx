import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { authApi } from '../services/api'
import SkyWaveLogo from '../assets/logo/SkyWaveLogo'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''

  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword,    setShowPassword]    = useState(false)
  const [error,           setError]           = useState('')
  const [loading,         setLoading]         = useState(false)
  const [done,            setDone]            = useState(false)

  const handleSubmit = async () => {
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    setError('')
    setLoading(true)
    try {
      await authApi.resetPassword(token, password)
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reset your password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#EFF6FF] dark:bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl px-8 py-10 shadow-2xl">
        <div className="flex justify-center mb-6">
          <SkyWaveLogo className="h-8" />
        </div>

        {!token ? (
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Invalid reset link</h1>
            <p className="text-slate-400 text-sm mb-6">This link is missing its security token. Please request a new password reset.</p>
            <button onClick={() => navigate('/')} className="btn-search w-full py-3.5 rounded-xl text-white font-semibold text-sm">
              Go home
            </button>
          </div>
        ) : done ? (
          <div className="text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Password reset</h1>
            <p className="text-slate-400 text-sm mb-6">Your password has been updated. You can now sign in with your new password.</p>
            <button onClick={() => navigate('/')} className="btn-search w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-transform hover:scale-[1.01] active:scale-[0.99]">
              Back to SkyWave
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">Set a new password</h1>
            <p className="text-slate-400 text-sm mb-6">Choose a strong password for your account.</p>

            <div className="flex flex-col gap-3">
              <div className="auth-field">
                <span className="text-slate-400 shrink-0"><Lock className="w-4 h-4" /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="flex-1 bg-transparent text-slate-900 dark:text-slate-100 text-sm font-medium outline-none placeholder-slate-400"
                />
                <button type="button" onClick={() => setShowPassword(p => !p)} className="text-slate-400 hover:text-slate-600 transition-colors shrink-0">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="auth-field">
                <span className="text-slate-400 shrink-0"><Lock className="w-4 h-4" /></span>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  className="flex-1 bg-transparent text-slate-900 dark:text-slate-100 text-sm font-medium outline-none placeholder-slate-400"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-xs mt-3">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-search w-full py-3.5 rounded-xl text-white font-semibold text-sm mt-5 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting…' : 'Reset password'}
            </button>

            <button onClick={() => navigate('/')} className="text-slate-400 text-xs font-semibold hover:text-slate-600 dark:hover:text-slate-200 transition-colors mt-4 block mx-auto">
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  )
}
