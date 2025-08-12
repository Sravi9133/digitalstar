
'use server';

import { getFirestore, collection, getDocs, query, orderBy, Timestamp, where, writeBatch, documentId } from 'firebase/firestore';
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
        // This might fail if a composite index is not created yet.
        // As a fallback, fetch all and filter in code.
        try {
            console.log("Falling back to fetching all announcements and filtering in code.");
            const announcementsCol = collection(db, 'announcements');
            const snapshot = await getDocs(query(announcementsCol, orderBy('createdAt', 'desc')));
             if (snapshot.empty) {
                return [];
            }
            const allAnnouncements = snapshot.docs.map(doc => {
                 const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: (data.createdAt as Timestamp).toDate(),
                } as Announcement;
            });
            return allAnnouncements.filter(a => a.isActive);
        } catch (fallbackError) {
             console.error("Fallback fetching also failed: ", fallbackError);
             return [];
        }
    }
}


export async function processWinners(
  competitionId: string,
  winnersDataJson: string, // Changed from object array to JSON string
  regNoColumn: string
): Promise<{ success: boolean; message: string }> {
  console.log("SERVER ACTION: processWinners started.");
  if (!competitionId) {
    return { success: false, message: "Please select a competition." };
  }
  if (!winnersDataJson) {
    return { success: false, message: "Winner data is empty." };
  }
   if (!regNoColumn) {
    return { success: false, message: "Registration number column mapping is missing." };
  }

  try {
    const winnersData: { [key: string]: string | number }[] = JSON.parse(winnersDataJson);

    const registrationIds = winnersData
        .map(row => row[regNoColumn])
        .filter(id => id) // Filter out any empty/null IDs
        .map(String);
        
    if (registrationIds.length === 0) {
        const message = "No valid registration IDs found in the file for the selected column.";
        console.error(`SERVER ACTION ERROR: ${message}`);
        return { success: false, message };
    }

    // Query Firestore for all submissions matching the competition and registration IDs
    const submissionsRef = collection(db, "submissions");
    // Firestore 'in' queries are limited to 30 items. We need to batch the requests.
    const registrationIdChunks: string[][] = [];
    for (let i = 0; i < registrationIds.length; i += 30) {
        registrationIdChunks.push(registrationIds.slice(i, i + 30));
    }
    
    const batch = writeBatch(db);
    let totalMatches = 0;

    for (const chunk of registrationIdChunks) {
         const q = query(submissionsRef, where("competitionId", "==", competitionId), where("registrationId", "in", chunk));
         const snapshot = await getDocs(q);

         if (!snapshot.empty) {
            totalMatches += snapshot.size;
            snapshot.docs.forEach(doc => {
                batch.update(doc.ref, { isWinner: true });
            });
         }
    }
    
    if (totalMatches === 0) {
        const message = `No matching submissions found for the provided registration IDs in the "${competitionId}" competition.`;
        console.warn(`SERVER ACTION: ${message}`);
        return { success: false, message };
    }

    await batch.commit();
    
    const successMessage = `${totalMatches} submission(s) successfully marked as winners.`;
    if(totalMatches < registrationIds.length) {
        return { success: true, message: `${successMessage} Note: ${registrationIds.length - totalMatches} registration IDs from the file did not match any submissions.` };
    }

    return { success: true, message: successMessage };

  } catch (error) {
    console.error("SERVER ACTION CRITICAL ERROR: Error processing winners:", error);
    if (error instanceof SyntaxError) {
        return { success: false, message: "Failed to parse winner data. The data format might be incorrect."};
    }
    return { success: false, message: "An error occurred while processing the winners. Please check the data and try again." };
  }
}
