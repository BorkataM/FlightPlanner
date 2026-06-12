import { useState, useRef } from 'react'
import { X, Camera, ImageIcon } from 'lucide-react'

function resizeImage(dataUrl: string, maxW: number, maxH: number): Promise<string> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      let { width: w, height: h } = img
      if (w > maxW) { h = Math.round(h * maxW / w); w = maxW }
      if (h > maxH) { w = Math.round(w * maxH / h); h = maxH }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.src = dataUrl
  })
}

export interface ProfileData {
  avatarDataUrl:    string | null
  coverGradient:    string
  coverImageDataUrl: string | null
  bio:              string
}

const COVER_GRADIENTS = [
  { id: 'night',  cls: 'from-slate-800 via-slate-700 to-blue-900',   label: 'Ocean Night' },
  { id: 'aurora', cls: 'from-indigo-900 via-purple-800 to-pink-700', label: 'Aurora'      },
  { id: 'sunset', cls: 'from-orange-600 via-rose-600 to-purple-700', label: 'Sunset'      },
  { id: 'forest', cls: 'from-emerald-800 via-teal-700 to-cyan-800',  label: 'Forest'      },
  { id: 'arctic', cls: 'from-sky-800 via-blue-700 to-indigo-800',    label: 'Arctic'      },
  { id: 'golden', cls: 'from-amber-700 via-orange-600 to-red-700',   label: 'Golden'      },
]

const MAX_BIO = 150

interface Props {
  initials: string
  initial:  ProfileData
  onClose:  () => void
  onSave:   (data: ProfileData) => void
}

export default function EditProfileModal({ initials, initial, onClose, onSave }: Props) {
  const [avatarDataUrl,     setAvatarDataUrl]     = useState(initial.avatarDataUrl)
  const [coverGradient,     setCoverGradient]     = useState(initial.coverGradient)
  const [coverImageDataUrl, setCoverImageDataUrl] = useState(initial.coverImageDataUrl)
  const [bio,               setBio]               = useState(initial.bio)

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef  = useRef<HTMLInputElement>(null)

  function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      const resized = await resizeImage(ev.target?.result as string, 300, 300)
      setAvatarDataUrl(resized)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function handleCoverFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      const resized = await resizeImage(ev.target?.result as string, 1200, 400)
      setCoverImageDataUrl(resized)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function selectGradient(cls: string) {
    setCoverGradient(cls)
    setCoverImageDataUrl(null) // gradient takes over, clear any uploaded image
  }

  function handleSave() {
    onSave({ avatarDataUrl, coverGradient, coverImageDataUrl, bio })
  }

  const overLimit = bio.length > MAX_BIO

  // Determine what shows in the preview strip
  const previewStyle = coverImageDataUrl
    ? { backgroundImage: `url(${coverImageDataUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined
  const previewGradientCls = coverImageDataUrl ? '' : `bg-gradient-to-br ${coverGradient}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Edit Profile</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Live preview strip */}
        <div
          className={`relative h-28 ${previewGradientCls}`}
          style={previewStyle}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent pointer-events-none" />
          {/* Avatar overlapping below strip */}
          <div className="absolute bottom-0 left-6 translate-y-1/2 z-10">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                {avatarDataUrl
                  ? <img src={avatarDataUrl} alt="avatar" className="w-full h-full object-cover" />
                  : <span className="text-2xl font-black text-white select-none">{initials}</span>
                }
              </div>
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
          <span className="absolute top-3 right-4 text-[11px] font-semibold text-white/60 uppercase tracking-wide">
            Preview
          </span>
        </div>

        {/* Hidden file inputs */}
        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
        <input ref={coverInputRef}  type="file" accept="image/*" className="hidden" onChange={handleCoverFile}  />

        {/* Form body */}
        <div className="px-6 pt-14 pb-6 space-y-5">

          {/* Cover Background */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2.5 block">
              Cover Background
            </label>

            {/* Gradient swatches */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {COVER_GRADIENTS.map(g => {
                const isActive = !coverImageDataUrl && coverGradient === g.cls
                return (
                  <button
                    key={g.id}
                    onClick={() => selectGradient(g.cls)}
                    className={`relative h-14 rounded-xl bg-gradient-to-br ${g.cls} transition-all duration-150 ${
                      isActive ? 'ring-2 ring-blue-500 ring-offset-2 scale-[1.03]' : 'hover:scale-[1.03]'
                    }`}
                  >
                    <span className="absolute bottom-1.5 inset-x-0 text-center text-[10px] font-bold text-white/80">
                      {g.label}
                    </span>
                    {isActive && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Upload button */}
            <button
              onClick={() => coverInputRef.current?.click()}
              className={`flex items-center gap-2.5 px-4 py-2.5 border-2 border-dashed rounded-xl text-sm transition-colors w-full justify-center ${
                coverImageDataUrl
                  ? 'border-blue-300 text-blue-600 bg-blue-50/50 hover:bg-blue-50'
                  : 'border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              {coverImageDataUrl ? 'Change background photo' : 'Upload background photo'}
            </button>
            {coverImageDataUrl && (
              <button
                onClick={() => setCoverImageDataUrl(null)}
                className="mt-1.5 text-xs text-rose-500 hover:text-rose-600 w-full text-center transition-colors"
              >
                Remove photo (use gradient)
              </button>
            )}
          </div>

          {/* Bio */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Bio</label>
              <span className={`text-xs tabular-nums ${overLimit ? 'text-rose-500 font-semibold' : 'text-slate-400'}`}>
                {bio.length} / {MAX_BIO}
              </span>
            </div>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={3}
              placeholder="Tell the world about your travel adventures…"
              className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 transition ${
                overLimit
                  ? 'border-rose-300 focus:ring-rose-400/30'
                  : 'border-slate-200 focus:ring-blue-500/30 focus:border-blue-300'
              }`}
            />
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/80">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={overLimit}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Changes
          </button>
        </div>

      </div>
    </div>
  )
}
