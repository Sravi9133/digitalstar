
'use server';

import { getFirestore, collection, getDocs, query, orderBy, Timestamp, where, writeBatch, documentId, FirestoreError, setDoc, doc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import type { Announcement, Submission } from '@/types';
import * as XLSX from "xlsx";

const db = getFirestore(app);

// READ
export async function getAnnouncements(): Promise<Announcement[]> {
    try {
        const announcementsCol = collection(db, 'announcements');
        const q = query(announcementsCol, where("isActive", "==", true), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp).toDate(),
            } as Announcement;
        });
    } catch (error) {
        console.error("Error fetching announcements: ", error);
        if (error instanceof FirestoreError && error.code === 'failed-precondition') {
             console.error("A composite index is likely required for this query. Please check the Firestore console.");
        }
        // Return empty array or re-throw, but don't use an insecure fallback.
        return [];
    }
}

export async function uploadWinnersList(competitionId: string, winnersDataJson: string): Promise<{success: boolean; message: string}> {
    console.log("SERVER ACTION: uploadWinnersList started.");
    
    if (!competitionId) {
        return { success: false, message: "Competition ID is missing." };
    }

    try {
        const winnersData = JSON.parse(winnersDataJson);

        if (!Array.isArray(winnersData)) {
            throw new Error("Winner data is not a valid array.");
        }

        console.log(`SERVER ACTION: Saving ${winnersData.length} winners for competition '${competitionId}'.`);

        const db = getFirestore(app);
        const winnerDocRef = doc(db, 'winners', competitionId);
        
        await setDoc(winnerDocRef, { data: winnersData, updatedAt: Timestamp.now() });

        console.log("SERVER ACTION: Successfully saved curated winner list.");
        return { success: true, message: `Successfully uploaded ${winnersData.length} winners.` };
    } catch (error: any) {
        console.error("SERVER ACTION CRITICAL ERROR: Failed to upload curated winner list.", error);
        return { success: false, message: error.message || "An unknown error occurred on the server." };
    }
}
