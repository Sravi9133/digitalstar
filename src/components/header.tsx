
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { LogOut, Loader2, Trophy, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { useState } from 'react';

export function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/admin/login');
  };

  const navLinks = (
    <>
        <Button variant="ghost" asChild onClick={() => setIsSheetOpen(false)}>
            <Link href="/#competitions">Competitions</Link>
        </Button>
        <Button variant="ghost" asChild onClick={() => setIsSheetOpen(false)}>
            <Link href="/winners">
                <Trophy className="mr-2 h-4 w-4" />
                Winners
            </Link>
        </Button>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between mx-auto px-4">
        <Logo />
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4">
            {navLinks}
            {loading ? (
                <div className="h-10 w-24" /> // Placeholder to prevent layout shift
            ) : user ? (
                <>
                <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>Dashboard</Button>
                <Button variant="ghost" onClick={handleLogout}>
                    Logout <LogOut className="ml-2 h-4 w-4"/>
                </Button>
                </>
            ) : (
                <div className="h-10 w-24" />
            )}
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Menu className="h-6 w-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent>
                    <div className="flex flex-col items-start space-y-4 pt-8">
                        {navLinks}
                        <div className="border-t w-full pt-4">
                        {loading ? (
                            <Loader2 className="animate-spin" />
                        ) : user ? (
                            <>
                            <Button variant="outline" className="w-full mb-2" onClick={() => {router.push('/admin/dashboard'); setIsSheetOpen(false)}}>Dashboard</Button>
                            <Button variant="ghost" className="w-full" onClick={() => {handleLogout(); setIsSheetOpen(false)}}>
                                Logout <LogOut className="ml-2 h-4 w-4"/>
                            </Button>
                            </>
                        ) : (
                           <p className="text-sm text-muted-foreground text-center">Login via the Admin page.</p>
                        )}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
      </div>
    </header>
  );
}
