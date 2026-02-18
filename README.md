# NyaAI - AI-Powered Legal Platform

A modern, full-stack legal technology platform that connects clients with lawyers through AI-powered features, intelligent document analysis, and real-time messaging capabilities.

![React](https://img.shields.io/badge/React-18.x-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![Vite](https://img.shields.io/badge/Vite-5.x-purple)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-cyan)

## 🌟 Features

### For Clients
- **🤖 AI Legal Assistant**: 24/7 AI-powered chatbot for instant legal advice and guidance
- **📄 Document Summarizer**: Upload and get AI-generated summaries of legal documents (PDF, DOCX, TXT)
- **👨‍⚖️ Lawyer Finder**: Search and filter lawyers by specialization, location, and experience
- **💬 Secure Messaging**: Request-based messaging system with file attachments
- **📊 Government Schemes**: Discover and access relevant government legal aid programs
- **🌓 Dark/Light Mode**: Comfortable viewing experience with theme switching

### For Lawyers
- **📋 Dashboard Analytics**: Comprehensive statistics on cases, clients, and performance
- **📊 Visual Reports**: Charts showing case distribution, monthly trends, and success rates
- **💼 Case Management**: Create, view, edit, and manage client cases
- **📬 Client Requests**: Review and accept/reject incoming case requests
- **💬 Real-time Messaging**: Chat with clients with file attachment support
- **🔔 Smart Notifications**: Toast alerts and badges for new messages
- **👤 Profile Management**: Update professional information and avatar

### Core Technologies
- **Frontend**: React 18 + TypeScript + Vite (**Note that the base frontend is generated through Lovable AI**)
- **UI Framework**: TailwindCSS + Shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth with Row Level Security (RLS)
- **Storage**: Supabase Storage for file uploads
- **Real-time**: Supabase Realtime for instant message updates
- **Charts**: Recharts for data visualization

## 🛠️ Complete Tech Stack

### **Frontend Technologies**

#### **Core Framework**
- **[React](https://react.dev/) v18.3.1** - Component-based UI library
- **[TypeScript](https://www.typescriptlang.org/) v5.5.3** - Type-safe JavaScript
- **[Vite](https://vitejs.dev/) v5.4.1** - Lightning-fast build tool and dev server
- **[@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) v3.5.0** - Fast React refresh with SWC compiler

#### **Routing & Navigation**
- **[React Router DOM](https://reactrouter.com/) v6.26.2** - Client-side routing
  - `BrowserRouter` for navigation
  - Protected routes with authentication checks
  - Smooth page transitions

#### **UI Component Library (Shadcn/ui + Radix UI)**
Built on **[Radix UI](https://www.radix-ui.com/)** primitives - Accessible, unstyled components:

- **[@radix-ui/react-dialog](https://www.radix-ui.com/docs/primitives/components/dialog) v1.1.2** - Modal dialogs
- **[@radix-ui/react-dropdown-menu](https://www.radix-ui.com/docs/primitives/components/dropdown-menu) v2.1.1** - Dropdown menus
- **[@radix-ui/react-toast](https://www.radix-ui.com/docs/primitives/components/toast) v1.2.1** - Toast notifications
- **[@radix-ui/react-tabs](https://www.radix-ui.com/docs/primitives/components/tabs) v1.1.0** - Tab navigation
- **[@radix-ui/react-avatar](https://www.radix-ui.com/docs/primitives/components/avatar) v1.1.0** - Avatar images
- **[@radix-ui/react-select](https://www.radix-ui.com/docs/primitives/components/select) v2.1.1** - Select dropdowns
- **[@radix-ui/react-popover](https://www.radix-ui.com/docs/primitives/components/popover) v1.1.1** - Popover menus
- **[@radix-ui/react-scroll-area](https://www.radix-ui.com/docs/primitives/components/scroll-area) v1.1.0** - Custom scrollbars
- **[@radix-ui/react-separator](https://www.radix-ui.com/docs/primitives/components/separator) v1.1.0** - Visual dividers
- **[@radix-ui/react-slider](https://www.radix-ui.com/docs/primitives/components/slider) v1.2.0** - Slider inputs
- **[@radix-ui/react-switch](https://www.radix-ui.com/docs/primitives/components/switch) v1.1.0** - Toggle switches
- **[@radix-ui/react-tooltip](https://www.radix-ui.com/docs/primitives/components/tooltip) v1.1.4** - Tooltips
- **[@radix-ui/react-accordion](https://www.radix-ui.com/docs/primitives/components/accordion) v1.2.0** - Collapsible sections
- **[@radix-ui/react-alert-dialog](https://www.radix-ui.com/docs/primitives/components/alert-dialog) v1.1.1** - Alert modals
- **[@radix-ui/react-checkbox](https://www.radix-ui.com/docs/primitives/components/checkbox) v1.1.1** - Checkboxes
- **[@radix-ui/react-context-menu](https://www.radix-ui.com/docs/primitives/components/context-menu) v2.2.1** - Right-click menus
- **[@radix-ui/react-hover-card](https://www.radix-ui.com/docs/primitives/components/hover-card) v1.1.1** - Hover cards
- **[@radix-ui/react-label](https://www.radix-ui.com/docs/primitives/components/label) v2.1.0** - Form labels
- **[@radix-ui/react-menubar](https://www.radix-ui.com/docs/primitives/components/menubar) v1.1.1** - Menu bars
- **[@radix-ui/react-navigation-menu](https://www.radix-ui.com/docs/primitives/components/navigation-menu) v1.2.0** - Navigation menus
- **[@radix-ui/react-progress](https://www.radix-ui.com/docs/primitives/components/progress) v1.1.0** - Progress bars
- **[@radix-ui/react-radio-group](https://www.radix-ui.com/docs/primitives/components/radio-group) v1.2.0** - Radio buttons
- **[@radix-ui/react-toggle](https://www.radix-ui.com/docs/primitives/components/toggle) v1.1.0** - Toggle buttons
- **[@radix-ui/react-toggle-group](https://www.radix-ui.com/docs/primitives/components/toggle-group) v1.1.0** - Toggle groups
- **[@radix-ui/react-aspect-ratio](https://www.radix-ui.com/docs/primitives/components/aspect-ratio) v1.1.0** - Aspect ratio containers
- **[@radix-ui/react-collapsible](https://www.radix-ui.com/docs/primitives/components/collapsible) v1.1.0** - Collapsible content
- **[@radix-ui/react-slot](https://www.radix-ui.com/docs/primitives/utilities/slot) v1.1.0** - Composition utilities

#### **Styling & Design**
- **[TailwindCSS](https://tailwindcss.com/) v3.4.11** - Utility-first CSS framework
- **[tailwindcss-animate](https://github.com/jamiebuilds/tailwindcss-animate) v1.0.7** - Animation utilities
- **[tailwind-merge](https://github.com/dcastil/tailwind-merge) v2.5.2** - Merge Tailwind classes intelligently
- **[@tailwindcss/typography](https://tailwindcss.com/docs/typography-plugin) v0.5.15** - Beautiful typography defaults
- **[PostCSS](https://postcss.org/) v8.4.47** - CSS transformation tool
- **[Autoprefixer](https://github.com/postcss/autoprefixer) v10.4.20** - Auto vendor prefixes
- **[class-variance-authority](https://cva.style/docs) v0.7.1** - Type-safe variant styling
- **[clsx](https://github.com/lukeed/clsx) v2.1.1** - Conditional className utility

#### **Icons & Animations**
- **[Lucide React](https://lucide.dev/) v0.462.0** - Beautiful SVG icon library (1000+ icons)
  - Used throughout: `Brain`, `Shield`, `Scale`, `MessageSquare`, `File`, etc.
- **[Framer Motion](https://www.framer.com/motion/) v12.23.12** - Production-ready animation library
  - Smooth page transitions
  - Hover effects and micro-interactions

#### **Theming**
- **[next-themes](https://github.com/pacocoursey/next-themes) v0.3.0** - Perfect dark mode support
  - System preference detection
  - Persistent theme selection
  - No flash on load

#### **Additional UI Libraries**
- **[cmdk](https://cmdk.paco.me/) v1.0.0** - Command palette component
- **[vaul](https://github.com/emilkowalski/vaul) v0.9.3** - Drawer component for mobile
- **[sonner](https://sonner.emilkowal.ski/) v1.5.0** - Toast notifications with beautiful animations
- **[embla-carousel-react](https://www.embla-carousel.com/) v8.3.0** - Lightweight carousel
- **[react-resizable-panels](https://github.com/bvaughn/react-resizable-panels) v2.1.3** - Resizable panel layouts
- **[input-otp](https://input-otp.rodz.dev/) v1.2.4** - OTP input component

### **Backend & Database**

#### **Supabase Stack**
- **[@supabase/supabase-js](https://supabase.com/docs/reference/javascript/introduction) v2.53.0** - JavaScript client
  - Authentication
  - Database (PostgreSQL)
  - Real-time subscriptions
  - Storage
  - Edge Functions

#### **Backend Runtime**
- **[Deno](https://deno.land/)** - Secure TypeScript runtime for Edge Functions
  - `std@0.168.0` - Standard library for HTTP server
  - `xhr@0.1.0` - XMLHttpRequest polyfill
  - `esm.sh` - CDN for npm packages

#### **Database**
- **PostgreSQL** - Supabase managed database
  - Row Level Security (RLS)
  - Foreign key constraints
  - Triggers and functions
  - Full-text search capabilities

### **State Management & Data Fetching**

#### **Server State**
- **[@tanstack/react-query](https://tanstack.com/query/latest) v5.56.2** - Powerful async state management
  - Automatic caching
  - Background refetching
  - Optimistic updates
  - Pagination support

#### **Client State**
- **React Context API** - Built-in state management
  - `AuthContext` - User authentication state
  - `ThemeProvider` - Theme preference state

### **Forms & Validation**

#### **Form Management**
- **[react-hook-form](https://react-hook-form.com/) v7.53.0** - Performant form library
  - Uncontrolled components for performance
  - Built-in validation
  - Minimal re-renders

#### **Schema Validation**
- **[Zod](https://zod.dev/) v3.23.8** - TypeScript-first schema validation
  - Runtime type checking
  - Error messages
  - Type inference
- **[@hookform/resolvers](https://github.com/react-hook-form/resolvers) v3.9.0** - Zod + React Hook Form integration

### **Data Visualization**

#### **Charts & Analytics**
- **[Recharts](https://recharts.org/) v2.12.7** - Composable charting library
  - Line charts (monthly trends)
  - Pie charts (case distribution)
  - Bar charts (statistics)
  - Responsive design

### **Maps & Location**

#### **Google Maps Integration**
- **[@react-google-maps/api](https://react-google-maps-api-docs.netlify.app/) v2.20.7** - Google Maps React wrapper
- **[use-places-autocomplete](https://github.com/wellyshen/use-places-autocomplete) v4.0.1** - Google Places autocomplete hook
  - Location search
  - Address suggestions
  - Geolocation support

### **Document Processing**

#### **PDF Handling**
- **[pdfjs-dist](https://mozilla.github.io/pdf.js/) v5.4.394** - Mozilla PDF.js library
  - PDF text extraction
  - Document parsing
  - Canvas rendering
- **[jsPDF](https://github.com/parallax/jsPDF) v3.0.3** - PDF generation
  - Create PDF documents
  - Export reports

### **Markdown & Rich Text**

#### **Markdown Rendering**
- **[react-markdown](https://github.com/remarkjs/react-markdown) v10.1.0** - Markdown component
  - Syntax highlighting
  - Custom renderers
- **[remark-gfm](https://github.com/remarkjs/remark-gfm) v4.0.1** - GitHub Flavored Markdown
  - Tables
  - Task lists
  - Strikethrough

### **Date & Time**

#### **Date Utilities**
- **[date-fns](https://date-fns.org/) v3.6.0** - Modern date utility library
  - Date formatting
  - Relative time
  - Time zone support
- **[react-day-picker](https://react-day-picker.js.org/) v8.10.1** - Date picker component
  - Calendar UI
  - Date range selection

### **Development Tools**

#### **Build Tools**
- **[Vite](https://vitejs.dev/) v5.4.1** - Next-generation frontend tooling
  - Hot Module Replacement (HMR)
  - Optimized builds
  - Code splitting
  - Environment variables

#### **Linting & Code Quality**
- **[ESLint](https://eslint.org/) v9.9.0** - Code linting
- **[@eslint/js](https://www.npmjs.com/package/@eslint/js) v9.9.0** - ESLint JavaScript config
- **[typescript-eslint](https://typescript-eslint.io/) v8.0.1** - TypeScript ESLint rules
- **[eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks) v5.1.0-rc.0** - React Hooks rules
- **[eslint-plugin-react-refresh](https://github.com/ArnaudBarre/eslint-plugin-react-refresh) v0.4.9** - React Refresh rules
- **[globals](https://github.com/sindresorhus/globals) v15.9.0** - Global variables list

#### **Type Definitions**
- **[@types/react](https://www.npmjs.com/package/@types/react) v18.3.3** - React type definitions
- **[@types/react-dom](https://www.npmjs.com/package/@types/react-dom) v18.3.0** - React DOM types
- **[@types/node](https://www.npmjs.com/package/@types/node) v22.5.5** - Node.js type definitions

#### **Supabase CLI**
- **[Supabase CLI](https://supabase.com/docs/guides/cli) v2.54.11** - Local development and deployment
  - Database migrations
  - Function deployment
  - Type generation
  - Local development environment

#### **Project Tagging**
- **[lovable-tagger](https://www.npmjs.com/package/lovable-tagger) v1.1.7** - Lovable AI project tagging

### **AI & External APIs**

#### **AI Services (Used in Edge Functions)**
- **OpenAI GPT-4** - AI legal assistant chatbot
  - Contextual legal advice
  - Multi-turn conversations
  - Legal document analysis
- **Google Gemini API** - Document summarization
  - PDF document parsing
  - Intelligent summarization
  - Key point extraction

### **Environment & Configuration**

#### **Environment Variables**
```env
# Frontend (Vite - VITE_ prefix required)
VITE_SUPABASE_URL          # Supabase project URL
VITE_SUPABASE_ANON_KEY     # Supabase anonymous key

# Backend (Supabase Edge Functions)
SUPABASE_URL               # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY  # Service role key (admin access)
SUPABASE_ANON_KEY          # Anonymous key (client access)
OPENAI_API_KEY             # OpenAI API key for AI chatbot
GOOGLE_API_KEY             # Google API key for document processing
```

### **Storage & File Management**

#### **Supabase Storage**
- **Buckets:**
  - `lawyer-chat-attachments` - Message file attachments (10MB limit per file)
  - `avatars` - User profile pictures
- **Supported Formats:**
  - Documents: PDF, DOCX, TXT
  - Images: JPG, PNG, GIF, WebP
- **Features:**
  - CDN delivery
  - Row Level Security (RLS)
  - Public/private access control
  - Automatic image optimization

### **Real-time Features**

#### **Supabase Realtime**
- **WebSocket Connections** - Instant bidirectional communication
- **Database Changes** - Live updates on table changes
- **Presence** - User online/offline status
- **Broadcast** - Custom events

**Subscribed Tables:**
- `messages` - New message notifications
- `conversations` - Conversation status updates
- `cases` - Case status changes

### **Security Features**

#### **Authentication**
- **Supabase Auth** - Built-in authentication
  - Email/password signup
  - JWT tokens
  - Session management
  - Password reset
  - Email verification

#### **Authorization**
- **Row Level Security (RLS)** - Database-level security
- **Role-Based Access Control (RBAC)** - User roles (client/lawyer)
- **Path-based Storage Policies** - Secure file access

#### **Security Best Practices**
- ✅ Environment variables for secrets
- ✅ HTTPS only in production
- ✅ CORS configuration
- ✅ Input validation with Zod
- ✅ XSS protection with React
- ✅ SQL injection prevention (parameterized queries)

### **Performance Optimizations**

#### **Build Optimizations**
- **Code Splitting** - Dynamic imports for route-based splitting
- **Tree Shaking** - Remove unused code
- **Minification** - Compressed production builds
- **Asset Optimization** - Image compression and lazy loading

#### **Runtime Optimizations**
- **React Memo** - Component memoization
- **React Query Caching** - Intelligent data caching
- **Debouncing** - Search input optimization
- **Virtual Scrolling** - Large list performance (if needed)
- **Lazy Loading** - Route-based code splitting

### **Testing & Quality Assurance**

#### **Type Safety**
- **TypeScript** - Compile-time type checking
- **Zod** - Runtime validation
- **Supabase Generated Types** - Database type safety

#### **Error Handling**
- **Error Boundary** - React error boundary component
- **Try-Catch Blocks** - Function-level error handling
- **Toast Notifications** - User-friendly error messages
- **Logging** - Console logging in development

### **Deployment & Hosting**

#### **Supported Platforms**
- **[Vercel](https://vercel.com/)** - Recommended (optimized for Vite)
- **[Netlify](https://www.netlify.com/)** - Easy deployment
- **[GitHub Pages](https://pages.github.com/)** - Free static hosting
- **[AWS Amplify](https://aws.amazon.com/amplify/)** - Scalable hosting
- **[Cloudflare Pages](https://pages.cloudflare.com/)** - Fast edge delivery

#### **CI/CD**
- GitHub Actions (optional)
- Automatic deployments on push
- Preview deployments for PRs

### **Browser Compatibility**

#### **Supported Browsers**
- ✅ Chrome 90+ (Recommended)
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Opera 76+

#### **Mobile Browsers**
- ✅ Chrome Mobile
- ✅ Safari iOS 14+
- ✅ Samsung Internet

### **Package Managers**

#### **Supported**
- **npm** - Node Package Manager (default)
- **bun** - Fast JavaScript runtime and package manager
- **pnpm** - Fast, disk space efficient
- **yarn** - Alternative package manager

### **3D Graphics**

#### **Spline 3D**
- **[Spline](https://spline.design/)** - 3D design tool for web
  - Embedded via iframe
  - Used in Hero and Auth pages
  - Interactive 3D backgrounds
  - Theme-aware filtering

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/bun
- Supabase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/GaurangDosar/NyaAI.git
   cd NyaAI
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run database migrations**
   ```bash
   # Install Supabase CLI if not already installed
   npm install -g supabase
   
   # Link to your Supabase project
   supabase link --project-ref your-project-ref
   
   # Run migrations
   supabase db push
   ```

5. **Deploy Edge Functions**
   ```bash
   supabase functions deploy ai-lawyer-chat
   supabase functions deploy send-message
   supabase functions deploy accept-case
   supabase functions deploy document-summarizer
   supabase functions deploy lawyer-finder
   supabase functions deploy government-schemes
   ```

6. **Start development server**
   ```bash
   npm run dev
   # or
   bun run dev
   ```

7. **Open your browser**
   
   Navigate to `http://localhost:8080`

## 📁 Project Structure

```
NyaAI/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Shadcn/ui components
│   │   ├── Navigation.tsx  # Main navigation bar
│   │   ├── Footer.tsx      # Footer with contact info
│   │   ├── Hero.tsx        # Landing page hero section
│   │   └── Features.tsx    # Features showcase
│   ├── contexts/           # React context providers
│   │   └── AuthContext.tsx # Authentication state management
│   ├── hooks/              # Custom React hooks
│   ├── integrations/       # Third-party integrations
│   │   └── supabase/       # Supabase client and types
│   ├── lib/                # Utility functions
│   ├── pages/              # Application pages
│   │   ├── Index.tsx       # Landing page
│   │   ├── Auth.tsx        # Login/Signup page
│   │   ├── Dashboard.tsx   # Client dashboard
│   │   ├── LawyerDashboard.tsx # Lawyer dashboard
│   │   ├── FindLawyers.tsx # Lawyer search & messaging
│   │   ├── AIChatbot.tsx   # AI legal assistant
│   │   ├── DocumentSummarizer.tsx # Document analysis
│   │   └── GovernmentSchemes.tsx # Legal aid programs
│   ├── App.tsx             # Main application component
│   └── main.tsx            # Application entry point
├── supabase/
│   ├── functions/          # Edge Functions (serverless)
│   │   ├── ai-lawyer-chat/
│   │   ├── send-message/
│   │   ├── accept-case/
│   │   ├── document-summarizer/
│   │   ├── lawyer-finder/
│   │   └── government-schemes/
│   └── migrations/         # Database migrations
└── public/                 # Static assets
```

## 🗄️ Database Schema

### Core Tables

**`auth.users`** - Supabase Auth users  
**`profiles`** - User profiles (name, email, avatar, specialization)  
**`user_roles`** - Role assignments (client/lawyer)  
**`conversations`** - Chat conversations between clients and lawyers  
**`messages`** - Individual messages with attachments  
**`cases`** - Legal cases managed by lawyers

### Storage Buckets

**`lawyer-chat-attachments`** - Message file attachments (10MB limit)  
**`avatars`** - User profile pictures

## 🔐 Security

- **Row Level Security (RLS)** enabled on all tables
- **JWT-based authentication** with Supabase Auth
- **Role-based access control** (client/lawyer)
- **Secure file uploads** with path-based RLS policies

## 🔄 Messaging Workflow

1. **Client sends request** → Creates conversation (`status: pending`)
2. **Lawyer reviews** → Appears in "Client Requests" tab
3. **Lawyer accepts** → Creates case, activates conversation
4. **Both chat** → Real-time messaging with file attachments
5. **Case closes** → Lawyer updates status

## 🛠️ Edge Functions

- **`send-message`** - Handles all messaging logic
- **`accept-case`** - Processes case acceptance/rejection
- **`ai-lawyer-chat`** - AI-powered legal assistant
- **`document-summarizer`** - Document analysis
- **`lawyer-finder`** - Smart lawyer search
- **`government-schemes`** - Legal aid discovery

## 🎨 UI Components

Built with **Shadcn/ui** and **TailwindCSS**:
- Button, Card, Input, Select, Dialog
- Avatar, Badge, Tabs, Toast
- Theme Toggle (Dark/Light mode)
- Error Boundary, Location Autocomplete

## 📊 Analytics & Charts

Lawyer Dashboard includes:
- Cases by Status (Pie chart)
- Monthly Trend (Line chart)
- Statistics Cards (Total cases, clients, won/lost)
- Time Period Filter (7 days, 30 days, all time)

## 🔔 Real-time Features

- Live message updates via Supabase Realtime
- Toast notifications for new messages
- Pulsing badge indicators
- Header alert banners
- Auto-scroll in chat

## 🚀 Deployment

### Supabase Setup
1. Create Supabase project
2. Run migrations
3. Deploy Edge Functions
4. Configure storage buckets

### Frontend Deployment
Compatible with Vercel, Netlify, GitHub Pages, AWS Amplify

## 📝 Recent Updates (Nov 2025)

- ✅ File attachment support for lawyers
- ✅ Case title display in messaging
- ✅ Fixed avatar upload
- ✅ Foreign key fixes (auth.users)
- ✅ Storage RLS policies
- ✅ Centered navigation
- ✅ Contact information update

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 👨‍💻 Developer

**Gaurang Dosar**
- 📧 Email: [dosargaurang@gmail.com](mailto:dosargaurang@gmail.com)
- 💼 LinkedIn: [linkedin.com/in/gaurangdosar](https://www.linkedin.com/in/gaurangdosar/)
- 🐙 GitHub: [github.com/GaurangDosar](https://github.com/GaurangDosar)

## 🙏 Acknowledgments

- **Supabase** - Backend infrastructure
- **Shadcn/ui** - UI components
- **Lucide Icons** - Icon library
- **Recharts** - Data visualization
- **TailwindCSS** - Styling framework

## 📚 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
├─────────────────────────────────────────────────────────────────┤
│  React 18 + TypeScript + Vite                                   │
│  ├─ UI: Radix UI + TailwindCSS + Shadcn/ui                     │
│  ├─ Routing: React Router DOM                                   │
│  ├─ State: React Query + Context API                            │
│  ├─ Forms: React Hook Form + Zod                                │
│  ├─ Charts: Recharts                                            │
│  └─ Maps: Google Maps API                                       │
└─────────────────────────────────────────────────────────────────┘
                              ▼ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE PLATFORM                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ PostgreSQL   │  │ Edge Funcs   │  │   Storage    │          │
│  │   Database   │  │    (Deno)    │  │   (Files)    │          │
│  │              │  │              │  │              │          │
│  │ • Tables     │  │ • AI Chat    │  │ • Avatars    │          │
│  │ • RLS        │  │ • Messages   │  │ • Docs       │          │
│  │ • Triggers   │  │ • Schemes    │  │ • RLS        │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │  Realtime    │  │     Auth     │                            │
│  │  (WebSocket) │  │    (JWT)     │                            │
│  │              │  │              │                            │
│  │ • Messages   │  │ • Signup     │                            │
│  │ • Cases      │  │ • Login      │                            │
│  │ • Presence   │  │ • Sessions   │                            │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                            │
├─────────────────────────────────────────────────────────────────┤
│  • OpenAI GPT-4 (AI Legal Assistant)                           │
│  • Google Gemini (Document Summarization)                       │
│  • Google Maps API (Location Services)                          │
│  • Spline 3D (Interactive Backgrounds)                          │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Roadmap

### Upcoming Features
- [ ] Payment integration
- [ ] Video call support
- [ ] Advanced document OCR
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] AI case outcome prediction
- [ ] Calendar integration
- [ ] Email notifications

## 📞 Support

- Open an issue on [GitHub](https://github.com/GaurangDosar/NyaAI/issues)
- Email: dosargaurang@gmail.com

## 📋 Quick Reference - Key Technologies

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Frontend** | React | 18.3.1 | UI Library |
| | TypeScript | 5.5.3 | Type Safety |
| | Vite | 5.4.1 | Build Tool |
| **Styling** | TailwindCSS | 3.4.11 | Utility CSS |
| | Radix UI | Various | UI Primitives |
| | Lucide React | 0.462.0 | Icons (1000+) |
| **Backend** | Supabase | 2.53.0 | BaaS Platform |
| | PostgreSQL | - | Database |
| | Deno | - | Edge Runtime |
| **State** | React Query | 5.56.2 | Server State |
| | Context API | - | Client State |
| **Forms** | React Hook Form | 7.53.0 | Form Management |
| | Zod | 3.23.8 | Validation |
| **Charts** | Recharts | 2.12.7 | Data Viz |
| **Maps** | Google Maps | 2.20.7 | Location Services |
| **Routing** | React Router | 6.26.2 | Navigation |
| **AI** | OpenAI GPT-4 | - | Chatbot |
| | Google Gemini | - | Doc Analysis |
| **PDF** | pdfjs-dist | 5.4.394 | PDF Parsing |
| | jsPDF | 3.0.3 | PDF Generation |
| **Real-time** | Supabase Realtime | - | WebSockets |
| **Auth** | Supabase Auth | - | JWT Auth |
| **Storage** | Supabase Storage | - | File Storage |

### **File Size Limits**
- Message Attachments: **10 MB**
- Avatar Images: Recommended **< 2 MB**

### **API Rate Limits**
- Supabase: Based on plan tier
- OpenAI: Token-based pricing
- Google Maps: Based on API quota

---

**Built with ❤️ using React, TypeScript, and Supabase**

*Making legal services accessible, affordable, and efficient for everyone.*


Author - @https://github.com/GaurangDosar
