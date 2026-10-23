import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { PLATFORM_META, type Platform, type Post, type SocialAccount } from '../types'
import PlatformIcon from '../components/PlatformIcon'
import {
  Users,
  FileText,
  Calendar as CalendarIcon,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { format, isToday, isTomorrow } from 'date-fns'

interface Stats {
  totalFollowers: number
  totalPosts: number
  scheduledCount: number
  publishedCount: number
}

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [upcomingPosts, setUpcomingPosts] = useState<Post[]>([])
  const [recentPosts, setRecentPosts] = useState<Post[]>([])
  const [stats, setStats] = useState<Stats>({
    totalFollowers: 0,
    totalPosts: 0,
    scheduledCount: 0,
    publishedCount: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    loadDashboard()
  }, [user])

  async function loadDashboard() {
    setLoading(true)

    const [accountsRes, postsRes] = await Promise.all([
      supabase.from('social_accounts').select('*').eq('user_id', user!.id),
      supabase
        .from('posts')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    const accts = (accountsRes.data ?? []) as SocialAccount[]
    const posts = (postsRes.data ?? []) as Post[]

    setAccounts(accts)

    const scheduled = posts
      .filter((p) => p.status === 'scheduled' && p.scheduled_for)
      .sort((a, b) => new Date(a.scheduled_for!).getTime() - new Date(b.scheduled_for!).getTime())

    setUpcomingPosts(scheduled.slice(0, 5))
    setRecentPosts(posts.filter((p) => p.status === 'published' || p.status === 'failed').slice(0, 5))

    setStats({
      totalFollowers: 0,
      totalPosts: posts.length,
      scheduledCount: posts.filter((p) => p.status === 'scheduled').length,
      publishedCount: posts.filter((p) => p.status === 'published').length,
    })

    setLoading(false)
  }

  const statCards = [
    {
      label: 'Connected Accounts',
      value: accounts.length,
      icon: Users,
      color: 'text-primary-600 bg-primary-50',
      trend: null,
    },
    {
      label: 'Total Posts',
      value: stats.totalPosts,
      icon: FileText,
      color: 'text-accent-600 bg-accent-50',
      trend: null,
    },
    {
      label: 'Scheduled',
      value: stats.scheduledCount,
      icon: CalendarIcon,
      color: 'text-warning-600 bg-warning-50',
      trend: null,
    },
    {
      label: 'Published',
      value: stats.publishedCount,
      icon: TrendingUp,
      color: 'text-success-600 bg-success-50',
      trend: null,
    },
  ]

  function formatScheduleDate(dateStr: string): string {
    const date = new Date(dateStr)
    if (isToday(date)) return `Today, ${format(date, 'h:mm a')}`
    if (isTomorrow(date)) return `Tomorrow, ${format(date, 'h:mm a')}`
    return format(date, 'MMM d, h:mm a')
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-200 border-t-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {profile?.display_name?.split(' ')[0] ?? 'Creator'}
          </h1>
          <p className="text-sm text-neutral-500">Here's your social media overview</p>
        </div>
        <Link to="/composer" className="btn-primary">
          <Plus className="h-4 w-4" />
          Create Post
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="card p-5 transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight">{stat.value}</p>
            <p className="text-sm text-neutral-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Connected accounts summary */}
      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Connected Platforms</h2>
          <Link to="/accounts" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            Manage
          </Link>
        </div>
        {accounts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-200 py-8 text-center">
            <Users className="mx-auto mb-2 h-8 w-8 text-neutral-300" />
            <p className="text-sm text-neutral-500">No social accounts connected yet</p>
            <Link to="/accounts" className="mt-2 inline-block text-sm font-medium text-primary-600 hover:text-primary-700">
              Connect your first account →
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {accounts.map((acct) => (
              <div
                key={acct.id}
                className="flex items-center gap-3 rounded-lg border border-neutral-200 px-4 py-2.5"
              >
                <PlatformIcon platform={acct.platform} />
                <div>
                  <p className="text-sm font-medium">{PLATFORM_META[acct.platform].label}</p>
                  <p className="text-xs text-neutral-500">@{acct.handle}</p>
                </div>
                <span className="badge bg-success-100 text-success-700">Connected</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Upcoming posts */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Upcoming Posts</h2>
            <Link to="/calendar" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              View Calendar
            </Link>
          </div>
          {upcomingPosts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-neutral-200 py-8 text-center">
              <CalendarIcon className="mx-auto mb-2 h-8 w-8 text-neutral-300" />
              <p className="text-sm text-neutral-500">No scheduled posts</p>
              <Link to="/composer" className="mt-2 inline-block text-sm font-medium text-primary-600 hover:text-primary-700">
                Schedule a post →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-start gap-3 rounded-lg border border-neutral-100 p-3 transition-colors hover:border-neutral-200"
                >
                  <div className="flex gap-1">
                    {post.platforms.map((p: Platform) => (
                      <PlatformIcon key={p} platform={p} className="h-6 w-6" />
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-neutral-700">
                      {post.content || '(no text)'}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-primary-600">
                      {formatScheduleDate(post.scheduled_for!)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Recent Activity</h2>
          {recentPosts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-neutral-200 py-8 text-center">
              <FileText className="mx-auto mb-2 h-8 w-8 text-neutral-300" />
              <p className="text-sm text-neutral-500">No posts published yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-start gap-3 rounded-lg border border-neutral-100 p-3"
                >
                  <div className="flex gap-1">
                    {post.platforms.slice(0, 2).map((p: Platform) => (
                      <PlatformIcon key={p} platform={p} className="h-6 w-6" />
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-neutral-700">
                      {post.content || '(no text)'}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span
                        className={`badge ${
                          post.status === 'published'
                            ? 'bg-success-100 text-success-700'
                            : 'bg-error-100 text-error-700'
                        }`}
                      >
                        {post.status === 'published' ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {post.status}
                      </span>
                      <span className="text-xs text-neutral-400">
                        {format(new Date(post.updated_at), 'MMM d')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
