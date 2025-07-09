import React from 'react';
import Header from '@/components/Header';

export type LayoutProps = React.ComponentProps<typeof Header> & {
  children: React.ReactNode;
};

export default function Layout({ children, ...headerProps }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header {...headerProps} />
      <main className="flex-1 pt-[var(--header-h)]">{children}</main>
    </div>
  );
}
