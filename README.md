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

### 2. Environment Variables

Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
NEXT_PUBLIC_TMDB_API_KEY=your-tmdb-key
```

### 3. Run
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
