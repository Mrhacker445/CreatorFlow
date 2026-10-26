import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { PLATFORM_META, type Platform, type Post, type SocialAccount, type PostStatus } from '../types'
import PlatformIcon from '../components/PlatformIcon'
import { useNavigate } from 'react-router-dom'
import { Send, Calendar as CalendarIcon, Save, Check, CircleAlert as AlertCircle, Image as ImageIcon, Hash } from 'lucide-react'

export default function Composer() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [content, setContent] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([])
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [mode, setMode] = useState<'now' | 'schedule' | 'draft'>('draft')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    loadAccounts()
  }, [user])

  async function loadAccounts() {
    const { data } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: true })
    setAccounts((data ?? []) as SocialAccount[])
    setLoading(false)
  }

  function togglePlatform(platform: Platform) {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    )
  }

  const charCount = content.length
  const maxChars = 280

  async function handleSave(status: PostStatus) {
    if (!content.trim()) {
      setError('Please write some content first')
      return
    }
    if (selectedPlatforms.length === 0) {
      setError('Select at least one platform')
      return
    }

    let scheduledFor: string | null = null
    if (status === 'scheduled') {
      if (!scheduleDate || !scheduleTime) {
        setError('Please select a date and time for scheduling')
        return
      }
      scheduledFor = new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
      if (new Date(scheduledFor) <= new Date()) {
        setError('Schedule time must be in the future')
        return
      }
    }

    setSaving(true)
    setError(null)

    const insertData: Record<string, unknown> = {
      user_id: user!.id,
      content: content.trim(),
      platforms: selectedPlatforms,
      status,
      scheduled_for: scheduledFor,
      published_at: status === 'published' ? new Date().toISOString() : null,
    }

    const { error: insertError } = await supabase.from('posts').insert(insertData)

    if (insertError) {
      setError(insertError.message)
    } else {
      const msg =
        status === 'draft'
          ? 'Draft saved'
          : status === 'scheduled'
            ? 'Post scheduled'
            : 'Post published'
      setSuccess(msg)
      setTimeout(() => {
        navigate(status === 'scheduled' ? '/calendar' : '/')
      }, 1200)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-200 border-t-primary-600" />
      </div>
    )
  }

  const connectedPlatforms = accounts.map((a) => a.platform)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compose Post</h1>
        <p className="text-sm text-neutral-500">Create and publish content across your platforms</p>
      </div>

      {accounts.length === 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-warning-50 px-4 py-3 text-sm text-warning-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          Connect a social account first to publish posts.
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700 animate-slide-up">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-success-50 px-4 py-3 text-sm text-success-700 animate-slide-up">
          <Check className="h-4 w-4 flex-shrink-0" />
          {success}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What do you want to share today?"
              rows={8}
              className="w-full resize-none rounded-lg border border-neutral-200 p-4 text-sm text-neutral-900 placeholder-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <Hash className="h-3.5 w-3.5" />
                Add hashtags to increase reach
              </div>
              <span
                className={`text-xs font-medium ${
                  charCount > maxChars ? 'text-error-600' : charCount > maxChars * 0.8 ? 'text-warning-600' : 'text-neutral-400'
                }`}
              >
                {charCount} / {maxChars}
              </span>
            </div>
          </div>

          {/* Platform selector */}
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold">Publish To</h3>
            {connectedPlatforms.length === 0 ? (
              <p className="text-sm text-neutral-500">No connected accounts. Connect one in Social Accounts.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {connectedPlatforms.map((platform) => {
                  const selected = selectedPlatforms.includes(platform)
                  return (
                    <button
                      key={platform}
                      onClick={() => togglePlatform(platform)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                        selected
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                      }`}
                    >
                      <PlatformIcon platform={platform} className="h-5 w-5" />
                      {PLATFORM_META[platform].label}
                      {selected && <Check className="h-3.5 w-3.5" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Scheduling */}
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold">When to Post</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setMode('draft')}
                className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                  mode === 'draft' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-neutral-200 text-neutral-600'
                }`}
              >
                <Save className="mx-auto mb-1 h-4 w-4" />
                Save as Draft
              </button>
              <button
                onClick={() => setMode('schedule')}
                className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                  mode === 'schedule' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-neutral-200 text-neutral-600'
                }`}
              >
                <CalendarIcon className="mx-auto mb-1 h-4 w-4" />
                Schedule
              </button>
              <button
                onClick={() => setMode('now')}
                className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                  mode === 'now' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-neutral-200 text-neutral-600'
                }`}
              >
                <Send className="mx-auto mb-1 h-4 w-4" />
                Post Now
              </button>
            </div>

            {mode === 'schedule' && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 animate-slide-up">
                <div>
                  <label className="label">Date</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Time</label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="input"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold">Preview</h3>
            <div className="rounded-lg border border-neutral-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                  {user?.email?.charAt(0).toUpperCase() ?? 'C'}
                </div>
                <div>
                  <p className="text-sm font-medium">Your Name</p>
                  <p className="text-xs text-neutral-400">@yourhandle</p>
                </div>
              </div>
              <p className="text-sm text-neutral-700 whitespace-pre-wrap min-h-[60px]">
                {content || 'Your post preview will appear here...'}
              </p>
              {selectedPlatforms.length > 0 && (
                <div className="mt-3 flex gap-1.5 border-t border-neutral-100 pt-3">
                  {selectedPlatforms.map((p) => (
                    <PlatformIcon key={p} platform={p} className="h-5 w-5" />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="mb-2 text-sm font-semibold">Tips</h3>
            <ul className="space-y-2 text-xs text-neutral-500">
              <li className="flex items-start gap-2">
                <ImageIcon className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-neutral-400" />
                Posts with images get 2x more engagement
              </li>
              <li className="flex items-start gap-2">
                <Hash className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-neutral-400" />
                Use 2-3 relevant hashtags
              </li>
              <li className="flex items-start gap-2">
                <CalendarIcon className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-neutral-400" />
                Best times: 9-11 AM, 7-9 PM
              </li>
            </ul>
          </div>

          {/* Action button */}
          <button
            onClick={() => {
              const status: PostStatus = mode === 'draft' ? 'draft' : mode === 'schedule' ? 'scheduled' : 'published'
              handleSave(status)
            }}
            disabled={saving || !content.trim()}
            className="btn-primary w-full"
          >
            {saving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : mode === 'draft' ? (
              <>
                <Save className="h-4 w-4" />
                Save Draft
              </>
            ) : mode === 'schedule' ? (
              <>
                <CalendarIcon className="h-4 w-4" />
                Schedule Post
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Publish Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
