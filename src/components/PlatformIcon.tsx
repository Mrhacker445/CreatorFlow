import type { Platform } from '../types'

const ICONS: Record<Platform, string> = {
  twitter: '𝕏',
  instagram: 'IG',
  linkedin: 'in',
  youtube: 'YT',
  tiktok: 'TT',
}

interface Props {
  platform: Platform
  className?: string
}

export default function PlatformIcon({ platform, className = 'h-5 w-5' }: Props) {
  const icon = ICONS[platform]
  return (
    <span
      className={`inline-flex items-center justify-center rounded font-bold text-white ${className}`}
      style={{ fontSize: '0.6em' }}
      aria-label={platform}
    >
      {icon}
    </span>
  )
}
