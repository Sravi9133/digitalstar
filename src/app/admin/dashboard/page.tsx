
"use client";

import type { Submission, CompetitionMeta } from "@/types";
import { DashboardClient } from "./dashboard-client";
import { Header } from "@/components/header";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { auth, app } from "@/lib/firebase";
import { useEffect, useState, useMemo } from "react";
import { getFirestore, collection, getDocs, Timestamp, doc, updateDoc, query, where, getDoc, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import { Loader2 } from "lucide-react";

const competitionDisplayNames: { [key: string]: string } = {
  "follow-win": "Follow & Win (Daily winner)",
  "reel-it-feel-it": "Reel It. Feel It.",
  "my-first-day": "My First Day at LPU",
};

function DashboardPageContent() {
    const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [reelItFeelItMeta, setReelItFeelItMeta] = useState<CompetitionMeta | null>(null);
    const [refFilter, setRefFilter] = useState('all');
    const db = getFirestore(app);

    const fetchData = async () => {
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
        setAllSubmissions(submissionList);

        // Fetch competition meta
        const metaRef = doc(db, "competition_meta", "reel-it-feel-it");
        const metaSnap = await getDoc(metaRef);
        if (metaSnap.exists()) {
            const data = metaSnap.data();
            setReelItFeelItMeta({
                ...data,
                resultAnnouncementDate: (data.resultAnnouncementDate as Timestamp).toDate(),
            } as CompetitionMeta);
        } else {
            setReelItFeelItMeta(null);
        }

        setIsLoadingData(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSetReelItFeelItDate = async (date: Date): Promise<{success: boolean, message: string}> => {
        try {
            const metaRef = doc(db, "competition_meta", "reel-it-feel-it");
            await setDoc(metaRef, { resultAnnouncementDate: Timestamp.fromDate(date) });
            await fetchData(); // Refetch data to update UI
            return { success: true, message: "Announcement date set successfully." };
        } catch (error) {
            console.error("Error setting announcement date: ", error);
            return { success: false, message: "Failed to set announcement date." };
        }
    }

    const handleDeleteSubmissions = async (ids: string[]): Promise<{success: boolean, message: string}> => {
        if (ids.length === 0) {
            return { success: false, message: "No submissions selected." };
        }
        try {
            const batch = writeBatch(db);
            ids.forEach(id => {
                const submissionRef = doc(db, "submissions", id);
                batch.delete(submissionRef);
            });
            await batch.commit();
            await fetchData(); // Refetch data to update UI
            return { success: true, message: `${ids.length} submission(s) deleted successfully.` };
        } catch (error) {
            console.error("Error deleting submissions: ", error);
            return { success: false, message: "Failed to delete submissions." };
        }
    }

    const handleMarkAsWinner = async (submission: Submission, rank?: 1 | 2 | 3): Promise<{success: boolean, message: string}> => {
        // For "Follow & Win", check if the user has already won
        if (submission.competitionId === 'follow-win' && submission.registrationId) {
            const q = query(
                collection(db, "submissions"),
                where("competitionId", "==", "follow-win"),
                where("registrationId", "==", submission.registrationId),
                where("isWinner", "==", true)
            );

            const existingWinnerSnapshot = await getDocs(q);
            if (!existingWinnerSnapshot.empty) {
                console.log(`User ${submission.registrationId} has already won.`);
                return { success: false, message: `This participant (${submission.registrationId}) has already won this competition.` };
            }
        }

        try {
            const submissionRef = doc(db, "submissions", submission.id);
            const updateData: { isWinner: boolean, rank?: 1 | 2 | 3 } = {
                isWinner: true
            };

            if (rank) {
                updateData.rank = rank;
            }

            await updateDoc(submissionRef, updateData);
            
            // Refetch data to update UI
            await fetchData(); 
            return { success: true, message: "Successfully marked as winner." };
        } catch (error) {
            console.error("Error marking as winner: ", error);
            return { success: false, message: "An unexpected error occurred while marking as winner." };
        }
    };
    
  const refSources = useMemo(() => {
    const sources = new Set<string>();
    allSubmissions.forEach(s => {
        if(s.refSource) {
            sources.add(s.refSource);
        }
    });
    return Array.from(sources);
  }, [allSubmissions]);

  const filteredSubmissions = useMemo(() => {
    if (refFilter === 'all') {
        return allSubmissions;
    }
    if (refFilter === 'direct') {
        return allSubmissions.filter(s => !s.refSource);
    }
    return allSubmissions.filter(s => s.refSource === refFilter);
  }, [allSubmissions, refFilter]);

  const stats = {
    totalSubmissions: filteredSubmissions.length,
    submissionsPerCompetition: Object.keys(competitionDisplayNames).map(id => ({
        id: id,
        name: competitionDisplayNames[id],
        count: filteredSubmissions.filter(s => s.competitionId === id).length
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
        <DashboardClient 
            submissions={filteredSubmissions} 
            stats={stats} 
            onMarkAsWinner={handleMarkAsWinner} 
            onDeleteSubmissions={handleDeleteSubmissions}
            reelItFeelItMeta={reelItFeelItMeta}
            onSetReelItFeelItDate={handleSetReelItFeelItDate}
            refSources={refSources}
            refFilter={refFilter}
            onRefFilterChange={setRefFilter}
        />
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
