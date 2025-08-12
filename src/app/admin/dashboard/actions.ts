
'use server';

import { getFirestore, collection, getDocs, query, orderBy, Timestamp, where, writeBatch, documentId, FirestoreError } from 'firebase/firestore';
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


export async function processWinners(
  competitionId: string,
  winnersDataJson: string, 
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

    if (!Array.isArray(winnersData)) {
      throw new Error("Parsed winner data is not an array.");
    }

    const registrationIds = winnersData
        .map(row => row[regNoColumn])
        .filter(id => id) // Filter out any empty/null IDs
        .map(String);
        
    if (registrationIds.length === 0) {
        const message = "No valid registration IDs found in the file for the selected column.";
        console.error(`SERVER ACTION ERROR: ${message}`);
        return { success: false, message };
    }

    console.log(`SERVER ACTION: Found ${registrationIds.length} registration IDs to process.`);

    // Firestore 'in' queries are limited to 30 items. We need to batch the requests.
    const registrationIdChunks: string[][] = [];
    for (let i = 0; i < registrationIds.length; i += 30) {
        registrationIdChunks.push(registrationIds.slice(i, i + 30));
    }
    
    console.log(`SERVER ACTION: Splitting into ${registrationIdChunks.length} chunks for querying.`);

    const db = getFirestore(app);
    const submissionsRef = collection(db, 'submissions');
    const batch = writeBatch(db);
    let totalMatches = 0;

    for (const [index, chunk] of registrationIdChunks.entries()) {
         console.log(`SERVER ACTION: Querying chunk ${index + 1}/${registrationIdChunks.length} with ${chunk.length} IDs.`);
         const q = query(submissionsRef, where("competitionId", "==", competitionId), where("registrationId", "in", chunk));
         const snapshot = await getDocs(q);

         if (!snapshot.empty) {
            totalMatches += snapshot.size;
            console.log(`SERVER ACTION: Found ${snapshot.size} matching submissions in chunk ${index + 1}.`);
            snapshot.docs.forEach(doc => {
                console.log(`SERVER ACTION: Adding update for submission ID ${doc.id} to the batch.`);
                batch.update(doc.ref, { isWinner: true });
            });
         } else {
             console.log(`SERVER ACTION: No matches found in chunk ${index + 1}.`);
         }
    }
    
    if (totalMatches === 0) {
        const message = `No matching submissions found for the provided registration IDs in the "${competitionId}" competition.`;
        console.warn(`SERVER ACTION: ${message}`);
        return { success: false, message };
    }

    console.log(`SERVER ACTION: Committing batch with ${totalMatches} updates.`);
    await batch.commit();
    
    const successMessage = `${totalMatches} submission(s) successfully marked as winners.`;
    console.log(`SERVER ACTION: ${successMessage}`);

    if(totalMatches < registrationIds.length) {
        const note = `Note: ${registrationIds.length - totalMatches} registration IDs from the file did not match any submissions in this competition.`;
        console.warn(`SERVER ACTION: ${note}`);
        return { success: true, message: `${successMessage} ${note}` };
    }

    return { success: true, message: successMessage };

  } catch (error) {
    console.error("SERVER ACTION CRITICAL ERROR: Error processing winners:", error);
    if (error instanceof SyntaxError) {
        return { success: false, message: "Failed to parse winner data. The data format might be incorrect."};
    }
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
        return { success: false, message: "Permission Denied. The server cannot write to the database. This is likely a Firestore Security Rules issue or a missing index. Please check your Firebase console." };
    }
    return { success: false, message: "An error occurred while processing the winners. Please check the data and try again." };
  }
}
