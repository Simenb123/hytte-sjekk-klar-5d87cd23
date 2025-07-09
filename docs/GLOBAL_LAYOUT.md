# Global Layout with Sticky Header

This project uses a shared `Layout` component to ensure that the header always stays visible at the top of the page. All pages should be wrapped in this component.

```tsx
// src/layout/Layout.tsx
import { Header } from '@/components/Header';

export const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    {/* Sticky header on top */}
    <Header />

    {/* Main content with padding equal to the header height */}
    <main className="page-content flex-1 overflow-y-auto [padding-top:var(--header-h)]">
      {children}
    </main>
  </div>
);
```

The header height is defined once using a CSS variable in `src/index.css`:

```css
:root {
  --header-h: 80px;
}

header.app-header {
  height: var(--header-h);
}
```

`Header` uses `sticky top-0` so content naturally flows underneath. Existing pages with manual `pt-*` spacing can remove those classes after wrapping with `Layout`.

Whenever the header height changes, update `--header-h` and the rest of the app will adjust automatically.
