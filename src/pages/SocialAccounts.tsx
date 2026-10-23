import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { ALL_PLATFORMS, PLATFORM_META, type Platform, type SocialAccount } from '../types'
import PlatformIcon from '../components/PlatformIcon'
import { Check, Plus, Trash2, X, AlertCircle } from 'lucide-react'

interface ConnectModalState {
  platform: Platform | null
  handle: string
  displayName: string
}

export default function SocialAccounts() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<ConnectModalState>({
    platform: null,
    handle: '',
    displayName: '',
  })
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    loadAccounts()
  }, [user])

  async function loadAccounts() {
    setLoading(true)
    const { data } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: true })
    setAccounts((data ?? []) as SocialAccount[])
    setLoading(false)
  }

  function openModal(platform: Platform) {
    setModal({ platform, handle: '', displayName: '' })
    setError(null)
  }

  function closeModal() {
    setModal({ platform: null, handle: '', displayName: '' })
    setError(null)
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    if (!modal.platform || !modal.handle.trim()) return

    const existing = accounts.find((a) => a.platform === modal.platform)
    if (existing) {
      setError(`You already have a ${PLATFORM_META[modal.platform].label} account connected`)
      return
    }

    setConnecting(true)
    setError(null)

    const { data, error: insertError } = await supabase
      .from('social_accounts')
      .insert({
        user_id: user!.id,
        platform: modal.platform,
        handle: modal.handle.trim().replace(/^@/, ''),
        display_name: modal.displayName.trim() || null,
        connected: true,
      })
      .select()
      .maybeSingle()

    if (insertError) {
      setError(insertError.message)
    } else if (data) {
      setAccounts([...accounts, data as SocialAccount])
      closeModal()
    }
    setConnecting(false)
  }

  async function handleDisconnect(account: SocialAccount) {
    const { error: deleteError } = await supabase
      .from('social_accounts')
      .delete()
      .eq('id', account.id)

    if (!deleteError) {
      setAccounts(accounts.filter((a) => a.id !== account.id))
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-200 border-t-primary-600" />
      </div>
    )
  }

  const connectedPlatforms = new Set(accounts.map((a) => a.platform))

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Social Accounts</h1>
        <p className="text-sm text-neutral-500">Connect and manage your social media platforms</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Connected accounts */}
      {accounts.length > 0 && (
        <div className="card divide-y divide-neutral-100">
          {accounts.map((account) => (
            <div key={account.id} className="flex items-center gap-4 p-5">
              <PlatformIcon platform={account.platform} className="h-10 w-10" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{account.display_name || PLATFORM_META[account.platform].label}</p>
                <p className="text-sm text-neutral-500">@{account.handle}</p>
              </div>
              <span className="badge bg-success-100 text-success-700">
                <Check className="h-3 w-3" />
                Connected
              </span>
              <button
                onClick={() => handleDisconnect(account)}
                className="btn-ghost text-error-600 hover:bg-error-50"
                title="Disconnect"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Available platforms */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-neutral-700">Available Platforms</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_PLATFORMS.map((platform) => {
            const isConnected = connectedPlatforms.has(platform)
            return (
              <div
                key={platform}
                className={`card flex items-center gap-3 p-4 transition-all ${
                  isConnected ? 'opacity-60' : 'hover:shadow-md'
                }`}
              >
                <PlatformIcon platform={platform} className="h-10 w-10" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{PLATFORM_META[platform].label}</p>
                  <p className="text-xs text-neutral-500">
                    {isConnected ? 'Already connected' : 'Not connected'}
                  </p>
                </div>
                {isConnected ? (
                  <Check className="h-5 w-5 text-success-500" />
                ) : (
                  <button onClick={() => openModal(platform)} className="btn-primary !py-1.5 !px-3 text-xs">
                    <Plus className="h-3.5 w-3.5" />
                    Connect
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Connect modal */}
      {modal.platform && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PlatformIcon platform={modal.platform} className="h-8 w-8" />
                <div>
                  <h3 className="font-semibold">Connect {PLATFORM_META[modal.platform].label}</h3>
                  <p className="text-xs text-neutral-500">Enter your account details</p>
                </div>
              </div>
              <button onClick={closeModal} className="btn-ghost !p-1.5">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label className="label">Username / Handle</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">@</span>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={modal.handle}
                    onChange={(e) => setModal({ ...modal, handle: e.target.value })}
                    placeholder="yourhandle"
                    className="input pl-8"
                  />
                </div>
              </div>
              <div>
                <label className="label">Display Name (optional)</label>
                <input
                  type="text"
                  value={modal.displayName}
                  onChange={(e) => setModal({ ...modal, displayName: e.target.value })}
                  placeholder="My Brand Account"
                  className="input"
                />
              </div>

              <div className="rounded-lg bg-warning-50 px-3.5 py-2.5 text-xs text-warning-700">
                Note: Real social platform API connections require OAuth setup. This saves your
                account info locally for now.
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={connecting} className="btn-primary flex-1">
                  {connecting ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    'Connect'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
