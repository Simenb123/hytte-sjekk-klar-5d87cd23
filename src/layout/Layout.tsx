import React from 'react';
import Header from '@/components/layout/Header';

export type LayoutProps = React.ComponentProps<typeof Header> & {
  children: React.ReactNode;
  actionBar?: React.ReactNode;
};

export default function Layout({
  children,
  actionBar,
  showBackButton = true,
  ...headerProps
}: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header {...headerProps} showBackButton={showBackButton} />
      {actionBar && (
        <div className="bg-muted border-b">
          <div className="w-full flex items-center gap-2 px-4 py-2">
            {actionBar}
          </div>
        </div>
      )}
      <main className="flex-1 pt-[var(--header-h)]">{children}</main>
    </div>
  );
}
