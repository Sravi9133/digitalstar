import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { RefTracker } from '@/components/ref-tracker';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Digital Star LPU',
  description: 'A modern platform for student competitions.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <Suspense fallback={null}>
          <RefTracker />
        </Suspense>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
