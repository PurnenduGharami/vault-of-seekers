import type { Metadata } from 'next';
import './globals.css';
import PageWrapper from '@/components/PageWrapper';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'Vault of Seekers',
  description: 'All Paths. One Vault.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=EB+Garamond+SC:wght@400&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-gradient-to-br from-[hsl(var(--background))] to-[#1A1A40] min-h-screen flex flex-col">
        <PageWrapper>
          {children}
        </PageWrapper>
        <Toaster />
      </body>
    </html>
  );
}
