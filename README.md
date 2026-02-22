# 🎬 Watchr v3

A collaborative media tracking app with smooth drag & drop, real-time updates, and community feeds.

## ✨ What's New in V3

- **Smooth Drag & Drop** - Using @dnd-kit for Trello-like card movement
- **Reorder Cards** - Arrange cards within columns however you like
- **Real-time Updates** - See changes instantly without refresh
- **Better Error Handling** - 10s timeout + friendly error messages
- **Password Requirements** - Live validation with checkmarks
- **1s Search Debounce** - Faster than before
- **Filter Dropdown** - Filter by Type and Genre
- **Invite to Boards** - Invite friends to collaborate
- **Member Avatars** - See who's on the board

## 🚀 Quick Start

### 1. Install
```bash
npm install
```

### 2. Database Setup

**Important:** If you have existing tables, drop them first:
```sql
DROP TABLE IF EXISTS community_invitations, board_invitations, 
  community_members, communities, cards, board_members, boards, profiles CASCADE;
```

Then run the SQL from `supabase/migrations/001_schema.sql` in Supabase SQL Editor.

### 3. Enable Realtime

In Supabase Dashboard:
1. Go to **Database** → **Tables**
2. Click on **cards** table
3. Click **Realtime** tab
4. Toggle **Enable Realtime**

### 4. Disable Email Confirmation (Optional)

In Supabase Dashboard:
1. Go to **Authentication** → **Providers**
2. Click **Email**
3. Toggle off **Confirm email**

### 5. Environment Variables

Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
NEXT_PUBLIC_TMDB_API_KEY=your-tmdb-key
```

### 6. Run
```bash
npm run dev
```

## 📱 Features

| Feature | Description |
|---------|-------------|
| 📋 Kanban Boards | Dropped, Backlog, Watching, Finished |
| 🔍 TMDB Search | 1s debounce, real posters |
| ⭐ Star Ratings | Half-star precision (0.5-5) |
| 🔄 Drag & Drop | Smooth reordering with @dnd-kit |
| 👥 Communities | See what friends are watching |
| 🔒 Privacy | Hide cards from community feeds |
| 🎨 Themes | 7 accent colors + dark mode |
| 📱 Mobile | Responsive with hamburger menu |

## 🐛 Troubleshooting

**Endless loader on refresh:**
- Check browser console for errors
- Verify Supabase URL and key are correct
- Clear browser cache and try again

**Cards not adding:**
- Check browser console for errors
- Verify you ran the latest SQL migration
- Check RLS policies are correct

**Changes not showing:**
- Enable Realtime for cards table
- Check Supabase connection

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx        # Main app
│   ├── login/          # Login page
│   └── signup/         # Signup with password validation
├── components/
│   ├── Sidebar.tsx     # Navigation
│   ├── BoardView.tsx   # Kanban with @dnd-kit
│   ├── CommunityView.tsx
│   ├── SettingsView.tsx
│   ├── StarRating.tsx
│   ├── FilterDropdown.tsx
│   └── modals/
├── hooks/
│   ├── useAuth.tsx     # Auth with timeout
│   └── useTheme.tsx    # Theme management
└── lib/
    ├── utils.ts        # Helpers
    ├── tmdb.ts         # TMDB API
    └── supabase/
```

## 🚢 Deployment

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

Remember to update Supabase URL Configuration with your Vercel domain.
