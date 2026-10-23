export interface Profile {
  id: string
  email: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
}

export type Platform = 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'tiktok'

export interface SocialAccount {
  id: string
  user_id: string
  platform: Platform
  handle: string
  display_name: string | null
  avatar_url: string | null
  connected: boolean
  created_at: string
}

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed'

export interface Post {
  id: string
  user_id: string
  content: string
  media_urls: string[] | null
  platforms: Platform[]
  status: PostStatus
  scheduled_for: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface AnalyticsSnapshot {
  id: string
  user_id: string
  platform: Platform
  followers: number
  impressions: number
  engagement: number
  posts_count: number
  recorded_at: string
}

export const PLATFORM_META: Record<Platform, { label: string; color: string; icon: string }> = {
  twitter: { label: 'X / Twitter', color: '#1a1a1a', icon: 'twitter' },
  instagram: { label: 'Instagram', color: '#e1306c', icon: 'instagram' },
  linkedin: { label: 'LinkedIn', color: '#0a66c2', icon: 'linkedin' },
  youtube: { label: 'YouTube', color: '#ff0000', icon: 'youtube' },
  tiktok: { label: 'TikTok', color: '#010101', icon: 'tiktok' },
}

export const ALL_PLATFORMS: Platform[] = ['twitter', 'instagram', 'linkedin', 'youtube', 'tiktok']
