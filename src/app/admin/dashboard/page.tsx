
"use client";

import type { Submission, CompetitionMeta, Announcement } from "@/types";
import { DashboardClient } from "./dashboard-client";
import { Header } from "@/components/header";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { auth, app } from "@/lib/firebase";
import { useEffect, useState, useMemo } from "react";
import { getFirestore, collection, getDocs, Timestamp, doc, updateDoc, query, where, getDoc, serverTimestamp, setDoc, writeBatch, orderBy, documentId } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { getAnnouncements, parseWinnersList } from "./actions";

const competitionDisplayNames: { [key: string]: string } = {
  "follow-win": "Follow & Win (Daily winner)",
  "reel-it-feel-it": "Reel It. Feel It.",
  "my-first-day": "My First Day at LPU",
};

function DashboardPageContent() {
    const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [reelItFeelItMeta, setReelItFeelItMeta] = useState<CompetitionMeta | null>(null);
    const [refFilter, setRefFilter] = useState('all');
    const db = getFirestore(app);

    const fetchData = async () => {
        setIsLoadingData(true);
        // Fetch submissions
        const submissionsCol = collection(db, "submissions");
        const submissionSnapshot = await getDocs(query(submissionsCol, orderBy("submittedAt", "desc")));
        const submissionList = submissionSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                submittedAt: (data.submittedAt as Timestamp).toDate(),
            } as Submission;
        });
        setAllSubmissions(submissionList);

        // Fetch announcements
        await fetchAnnouncements();

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

    const fetchAnnouncements = async () => {
        const db = getFirestore(app);
        const announcementsCol = collection(db, "announcements");
        const q = query(announcementsCol, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const fetchedAnnouncements = snapshot.docs.map(doc => {
             const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp).toDate(),
            } as Announcement;
        });
        setAnnouncements(fetchedAnnouncements);
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

    const handleUpdateRefSource = async (submissionId: string, newRefSource: string): Promise<{success: boolean, message: string}> => {
        try {
            const submissionRef = doc(db, "submissions", submissionId);
            await updateDoc(submissionRef, { refSource: newRefSource });
            await fetchData(); // Refetch to show the update
            return { success: true, message: "Referral source updated." };
        } catch (error) {
            console.error("Error updating referral source: ", error);
            return { success: false, message: "Failed to update referral source." };
        }
    };
    
    const handleBulkUpdateRefSource = async (updates: Record<string, string>): Promise<{success: boolean, message: string}> => {
        const numUpdates = Object.keys(updates).length;
        if (numUpdates === 0) {
            return { success: false, message: "No changes to save." };
        }
        try {
            const batch = writeBatch(db);
            Object.entries(updates).forEach(([id, refSource]) => {
                const submissionRef = doc(db, "submissions", id);
                batch.update(submissionRef, { refSource });
            });
            await batch.commit();
            await fetchData();
            return { success: true, message: `${numUpdates} referral source(s) updated successfully.` };
        } catch (error) {
            console.error("Error bulk updating referral sources: ", error);
            return { success: false, message: "Failed to bulk update referral sources." };
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
    
    const handleUploadWinners = async (competitionId: string, registrationIds: string[]): Promise<{success: boolean, message: string}> => {
       try {
            const totalInFile = registrationIds.length;

            if (totalInFile === 0) {
                return { success: false, message: "No registration IDs found in the selected column."};
            }

            // Split into chunks of 30 for Firestore 'in' query limit
            const chunks: string[][] = [];
            for (let i = 0; i < registrationIds.length; i += 30) {
                chunks.push(registrationIds.slice(i, i + 30));
            }

            const submissionsRef = collection(db, 'submissions');
            const matchingIds: string[] = [];
            
            for (const chunk of chunks) {
                const q = query(submissionsRef, where("competitionId", "==", competitionId), where("registrationId", "in", chunk));
                const snapshot = await getDocs(q);
                snapshot.forEach(doc => matchingIds.push(doc.id));
            }
            
            const totalMatches = matchingIds.length;
            if (totalMatches === 0) {
                return { success: false, message: "No matching submissions found for the provided registration IDs in this competition." };
            }

            const batch = writeBatch(db);
            matchingIds.forEach(id => {
                const submissionRef = doc(db, "submissions", id);
                batch.update(submissionRef, { isWinner: true });
            });
            await batch.commit();

            await fetchData(); // Refresh data

            let successMessage = `${totalMatches} submission(s) successfully marked as winners.`;
            if (totalMatches < totalInFile) {
                successMessage += ` Note: ${totalInFile - totalMatches} registration IDs from the file did not match any submissions.`;
            }

            return { success: true, message: successMessage };

        } catch(error: any) {
            console.error("CLIENT-SIDE ERROR: Failed to process and mark winners:", error);
            if (error.code === 'permission-denied') {
                 return { success: false, message: "Permission Denied. Ensure you have the correct permissions to read and write to the database."};
            }
            return { success: false, message: "An unexpected error occurred while processing winners."};
        }
    }
    
    // NEW: This function runs on the client and handles the entire flow.
    const handleUploadCuratedWinners = async (competitionId: string, winnersDataJson: string): Promise<{success: boolean; message: string}> => {
        try {
            // Step 1: Call the server action to securely parse the file.
            const parseResult = await parseWinnersList(competitionId, winnersDataJson);

            if (!parseResult.success || !parseResult.data) {
                return { success: false, message: parseResult.message };
            }

            // Step 2: Use the parsed data to write to Firestore from the client.
            // This runs in the browser, so it's authenticated.
            const winnerDocRef = doc(db, 'winners', competitionId);
            await setDoc(winnerDocRef, { data: parseResult.data, updatedAt: Timestamp.now() });

            return { success: true, message: `Successfully uploaded ${parseResult.data.length} winners.` };
        } catch (error: any) {
            console.error("CLIENT-SIDE CRITICAL ERROR: Failed to upload curated winner list.", error);
            return { success: false, message: error.message || "An unknown error occurred." };
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
            onUpdateRefSource={handleUpdateRefSource}
            onBulkUpdateRefSource={handleBulkUpdateRefSource}
            reelItFeelItMeta={reelItFeelItMeta}
            onSetReelItFeelItDate={handleSetReelItFeelItDate}
            refSources={refSources}
            refFilter={refFilter}
            onRefFilterChange={setRefFilter}
            announcements={announcements}
            onRefreshAnnouncements={fetchAnnouncements}
            onUploadWinners={handleUploadWinners}
            onUploadCuratedWinners={handleUploadCuratedWinners}
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
