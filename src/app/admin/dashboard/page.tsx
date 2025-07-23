
"use client";

import type { Submission } from "@/types";
import { DashboardClient } from "./dashboard-client";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { auth, app } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, Timestamp } from "firebase/firestore";

const competitionDisplayNames: { [key: string]: string } = {
  "follow-win": "Follow & Win",
  "reel-it-feel-it": "Reel It. Feel It.",
  "my-first-day": "My First Day at LPU",
};

function DashboardPageContent() {
    const router = useRouter();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        const fetchSubmissions = async () => {
            setIsLoadingData(true);
            const db = getFirestore(app);
            const submissionsCol = collection(db, "submissions");
            const submissionSnapshot = await getDocs(submissionsCol);
            const submissionList = submissionSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    submittedAt: (data.submittedAt as Timestamp).toDate(),
                } as Submission;
            });
            setSubmissions(submissionList);
            setIsLoadingData(false);
        };

        fetchSubmissions();
    }, []);

  const stats = {
    totalSubmissions: submissions.length,
    submissionsPerCompetition: Object.keys(competitionDisplayNames).map(id => ({
        id: id,
        name: competitionDisplayNames[id],
        count: submissions.filter(s => s.competitionId === id).length
    }))
  };

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/admin/login');
  };
  
  if (isLoadingData) {
      return (
          <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      )
  }

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

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/admin/login");
        }
    }, [user, loading, router]);


    if (loading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return <DashboardPageContent />;
}
