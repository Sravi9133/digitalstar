import Link from "next/link";
import Image from "next/image";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <Image 
        src="/logo.png" 
        alt="DigitalStar LPU Logo" 
        width={32} 
        height={32} 
        className="h-8 w-8"
      />
      <span className="text-2xl font-bold font-headline text-foreground">
        DigitalStar LPU
      </span>
    </Link>
  );
}
