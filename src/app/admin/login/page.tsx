
"use client";

import { useEffect } from "react";
import { LoginForm } from "./login-form";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Header } from "@/components/header";

export default function LoginPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.replace("/admin/dashboard");
        }
    }, [user, loading, router]);


    if (loading || user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <LoginForm />
      </main>
    </div>
    );
}
