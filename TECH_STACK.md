# 🚀 NyaAI - Complete Technology Stack Documentation

> **Comprehensive guide to all technologies, libraries, and tools used in NyaAI**  
> Last Updated: November 9, 2025

---

## 📋 Table of Contents

1. [Tech Stack Overview](#-tech-stack-overview)
2. [Frontend Technologies](#-frontend-technologies)
3. [Backend & Database](#-backend--database)
4. [UI Component Libraries](#-ui-component-libraries)
5. [Development Tools](#-development-tools)
6. [External Services & APIs](#-external-services--apis)
7. [Build & Deployment](#-build--deployment)
8. [Architecture Patterns](#-architecture-patterns)
9. [Quick Reference Table](#-quick-reference-table)

---

## 🎯 Tech Stack Overview

### **Architecture Type**
- **Full-Stack Web Application** (SPA - Single Page Application)
- **Serverless Architecture** (Edge Functions)
- **Real-time Communication** (WebSocket-based)

### **Primary Technologies**
```
Frontend:  React 18 + TypeScript + Vite
Backend:   Supabase (PostgreSQL + Edge Functions)
Styling:   TailwindCSS + Shadcn/ui
State:     React Context + TanStack Query
Real-time: Supabase Realtime Subscriptions
```

---

## 🎨 Frontend Technologies

### **Core Framework & Runtime**

#### **1. React 18.3.1**
- **Purpose:** UI library for building component-based interfaces
- **Why chosen:** 
  - Virtual DOM for efficient rendering
  - Large ecosystem and community
  - Hooks for state management
  - Concurrent features for better UX
- **Key features used:**
  - `useState`, `useEffect`, `useContext`, `useRef`, `useMemo`
  - Custom hooks for reusable logic
  - Context API for global state
  - Error boundaries for fault tolerance

#### **2. TypeScript 5.5.3**
- **Purpose:** Static type checking for JavaScript
- **Why chosen:**
  - Type safety prevents runtime errors
  - Better IDE autocomplete and IntelliSense
  - Self-documenting code
  - Easier refactoring
- **Configuration:**
  - Strict mode enabled
  - Path aliases (`@/components`, `@/lib`, etc.)
  - ESNext target for modern features

#### **3. Vite 5.4.1**
- **Purpose:** Build tool and development server
- **Why chosen:**
  - Lightning-fast HMR (Hot Module Replacement)
  - Native ES modules support
  - Optimized production builds
  - Better than Create React App
- **Plugins used:**
  - `@vitejs/plugin-react-swc` - SWC for faster transpilation
  - Built-in TypeScript support

---

### **Routing & Navigation**

#### **React Router DOM 6.26.2**
- **Purpose:** Client-side routing
- **Features used:**
  - `BrowserRouter` for history-based navigation
  - `Routes` and `Route` for page definitions
  - `useNavigate` hook for programmatic navigation
  - `Navigate` component for redirects
  - Protected routes for authentication
- **Routes implemented:**
  - `/` - Landing page
  - `/auth` - Login/Signup
  - `/dashboard` - User dashboard
  - `/lawyer-dashboard` - Lawyer portal
  - `/ai-chat` - AI lawyer chatbot
  - `/find-lawyers` - Lawyer search
  - `/document-summarizer` - Document analysis
  - `/government-schemes` - Schemes finder

---

### **Styling & Design System**

#### **1. TailwindCSS 3.4.11**
- **Purpose:** Utility-first CSS framework
- **Why chosen:**
  - Rapid UI development
  - Consistent design system
  - Small bundle size (purges unused CSS)
  - Responsive design utilities
- **Plugins:**
  - `@tailwindcss/typography` - Rich text styling
  - `tailwindcss-animate` - Animation utilities
  - Custom color palette (primary, secondary, accent)

#### **2. Shadcn/ui Components**
- **Purpose:** Pre-built accessible React components
- **Why chosen:**
  - Built on Radix UI (accessible primitives)
  - Customizable with TailwindCSS
  - Copy-paste approach (no npm package bloat)
  - Fully typed with TypeScript
- **Components used:** (50+ components)
  - Forms: Button, Input, Textarea, Select, Checkbox, Radio, Switch
  - Layout: Card, Dialog, Sheet, Tabs, Accordion, Separator
  - Feedback: Toast, Alert, Progress, Skeleton
  - Navigation: NavigationMenu, Dropdown, Command, Popover
  - Data Display: Table, Avatar, Badge, Tooltip
  - Advanced: Calendar, DatePicker, Carousel, Resizable Panels

#### **3. Radix UI Primitives**
- **Purpose:** Unstyled, accessible UI components
- **Components used:**
  - `@radix-ui/react-dialog` - Modals and dialogs
  - `@radix-ui/react-dropdown-menu` - Dropdown menus
  - `@radix-ui/react-popover` - Popovers and tooltips
  - `@radix-ui/react-select` - Custom select inputs
  - `@radix-ui/react-tabs` - Tab navigation
  - `@radix-ui/react-toast` - Toast notifications
  - `@radix-ui/react-avatar` - Avatar component
  - `@radix-ui/react-progress` - Progress bars
  - `@radix-ui/react-scroll-area` - Custom scrollbars
  - `@radix-ui/react-slider` - Range sliders
  - `@radix-ui/react-switch` - Toggle switches
  - (22 total Radix UI packages)

#### **4. Additional Styling Libraries**
- **Lucide React 0.462.0** - Icon library (1000+ icons)
- **Framer Motion 12.23.12** - Animation library for smooth transitions
- **class-variance-authority** - For component variants
- **clsx** & **tailwind-merge** - Conditional class names
- **next-themes 0.3.0** - Dark/light mode theming

---

### **State Management**

#### **1. React Context API**
- **Purpose:** Global state management
- **Contexts created:**
  - `AuthContext` - User authentication state
  - `ThemeProvider` - Dark/light mode state
- **Why chosen:**
  - Built into React (no extra dependencies)
  - Simple for app-wide state
  - Type-safe with TypeScript

#### **2. TanStack Query (React Query) 5.56.2**
- **Purpose:** Server state management and data fetching
- **Features used:**
  - Automatic caching and refetching
  - Background data synchronization
  - Query invalidation
  - Optimistic updates
- **Why chosen:**
  - Handles async operations elegantly
  - Reduces boilerplate code
  - Better than Redux for API calls

---

### **Form Handling**

#### **React Hook Form 7.53.0**
- **Purpose:** Form state management and validation
- **Features used:**
  - `useForm` hook for form state
  - Field registration with validation
  - Error handling and display
  - Uncontrolled components (better performance)
- **Why chosen:**
  - Minimal re-renders
  - Easy integration with Zod
  - Great TypeScript support

#### **Zod 3.23.8**
- **Purpose:** TypeScript-first schema validation
- **Features used:**
  - Form validation schemas
  - Type inference for forms
  - Custom error messages
  - Complex validation rules
- **Integration:** 
  - `@hookform/resolvers` - Connects Zod with React Hook Form

---

### **Data Visualization**

#### **Recharts 2.12.7**
- **Purpose:** Chart library for React
- **Charts used:**
  - Line charts - Activity tracking
  - Bar charts - Statistics comparison
  - Pie charts - Distribution visualization
  - Area charts - Trend analysis
- **Why chosen:**
  - Composable components
  - Responsive by default
  - TypeScript support
  - Smooth animations

---

### **Maps & Location**

#### **1. @react-google-maps/api 2.20.7**
- **Purpose:** Google Maps integration
- **Features used:**
  - Interactive map display
  - Marker placement for lawyer locations
  - Custom map styling
  - Responsive map container
- **Why chosen:**
  - Official React wrapper
  - TypeScript definitions included
  - Active maintenance

#### **2. use-places-autocomplete 4.0.1**
- **Purpose:** Google Places API autocomplete
- **Features used:**
  - Location search input
  - Address suggestions
  - Geocoding results
- **Use case:** Lawyer location search and filtering

---

### **Document Handling**

#### **1. PDF.js (pdfjs-dist) 5.4.394**
- **Purpose:** PDF rendering in browser
- **Features used:**
  - PDF file parsing
  - Text extraction from PDFs
  - Document preview
- **Use case:** Legal document analysis and summarization

#### **2. jsPDF 3.0.3**
- **Purpose:** PDF generation in JavaScript
- **Features used:**
  - Generate PDF reports
  - Download legal documents
  - Export case summaries
- **Use case:** Creating downloadable legal reports

---

### **Rich Text & Markdown**

#### **React Markdown 10.1.0**
- **Purpose:** Render Markdown as React components
- **Features used:**
  - Markdown to JSX conversion
  - Code block rendering
  - Link handling
- **Plugin:** `remark-gfm 4.0.1` - GitHub Flavored Markdown support
- **Use case:** Formatting AI chat responses and document summaries

---

### **UI Enhancements**

#### **Additional Libraries**
- **Sonner 1.5.0** - Beautiful toast notifications
- **cmdk 1.0.0** - Command palette (Cmd+K interface)
- **vaul 0.9.3** - Drawer component for mobile
- **embla-carousel-react 8.3.0** - Carousel/slider component
- **react-resizable-panels 2.1.3** - Resizable split panels
- **input-otp 1.2.4** - OTP input component
- **react-day-picker 8.10.1** - Date picker component
- **date-fns 3.6.0** - Date formatting and manipulation

---

## 🔧 Backend & Database

### **Supabase (Complete Backend-as-a-Service)**

#### **1. Supabase Client (@supabase/supabase-js 2.53.0)**
- **Purpose:** JavaScript client for Supabase
- **Features used:**
  - Authentication SDK
  - Database queries (PostgreSQL)
  - Real-time subscriptions
  - Storage operations
  - Edge Functions invocation

#### **2. PostgreSQL Database**
- **Purpose:** Primary data storage
- **Tables created:**
  - `profiles` - User profile information
  - `user_roles` - Role assignments (user/lawyer)
  - `cases` - Legal case records
  - `conversations` - Chat conversations
  - `messages` - Chat messages
  - `chat_history` - AI chat logs
  - `government_schemes` - Schemes data
  - `saved_schemes` - User-saved schemes
- **Features:**
  - Row Level Security (RLS) for data protection
  - Foreign key constraints
  - Indexes for performance
  - Triggers for automation

#### **3. Supabase Authentication**
- **Methods supported:**
  - Email/Password authentication
  - Magic link authentication
  - OAuth providers (ready to integrate)
- **Features:**
  - JWT-based session management
  - Automatic token refresh
  - Password reset functionality
  - Email verification

#### **4. Supabase Storage**
- **Buckets created:**
  - `lawyer-chat-attachments` - Message file attachments (10MB limit)
  - `avatars` - User profile pictures
- **Features:**
  - File upload/download
  - RLS policies for access control
  - Public/private bucket options
  - CDN-backed delivery

#### **5. Supabase Realtime**
- **Purpose:** WebSocket-based real-time updates
- **Features used:**
  - PostgreSQL change data capture (CDC)
  - Real-time message delivery
  - Live conversation updates
  - Presence tracking
- **Channels subscribed:**
  - `messages` table changes
  - `conversations` table changes

#### **6. Supabase Edge Functions (Deno Runtime)**
- **Purpose:** Serverless API endpoints
- **Runtime:** Deno (TypeScript-native, secure by default)
- **Functions deployed:**

##### **a. ai-lawyer-chat**
- **Purpose:** AI-powered legal consultation
- **Tech:** OpenAI GPT-4 API integration
- **Features:**
  - Natural language processing
  - Legal context understanding
  - Conversation history management
  - Streaming responses

##### **b. document-summarizer**
- **Purpose:** Legal document analysis
- **Tech:** PDF parsing + AI summarization
- **Features:**
  - Extract text from PDFs
  - Generate summaries
  - Identify key legal points
  - Return structured data

##### **c. lawyer-finder**
- **Purpose:** Find lawyers by location and specialization
- **Tech:** PostgreSQL queries + geolocation
- **Features:**
  - Location-based search
  - Specialization filtering
  - Rating-based sorting
  - Distance calculation

##### **d. government-schemes**
- **Purpose:** Fetch relevant government schemes
- **Tech:** Web scraping + data aggregation
- **Features:**
  - Scheme recommendations
  - Eligibility checking
  - Category filtering
  - Search functionality

##### **e. send-message**
- **Purpose:** Handle messaging between users and lawyers
- **Tech:** Database operations + notifications
- **Features:**
  - Message creation
  - Conversation management
  - File attachment handling
  - Real-time trigger

##### **f. accept-case**
- **Purpose:** Lawyer accepts client case
- **Tech:** Database transactions
- **Features:**
  - Case status updates
  - Conversation creation
  - Notification sending
  - Transaction safety

---

### **Database Migrations**
- **Tool:** Supabase CLI
- **Migration files:** 22 SQL migration files
- **Approach:** Version-controlled schema changes
- **Features:**
  - Rollback capability
  - Automated deployment
  - Environment parity

---

## 🎨 UI Component Libraries

### **Complete List of Radix UI Components**
```typescript
@radix-ui/react-accordion       // Collapsible content sections
@radix-ui/react-alert-dialog    // Modal alerts and confirmations
@radix-ui/react-aspect-ratio    // Maintain aspect ratios
@radix-ui/react-avatar          // User avatar display
@radix-ui/react-checkbox        // Checkbox inputs
@radix-ui/react-collapsible     // Expandable content
@radix-ui/react-context-menu    // Right-click menus
@radix-ui/react-dialog          // Modal dialogs
@radix-ui/react-dropdown-menu   // Dropdown menus
@radix-ui/react-hover-card      // Hover-triggered cards
@radix-ui/react-label           // Form labels
@radix-ui/react-menubar         // Application menu bar
@radix-ui/react-navigation-menu // Navigation menus
@radix-ui/react-popover         // Popover overlays
@radix-ui/react-progress        // Progress indicators
@radix-ui/react-radio-group     // Radio button groups
@radix-ui/react-scroll-area     // Custom scrollable areas
@radix-ui/react-select          // Custom select dropdowns
@radix-ui/react-separator       // Visual separators
@radix-ui/react-slider          // Range sliders
@radix-ui/react-slot            // Component composition
@radix-ui/react-switch          // Toggle switches
@radix-ui/react-tabs            // Tab navigation
@radix-ui/react-toast           // Toast notifications
@radix-ui/react-toggle          // Toggle buttons
@radix-ui/react-toggle-group    // Toggle button groups
@radix-ui/react-tooltip         // Tooltips
```

---

## 🛠️ Development Tools

### **Code Quality & Linting**

#### **ESLint 9.9.0**
- **Purpose:** JavaScript/TypeScript linting
- **Plugins:**
  - `eslint-plugin-react-hooks` - React hooks rules
  - `eslint-plugin-react-refresh` - Fast refresh rules
  - `@eslint/js` - Core ESLint rules
  - `typescript-eslint` - TypeScript-specific rules
- **Configuration:** `eslint.config.js`

#### **TypeScript ESLint 8.0.1**
- **Purpose:** TypeScript-specific linting
- **Features:**
  - Type-aware linting rules
  - Performance optimization
  - Best practices enforcement

---

### **Build Tools**

#### **PostCSS 8.4.47**
- **Purpose:** CSS processing pipeline
- **Plugins:**
  - `autoprefixer 10.4.20` - Automatic vendor prefixes
  - TailwindCSS integration

#### **Vite Config**
- **Features:**
  - Path aliases configuration
  - Environment variable handling
  - Build optimization
  - Code splitting
  - Asset optimization

---

### **Package Management**

#### **npm & Bun**
- **Primary:** npm (Node Package Manager)
- **Alternative:** Bun for faster installs
- **Lockfiles:** `package-lock.json`, `bun.lockb`

---

### **Version Control**

#### **Git & GitHub**
- **Repository:** `GaurangDosar/NyaAI`
- **Branch strategy:** Main branch deployment
- **Commit conventions:** Descriptive commit messages
- **CI/CD:** Manual deployment (ready for automation)

---

### **CLI Tools**

#### **Supabase CLI 2.54.11**
- **Purpose:** Supabase project management
- **Commands used:**
  - `supabase init` - Initialize project
  - `supabase start` - Local development
  - `supabase db push` - Deploy migrations
  - `supabase functions deploy` - Deploy edge functions
  - `supabase storage` - Manage storage buckets

---

## 🌐 External Services & APIs

### **1. OpenAI API**
- **Model:** GPT-4 / GPT-3.5-turbo
- **Purpose:** AI legal consultation
- **Features:**
  - Natural language understanding
  - Context-aware responses
  - Streaming API for real-time chat
- **Integration:** Edge function `ai-lawyer-chat`

### **2. Google Maps Platform**
- **APIs used:**
  - Maps JavaScript API
  - Places API
  - Geocoding API
- **Purpose:** Lawyer location search and mapping
- **Features:**
  - Interactive maps
  - Location autocomplete
  - Distance calculation

### **3. Spline 3D**
- **Purpose:** 3D background graphics
- **Implementation:** iframe embeds
- **Use cases:**
  - Hero section animation
  - Auth page background
- **URL:** `https://my.spline.design/worldplanet-CMjrskBh7SPlIOLUf4luIIay/`

### **4. Supabase Cloud**
- **Services:**
  - PostgreSQL database hosting
  - Edge Functions runtime (Deno)
  - Storage CDN
  - Real-time WebSocket server
  - Authentication service

---

## 📦 Build & Deployment

### **Build Process**

#### **Development Mode**
```bash
npm run dev
# Uses Vite dev server
# Hot Module Replacement (HMR)
# Port: 5173 (default)
```

#### **Production Build**
```bash
npm run build
# TypeScript compilation
# Vite optimization (minification, tree-shaking)
# Asset optimization (images, fonts)
# CSS purging (removes unused Tailwind classes)
# Output: dist/ folder
```

#### **Preview Build**
```bash
npm run preview
# Serves production build locally
# Test before deployment
```

---

### **Deployment**

#### **Frontend Hosting**
- **Options:** Vercel, Netlify, or any static host
- **Build output:** `dist/` directory
- **Environment variables:**
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_GOOGLE_MAPS_API_KEY`

#### **Backend Deployment**
- **Platform:** Supabase Cloud
- **Edge Functions:** Deployed via Supabase CLI
- **Database:** Managed PostgreSQL
- **Migrations:** Version-controlled SQL files

---

### **Environment Configuration**

#### **Environment Variables**
```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your_google_api_key

# OpenAI (Server-side only, in Supabase)
OPENAI_API_KEY=your_openai_key
```

---

## 🏗️ Architecture Patterns

### **Design Patterns Used**

#### **1. Component-Based Architecture**
- Small, reusable components
- Single Responsibility Principle
- Props for data passing
- Children for composition

#### **2. Custom Hooks Pattern**
```typescript
// Custom hooks for reusable logic
useAuth()        // Authentication state
useToast()       // Toast notifications
useMobile()      // Mobile detection
```

#### **3. Context Provider Pattern**
```typescript
// Global state management
<AuthContext.Provider>
  <ThemeProvider>
    <App />
  </ThemeProvider>
</AuthContext.Provider>
```

#### **4. Protected Routes Pattern**
```typescript
// Route protection based on auth
<Route path="/dashboard" element={
  user ? <Dashboard /> : <Navigate to="/auth" />
} />
```

#### **5. Error Boundary Pattern**
```typescript
// Graceful error handling
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

#### **6. Compound Component Pattern**
```typescript
// Radix UI components
<Dialog>
  <DialogTrigger />
  <DialogContent>
    <DialogTitle />
    <DialogDescription />
  </DialogContent>
</Dialog>
```

---

### **Code Organization**

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn/ui components
│   ├── Hero.tsx
│   ├── Navigation.tsx
│   └── ...
├── contexts/           # React Context providers
│   └── AuthContext.tsx
├── hooks/              # Custom React hooks
│   ├── use-toast.ts
│   └── use-mobile.tsx
├── integrations/       # Third-party integrations
│   └── supabase/
├── lib/                # Utility functions
│   ├── utils.ts
│   ├── auth-utils.ts
│   └── storage-utils.ts
├── pages/              # Route components
│   ├── Index.tsx
│   ├── Auth.tsx
│   ├── Dashboard.tsx
│   └── ...
├── App.tsx             # Main app component
└── main.tsx            # Entry point
```

---

### **State Management Strategy**

```
Local State (useState)
    ↓
Component Props
    ↓
Context API (Global State)
    ↓
TanStack Query (Server State)
    ↓
Supabase Realtime (Live Updates)
```

---

## 📊 Quick Reference Table

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Core** |
| Framework | React | 18.3.1 | UI Library |
| Language | TypeScript | 5.5.3 | Type Safety |
| Build Tool | Vite | 5.4.1 | Dev Server & Bundler |
| **Routing** |
| Router | React Router DOM | 6.26.2 | Client-side Routing |
| **Styling** |
| CSS Framework | TailwindCSS | 3.4.11 | Utility-first CSS |
| Components | Shadcn/ui | Latest | UI Components |
| Primitives | Radix UI | Various | Accessible Primitives |
| Icons | Lucide React | 0.462.0 | Icon Library |
| Animation | Framer Motion | 12.23.12 | Animations |
| Theming | next-themes | 0.3.0 | Dark/Light Mode |
| **State** |
| Global State | React Context | Built-in | Auth & Theme |
| Server State | TanStack Query | 5.56.2 | Data Fetching |
| **Forms** |
| Form Library | React Hook Form | 7.53.0 | Form Management |
| Validation | Zod | 3.23.8 | Schema Validation |
| **Backend** |
| BaaS | Supabase | 2.53.0 | Complete Backend |
| Database | PostgreSQL | 15+ | Data Storage |
| Auth | Supabase Auth | Built-in | Authentication |
| Storage | Supabase Storage | Built-in | File Storage |
| Realtime | Supabase Realtime | Built-in | Live Updates |
| Functions | Edge Functions | Deno | Serverless APIs |
| **Data Viz** |
| Charts | Recharts | 2.12.7 | Data Visualization |
| **Maps** |
| Maps | Google Maps API | 2.20.7 | Interactive Maps |
| Autocomplete | use-places-autocomplete | 4.0.1 | Location Search |
| **Documents** |
| PDF Render | PDF.js | 5.4.394 | PDF Viewing |
| PDF Generate | jsPDF | 3.0.3 | PDF Creation |
| **Rich Text** |
| Markdown | React Markdown | 10.1.0 | Markdown Rendering |
| Markdown Plugin | remark-gfm | 4.0.1 | GitHub Flavored MD |
| **UI Extras** |
| Toasts | Sonner | 1.5.0 | Notifications |
| Command | cmdk | 1.0.0 | Command Palette |
| Drawer | vaul | 0.9.3 | Mobile Drawer |
| Carousel | Embla Carousel | 8.3.0 | Image Carousel |
| Panels | Resizable Panels | 2.1.3 | Split Views |
| **Dev Tools** |
| Linter | ESLint | 9.9.0 | Code Quality |
| TS Linter | typescript-eslint | 8.0.1 | TS Linting |
| CSS Processor | PostCSS | 8.4.47 | CSS Processing |
| Autoprefixer | autoprefixer | 10.4.20 | Vendor Prefixes |
| Supabase CLI | supabase | 2.54.11 | Backend Management |

---

## 🎓 Key Technologies for Presentation

### **Must Know for Demo:**

1. **React 18** - Component lifecycle, hooks, context
2. **TypeScript** - Type safety, interfaces, generics
3. **Supabase** - Auth, database, realtime, storage, functions
4. **TailwindCSS** - Utility classes, responsive design
5. **React Router** - Navigation, protected routes
6. **PostgreSQL** - Database design, RLS, migrations

### **Important Libraries:**

7. **Radix UI** - Accessibility, headless components
8. **TanStack Query** - Server state, caching
9. **React Hook Form** - Form handling, validation
10. **Recharts** - Data visualization

### **APIs & Services:**

11. **OpenAI GPT-4** - AI integration
12. **Google Maps** - Location services
13. **Deno Runtime** - Edge functions

---

## 📝 Notes for Presentation

### **Why This Tech Stack?**

1. **Performance:** Vite + React 18 = Fast dev & build
2. **Type Safety:** TypeScript prevents bugs
3. **Scalability:** Supabase scales automatically
4. **Real-time:** Built-in WebSocket support
5. **Accessibility:** Radix UI components are WCAG compliant
6. **Developer Experience:** Hot reload, type checking, great docs
7. **Cost-Effective:** Free tier for development
8. **Modern:** Latest stable versions of all packages

### **Key Features Enabled by Tech:**

- **Real-time Messaging:** Supabase Realtime
- **AI Chat:** OpenAI + Streaming responses
- **Document Analysis:** PDF.js + AI summarization
- **Lawyer Search:** Google Maps + PostgreSQL queries
- **Dark Mode:** next-themes + TailwindCSS
- **Responsive Design:** TailwindCSS utilities
- **Type Safety:** TypeScript throughout
- **Accessibility:** Radix UI primitives

---

## 🔗 Useful Links

- **React:** https://react.dev
- **TypeScript:** https://www.typescriptlang.org
- **Vite:** https://vitejs.dev
- **TailwindCSS:** https://tailwindcss.com
- **Shadcn/ui:** https://ui.shadcn.com
- **Radix UI:** https://www.radix-ui.com
- **Supabase:** https://supabase.com/docs
- **TanStack Query:** https://tanstack.com/query
- **React Router:** https://reactrouter.com
- **Recharts:** https://recharts.org

---

**Total Dependencies:** 87 packages (57 production + 30 development)  
**Total Lines of Code:** ~15,000+ lines  
**Components Created:** 50+ custom components  
**Edge Functions:** 6 serverless functions  
**Database Tables:** 8 tables with RLS  
**Migration Files:** 22 SQL migrations  

---

*This document covers 100% of the technology stack used in NyaAI.*  
*For questions or clarifications, refer to official documentation of each technology.*
