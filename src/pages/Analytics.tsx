import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { PLATFORM_META, ALL_PLATFORMS, type Platform, type Post, type SocialAccount } from '../types'
import PlatformIcon from '../components/PlatformIcon'
import {
  TrendingUp,
  Users,
  Eye,
  Heart,
  FileText,
  ArrowUpRight,
  BarChart3,
} from 'lucide-react'
import { format, subDays, parseISO } from 'date-fns'

export default function Analytics() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'all'>('all')

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  async function loadData() {
    const [postsRes, accountsRes] = await Promise.all([
      supabase
        .from('posts')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false }),
      supabase.from('social_accounts').select('*').eq('user_id', user!.id),
    ])
    setPosts((postsRes.data ?? []) as Post[])
    setAccounts((accountsRes.data ?? []) as SocialAccount[])
    setLoading(false)
  }

  const filteredPosts = useMemo(() => {
    if (selectedPlatform === 'all') return posts
    return posts.filter((p) => p.platforms.includes(selectedPlatform))
  }, [posts, selectedPlatform])

  const stats = useMemo(() => {
    const published = filteredPosts.filter((p) => p.status === 'published')
    const scheduled = filteredPosts.filter((p) => p.status === 'scheduled')
    const drafts = filteredPosts.filter((p) => p.status === 'draft')
    const failed = filteredPosts.filter((p) => p.status === 'failed')

    const platformCounts: Record<string, number> = {}
    published.forEach((post) => {
      post.platforms.forEach((p) => {
        platformCounts[p] = (platformCounts[p] || 0) + 1
      })
    })

    return {
      total: filteredPosts.length,
      published: published.length,
      scheduled: scheduled.length,
      drafts: drafts.length,
      failed: failed.length,
      platformCounts,
    }
  }, [filteredPosts])

  const last14Days = useMemo(() => {
    const days: { date: Date; label: string; count: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const count = filteredPosts.filter((post) => {
        const postDate = post.published_at || post.scheduled_for
        if (!postDate) return false
        return format(parseISO(postDate), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      }).length
      days.push({ date, label: format(date, 'MMM d'), count })
    }
    return days
  }, [filteredPosts])

  const maxBarHeight = 120
  const maxCount = Math.max(...last14Days.map((d) => d.count), 1)

  const platformDistribution = useMemo(() => {
    const total = Object.values(stats.platformCounts).reduce((a, b) => a + b, 0)
    return ALL_PLATFORMS.map((platform) => ({
      platform,
      count: stats.platformCounts[platform] || 0,
      percentage: total > 0 ? ((stats.platformCounts[platform] || 0) / total) * 100 : 0,
    })).filter((p) => p.count > 0)
  }, [stats])

  const availablePlatforms = accounts.map((a) => a.platform)

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-200 border-t-primary-600" />
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Posts',
      value: stats.total,
      icon: FileText,
      color: 'text-primary-600 bg-primary-50',
    },
    {
      label: 'Published',
      value: stats.published,
      icon: TrendingUp,
      color: 'text-success-600 bg-success-50',
    },
    {
      label: 'Scheduled',
      value: stats.scheduled,
      icon: BarChart3,
      color: 'text-warning-600 bg-warning-50',
    },
    {
      label: 'Connected',
      value: accounts.length,
      icon: Users,
      color: 'text-accent-600 bg-accent-50',
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-neutral-500">Track your content performance across platforms</p>
      </div>

      {/* Platform filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedPlatform('all')}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
            selectedPlatform === 'all'
              ? 'border-primary-500 bg-primary-50 text-primary-700'
              : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
          }`}
        >
          All Platforms
        </button>
        {availablePlatforms.map((platform) => (
          <button
            key={platform}
            onClick={() => setSelectedPlatform(platform)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
              selectedPlatform === platform
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
            }`}
          >
            <PlatformIcon platform={platform} className="h-4 w-4" />
            {PLATFORM_META[platform].label}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="card p-5 transition-shadow hover:shadow-md">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight">{stat.value}</p>
            <p className="text-sm text-neutral-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Posts over time chart */}
      <div className="card p-5">
        <h2 className="mb-4 font-semibold">Posting Activity — Last 14 Days</h2>
        <div className="flex items-end justify-between gap-1.5" style={{ height: `${maxBarHeight + 30}px` }}>
          {last14Days.map((day, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-medium text-neutral-600">{day.count}</span>
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-primary-400 to-primary-600 transition-all hover:from-primary-500 hover:to-primary-700"
                style={{
                  height: `${Math.max((day.count / maxCount) * maxBarHeight, 2)}px`,
                  opacity: day.count > 0 ? 1 : 0.2,
                }}
              />
              <span className="text-[9px] text-neutral-400 hidden sm:block">
                {format(day.date, 'd')}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Platform distribution */}
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Posts by Platform</h2>
          {platformDistribution.length === 0 ? (
            <div className="py-8 text-center">
              <BarChart3 className="mx-auto mb-2 h-8 w-8 text-neutral-300" />
              <p className="text-sm text-neutral-500">No published posts yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {platformDistribution.map(({ platform, count, percentage }) => (
                <div key={platform}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PlatformIcon platform={platform} className="h-5 w-5" />
                      <span className="text-sm font-medium">{PLATFORM_META[platform].label}</span>
                    </div>
                    <span className="text-sm text-neutral-500">
                      {count} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-primary-500 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Post status breakdown */}
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Post Status Breakdown</h2>
          <div className="space-y-4">
            <StatusRow label="Published" count={stats.published} total={stats.total} color="bg-success-500" />
            <StatusRow label="Scheduled" count={stats.scheduled} total={stats.total} color="bg-primary-500" />
            <StatusRow label="Drafts" count={stats.drafts} total={stats.total} color="bg-neutral-400" />
            <StatusRow label="Failed" count={stats.failed} total={stats.total} color="bg-error-500" />
          </div>
        </div>
      </div>

      {/* Recent posts table */}
      <div className="card p-5">
        <h2 className="mb-4 font-semibold">Recent Posts</h2>
        {filteredPosts.length === 0 ? (
          <div className="py-8 text-center">
            <FileText className="mx-auto mb-2 h-8 w-8 text-neutral-300" />
            <p className="text-sm text-neutral-500">No posts to show</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-xs text-neutral-400">
                  <th className="pb-3 pr-4 font-medium">Content</th>
                  <th className="pb-3 pr-4 font-medium">Platforms</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredPosts.slice(0, 10).map((post) => (
                  <tr key={post.id} className="transition-colors hover:bg-neutral-50">
                    <td className="py-3 pr-4">
                      <p className="max-w-xs truncate text-neutral-700">
                        {post.content || '(no content)'}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex gap-1">
                        {post.platforms.map((p: Platform) => (
                          <PlatformIcon key={p} platform={p} className="h-5 w-5" />
                        ))}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`badge ${
                          post.status === 'published'
                            ? 'bg-success-100 text-success-700'
                            : post.status === 'scheduled'
                              ? 'bg-primary-100 text-primary-700'
                              : post.status === 'failed'
                                ? 'bg-error-100 text-error-700'
                                : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {post.status}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-neutral-400">
                      {post.published_at
                        ? format(parseISO(post.published_at), 'MMM d, yyyy')
                        : post.scheduled_for
                          ? format(parseISO(post.scheduled_for), 'MMM d, yyyy')
                          : format(parseISO(post.created_at), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-lg bg-neutral-100 px-4 py-3 text-xs text-neutral-500">
        <strong>Note:</strong> Follower counts, impressions, and engagement metrics from connected
        platforms will appear here once real social API integrations are configured. Currently
        showing your post activity and scheduling statistics.
      </div>
    </div>
  )
}

function StatusRow({
  label,
  count,
  total,
  color,
}: {
  label: string
  count: number
  total: number
  color: string
}) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-700">{label}</span>
        <span className="text-sm text-neutral-500">{count}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
