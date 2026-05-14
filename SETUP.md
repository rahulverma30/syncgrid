# Installation & Setup Guide

Complete step-by-step guide to set up and run SyncGrid.

## Prerequisites

- Node.js 18.17 or later
- npm, yarn, pnpm, or bun package manager
- Git

## Installation Steps

### 1. Clone the Repository

```bash
cd syncgrid
```

### 2. Install Dependencies

```bash
npm install
```

Or with your preferred package manager:

```bash
yarn install
pnpm install
bun install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Project Commands

### Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server
npm run lint        # Run ESLint
npm run format      # Format code with Prettier
```

## File Structure Quick Reference

```
📁 syncgrid/
├── 📂 app/                    # Next.js pages and layouts
├── 📂 components/             # React components
│   ├── ui/                   # Reusable UI components
│   ├── navigation/           # Navigation components
│   ├── layouts/              # Layout wrappers
│   └── examples/             # Example implementations
├── 📂 store/                 # Zustand state stores
├── 📂 hooks/                 # Custom React hooks
├── 📂 providers/             # Context & providers
├── 📂 utils/                 # Utility functions
├── 📂 constants/             # App constants
├── 📂 config/                # Configuration
├── 📂 schemas/               # Zod validation schemas
├── 📂 services/              # API services
├── 📂 lib/                   # Library utilities
├── 📂 types/                 # TypeScript definitions
├── 📂 features/              # Feature organization
├── tailwind.config.ts        # Tailwind configuration
├── jsconfig.json            # Path aliases
└── package.json             # Dependencies
```

## Available Components

### Core UI Components

- Button, Card, Badge, Input, Textarea
- Select, Checkbox, RadioGroup
- Modal, Drawer, AlertDialog
- Tabs, DataTable, Skeleton
- EmptyState, Breadcrumb, PageHeader
- DropdownMenu, LoadingSpinner
- ErrorBoundary

### Layout Components

- DashboardLayout
- AuthLayout

### Navigation Components

- Header
- Sidebar
- CommandPalette

## Available Hooks

- `useMounted()` - Check if component is mounted
- `useMediaQuery()` - Responsive media queries
- `useDebounce()` - Debounce values
- `useOutsideClick()` - Detect outside clicks
- `useLocalStorage()` - Persist state locally

## Available Stores

- `useSidebarStore` - Sidebar state
- `useThemeStore` - Theme management
- `useModalStore` - Modal management
- `useNotificationStore` - Notifications
- `useCommandPaletteStore` - Command palette
- `useUIStore` - General UI state

## Customization

### Colors & Theming

Edit `app/globals.css` to customize theme colors:

```css
:root {
  --primary: 0 0% 9%;
  --secondary: 0 0% 96.1%;
  /* ... more colors ... */
}
```

### Tailwind Configuration

Edit `tailwind.config.ts` to customize Tailwind:

```js
export default {
  theme: {
    extend: {
      colors: {
        // Custom colors
      },
    },
  },
};
```

### Routes & Navigation

Edit `constants/navigation.ts` to customize sidebar navigation:

```js
export const SIDEBAR_GROUPS = [
  {
    id: 'core',
    label: 'Core',
    items: [
      // Add your navigation items
    ],
  },
];
```

## First Steps with the Project

### 1. Explore the Dashboard

Visit [http://localhost:3000/dashboard](http://localhost:3000/dashboard) to see the main dashboard layout.

### 2. Try the Components

Browse `components/ui/` to see available components and their patterns.

### 3. Check the Examples

Look at `components/examples/` for working examples of forms, tables, and hooks.

### 4. Review the Structure

Understand the folder structure for organizing your features.

### 5. Start Building

Create your first feature following the established patterns.

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect to Vercel
3. Vercel will auto-detect Next.js
4. Click Deploy

### Other Platforms

```bash
npm run build
npm start
```

## Troubleshooting

### Styles not loading

- Clear `.next` folder: `rm -rf .next`
- Restart development server

### Port 3000 in use

```bash
npm run dev -- -p 3001
```

### Module not found errors

- Check path aliases in `jsconfig.json`
- Ensure imports use correct `@/` paths

## Next Steps

1. **Review Components**: Check `components/ui/` folder
2. **Understand State**: Review stores in `store/` folder
3. **Check Examples**: Look at example components
4. **Start Feature Development**: Create your first feature
5. **Connect API**: Update services in `services/` folder

## Support & Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Zustand](https://github.com/pmndrs/zustand)
- [Framer Motion](https://www.framer.com/motion/)

---

Happy coding! 🚀
