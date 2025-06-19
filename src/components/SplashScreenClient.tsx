
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

// SVG for the rotating symbol
const RotatingSymbol = () => (
  <svg
    className="w-20 h-20 md:w-28 md:h-28 text-primary animate-spin my-6 md:my-8 drop-shadow-[0_0_12px_hsl(var(--primary)/0.7)]"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeOpacity="0.4" strokeWidth="3"/>
    <path d="M50 15 V 35 M50 65 V 85 M25 25 L40 40 M60 60 L75 75 M25 75 L40 60 M60 40 L75 25 M15 50 H 35 M65 50 H 85"
      stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
    <circle cx="50" cy="50" r="10" fill="currentColor" />
  </svg>
);

const SplashScreenClient = () => {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/login'); // PageWrapper will handle the fade-out
    }, 3000); // 3 seconds delay

    return () => clearTimeout(timer);
  }, [router]);

  return (
    // This div will be faded in by PageWrapper.
    // It's set to bg-transparent so the body's gradient from layout.tsx shows through.
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-transparent">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <h1 className="font-title text-7xl md:text-9xl font-bold text-foreground">
          VOS
        </h1>
        <p className="font-headline text-2xl md:text-4xl text-foreground mt-1 md:mt-2">
          Vault of Seekers
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.4, ease: "circOut" }}
      >
        <RotatingSymbol />
      </motion.div>
      
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.7, ease: "easeOut" }}
        className="font-body text-lg md:text-xl text-foreground"
      >
        All Paths. One Vault.
      </motion.p>
    </div>
  );
};

export default SplashScreenClient;
