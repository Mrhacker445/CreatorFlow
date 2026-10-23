# CreatorFlow

A social media management platform for creators. Compose posts, schedule them across multiple platforms, and track your content performance — all from one dashboard.

## Features

### Dashboard
- Overview of connected accounts, total posts, scheduled posts, and published posts
- Upcoming posts list with scheduled dates
- Recent activity feed showing published and failed posts
- Quick access to compose new posts

### Social Account Connections
- Connect up to 5 social platforms: X/Twitter, Instagram, LinkedIn, YouTube, TikTok
- Store your handle and display name per platform
- Connect and disconnect accounts at any time
- Note: Real OAuth-based platform connections require additional API setup. Account details are stored locally for now.

### Post Composer
- Write content with a live character counter (280 character guideline)
- Select multiple connected platforms to publish to simultaneously
- Choose between three modes: Save as Draft, Schedule for later, or Publish Now
- Live preview panel showing how your post will look
- Scheduling with date and time picker

### Scheduling Calendar
- Monthly calendar view of all scheduled and published posts
- Color-coded post status (scheduled = blue, published = green, draft = gray)
- Click any day to see all posts scheduled for that date
- Delete posts directly from the calendar detail view
- Navigate between months with Today shortcut

### Analytics
- Platform filter to view stats for a single platform or all
- Stat cards: total posts, published, scheduled, connected accounts
- 14-day posting activity bar chart
- Posts by platform distribution with percentage bars
- Post status breakdown (published, scheduled, drafts, failed)
- Recent posts table with content, platforms, status, and date
- Note: Real engagement metrics (followers, impressions, engagement rate) from platform APIs will appear once social integrations are configured. Currently shows post activity and scheduling statistics.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS with a custom color system (primary, accent, success, warning, error, neutral)
- **Icons:** lucide-react
- **Routing:** react-router-dom
- **Date handling:** date-fns
- **Backend:** Supabase (PostgreSQL database, authentication, row-level security)

## Database

The app uses three tables, all protected with row-level security so each user only sees their own data:

- **profiles** — user display name, bio, avatar, linked to Supabase auth
- **social_accounts** — connected platform info (one per platform per user)
- **posts** — post content, target platforms, status (draft/scheduled/published/failed), scheduling timestamps

## Authentication

Email/password authentication powered by Supabase Auth. New users can create an account from the sign-up screen, and a profile row is created automatically.

## Getting Started

The development server runs automatically. Dependencies are already installed.

## Project Structure

```
src/
  components/     # Reusable UI components (layout, icons)
  context/        # Auth context provider
  lib/            # Supabase client setup
  pages/          # Route pages (Auth, Dashboard, Accounts, Composer, Calendar, Analytics)
  types/          # TypeScript type definitions
  App.tsx         # Router and route protection
  main.tsx        # Entry point
  index.css       # Tailwind + custom component styles
```

## What's Not Yet Implemented

- Real OAuth integrations with social platform APIs (X, Instagram, LinkedIn, YouTube, TikTok)
- Actual cross-platform post publishing via API
- Real-time engagement metrics from connected platforms
- Media upload (images/video attachments)
- Team collaboration features
- Post templates and AI-assisted content generation

## Future Enhancements

- OAuth 2.0 flows for each social platform
- Automated publishing via Supabase Edge Functions (scheduled triggers)
- Media library with image uploads via Supabase Storage
- Best-time-to-post recommendations
- Bulk scheduling and CSV import
- Team workspaces with shared calendars
