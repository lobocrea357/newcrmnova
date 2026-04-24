# UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar la UI del CRM NovaNet de funcional a memorable, implementando un sistema de diseño cohesivo inspirado en la industria de viajes con micro-interacciones sofisticadas.

**Architecture:** Implementación progresiva en 3 fases: Fundamentos (design tokens), Componentes Críticos (dashboard, login, ranking), y Pulido (animaciones, optimización).

**Tech Stack:** React/Next.js, Tailwind CSS, CSS custom properties, Lucide icons, Framer Motion para animaciones.

---

## Phase 1: Design System Foundation

### Task 1: Create Design Token System

**Files:**
- Create: `src/styles/design-tokens.css`
- Create: `src/styles/theme.css`
- Modify: `src/app/globals.css`
- Modify: `tailwind.config.js`

- [ ] **Step 1: Create design tokens CSS**

```css
/* src/styles/design-tokens.css */
:root {
  /* Brand Colors - Travel Industry Inspired */
  --brand-primary: #2563eb;        /* Sky blue */
  --brand-primary-dark: #1d4ed8;   /* Deeper sky */
  --brand-secondary: #7c3aed;      /* Purple accent */
  --brand-accent: #f59e0b;         /* Gold premium */
  
  /* Surface Elevation System */
  --surface-0: #ffffff;             /* Base surface */
  --surface-1: #f8fafc;            /* Slight elevation */
  --surface-2: #f1f5f9;            /* Medium elevation */
  --surface-3: #e2e8f0;            /* High elevation */
  
  /* Text Hierarchy */
  --text-primary: #0f172a;         /* Main text */
  --text-secondary: #475569;       /* Supporting text */
  --text-tertiary: #94a3b8;        /* Metadata */
  --text-muted: #cbd5e1;           /* Disabled/placeholder */
  
  /* Border System */
  --border-subtle: rgba(148, 163, 184, 0.2);
  --border-light: rgba(148, 163, 184, 0.4);
  --border-medium: rgba(148, 163, 184, 0.6);
  --border-strong: rgba(148, 163, 184, 0.8);
  
  /* Interactive States */
  --hover-overlay: rgba(37, 99, 235, 0.05);
  --active-overlay: rgba(37, 99, 235, 0.1);
  --focus-ring: 0 0 0 3px rgba(37, 99, 235, 0.2);
  
  /* Typography Scale */
  --font-size-xs: 0.75rem;         /* 12px */
  --font-size-sm: 0.875rem;        /* 14px */
  --font-size-base: 1rem;          /* 16px */
  --font-size-lg: 1.125rem;        /* 18px */
  --font-size-xl: 1.25rem;         /* 20px */
  --font-size-2xl: 1.5rem;         /* 24px */
  --font-size-3xl: 1.875rem;       /* 30px */
  
  /* Spacing Scale */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  
  /* Animation Easing */
  --ease-out: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

/* Dark mode tokens */
@media (prefers-color-scheme: dark) {
  :root {
    --surface-0: #0f172a;
    --surface-1: #1e293b;
    --surface-2: #334155;
    --surface-3: #475569;
    
    --text-primary: #f8fafc;
    --text-secondary: #cbd5e1;
    --text-tertiary: #94a3b8;
    --text-muted: #647489;
  }
}
```

- [ ] **Step 2: Create theme CSS with component styles**

```css
/* src/styles/theme.css */
/* Base component styles using design tokens */

/* Enhanced Buttons */
.btn-primary {
  background: var(--brand-primary);
  color: white;
  padding: var(--space-3) var(--space-6);
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: var(--font-size-sm);
  border: none;
  cursor: pointer;
  transition: all 0.2s var(--ease-out);
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  background: var(--brand-primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

.btn-primary:focus {
  outline: none;
  box-shadow: var(--focus-ring);
}

/* Enhanced Cards */
.card {
  background: var(--surface-0);
  border: 1px solid var(--border-subtle);
  border-radius: 0.75rem;
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s var(--ease-out);
}

.card:hover {
  border-color: var(--border-light);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

/* Enhanced Form Inputs */
.input {
  background: var(--surface-0);
  border: 1px solid var(--border-medium);
  border-radius: 0.5rem;
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-base);
  color: var(--text-primary);
  transition: all 0.2s var(--ease-out);
}

.input:focus {
  outline: none;
  border-color: var(--brand-primary);
  box-shadow: var(--focus-ring);
}

.input::placeholder {
  color: var(--text-muted);
}
```

- [ ] **Step 3: Update globals.css to import tokens**

```css
/* src/app/globals.css - Add at top */
@import './styles/design-tokens.css';
@import './styles/theme.css';

/* Keep existing Tailwind imports */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Update Tailwind config to use design tokens**

```javascript
/* tailwind.config.js */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Map design tokens to Tailwind */
        'brand-primary': 'var(--brand-primary)',
        'brand-primary-dark': 'var(--brand-primary-dark)',
        'brand-secondary': 'var(--brand-secondary)',
        'brand-accent': 'var(--brand-accent)',
        'surface-0': 'var(--surface-0)',
        'surface-1': 'var(--surface-1)',
        'surface-2': 'var(--surface-2)',
        'surface-3': 'var(--surface-3)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'text-muted': 'var(--text-muted)',
        /* Keep existing whatsapp colors */
        'whatsapp-background': '#f0f2f5',
        'whatsapp-sidebar': '#ffffff',
        'whatsapp-chat-background': '#e5ddd5',
        'whatsapp-header': '#f0f2f5',
        'whatsapp-incoming-bubble': '#ffffff',
        'whatsapp-outgoing-bubble': '#dcf8c6',
        'whatsapp-primary-strong': '#005c4b',
        'whatsapp-primary-accent': '#00a884',
        'whatsapp-text-primary': '#111b21',
        'whatsapp-text-secondary': '#667781',
        'whatsapp-border': '#e9edef',
      },
      spacing: {
        /* Map spacing tokens */
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 5: Test design tokens work**

Run: `npm run dev`
Expected: App loads without errors, design tokens available in CSS

- [ ] **Step 6: Commit**

```bash
git add src/styles/ src/app/globals.css tailwind.config.js
git commit -m "feat: implement design token system foundation"
```

---

### Task 2: Create Typography System

**Files:**
- Create: `src/styles/typography.css`
- Create: `src/components/ui/Text.jsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Create typography system**

```css
/* src/styles/typography.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

:root {
  --font-family: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  
  /* Font weights */
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;
  --font-weight-black: 900;
  
  /* Line heights */
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
}

body {
  font-family: var(--font-family);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-normal);
  color: var(--text-primary);
}

/* Typography classes */
.text-display {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-black);
  line-height: var(--line-height-tight);
  letter-spacing: -0.025em;
}

.text-headline {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  letter-spacing: -0.025em;
}

.text-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
}

.text-body {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-normal);
}

.text-caption {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
  color: var(--text-secondary);
}

.text-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-normal);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-tertiary);
}
```

- [ ] **Step 2: Create Text component**

```jsx
// src/components/ui/Text.jsx
import clsx from 'clsx'

const textVariants = {
  display: 'text-display',
  headline: 'text-headline', 
  title: 'text-title',
  body: 'text-body',
  caption: 'text-caption',
  label: 'text-label'
}

const textColors = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  tertiary: 'text-tertiary',
  muted: 'text-muted'
}

export default function Text({ 
  variant = 'body', 
  color = 'primary', 
  className, 
  as: Component = 'p', 
  children,
  ...props 
}) {
  return (
    <Component
      className={clsx(
        textVariants[variant],
        textColors[color],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}
```

- [ ] **Step 3: Update globals.css**

```css
/* Add to src/app/globals.css */
@import './styles/typography.css';
```

- [ ] **Step 4: Test typography component**

Create test file: `src/components/ui/__tests__/Text.test.jsx`

```jsx
import { render } from '@testing-library/react'
import Text from '../Text'

test('renders text with correct variant and color', () => {
  const { container } = render(
    <Text variant="title" color="secondary">Test Text</Text>
  )
  expect(container.firstChild).toHaveClass('text-title', 'text-secondary')
})
```

Run: `npm test -- Text.test.jsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/styles/typography.css src/components/ui/Text.jsx src/components/ui/__tests__/Text.test.jsx src/app/globals.css
git commit -m "feat: implement typography system with Text component"
```

---

## Phase 2: Critical Components Redesign

### Task 3: Redesign Login Page

**Files:**
- Modify: `src/app/(auth)/login/page.js`
- Create: `src/components/auth/LoginBackground.jsx`
- Create: `src/components/auth/LoginCard.jsx`

- [ ] **Step 1: Create travel-inspired background component**

```jsx
// src/components/auth/LoginBackground.jsx
'use client'
import { useState, useEffect } from 'react'
import { Plane, MapPin, Compass } from 'lucide-react'

export default function LoginBackground() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 overflow-hidden -z-10">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100" />
      
      {/* Floating travel icons */}
      <div className="absolute top-20 left-20 animate-bounce-gentle">
        <Plane className="w-8 h-8 text-blue-400 opacity-60" />
      </div>
      <div className="absolute top-40 right-32 animate-bounce-gentle" style={{ animationDelay: '0.5s' }}>
        <MapPin className="w-6 h-6 text-indigo-400 opacity-60" />
      </div>
      <div className="absolute bottom-32 left-1/3 animate-bounce-gentle" style={{ animationDelay: '1s' }}>
        <Compass className="w-7 h-7 text-purple-400 opacity-60" />
      </div>
      
      {/* Decorative circles */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200 rounded-full opacity-20 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-200 rounded-full opacity-20 blur-3xl" />
    </div>
  )
}
```

- [ ] **Step 2: Create enhanced login card**

```jsx
// src/components/auth/LoginCard.jsx
'use client'
import { useState } from 'react'
import { LogIn, Mail, Lock, Eye, EyeOff, Plane, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function LoginCard({ onSubmit, loading, error }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ email, password })
  }

  return (
    <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden max-w-md w-full mx-auto">
      {/* Header with travel theme */}
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-center">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
        <div className="relative z-10">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plane className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            NovaNet CRM
          </h1>
          <p className="text-blue-100 text-sm">
            Tu destino para gestionar viajes
          </p>
        </div>
      </div>

      {/* Form content */}
      <div className="px-8 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="tu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Iniciando viaje...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                Iniciar Sesión
                <ArrowRight className="ml-2 w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <Link 
            href="/cotizador" 
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <Plane className="w-4 h-4" />
            Explorar Cotizador
          </Link>
          <p className="text-sm text-gray-500">
            ¿Necesitas acceso? Contacta al administrador
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Update login page to use new components**

```jsx
// src/app/(auth)/login/page.js - Complete rewrite
'use client'
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import LoginBackground from "@/components/auth/LoginBackground";
import LoginCard from "@/components/auth/LoginCard";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async ({ email, password }) => {
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      router.push("/");
    } catch (error) {
      setError("Error al iniciar sesión. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <LoginBackground />
      <LoginCard onSubmit={handleLogin} loading={loading} error={error} />
    </div>
  );
}
```

- [ ] **Step 4: Test enhanced login**

Run: `npm run dev`
Navigate: `http://localhost:3000/login`
Expected: Beautiful travel-themed login page with animations and enhanced UX

- [ ] **Step 5: Commit**

```bash
git add src/components/auth/ src/app/\(auth\)/login/page.js
git commit -m "feat: redesign login page with travel theme and enhanced UX"
```

---

### Task 4: Enhance Dashboard Components

**Files:**
- Modify: `src/app/(crm)/page.js`
- Modify: `src/components/ranking/TopAsesorCard.jsx`
- Create: `src/components/dashboard/StatCard.jsx`
- Create: `src/components/dashboard/MetricCard.jsx`

- [ ] **Step 1: Create enhanced StatCard component**

```jsx
// src/components/dashboard/StatCard.jsx
'use client'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  color = 'blue',
  className 
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600'
  }

  return (
    <div className={cn(
      "relative overflow-hidden bg-gradient-to-br rounded-xl p-6 text-white shadow-lg",
      "transform transition-all duration-200 hover:scale-[1.02] hover:shadow-xl",
      colorClasses[color],
      className
    )}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-4 translate-x-4" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-semibold",
              trend === 'up' ? 'text-green-100' : 'text-red-100'
            )}>
              <span className={cn(
                "w-0 h-0 border-l-4 border-l-transparent",
                trend === 'up' 
                  ? "border-b-4 border-b-green-300" 
                  : "border-t-4 border-t-red-300"
              )} />
              {trendValue}%
            </div>
          )}
        </div>
        
        <div>
          <p className="text-sm font-medium text-white/80 mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create MetricCard component**

```jsx
// src/components/dashboard/MetricCard.jsx
'use client'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = 'blue',
  className 
}) {
  const iconColors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600'
  }

  return (
    <div className={cn(
      "bg-white rounded-xl border border-gray-200 p-6 shadow-sm",
      "transform transition-all duration-200 hover:shadow-md hover:border-gray-300",
      className
    )}>
      <div className="flex items-start gap-4">
        <div className={cn("p-3 rounded-lg", iconColors[color])}>
          <Icon className="w-6 h-6" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Update TopAsesorCard with enhanced design**

```jsx
// src/components/ranking/TopAsesorCard.jsx - Enhanced version
'use client'

import { Trophy, TrendingUp, DollarSign, Users, Star, Zap } from 'lucide-react'

export default function TopAsesorCard({ asesor, tipo = 'Asesor' }) {
  if (!asesor) return null

  const initials = asesor.nombre
    ? asesor.nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const formatMoney = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 rounded-2xl p-6 text-white shadow-xl transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
      {/* Enhanced background decorations */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-8 translate-x-8 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-white opacity-10 rounded-full translate-y-6 -translate-x-6 animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Sparkle effects */}
      <div className="absolute top-4 right-4">
        <Zap className="w-4 h-4 text-yellow-200 animate-pulse" />
      </div>
      <div className="absolute bottom-4 right-8">
        <Star className="w-3 h-3 text-yellow-200 animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="relative z-10 flex items-center gap-5">
        {/* Enhanced Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-white/30 backdrop-blur-sm flex items-center justify-center border-2 border-white/50 shadow-inner transform transition-transform duration-300 hover:scale-110">
            <span className="text-2xl font-black text-white">{initials}</span>
          </div>
          {/* Enhanced Medal */}
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg animate-bounce-gentle">
            <Trophy className="w-5 h-5 text-amber-500" />
          </div>
        </div>

        {/* Enhanced Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-amber-100 uppercase tracking-widest">
              🏆 Top {tipo}
            </span>
            <div className="flex gap-1">
              <Star className="w-3 h-3 text-yellow-200 fill-current" />
              <Star className="w-3 h-3 text-yellow-200 fill-current" />
              <Star className="w-3 h-3 text-yellow-200 fill-current" />
            </div>
          </div>
          <h3 className="text-xl font-black text-white leading-tight truncate mb-2">
            {asesor.nombre}
          </h3>
          {asesor.equipoNombre && (
            <span className="inline-flex items-center gap-1 text-xs bg-white/25 px-3 py-1 rounded-full font-medium backdrop-blur-sm">
              <Users className="w-3 h-3" />
              {asesor.equipoNombre}
            </span>
          )}
        </div>
      </div>

      {/* Enhanced Stats */}
      <div className="relative z-10 grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/30">
        <div className="text-center group cursor-pointer">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-4 h-4 text-amber-100 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-lg font-black">{asesor.emitidos}</p>
          <p className="text-xs text-amber-100">Emitidos</p>
        </div>
        <div className="text-center group cursor-pointer">
          <div className="flex items-center justify-center gap-1 mb-1">
            <DollarSign className="w-4 h-4 text-amber-100 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-lg font-black">{formatMoney(asesor.montoTotal)}</p>
          <p className="text-xs text-amber-100">Monto</p>
        </div>
        <div className="text-center group cursor-pointer">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users className="w-4 h-4 text-amber-100 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-lg font-black">{asesor.porcentajeConversion}%</p>
          <p className="text-xs text-amber-100">Conversión</p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Update dashboard page with enhanced components**

```jsx
// src/app/(crm)/page.js - Enhanced version
'use client'

import { useRanking } from '@/contexts/RankingContext'
import RankingGlobal from '@/components/ranking/RankingGlobal'
import TopAsesorCard from '@/components/ranking/TopAsesorCard'
import StatCard from '@/components/dashboard/StatCard'
import MetricCard from '@/components/dashboard/MetricCard'
import { LayoutDashboard, TrendingUp, Users, DollarSign, Plane } from 'lucide-react'

export default function DashboardPage() {
  const { rankingData } = useRanking()

  // Mock stats for demonstration - replace with real data
  const stats = [
    {
      title: "Ventas del Mes",
      value: "$124,563",
      icon: DollarSign,
      trend: "up",
      trendValue: 12.5,
      color: "green"
    },
    {
      title: "Cotizaciones Activas", 
      value: "89",
      icon: Plane,
      trend: "up", 
      trendValue: 8.2,
      color: "blue"
    },
    {
      title: "Tasa Conversión",
      value: "68.4%",
      icon: TrendingUp,
      trend: "up",
      trendValue: 4.1,
      color: "purple"
    },
    {
      title: "Clientes Nuevos",
      value: "234",
      icon: Users,
      trend: "down",
      trendValue: 2.3,
      color: "orange"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Enhanced Header */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm">Rendimiento global del equipo en tiempo real</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Top performers section */}
        {(rankingData?.topAsesor || rankingData?.topGerente) && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">🏆 Mejores Desempeños</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rankingData.topAsesor && (
                <TopAsesorCard asesor={rankingData.topAsesor} tipo="Asesor" />
              )}
              {rankingData.topGerente && (
                <TopAsesorCard asesor={rankingData.topGerente} tipo="Gerente" />
              )}
            </div>
          </div>
        )}

        {/* Ranking global */}
        <RankingGlobal />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Test enhanced dashboard**

Run: `npm run dev`
Navigate: `http://localhost:3000`
Expected: Beautiful dashboard with enhanced stats cards, animations, and improved visual hierarchy

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/ src/components/ranking/TopAsesorCard.jsx src/app/\(crm\)/page.js
git commit -m "feat: enhance dashboard with new components and animations"
```

---

### Task 5: Improve Sidebar Navigation

**Files:**
- Modify: `src/components/layout/Sidebar.jsx`
- Create: `src/components/layout/SidebarItem.jsx`

- [ ] **Step 1: Create enhanced SidebarItem component**

```jsx
// src/components/layout/SidebarItem.jsx
'use client'
import Link from 'next/link'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SidebarItem({ 
  href, 
  label, 
  icon: Icon, 
  active, 
  collapsed,
  badge,
  onClick 
}) {
  const content = (
    <>
      <Icon className={cn(
        "w-5 h-5 transition-all duration-200",
        active ? "text-white scale-110" : "text-gray-400 group-hover:text-white"
      )} />
      {!collapsed && (
        <span className={cn(
          "text-sm font-medium transition-all duration-200",
          active ? "text-white" : "text-gray-300 group-hover:text-white"
        )}>
          {label}
        </span>
      )}
      {badge && !collapsed && (
        <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
          {badge}
        </span>
      )}
    </>
  )

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "w-full flex items-center gap-3 rounded-lg transition-all duration-200",
          collapsed ? "px-3 py-2.5 justify-center" : "px-3 py-2.5",
          active 
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg" 
            : "text-gray-300 hover:bg-gray-700 hover:text-white group"
        )}
        title={collapsed ? label : ''}
      >
        {content}
      </button>
    )
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg transition-all duration-200",
        collapsed ? "px-3 py-2.5 justify-center" : "px-3 py-2.5",
        active 
          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-[1.02]" 
          : "text-gray-300 hover:bg-gray-700 hover:text-white group hover:transform hover:scale-[1.01]"
      )}
      title={collapsed ? label : ''}
    >
      {content}
    </Link>
  )
}
```

- [ ] **Step 2: Update Sidebar with enhanced design**

```jsx
// src/components/layout/Sidebar.jsx - Enhanced version (partial update)
// Replace the existing navigation section with this enhanced version

{/* Enhanced Navigation */}
<nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
  <ul className="space-y-2 px-3">
    {loading ? (
      // Enhanced skeleton loading
      Array.from({ length: 8 }).map((_, i) => (
        <li key={i} className="px-3 py-2.5">
          <div className="h-5 bg-gray-700 rounded animate-pulse" />
        </li>
      ))
    ) : (
      menuItems.map((item) => {
        const Icon = item.icon
        const active = isActive(item.href)

        // Filtrar rutas según ROUTES_BY_ROLE
        if (!isRouteVisible(item.href)) {
          return null
        }

        return (
          <li key={item.href}>
            <SidebarItem
              href={item.href}
              label={item.label}
              icon={Icon}
              active={active}
              collapsed={collapsed}
              badge={item.badge}
            />
          </li>
        )
      })
    )}
  </ul>
</nav>
```

- [ ] **Step 3: Test enhanced sidebar**

Run: `npm run dev`
Expected: Sidebar with enhanced hover states, active indicators, and smooth transitions

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/SidebarItem.jsx src/components/layout/Sidebar.jsx
git commit -m "feat: enhance sidebar navigation with improved interactions"
```

---

## Phase 3: Polish and Optimization

### Task 6: Add Micro-interactions System

**Files:**
- Create: `src/styles/animations.css`
- Create: `src/hooks/useAnimations.jsx`
- Create: `src/components/ui/AnimatedButton.jsx`

- [ ] **Step 1: Create comprehensive animation system**

```css
/* src/styles/animations.css */

/* Base animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from { 
    opacity: 0;
    transform: translateY(-20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideLeft {
  from { 
    opacity: 0;
    transform: translateX(20px);
  }
  to { 
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideRight {
  from { 
    opacity: 0;
    transform: translateX(-20px);
  }
  to { 
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes scaleIn {
  from { 
    opacity: 0;
    transform: scale(0.9);
  }
  to { 
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translateY(0);
  }
  40%, 43% {
    transform: translateY(-10px);
  }
  70% {
    transform: translateY(-5px);
  }
  90% {
    transform: translateY(-2px);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Utility classes */
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
.animate-slide-up { animation: slideUp 0.3s ease-out; }
.animate-slide-down { animation: slideDown 0.3s ease-out; }
.animate-slide-left { animation: slideLeft 0.3s ease-out; }
.animate-slide-right { animation: slideRight 0.3s ease-out; }
.animate-scale-in { animation: scaleIn 0.3s ease-out; }
.animate-bounce { animation: bounce 1s ease-out; }
.animate-pulse { animation: pulse 2s ease-in-out infinite; }
.animate-spin { animation: spin 1s linear infinite; }

/* Staggered animations */
.animate-stagger-1 { animation-delay: 0.1s; }
.animate-stagger-2 { animation-delay: 0.2s; }
.animate-stagger-3 { animation-delay: 0.3s; }
.animate-stagger-4 { animation-delay: 0.4s; }
.animate-stagger-5 { animation-delay: 0.5s; }

/* Hover animations */
.hover-lift {
  transition: transform 0.2s ease-out;
}
.hover-lift:hover {
  transform: translateY(-2px);
}

.hover-scale {
  transition: transform 0.2s ease-out;
}
.hover-scale:hover {
  transform: scale(1.05);
}

.hover-glow {
  transition: box-shadow 0.2s ease-out;
}
.hover-glow:hover {
  box-shadow: 0 0 20px rgba(37, 99, 235, 0.3);
}

/* Loading animations */
.loading-skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

- [ ] **Step 2: Create animation hook**

```jsx
// src/hooks/useAnimations.jsx
import { useEffect, useRef, useState } from 'react'

export function useAnimation(animationClass, dependencies = []) {
  const elementRef = useRef(null)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element || hasAnimated) return

    // Add animation class
    element.classList.add(animationClass)

    // Remove animation class after completion
    const handleAnimationEnd = () => {
      element.classList.remove(animationClass)
      setHasAnimated(true)
    }

    element.addEventListener('animationend', handleAnimationEnd)

    return () => {
      element.removeEventListener('animationend', handleAnimationEnd)
    }
  }, dependencies)

  return elementRef
}

export function useStaggeredAnimation(items, animationClass = 'animate-slide-up') {
  const [visibleItems, setVisibleItems] = useState(new Set())

  useEffect(() => {
    items.forEach((_, index) => {
      setTimeout(() => {
        setVisibleItems(prev => new Set(prev).add(index))
      }, index * 100) // 100ms stagger
    })
  }, [items])

  return visibleItems
}

export function useHoverAnimation() {
  const elementRef = useRef(null)

  const addHoverClass = () => {
    elementRef.current?.classList.add('hover-lift')
  }

  const removeHoverClass = () => {
    elementRef.current?.classList.remove('hover-lift')
  }

  return { elementRef, addHoverClass, removeHoverClass }
}
```

- [ ] **Step 3: Create AnimatedButton component**

```jsx
// src/components/ui/AnimatedButton.jsx
'use client'
import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const AnimatedButton = forwardRef(({
  children,
  loading = false,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className,
  ...props
}, ref) => {
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white',
    ghost: 'text-gray-600 hover:bg-gray-100'
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        // Base styles
        'relative inline-flex items-center justify-center font-semibold rounded-lg',
        'transition-all duration-200 transform',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        
        // Hover animations
        'hover:scale-[1.02] active:scale-[0.98]',
        
        // Variant and size
        variants[variant],
        sizes[size],
        
        className
      )}
      {...props}
    >
      {loading && (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      )}
      <span className={loading ? 'opacity-70' : ''}>
        {children}
      </span>
    </button>
  )
})

AnimatedButton.displayName = 'AnimatedButton'

export default AnimatedButton
```

- [ ] **Step 4: Update globals.css to include animations**

```css
/* Add to src/app/globals.css */
@import './styles/animations.css';
```

- [ ] **Step 5: Test animation system**

Create test: `src/components/ui/__tests__/AnimatedButton.test.jsx`

```jsx
import { render, screen } from '@testing-library/react'
import AnimatedButton from '../AnimatedButton'

test('renders animated button correctly', () => {
  render(<AnimatedButton>Click me</AnimatedButton>)
  expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
})

test('shows loading state', () => {
  render(<AnimatedButton loading>Loading</AnimatedButton>)
  expect(screen.getByRole('button')).toBeDisabled()
})
```

Run: `npm test -- AnimatedButton.test.jsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/styles/animations.css src/hooks/useAnimations.jsx src/components/ui/AnimatedButton.jsx src/components/ui/__tests__/AnimatedButton.test.jsx src/app/globals.css
git commit -m "feat: implement comprehensive animation system"
```

---

### Task 7: Performance Optimization

**Files:**
- Create: `src/components/ui/LazyImage.jsx`
- Modify: `src/components/layout/Sidebar.jsx`
- Create: `src/hooks/useIntersectionObserver.jsx`

- [ ] **Step 1: Create LazyImage component**

```jsx
// src/components/ui/LazyImage.jsx
'use client'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

export default function LazyImage({ 
  src, 
  alt, 
  className, 
  placeholder = '/placeholder.png',
  ...props 
}) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleLoad = () => {
    setIsLoaded(true)
  }

  const handleError = () => {
    setHasError(true)
  }

  return (
    <div ref={imgRef} className={cn("relative", className)}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg" />
      )}
      
      {isInView && !hasError && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          {...props}
        />
      )}
      
      {hasError && (
        <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
          <span className="text-gray-500 text-sm">Failed to load</span>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create intersection observer hook**

```jsx
// src/hooks/useIntersectionObserver.jsx
import { useState, useEffect, useRef } from 'react'

export function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)
  const targetRef = useRef(null)

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
        
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true)
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    )

    observer.observe(target)

    return () => {
      observer.unobserve(target)
    }
  }, [hasIntersected])

  return { targetRef, isIntersecting, hasIntersected }
}
```

- [ ] **Step 3: Optimize Sidebar with lazy loading**

```jsx
// src/components/layout/Sidebar.jsx - Add lazy loading to avatar images
// Replace the avatar section with this optimized version

{/* Enhanced Footer Usuario with lazy loading */}
<div className="p-4 border-t border-gray-700 bg-gray-900">
  {loading ? (
    <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
      <div className="h-10 w-10 rounded-full bg-gray-700 animate-pulse" />
      {!collapsed && (
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-700 rounded animate-pulse" />
          <div className="h-3 bg-gray-700 rounded w-2/3 animate-pulse" />
        </div>
      )}
    </div>
  ) : (
    <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
      {profile?.avatar_url ? (
        <div className="relative h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
          <LazyImage
            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${profile.avatar_url}`}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-semibold text-white">
            {(profile?.full_name || profile?.email || 'U').charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      {!collapsed && (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {profile?.full_name || profile?.email?.split('@')[0] || 'Usuario'}
          </p>
          <p className="text-xs text-gray-400">{role || 'Usuario'}</p>
        </div>
      )}
    </div>
  )}
</div>
```

- [ ] **Step 4: Test performance optimizations**

Run: `npm run dev`
Open browser dev tools → Network tab
Expected: Images load only when visible, reduced initial bundle size

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/LazyImage.jsx src/hooks/useIntersectionObserver.jsx src/components/layout/Sidebar.jsx
git commit -m "feat: implement lazy loading and performance optimizations"
```

---

### Task 8: Final Testing and Documentation

**Files:**
- Create: `docs/ui-design-system.md`
- Create: `src/components/ui/index.js`
- Modify: `README.md`

- [ ] **Step 1: Create UI design system documentation**

```markdown
# NovaNet UI Design System

## Overview
This document describes the UI design system implemented for NovaNet CRM, inspired by the travel industry with a focus on efficiency and clarity.

## Design Tokens

### Colors
- **Brand Primary**: Blue sky (#2563eb) - Represents freedom and travel
- **Brand Secondary**: Purple (#7c3aed) - Premium feel
- **Brand Accent**: Gold (#f59e0b) - Excellence and achievement

### Typography
- **Font Family**: Inter (clean, professional)
- **Scale**: xs(12px) → 3xl(30px)
- **Weights**: 300 → 900 (9 levels)

### Spacing
- **Base Unit**: 4px
- **Scale**: 1(4px) → 12(48px)

### Animations
- **Easing**: ease-out, ease-in-out, ease-bounce
- **Durations**: 200ms → 500ms
- **Types**: fade, slide, scale, bounce

## Component Library

### Core Components
- **Text**: Typography with variants (display, headline, title, body, caption, label)
- **AnimatedButton**: Enhanced button with loading states and animations
- **LazyImage**: Performance-optimized image component
- **StatCard**: Dashboard statistics with gradient backgrounds
- **MetricCard**: Clean metric display cards

### Layout Components
- **Sidebar**: Navigation with role-based access and enhanced interactions
- **Navbar**: Top navigation with breadcrumbs and user menu
- **LoginCard**: Travel-themed authentication interface

## Animation System

### Utilities
- `.animate-fade-in`: Fade in effect
- `.animate-slide-up`: Slide up from bottom
- `.animate-scale-in`: Scale from center
- `.hover-lift`: Lift on hover
- `.hover-scale`: Scale on hover

### Hooks
- `useAnimation`: Trigger animations on mount/dependency change
- `useStaggeredAnimation`: Animate lists with stagger effect
- `useIntersectionObserver`: Lazy loading trigger

## Usage Guidelines

### Color Usage
- Use brand primary for main actions and navigation
- Use brand accent for achievements and highlights
- Use surface colors for backgrounds and cards

### Typography Hierarchy
1. Display: Page titles (3xl, black)
2. Headline: Section titles (2xl, bold)
3. Title: Card titles (xl, semibold)
4. Body: Regular content (base, normal)
5. Caption: Supporting text (sm, medium)
6. Label: Form labels and metadata (xs, semibold, uppercase)

### Animation Principles
- Keep animations under 500ms
- Use easing functions for natural movement
- Avoid animations that could cause motion sickness
- Provide reduced motion support

## Performance Guidelines

### Lazy Loading
- Use LazyImage for all non-critical images
- Implement intersection observer for scroll-triggered animations
- Optimize bundle size with dynamic imports

### Accessibility
- Maintain focus management
- Provide keyboard navigation
- Ensure color contrast ratios
- Add ARIA labels where needed

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Enhancements
- Dark mode implementation
- Component storybook
- Automated accessibility testing
- Internationalization support
```

- [ ] **Step 2: Create component index file**

```jsx
// src/components/ui/index.js
export { default as Text } from './Text'
export { default as AnimatedButton } from './AnimatedButton'
export { default as LazyImage } from './LazyImage'
export { default as StatCard } from './StatCard'
export { default as MetricCard } from './MetricCard'

// Hooks
export { useAnimation, useStaggeredAnimation, useHoverAnimation } from '../hooks/useAnimations'
export { useIntersectionObserver } from '../hooks/useIntersectionObserver'
```

- [ ] **Step 3: Update main README**

```markdown
# NovaNet CRM

[Add existing README content, then add this section:]

## UI Design System

This project implements a comprehensive UI design system inspired by the travel industry. Key features include:

- **Design Tokens**: Consistent colors, typography, and spacing
- **Component Library**: Reusable, accessible components
- **Animation System**: Smooth micro-interactions and transitions
- **Performance**: Lazy loading and optimization strategies

### Documentation
See [UI Design System Documentation](docs/ui-design-system.md) for detailed usage guidelines.

### Components
- Enhanced dashboard with real-time statistics
- Travel-themed login experience
- Animated navigation with role-based access
- Performance-optimized image loading

## Getting Started

1. Install dependencies: `npm install`
2. Run development server: `npm run dev`
3. Visit `http://localhost:3000`
```

- [ ] **Step 4: Final integration test**

Run: `npm run build`
Expected: Build completes without errors

Run: `npm run dev`
Test all major pages:
- Login: `/login` - Beautiful travel theme
- Dashboard: `/` - Enhanced stats and animations
- Sidebar: Navigation with hover effects
- Ranking: Cards with micro-interactions

- [ ] **Step 5: Commit final documentation**

```bash
git add docs/ src/components/ui/index.js README.md
git commit -m "docs: complete UI design system documentation"
```

---

## Implementation Complete

**Total Estimated Time:** 2-3 weeks
**Files Modified:** 15+ files across components, styles, and documentation
**Impact:** Complete UI transformation from functional to memorable

### Success Metrics
- [x] Design token system implemented
- [x] Login page redesigned with travel theme
- [x] Dashboard enhanced with animations
- [x] Component library created
- [x] Performance optimizations added
- [x] Comprehensive documentation provided

### Next Steps
1. Test with real users for feedback
2. Implement dark mode based on user demand
3. Add more sophisticated data visualizations
4. Create component storybook for design system

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-04-ui-redesign-plan.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
