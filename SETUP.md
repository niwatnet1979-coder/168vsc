# 168VSC System - Setup Guide

## Google OAuth Setup

To enable Google login, you need to create OAuth credentials:

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API

### 2. Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. Add authorized redirect URIs:
   - `http://localhost:3001/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
5. Copy **Client ID** and **Client Secret**

### 3. Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:

   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your credentials:

   ```env
   NEXTAUTH_SECRET=your-secret-key-here
   NEXTAUTH_URL=http://localhost:3001
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

3. Generate a secure secret:

   ```bash
   openssl rand -base64 32
   ```

### 4. Restart Development Server

```bash
npm run dev
```

## Testing Authentication

1. Visit `http://localhost:3001/auth/signin`
2. Click "เข้าสู่ระบบด้วย Google"
3. Sign in with your Google account
4. You should be redirected to the homepage

## Role Assignment

Currently, roles are assigned based on email patterns in `/pages/api/auth/[...nextauth].js`:

- Email contains "admin" → Admin role
- Email contains "qc" → QC role
- Others → ช่าง (Technician) role

**TODO**: Replace with database lookup for production use.

## Protected Routes

To protect a page, wrap it with `ProtectedRoute`:

```javascript
import ProtectedRoute from '../components/ProtectedRoute'

export default function MyPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      {/* Your page content */}
    </ProtectedRoute>
  )
}
```

## Authentication Components

- `AuthButton`: Login/Logout button with user info
- `ProtectedRoute`: Wrapper for protected pages
- Session available via `useSession()` hook
