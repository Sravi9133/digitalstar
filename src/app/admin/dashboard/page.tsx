
"use client";

import type { Submission } from "@/types";
import { DashboardClient } from "./dashboard-client";
import { Header } from "@/components/header";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { auth, app } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, Timestamp, doc, updateDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";

const competitionDisplayNames: { [key: string]: string } = {
  "follow-win": "Follow & Win",
  "reel-it-feel-it": "Reel It. Feel It.",
  "my-first-day": "My First Day at LPU",
};

function DashboardPageContent() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const db = getFirestore(app);

    const fetchSubmissions = async () => {
        setIsLoadingData(true);
        const submissionsCol = collection(db, "submissions");
        const submissionSnapshot = await getDocs(submissionsCol);
        const submissionList = submissionSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                submittedAt: (data.submittedAt as Timestamp).toDate(),
            } as Submission;
        }).sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
        setSubmissions(submissionList);
        setIsLoadingData(false);
    };

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const handleMarkAsWinner = async (submissionId: string) => {
        const submissionRef = doc(db, "submissions", submissionId);
        await updateDoc(submissionRef, {
            isWinner: true
        });
        // Refetch data to update UI
        await fetchSubmissions(); 
    };

  const stats = {
    totalSubmissions: submissions.length,
    submissionsPerCompetition: Object.keys(competitionDisplayNames).map(id => ({
        id: id,
        name: competitionDisplayNames[id],
        count: submissions.filter(s => s.competitionId === id).length
    }))
  };

  if (isLoadingData) {
      return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        </div>
      )
  }

  return (
    <div className="flex flex-col min-h-screen">
    <Header />
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <DashboardClient submissions={submissions} stats={stats} onMarkAsWinner={handleMarkAsWinner} />
    </main>
    </div>
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
