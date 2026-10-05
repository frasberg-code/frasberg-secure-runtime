# EmeraldOrbit - Product Requirements Document

## Project Overview
EmeraldOrbit is a comprehensive enterprise platform combining AI assistance (Sofia), real estate management, crypto trading, communications, and creative tools in one unified experience.

## Tech Stack
- **Backend**: FastAPI + MongoDB (primary) + Supabase (hybrid for realtime)
- **Frontend**: React 18 + Tailwind CSS + Framer Motion + shadcn/ui + @supabase/supabase-js
- **State Management**: @tanstack/react-query
- **Authentication**: Hybrid (JWT custom auth + Supabase Auth ready)
- **Realtime**: Supabase Realtime (calls, messaging, presence)

## Architecture: Hybrid Supabase + MongoDB

### Supabase (PostgreSQL) - Realtime Features
- **profiles**: Extended user profiles
- **presence**: Live online/offline/idle status
- **conversations**: Chat rooms
- **conversation_participants**: Chat membership
- **messages_live**: Real-time messages
- **calls**: Voice/video call status (ringing, active, ended)
- **meetings**: Scheduled meetings
- **meeting_participants**: Meeting attendees

### MongoDB - Long-term Storage & Creative
- **users**: Profile data, preferences, settings
- **projects**: Creative assets, dashboards, workflows
- **messages_archive**: Long-term message storage
- **call_history**: Full call logs with duration
- **creator_assets**: Templates, scenes, saved work
- **properties**: Real estate listings
- **subscriptions**: User subscription tiers

### Data Flow
1. User authenticates via Supabase Auth or custom JWT
2. Presence updates → Supabase presence table
3. User initiates call → Supabase calls table
4. Realtime listeners notify participants
5. Call ends → Edge Function logs to MongoDB
6. MongoDB persists call_history permanently

## Core Features

### Phase 1 - Core Infrastructure ✅ (Completed Jan 21, 2026)
- Authentication System (JWT + Supabase ready)
- Landing Page, Dashboard, Sofia AI Chat
- Properties, Contacts, Crypto Hub
- User Messaging, Profile, Subscription Plans

### Phase 2 - Hybrid Architecture ✅ (Completed Jan 21, 2026)
- Supabase client integration
- Presence service (online/offline/idle)
- Calls service (start, answer, end, realtime)
- Messaging service (conversations, messages)
- Meetings service
- MongoDB call-history endpoint
- Projects, messages_archive, creator_assets APIs

## API Endpoints

### MongoDB Backend
- POST /api/call-history - Log calls from Supabase
- GET /api/call-history - Get call history
- CRUD /api/projects - Creative projects
- CRUD /api/creator-assets - Templates, scenes
- POST /api/messages/archive - Archive messages
- GET /api/messages/archive/:id - Get archived messages

### Supabase Services (Frontend)
- supabaseAuth: signUp, signIn, signOut, getUser
- presenceService: setOnline, setOffline, setIdle, subscribe
- callsService: startCall, answerCall, endCall, subscribe
- messagingService: createConversation, sendMessage, subscribe
- meetingsService: createMeeting, getMeetings
- profilesService: getProfile, updateProfile
- storageService: uploadFile, uploadAvatar

## Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=emerald_orbit
JWT_SECRET=<secret>
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=<preview_url>
REACT_APP_SUPABASE_URL=<supabase_url>
REACT_APP_SUPABASE_ANON_KEY=<anon_key>
```

## Upcoming Tasks (P1)
- [ ] Configure Supabase credentials
- [ ] Run Supabase SQL schema
- [ ] Enable RLS policies
- [ ] Implement calling UI
- [ ] Integrate LLM for Sofia AI

## Backlog (P2)
- Live streaming module
- Music/video generation
- Admin dashboards
- Payment integration

---
Last Updated: January 21, 2026
