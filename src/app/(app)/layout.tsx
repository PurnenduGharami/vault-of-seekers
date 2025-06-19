
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import AppHeader from '@/components/AppHeader';
import LoadingFallback from '@/components/LoadingFallback';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        <Suspense fallback={<LoadingFallback />}>
          {children}
        </Suspense>
      </main>
      <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border/40">
        Vault of Seekers &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
