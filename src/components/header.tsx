
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { LogOut, Loader2 } from 'lucide-react';

export function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/admin/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between mx-auto px-4">
        <Logo />
        <div className="flex items-center space-x-4">
          {loading ? (
            <div className="h-10 w-24" /> // Placeholder to prevent layout shift
          ) : user ? (
            <>
              <Button variant="ghost" onClick={() => router.push('/admin/dashboard')}>Dashboard</Button>
              <Button variant="ghost" onClick={handleLogout}>
                Logout <LogOut className="ml-2 h-4 w-4"/>
              </Button>
            </>
          ) : (
            // The Admin Login button was here. It's now hidden for a cleaner public UI.
            // A placeholder is used to prevent layout shift while auth state loads.
             <div className="h-10 w-24" />
          )}
        </div>
      </div>
    </header>
  );
}
