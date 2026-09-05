'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'

type Profile = {
  id: string
  username: string | null
  display_name: string | null
  bio: string | null
  avatar_url: string | null
}

export default function EditProfileModal({ profile }: { profile: Profile }) {
  const [isOpen, setIsOpen] = useState(false)
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [username, setUsername] = useState(profile?.username || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [preview, setPreview] = useState(profile?.avatar_url || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()
  const supabase = createClient()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  async function handleSave() {
    setLoading(true)
    setError('')

    try {
      let avatarUrl = profile?.avatar_url || null

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const filePath = `${profile.id}/avatar.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)

        avatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          username: username,
          bio: bio,
          avatar_url: avatarUrl,
        })
        .eq('id', profile.id)

      if (updateError) throw updateError

      setIsOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan perubahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs font-semibold text-white border border-neutral-700 px-3 py-1.5 rounded-full hover:bg-neutral-800 transition"
      >
        Edit Profile
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-neutral-900 border border-neutral-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col">
            {/* Header - sticky */}
            <div className="flex justify-between items-center p-5 pb-3 border-b border-neutral-800 shrink-0">
              <h3 className="font-bold text-lg">Edit Profile</h3>
              <button onClick={() => setIsOpen(false)}>
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            {/* Body - scrollable */}
            <div className="overflow-y-auto p-5 space-y-4 flex-1">
              <div className="flex justify-center">
                <label className="cursor-pointer">
                  <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden">
                    {preview ? (
                      <img src={preview} alt="Avatar preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl text-neutral-500">
                        {username?.[0]?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <p className="text-[10px] text-center text-neutral-500 mt-1">Ganti foto</p>
                </label>
              </div>

              <div>
                <label className="text-xs text-neutral-400">Nama Tampilan</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm mt-1"
                  placeholder="Nama kamu"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400">Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm mt-1"
                  placeholder="username"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm mt-1 resize-none"
                  rows={3}
                  maxLength={150}
                  placeholder="Ceritain sedikit tentang kamu"
                />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>

            {/* Footer - sticky, tombol selalu kelihatan */}
            <div className="p-5 pt-3 border-t border-neutral-800 shrink-0">
              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-white text-black font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
