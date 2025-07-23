import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center mx-auto px-4">
        <div className="mr-auto flex">
          <Logo />
        </div>
        <div className="flex items-center justify-end space-x-2">
          <Button asChild variant="ghost">
            <Link href="/admin/login">Admin Login</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
