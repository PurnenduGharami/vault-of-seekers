
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase'; // Import Firebase auth
import { GoogleAuthProvider, signInWithPopup, type User } from 'firebase/auth'; // Import Firebase auth methods
import { useToast } from "@/hooks/use-toast";

// A simple inline SVG for the Google G logo
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12.0002 12.0002C12.0002 11.448 11.9542 10.9023 11.8672 10.3711H6.1814V13.5111H9.44093C9.29293 14.3421 8.80843 15.0461 8.10143 15.5081V17.4761H10.1144C11.3164 16.4171 12.0002 14.8621 12.0002 13.0971C12.0002 12.7531 11.9852 12.4021 11.9622 12.0591L12.0002 12.0002Z"
      fill="#34A853"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11.8668 10.3711C11.0008 7.91906 8.72478 6.18164 6.18138 6.18164C4.70338 6.18164 3.36938 6.81164 2.40538 7.79464L0.519531 6.01064C1.75653 4.86864 3.38153 4.00064 5.20253 3.53964C5.51953 3.44864 5.84953 3.38464 6.18138 3.33364C6.30438 3.31564 6.42838 3.30264 6.55238 3.29164L6.55285 3.2918C7.9682 3.15536 9.43015 3.41111 10.6979 4.02035C11.9656 4.6296 12.9744 5.5649 13.6128 6.70901L11.9998 7.93911C12.4918 7.26111 12.2768 6.61911 11.8668 6.01011L11.8668 10.3711Z"
      fill="#4A90E2"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.10103 15.5082C7.06603 14.8032 6.18103 14.1102 6.18103 13.0972C6.18103 12.4512 6.35503 11.8502 6.65503 11.3432L4.80803 9.59824C3.87303 10.6692 3.33303 12.0772 3.33303 13.5962C3.33303 15.1152 3.87303 16.5232 4.80803 17.5942L6.66103 15.8442C6.36303 16.3462 6.18103 16.9422 6.18103 17.5882C6.18103 18.1402 6.22703 18.6862 6.31403 19.2172L8.10103 15.5082Z"
      fill="#FBBC05"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.18143 20.6667C8.72443 20.6667 11.0004 18.9287 11.8674 16.4767L13.6128 17.7417C12.9743 18.8858 11.9655 19.8211 10.6978 20.4303C9.43008 21.0396 7.96813 21.2953 6.55268 21.1589L6.18143 21.1117C4.36043 21.0607 2.58743 20.3347 1.20143 19.0737L2.96843 17.4457C3.90043 18.2597 5.08343 18.7407 6.18143 18.7407C7.28043 18.7407 8.25343 18.3217 8.94543 17.6567L8.10143 15.5087C7.51843 15.8897 6.86043 16.1227 6.18143 16.1227C6.07443 16.1227 5.96743 16.1147 5.86243 16.0997L6.18143 20.6667Z"
      fill="#EA4335"
    />
  </svg>
);

export default function AuthForm() {
  const router = useRouter();
  const { toast } = useToast();

  async function handleGoogleSignIn() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user: User = result.user;
      // You can access user details via user.displayName, user.email, etc.
      console.log("Signed in user:", user.displayName);
      toast({
        title: "Sign In Successful",
        description: `Welcome, ${user.displayName || 'Seeker'}!`,
      });
      router.push('/home');
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      let errorMessage = "An unknown error occurred during sign-in.";
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in popup was closed. Please try again.";
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = "Sign-in was cancelled. Please try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({
        title: "Sign In Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }

  return (
    <Card className="w-full max-w-md shadow-2xl bg-card/80 backdrop-blur-sm border-primary/20 rounded-2xl">
      <CardHeader className="text-center">
        <CardTitle className="font-headline text-3xl">Enter the Vault</CardTitle>
        <CardDescription className="text-muted-foreground font-body">Access your arcane knowledge.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <Button
          variant="outline"
          size="lg"
          className="w-full rounded-2xl font-body border-2 hover:border-primary focus-visible:border-primary text-foreground bg-background hover:bg-muted/30 transition-colors duration-300"
          onClick={handleGoogleSignIn}
        >
          <GoogleIcon />
          Sign in with Google
        </Button>

        <Button
          variant="secondary"
          size="lg"
          className="w-full rounded-2xl font-body hover:bg-secondary/80 transition-colors duration-300"
          asChild
        >
          <Link href="/home">
            Continue as Guest
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
