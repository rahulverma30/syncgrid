# SyncGrid - Enterprise ERP Foundation

> A premium, production-ready enterprise SaaS foundation built with **Next.js 16**, **React 19**, **Tailwind CSS**, and modern technologies.

🎯 **Module 1: Foundation & Core Architecture** - Complete, scalable foundation for enterprise applications.

![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black)
![React](https://img.shields.io/badge/React-19.2.4-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### 🏗️ Architecture

- ✅ **Scalable folder structure** organized by features
- ✅ **Type-safe** throughout with TypeScript paths
- ✅ **Global state management** with Zustand
- ✅ **Service layer** for API integration
- ✅ **Validation schemas** with Zod
- ✅ **Error boundaries** and error handling
- ✅ **Performance optimized** with code splitting

### 🎨 UI & Design

- ✅ **20+ reusable components** (buttons, cards, modals, tables, etc.)
- ✅ **Dark/Light theme** with persistence
- ✅ **Responsive design** (mobile, tablet, desktop)
- ✅ **Smooth animations** with Framer Motion
- ✅ **Premium styling** inspired by Linear, Vercel, Stripe
- ✅ **Accessibility support** with ARIA labels

### 🧭 Navigation & UX

- ✅ **Collapsible sidebar** with animations
- ✅ **Header/navbar** with theme toggle
- ✅ **Command palette** (CMD+K)
- ✅ **Breadcrumb navigation**
- ✅ **Toast notifications** with Sonner
- ✅ **Modal system** for dialogs

### 💡 Developer Experience

- ✅ **Custom hooks** collection
- ✅ **Prettier formatting**
- ✅ **ESLint configuration**
- ✅ **Path aliases** for clean imports
- ✅ **Comprehensive documentation**

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build & Deploy

```bash
npm run build
npm start
```

## 📦 Tech Stack

| Category          | Technology                       |
| ----------------- | -------------------------------- |
| **Framework**     | Next.js 16, React 19             |
| **Styling**       | Tailwind CSS 4, Framer Motion    |
| **State**         | Zustand                          |
| **Forms**         | React Hook Form, Zod             |
| **UI**            | shadcn/ui patterns, Lucide Icons |
| **Notifications** | Sonner                           |
| **Tables**        | TanStack React Table             |
| **Theming**       | next-themes                      |
| **Tooling**       | ESLint, Prettier, Husky          |

## 📁 Project Structure

```
syncgrid/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes
│   ├── (dashboard)/       # Dashboard routes
│   ├── api/               # API routes
│   ├── layout.js          # Root layout
│   ├── page.js            # Home page
│   └── globals.css        # Global styles
│
├── components/
│   ├── ui/                # 20+ UI components
│   ├── navigation/        # Header, Sidebar
│   ├── layouts/           # Layout wrappers
│   └── command-palette.tsx
│
├── store/                 # Zustand stores (6)
├── hooks/                 # Custom hooks (5)
├── providers/             # Context providers
├── utils/                 # Utility functions
├── constants/             # App constants
├── config/                # Configuration
├── schemas/               # Zod schemas
├── services/              # API services
├── lib/                   # Library functions
├── types/                 # Type definitions
├── features/              # Feature organization
├── middleware/            # Middleware
└── styles/                # Additional styles
```

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Installation & setup instructions
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture overview
- **Components Guide** - Component API reference (in components/ui/)

## 🎯 Available Components

### Forms & Inputs

```jsx
<Input label="Name" placeholder="..." />
<Textarea label="Message" />
<Select options={items} />
<Checkbox label="Agree" />
<RadioGroup options={items} />
```

### Containers

```jsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

### Tables & Lists

```jsx
<DataTable columns={columns} data={data} />
<Tabs tabs={tabItems} />
<Breadcrumb items={items} />
```

### Dialogs & Overlays

```jsx
<Modal isOpen={open} onClose={close}>Content</Modal>
<Drawer isOpen={open} onClose={close}>Content</Drawer>
<AlertDialog isOpen={open} onConfirm={handleConfirm} />
```

### Utilities

```jsx
<Button variant="primary">Button</Button>
<Badge variant="success">Success</Badge>
<LoadingSpinner />
<EmptyState title="No data" />
<ErrorBoundary>Component</ErrorBoundary>
```

## 🎨 Customization

### Colors

Edit `app/globals.css`:

```css
:root {
  --primary: 0 0% 9%;
  --secondary: 0 0% 96.1%;
}
```

### Tailwind

Edit `tailwind.config.ts` to extend theme

### Routes

Edit `constants/navigation.ts` for sidebar

### API

Update `config/app.ts` for API configuration

## 📝 Usage Examples

### Form with Validation

```jsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema } from '@/schemas';

export function ContactForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(contactSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('email')} error={errors.email?.message} />
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

### Using Hooks

```jsx
'use client';
import { useDebounce, useMediaQuery } from '@/hooks';

export function SearchComponent() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const isMobile = useMediaQuery('(max-width: 768px)');

  return <div>{isMobile ? 'Mobile' : 'Desktop'}</div>;
}
```

### State Management

```jsx
'use client';
import { useSidebarStore } from '@/store';

export function Navbar() {
  const { isCollapsed, toggleCollapse } = useSidebarStore();
  return <button onClick={toggleCollapse}>Toggle</button>;
}
```

## 🔄 Future Modules

This is the foundation. Future modules:

- 🔜 **CRM Module** - Contact & deal management
- 🔜 **Projects Module** - Project tracking
- 🔜 **Tasks Module** - Task management
- 🔜 **Finance Module** - Invoicing & expenses
- 🔜 **HR Module** - Employee management
- 🔜 **Analytics Module** - Reporting & dashboards

## ✅ What's Included

### Architecture (14/14)

- ✅ Folder structure
- ✅ Path aliases
- ✅ Configuration system
- ✅ Constants management
- ✅ Routes organization
- ✅ Type definitions
- ✅ Service layer
- ✅ Schema validation
- ✅ Feature organization
- ✅ Middleware setup
- ✅ Global styles
- ✅ Theme configuration
- ✅ Error handling
- ✅ Best practices

### Components (21/21)

- ✅ Button (5 variants)
- ✅ Card (header, title, content, footer)
- ✅ Input with validation
- ✅ Textarea
- ✅ Select dropdown
- ✅ Checkbox
- ✅ RadioGroup
- ✅ Badge (5 variants)
- ✅ Modal/Dialog
- ✅ Drawer/Sheet
- ✅ AlertDialog
- ✅ Tabs
- ✅ DataTable (with sorting, filtering, pagination)
- ✅ Skeleton loader
- ✅ EmptyState
- ✅ Breadcrumb
- ✅ PageHeader
- ✅ DropdownMenu
- ✅ LoadingSpinner
- ✅ ErrorBoundary
- ✅ Command Palette

### Features (8/8)

- ✅ Dark/Light theme
- ✅ Responsive design
- ✅ Sidebar navigation
- ✅ Header/Navbar
- ✅ Animations
- ✅ State management
- ✅ Form handling
- ✅ Toast notifications

### Stores (6/6)

- ✅ Sidebar store
- ✅ Theme store
- ✅ Modal store
- ✅ Notification store
- ✅ Command palette store
- ✅ UI store

### Hooks (5/5)

- ✅ useMounted
- ✅ useMediaQuery
- ✅ useDebounce
- ✅ useOutsideClick
- ✅ useLocalStorage

## 📊 Statistics

- **20+ UI Components** ready to use
- **6 Zustand Stores** for state management
- **5 Custom Hooks** for common patterns
- **4 Layout Systems** for different contexts
- **100% TypeScript-ready** with path aliases
- **Zero Build Warnings** ESLint configured

## 🚀 Performance

- ✅ Code splitting with Next.js
- ✅ Lazy loading of components
- ✅ Image optimization
- ✅ CSS optimization with Tailwind
- ✅ Minimal bundle size
- ✅ Server-side rendering ready

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## 📄 License

MIT License - Feel free to use for personal or commercial projects

## 🤝 Contributing

This is a foundation template. Extend it for your specific needs while maintaining the architectural patterns.

## 📞 Support

For questions or issues:

1. Check the documentation
2. Examine the component source code

## 🎉 Getting Started

1. [Install dependencies](./SETUP.md)
2. [Review documentation](./ARCHITECTURE.md)
3. [Explore components](./components/ui/)
4. Start building your features!

---

**Built with ❤️ for enterprise SaaS applications**

_Last Updated: 2024 | Next.js 16 | React 19_
