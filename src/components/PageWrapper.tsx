
"use client";

import type { FC, ReactNode } from 'react';
import { useEffect } from 'react'; // Added useEffect
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

interface PageWrapperProps {
  children: ReactNode;
}

const PageWrapper: FC<PageWrapperProps> = ({ children }) => {
  const pathname = usePathname();

  useEffect(() => {
    let mediaQuery: MediaQueryList | undefined;
    const systemThemeListener = (e: MediaQueryListEvent) => {
      // Only apply system preference if 'system' is the chosen theme
      if (localStorage.getItem('theme') === 'system') {
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    const applyTheme = () => {
      const theme = localStorage.getItem('theme');
      
      // Clean up previous system listener if any
      if (mediaQuery) {
        mediaQuery.removeEventListener('change', systemThemeListener);
        mediaQuery = undefined; 
      }

      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else { // System or no theme set (defaults to system behavior)
        mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        if (mediaQuery.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        mediaQuery.addEventListener('change', systemThemeListener);
      }
    };

    applyTheme(); // Apply on initial load

    window.addEventListener('themeChanged', applyTheme);

    return () => {
      window.removeEventListener('themeChanged', applyTheme);
      if (mediaQuery) {
        mediaQuery.removeEventListener('change', systemThemeListener);
      }
    };
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex-grow flex flex-col w-full" 
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageWrapper;
