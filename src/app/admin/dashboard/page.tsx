
"use client";

import type { Submission } from "@/types";
import { DashboardClient } from "./dashboard-client";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

// Dummy data for submissions
const submissions: Submission[] = [
  {
    id: "sub-001",
    name: "Alice Johnson",
    email: "alice.j@example.com",
    phone: "111-222-3333",
    university: "Tech University",
    competitionId: "codeclash-2024",
    competitionName: "CodeClash 2024",
    fileName: "solution.pdf",
    submittedAt: new Date("2024-11-20T10:00:00Z"),
  },
  {
    id: "sub-002",
    name: "Bob Smith",
    email: "bob.s@example.com",
    phone: "222-333-4444",
    university: "Design Institute",
    competitionId: "designminds-challenge",
    competitionName: "DesignMinds Challenge",
    fileName: "design_mockup.png",
    submittedAt: new Date("2024-11-15T14:30:00Z"),
  },
  {
    id: "sub-003",
    name: "Charlie Brown",
    email: "charlie.b@example.com",
    phone: "333-444-5555",
    university: "Business School",
    competitionId: "startup-pitchfest",
    competitionName: "Startup PitchFest",
    fileName: "pitch_deck.pdf",
    submittedAt: new Date("2024-12-01T09:00:00Z"),
  },
    {
    id: "sub-004",
    name: "Diana Prince",
    email: "diana.p@example.com",
    phone: "444-555-6666",
    university: "Tech University",
    competitionId: "codeclash-2024",
    competitionName: "CodeClash 2024",
    fileName: "code_submission.zip",
    submittedAt: new Date("2024-11-22T11:00:00Z"),
  },
  {
    id: "sub-005",
    name: "Ethan Hunt",
    email: "ethan.h@example.com",
    phone: "555-666-7777",
    university: "Design Institute",
    competitionId: "designminds-challenge",
    competitionName: "DesignMinds Challenge",
    fileName: "app_prototype.jpg",
    submittedAt: new Date("2024-11-18T18:00:00Z"),
  },
];

const competitionIds = ["codeclash-2024", "designminds-challenge", "startup-pitchfest"];

function DashboardPageContent() {
    const router = useRouter();

  // In a real app, you would fetch this data from a database.
  const stats = {
    totalSubmissions: submissions.length,
    submissionsPerCompetition: competitionIds.map(id => {
        const comp = submissions.find(s => s.competitionId === id)
        return {
            id: id,
            name: comp?.competitionName || id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            count: submissions.filter(s => s.competitionId === id).length
        }
    })
  };

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/admin/login');
  };

  return (
    <>
    <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
            <Logo />
            <div className="flex flex-1 items-center justify-end space-x-4">
            <Button variant="ghost" onClick={handleLogout}>
                Logout <LogOut className="ml-2 h-4 w-4"/>
            </Button>
            </div>
        </div>
    </header>
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <DashboardClient submissions={submissions} stats={stats} />
    </main>
    </>
  );
}

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (!user) {
        router.replace("/admin/login");
        return null;
    }

    return <DashboardPageContent />;
}
