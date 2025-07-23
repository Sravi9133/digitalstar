import Link from "next/link";
import Image from "next/image";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <Image 
        src="/logo.png" 
        alt="Digital Star LPU Logo" 
        width={32} 
        height={32} 
        className="h-8 w-8"
      />
      <span className="text-2xl font-bold font-headline text-foreground">
        Digital Star LPU
      </span>
    </Link>
  );
}
