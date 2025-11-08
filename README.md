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
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: TailwindCSS + Shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth with Row Level Security (RLS)
- **Storage**: Supabase Storage for file uploads
- **Real-time**: Supabase Realtime for instant message updates
- **Charts**: Recharts for data visualization

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

## 📚 Documentation

- [Messaging Workflow](./MESSAGING_WORKFLOW_UPDATE.md)
- [Lawyer Messaging Implementation](./LAWYER_MESSAGING_IMPLEMENTATION_SUMMARY.md)
- [File Attachments](./LAWYER_FILE_ATTACHMENTS_COMPLETE.md)
- [Migration Guide](./RUN_LAWYER_MESSAGING_MIGRATIONS.md)

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

---

**Built with ❤️ using React, TypeScript, and Supabase**

*Making legal services accessible, affordable, and efficient for everyone.*


Author - @https://github.com/GaurangDosar