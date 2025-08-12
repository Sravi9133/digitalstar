
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


export async function processWinnersCsv(
  competitionId: string,
  fileContent: string
): Promise<{ success: boolean; message: string }> {
  console.log("SERVER ACTION: processWinnersCsv started.");
  if (!competitionId) {
    console.error("SERVER ACTION ERROR: No competition ID provided.");
    return { success: false, message: "Please select a competition." };
  }
  if (!fileContent) {
    console.error("SERVER ACTION ERROR: File content is empty.");
    return { success: false, message: "The uploaded file is empty." };
  }

  console.log("SERVER ACTION: Received file content snippet:", fileContent.substring(0, 200));

  try {
    console.log("SERVER ACTION: Attempting to parse CSV content...");
    const workbook = XLSX.read(fileContent, { type: "string" });
    const sheetName = workbook.SheetNames[0];
    console.log(`SERVER ACTION: Reading from sheet: ${sheetName}`);
    const worksheet = workbook.Sheets[sheetName];
    const winnersData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log("SERVER ACTION: Parsed CSV data (first 5 rows):", winnersData.slice(0, 5));


    if (winnersData.length < 2) {
      const message = "CSV file must have a header row and at least one winner row.";
      console.error(`SERVER ACTION ERROR: ${message}`);
      return { success: false, message };
    }

    const header = winnersData[0].map((h: string) => String(h).toLowerCase().trim());
    console.log("SERVER ACTION: Parsed header (lowercase, trimmed):", header);
    
    const regNoIndex = header.indexOf('reg no');
    console.log(`SERVER ACTION: Index of 'reg no' is: ${regNoIndex}`);

    if (regNoIndex === -1) {
        const message = "CSV header must include 'REG NO'.";
        console.error(`SERVER ACTION ERROR: ${message}. Found headers:`, header);
        return { success: false, message: `${message} Detected headers are: ${header.join(', ')}` };
    }
    
    const registrationIds = winnersData
        .slice(1) // Skip header
        .map(row => row[regNoIndex])
        .filter(id => id) // Filter out any empty/null IDs
        .map(String);
    
    console.log(`SERVER ACTION: Extracted ${registrationIds.length} registration IDs:`, registrationIds);
        
    if (registrationIds.length === 0) {
        const message = "No valid registration IDs found in the file.";
        console.error(`SERVER ACTION ERROR: ${message}`);
        return { success: false, message };
    }

    console.log(`SERVER ACTION: Querying Firestore for ${registrationIds.length} IDs in competition "${competitionId}"...`);
    // Query Firestore for all submissions matching the competition and registration IDs
    const submissionsRef = collection(db, "submissions");
    const q = query(submissionsRef, where("competitionId", "==", competitionId), where("registrationId", "in", registrationIds));
    
    const snapshot = await getDocs(q);
    console.log(`SERVER ACTION: Firestore query found ${snapshot.size} matching documents.`);

    if (snapshot.empty) {
        const message = `No matching submissions found for the provided registration IDs in the "${competitionId}" competition.`;
        console.warn(`SERVER ACTION: ${message}`);
        return { success: false, message };
    }
    
    console.log("SERVER ACTION: Creating write batch to update winners...");
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        console.log(`SERVER ACTION: Marking doc ${doc.id} as winner.`);
        batch.update(doc.ref, { isWinner: true });
    });

    await batch.commit();
    console.log("SERVER ACTION: Batch commit successful.");
    
    const successMessage = `${snapshot.size} submission(s) successfully marked as winners.`;
    if(snapshot.size < registrationIds.length) {
        return { success: true, message: `${successMessage} Note: ${registrationIds.length - snapshot.size} registration IDs from the file did not match any submissions.` };
    }

    return { success: true, message: successMessage };

  } catch (error) {
    console.error("SERVER ACTION CRITICAL ERROR: Error processing winners CSV:", error);
    return { success: false, message: "An error occurred while processing the file. Please check the file format and try again." };
  }
}
