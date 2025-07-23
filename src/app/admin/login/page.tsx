
"use client";

import { LoginForm } from "./login-form";
import { Logo } from "@/components/logo";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (user) {
        router.replace("/admin/dashboard");
        return null;
    }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="mb-8">
        <Logo />
      </div>
      <LoginForm />
    </div>
  );
}
