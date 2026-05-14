# SyncGrid - Enterprise ERP Foundation

A premium, enterprise-grade SaaS foundation built with Next.js 16, React 19, and modern technologies. This is the complete foundational architecture for an agency ERP/Company Management System.

## 🎯 Project Overview

**Module 1: Foundation & Core Architecture** ✅

This is ONLY the foundation and core architecture. Future modules include:

- CRM Module
- Projects Module
- Tasks Module
- Finance Module
- HR Module
- Analytics Module

## 🏗️ Architecture Highlights

### Scalable & Modular

- **Feature-based organization** for easy scaling
- **Service layer** for API integration
- **Schema validation** with Zod
- **Type-safe** throughout the application

### Enterprise-Ready

- Dark/Light theme system
- Role-based navigation (ready for multi-role support)
- Global state management with Zustand
- Comprehensive error handling
- Performance optimized

### Developer Experience

- Type-safe with TypeScript-ready paths
- Centralized constants and config
- Reusable component library
- Custom hooks collection
- Best practices throughout

## 📦 Tech Stack

### Core

- **Next.js 16** - App Router with React 19
- **React 19** - Latest React version
- **JavaScript** - Clean, maintainable code
- **Tailwind CSS 4** - Utility-first styling

### State Management & Forms

- **Zustand** - Lightweight state management
- **React Hook Form** - Efficient form handling
- **Zod** - Runtime schema validation

### UI & Animation

- **shadcn/ui patterns** - Accessible components
- **Lucide React** - Icon library
- **Framer Motion** - Smooth animations
- **Sonner** - Toast notifications
- **next-themes** - Theme management

### Tooling

- **ESLint** - Code quality
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **TanStack Table** - Advanced data tables

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## 📁 Folder Structure

```
syncgrid/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Auth route group
│   ├── (dashboard)/       # Dashboard route group
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   └── layout.js          # Root layout
│
├── components/
│   ├── ui/                # Reusable UI components
│   ├── navigation/        # Header, Sidebar
│   ├── layouts/           # Layout wrappers
│   └── command-palette.tsx
│
├── store/                 # Zustand stores
├── hooks/                 # Custom React hooks
├── providers/             # Context providers
├── utils/                 # Utility functions
├── constants/             # App constants
├── config/                # Configuration
├── schemas/               # Zod schemas
├── services/              # API services
├── lib/                   # Library functions
├── types/                 # TypeScript types
├── features/              # Feature organization
└── middleware/            # Middleware
```

## 🎨 Design System

### Components Included

- **Button** - Multiple variants
- **Card** - Flexible containers
- **Input** - Form inputs
- **Textarea** - Multi-line input
- **Select** - Dropdown select
- **Checkbox** - Checkboxes
- **RadioGroup** - Radio buttons
- **Badge** - Status badges
- **Modal** - Dialog component
- **Drawer** - Side drawer
- **AlertDialog** - Confirmation dialog
- **Tabs** - Tab navigation
- **DataTable** - Advanced tables
- **Skeleton** - Loading skeleton
- **EmptyState** - Empty states
- **Breadcrumb** - Navigation
- **PageHeader** - Page titles
- **DropdownMenu** - Dropdowns
- **LoadingSpinner** - Loading indicators
- **ErrorBoundary** - Error handling

## ✨ Features

- ✅ Dark/Light theme with persistence
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Collapsible sidebar with animations
- ✅ Command palette (CMD+K)
- ✅ Global state management
- ✅ Form validation with Zod
- ✅ Type-safe routing
- ✅ API service layer
- ✅ Toast notifications
- ✅ Modal/drawer system
- ✅ Error boundaries
- ✅ Advanced data tables
- ✅ Loading skeletons
- ✅ Accessibility support

## 🔧 Configuration

### Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Tailwind Customization

Edit `tailwind.config.ts` to customize colors, spacing, and more.

## 📚 Documentation

For detailed guides, see the `docs/` folder (to be created):

- Architecture decisions
- Component API reference
- State management patterns
- API integration guide
- Deployment instructions

## 🚀 Development Workflow

1. Create feature in `features/` directory
2. Add Zod schema in `schemas/`
3. Create API service in `services/`
4. Build components in `components/`
5. Add to relevant routes in `app/`
6. Update constants as needed

## 📋 Next Steps

1. Set up authentication
2. Connect to backend API
3. Create business modules
4. Add tests
5. Deploy to production

## 📄 License

MIT License

---

Built with ❤️ for enterprise applications
