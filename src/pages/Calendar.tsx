import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { PLATFORM_META, type Platform, type Post } from '../types'
import PlatformIcon from '../components/PlatformIcon'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Trash2,
  X,
  Calendar as CalendarIcon,
} from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  isSameMonth,
  isSameDay,
  parseISO,
} from 'date-fns'
import { Link } from 'react-router-dom'

export default function Calendar() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedPosts, setSelectedPosts] = useState<Post[]>([])

  useEffect(() => {
    if (!user) return
    loadPosts()
  }, [user])

  async function loadPosts() {
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', user!.id)
      .order('scheduled_for', { ascending: true })
    setPosts((data ?? []) as Post[])
    setLoading(false)
  }

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth))
    const end = endOfWeek(endOfMonth(currentMonth))
    const days: Date[] = []
    let day = start
    while (day <= end) {
      days.push(day)
      day = addDays(day, 1)
    }
    return days
  }, [currentMonth])

  function getPostsForDay(day: Date): Post[] {
    return posts.filter((post) => {
      if (!post.scheduled_for && !post.published_at) return false
      const postDate = parseISO(post.scheduled_for || post.published_at || '')
      return isSameDay(postDate, day)
    })
  }

  function handleDayClick(day: Date, dayPosts: Post[]) {
    setSelectedDate(day)
    setSelectedPosts(dayPosts)
  }

  async function handleDeletePost(postId: string) {
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (!error) {
      setPosts(posts.filter((p) => p.id !== postId))
      setSelectedPosts(selectedPosts.filter((p) => p.id !== postId))
    }
  }

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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
          <h1 className="text-2xl font-bold tracking-tight">Content Calendar</h1>
          <p className="text-sm text-neutral-500">View and manage your scheduled content</p>
        </div>
        <Link to="/composer" className="btn-primary">
          <Plus className="h-4 w-4" />
          New Post
        </Link>
      </div>

      <div className="card p-4 md:p-6">
        {/* Calendar header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
              className="btn-ghost !p-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="btn-secondary !py-1.5 text-xs"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="btn-ghost !p-2"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="mb-2 grid grid-cols-7 gap-1">
          {weekdays.map((day) => (
            <div key={day} className="py-2 text-center text-xs font-semibold text-neutral-400">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const dayPosts = getPostsForDay(day)
            const inMonth = isSameMonth(day, currentMonth)
            const isToday = isSameDay(day, new Date())
            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDayClick(day, dayPosts)}
                className={`min-h-[72px] rounded-lg border p-1.5 text-left transition-all hover:shadow-sm sm:min-h-[88px] ${
                  inMonth ? 'border-neutral-100 bg-white' : 'border-neutral-50 bg-neutral-50/50'
                } ${isToday ? 'border-primary-300 ring-1 ring-primary-200' : ''} ${
                  dayPosts.length > 0 ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <div
                  className={`mb-1 text-xs font-medium ${
                    isToday
                      ? 'flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-white'
                      : inMonth
                        ? 'text-neutral-700'
                        : 'text-neutral-300'
                  }`}
                >
                  {format(day, 'd')}
                </div>
                {dayPosts.slice(0, 3).map((post) => (
                  <div
                    key={post.id}
                    className="mb-0.5 truncate rounded px-1.5 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor:
                        post.status === 'published' ? '#dcfce7' : post.status === 'scheduled' ? '#dbeafe' : '#f4f4f5',
                      color:
                        post.status === 'published' ? '#15803d' : post.status === 'scheduled' ? '#1d4ed8' : '#52525b',
                    }}
                  >
                    {post.content.slice(0, 20) || '(empty)'}
                  </div>
                ))}
                {dayPosts.length > 3 && (
                  <div className="text-[10px] font-medium text-neutral-400">+{dayPosts.length - 3} more</div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Day detail modal */}
      {selectedDate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in"
          onClick={() => setSelectedDate(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{format(selectedDate, 'EEEE, MMM d')}</h3>
                <p className="text-xs text-neutral-500">
                  {selectedPosts.length} post{selectedPosts.length !== 1 ? 's' : ''} scheduled
                </p>
              </div>
              <button onClick={() => setSelectedDate(null)} className="btn-ghost !p-1.5">
                <X className="h-4 w-4" />
              </button>
            </div>

            {selectedPosts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-neutral-200 py-8 text-center">
                <CalendarIcon className="mx-auto mb-2 h-8 w-8 text-neutral-300" />
                <p className="text-sm text-neutral-500">No posts on this day</p>
                <Link to="/composer" className="mt-2 inline-block text-sm font-medium text-primary-600 hover:text-primary-700">
                  Schedule a post →
                </Link>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {selectedPosts.map((post) => (
                  <div key={post.id} className="rounded-lg border border-neutral-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          {post.platforms.map((p: Platform) => (
                            <PlatformIcon key={p} platform={p} className="h-5 w-5" />
                          ))}
                          <span
                            className={`badge ${
                              post.status === 'published'
                                ? 'bg-success-100 text-success-700'
                                : post.status === 'scheduled'
                                  ? 'bg-primary-100 text-primary-700'
                                  : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            {post.status}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-700 whitespace-pre-wrap">{post.content}</p>
                        {post.scheduled_for && (
                          <p className="mt-2 flex items-center gap-1 text-xs text-neutral-400">
                            <Clock className="h-3 w-3" />
                            {format(parseISO(post.scheduled_for), 'h:mm a')}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="btn-ghost text-error-600 hover:bg-error-50 !p-1.5"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
