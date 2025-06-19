
"use client";

import Link from 'next/link';
import SiteLogo from '@/components/SiteLogo';
import { Button } from '@/components/ui/button';
import { History, Home, User } from 'lucide-react';
// import { useRouter } from 'next/navigation'; // Not used
import { auth } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';

const AppHeader = () => {
  // const router = useRouter(); // Not currently used in this component
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoadingAuth(false);
    });
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  // isLoggedIn now reflects the actual Firebase auth state.
  // For a guest, currentUser will be null, so isLoggedIn will be false after loading.
  // The "Login" button will appear in the header for guests or if truly logged out.
  const isLoggedIn = !loadingAuth && !!currentUser;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/home" className="flex items-center space-x-2" aria-label="Go to homepage">
          <SiteLogo size="small" />
        </Link>

        <nav className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
          <Button variant="ghost" asChild className="rounded-2xl hover:bg-primary/10 font-body">
            <Link href="/home">
              <Home className="mr-0 md:mr-2 h-5 w-5" />
              <span className="hidden md:inline">Home</span>
            </Link>
          </Button>
          <Button variant="ghost" asChild className="rounded-2xl hover:bg-primary/10 font-body">
            <Link href="/history">
              <History className="mr-0 md:mr-2 h-5 w-5" />
              <span className="hidden md:inline">History</span>
            </Link>
          </Button>
          <Button variant="ghost" asChild className="rounded-2xl hover:bg-primary/10 font-body">
            <Link href="/profile">
              <User className="mr-0 md:mr-2 h-5 w-5" />
              <span className="hidden md:inline">Profile</span>
            </Link>
          </Button>

          {/* Show Login button if auth is loaded and no Firebase user is signed in */}
          {!loadingAuth && !currentUser && (
            <Button asChild className="btn-pulse-hover rounded-2xl font-body">
              <Link href="/login">Login</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default AppHeader;
