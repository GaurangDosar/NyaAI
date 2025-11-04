# NyaAI Routing Structure

## Route Types

### 1. PUBLIC ROUTES (No authentication required)
- `/` - Home/Landing page (Index)
- `/auth` - Login/Signup page

**Note:** If user is already logged in and visits `/auth`, they are redirected to `/`

### 2. PROTECTED ROUTES (Authentication required)
- `/dashboard` - User dashboard with analytics
- `/ai-chat` - AI Legal Chatbot
- `/document-summarizer` - Document analysis
- `/government-schemes` - Government schemes advisor
- `/find-lawyers` - Find lawyers feature

**Note:** If user is NOT logged in and tries to access any protected route, they are redirected to `/auth`

### 3. ERROR ROUTES
- `*` (any other path) - 404 Not Found page

## How It Works

### ProtectedRoute Component
```
1. Checks if auth is loading → Show spinner
2. Checks if user exists → If NO, redirect to /auth
3. If user exists → Render the protected page
```

### PublicRoute Component
```
1. Checks if auth is loading → Show spinner
2. If on /auth page AND user is logged in → Redirect to /
3. Otherwise → Render the public page
```

## Navigation Flow

### For Logged OUT Users:
```
/ (Home) → Click "Get Started" → /auth (Login) → After login → /dashboard
```

### For Logged IN Users:
```
/ (Home) → Click "Go to Dashboard" → /dashboard
Navigation → Click "Dashboard" → /dashboard
```

## Debugging

Check browser console for these logs:
- `ProtectedRoute - Loading: false, User: user@example.com`
- `ProtectedRoute - User authenticated, rendering children`
- `Dashboard - Rendering with user: user@example.com, profile: John Doe`

If you see redirect loops or blank pages, check:
1. Is AuthContext properly initialized?
2. Is user state being set correctly after login?
3. Are there any console errors?
