
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

// This function now ONLY parses the file and returns the data. It does NOT write to Firestore.
export async function parseWinnersList(competitionId: string, winnersDataJson: string): Promise<{success: boolean; message: string; data?: any[]}> {
    console.log("SERVER ACTION: parseWinnersList started.");
    
    if (!competitionId) {
        return { success: false, message: "Competition ID is missing." };
    }

    try {
        const winnersData = JSON.parse(winnersDataJson);

        if (!Array.isArray(winnersData)) {
            throw new Error("Winner data is not a valid array.");
        }

        console.log(`SERVER ACTION: Parsed ${winnersData.length} winners for competition '${competitionId}'.`);
        
        return { success: true, message: `Successfully parsed ${winnersData.length} winners.`, data: winnersData };
    } catch (error: any) {
        console.error("SERVER ACTION CRITICAL ERROR: Failed to parse winner list.", error);
        return { success: false, message: error.message || "An unknown error occurred on the server." };
    }
}
