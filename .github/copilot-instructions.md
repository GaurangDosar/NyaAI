# NyaAI - AI Coding Agent Instructions

## Project Overview
NyaAI is a legal tech platform connecting clients with lawyers through AI-powered features. The frontend was initially generated with Lovable AI but has evolved with custom implementations.

**Stack:** React 18 + TypeScript + Vite + Supabase (PostgreSQL + Edge Functions) + TailwindCSS + Shadcn/ui

## Architecture & Data Flow

### Authentication Flow
- **AuthContext** ([src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)) is the single source of truth for auth state
- Implements session caching (5-second TTL) to prevent repeated validations
- Uses refs (`isRefreshingRef`, `initializingRef`, `processingEventRef`) to prevent race conditions
- **Critical:** Auth storage corruption is a known issue. Use utilities in [src/lib/auth-utils.ts](src/lib/auth-utils.ts) for diagnostics (`getAuthDiagnostics()`, `clearSupabaseStorage()`)
- **Protected Routes:** Use the `<ProtectedRoute>` wrapper in [src/App.tsx](src/App.tsx) - checks `user` and `loading` state before rendering

### Database Access Patterns
- **Supabase Client:** Import from `@/integrations/supabase/client` - pre-configured with auth persistence
- **RLS (Row Level Security):** All tables have policies. Edge Functions use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS, while frontend uses `SUPABASE_ANON_KEY`
- **Type Safety:** Database types are auto-generated in [src/integrations/supabase/types.ts](src/integrations/supabase/types.ts). Use `Database` type for type-safe queries
- **Realtime:** Used for messaging. Configure with `eventsPerSecond: 10` (see client config)

### Dual-Dashboard Architecture
- **User Dashboard** ([src/pages/Dashboard.tsx](src/pages/Dashboard.tsx)): Client view - browse lawyers, chat with AI, manage requests
- **Lawyer Dashboard** ([src/pages/LawyerDashboard.tsx](src/pages/LawyerDashboard.tsx)): Professional view - case management, analytics (Recharts), client messaging
- **Role Detection:** `userRole` from AuthContext determines access. Stored in `user_roles` table

### Edge Functions (Deno Runtime)
Located in `supabase/functions/`. Pattern for all functions:
```typescript
// Dual-client pattern for auth + service operations
const supabaseClient = createClient(URL, SERVICE_ROLE_KEY); // Database ops (bypasses RLS)
const supabaseAuth = createClient(URL, ANON_KEY, { global: { headers: { Authorization: authHeader }}}); // Auth verification
const { data: { user } } = await supabaseAuth.auth.getUser(token);
```
**Key Functions:**
- `ai-lawyer-chat`: LLaMA 3.3 70B via Groq API, maintains chat sessions
- `document-summarizer`: PDF/DOCX parsing + AI summarization
- `lawyer-finder`: Location-based search with Google Maps integration

## Development Workflows

### Build & Run Commands
```bash
# Dev server (http://localhost:8080)
bun dev

# Production build
bun run build

# Preview production build
bun run preview

# Lint code
bun run lint
```

### Supabase Local Development
```bash
# Start local Supabase (requires Docker)
supabase start

# Apply migrations
supabase db reset

# Generate TypeScript types after schema changes
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### Working with Edge Functions
```bash
# Serve function locally
supabase functions serve ai-lawyer-chat --env-file .env

# Deploy function
supabase functions deploy ai-lawyer-chat

# View logs
supabase functions logs ai-lawyer-chat
```

## Component Patterns

### UI Components (Shadcn/ui)
- **Location:** [src/components/ui/](src/components/ui/) - DO NOT edit directly, regenerate with `npx shadcn@latest add <component>`
- **Variants:** Use `class-variance-authority` (CVA) for type-safe variants. Example: [src/components/ui/button.tsx](src/components/ui/button.tsx) has `hero`, `glass`, `neon` variants
- **Styling:** Combine with `cn()` utility from [src/lib/utils.ts](src/lib/utils.ts) - merges Tailwind classes intelligently
- **Path Aliases:** Use `@/` prefix (configured in [vite.config.ts](vite.config.ts) and [components.json](components.json))

### Custom Transitions
- **Framer Motion:** Used for page transitions and animations
- **Custom CSS:** Gradient backgrounds, glass morphism, and neon glow effects in [src/index.css](src/index.css) - use utility classes like `glass`, `gradient-primary`, `shadow-neon`

### Form Handling
- **Pattern:** React Hook Form + Zod validation (see `@hookform/resolvers` and `zod` in dependencies)
- **Toast Notifications:** Use `useToast()` hook from [src/hooks/use-toast.ts](src/hooks/use-toast.ts) for user feedback

## Critical Conventions

### File Organization
- **Pages:** [src/pages/](src/pages/) - each route gets its own file, lazy-loaded in [src/App.tsx](src/App.tsx)
- **Components:** [src/components/](src/components/) for shared UI, [src/components/ui/](src/components/ui/) for Shadcn primitives
- **Integrations:** [src/integrations/supabase/](src/integrations/supabase/) - all Supabase-related code
- **Migrations:** [supabase/migrations/](supabase/migrations/) - timestamp-prefixed SQL files, applied sequentially

### Import Patterns
```typescript
// ✅ Correct - use path alias
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

// ❌ Avoid - relative imports across directories
import { supabase } from "../../integrations/supabase/client";
```

### TypeScript Conventions
- **Interfaces:** Use `interface` for object shapes (e.g., `Case`, `ClientRequest` in LawyerDashboard)
- **Types:** Use `type` for unions, intersections, or primitives
- **Nullability:** Handle with optional chaining (`?.`) and nullish coalescing (`??`)

### State Management
- **Local State:** `useState` for component-specific state
- **Global State:** React Context (AuthContext) for auth, consider TanStack Query for server state (already installed)
- **Avoid:** Redux/Zustand - not used in this project

## Common Pitfalls

1. **Auth Storage Corruption:** If users report login issues, check localStorage. Use `clearSupabaseStorage()` utility before suggesting full logout
2. **RLS Policies:** When queries fail with permissions errors, verify policies in migrations. Frontend queries run as authenticated user, Edge Functions as service role
3. **Edge Function CORS:** Always include `corsHeaders` in OPTIONS responses and error responses
4. **Lazy Loading:** Pages are lazy-loaded. Wrap new routes in `<Suspense fallback={<PageLoader />}>`
5. **Avatar Uploads:** Use `avatars` bucket, not generic storage. See policies in [supabase/migrations/20251109130000_fix_storage_policies.sql](supabase/migrations/20251109130000_fix_storage_policies.sql)

## Integration Points

### Google Maps API
- **Component:** [src/components/LocationAutocomplete.tsx](src/components/LocationAutocomplete.tsx)
- **Package:** `use-places-autocomplete` + `@react-google-maps/api`
- **Usage:** Lawyer location search, autocomplete inputs

### Groq API (LLaMA 3.3)
- **Accessed via:** Edge Function `ai-lawyer-chat`
- **Model:** `llama-3.3-70b-versatile`
- **Streaming:** Supports both streaming and non-streaming responses

### Supabase Storage
- **Buckets:** `avatars` (profile pics), `case-files` (legal documents)
- **Pattern:** Upload from frontend, generate public URLs, store URLs in database
- **File Attachments:** Handled in messaging system with metadata in `messages` table

## Testing & Debugging

### Logs & Diagnostics
- **Browser DevTools:** Check console for AuthContext initialization logs
- **Supabase Dashboard:** Real-time logs for Edge Functions
- **Auth Diagnostics:** Run `getAuthDiagnostics()` in browser console for detailed auth state

### Common Debug Commands
```bash
# Check Supabase CLI version
supabase --version

# Inspect local database
supabase db diff

# Check migrations status
supabase migration list
```

## References
- [README.md](README.md) - Feature overview and setup instructions
- [TECH_STACK.md](TECH_STACK.md) - Complete technology documentation
- [PROJECT_REPORT.md](PROJECT_REPORT.md) - Academic project report with detailed architecture
