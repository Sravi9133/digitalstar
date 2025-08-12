
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
  if (!competitionId) {
    return { success: false, message: "Please select a competition." };
  }
  if (!fileContent) {
    return { success: false, message: "The uploaded file is empty." };
  }

  try {
    const workbook = XLSX.read(fileContent, { type: "string" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const winnersData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (winnersData.length < 2) {
      return { success: false, message: "CSV file must have a header row and at least one winner row." };
    }

    const header = winnersData[0].map((h: string) => h.toLowerCase());
    const regNoIndex = header.indexOf('reg no');

    if (regNoIndex === -1) {
        return { success: false, message: "CSV header must include 'REG NO'." };
    }
    
    const registrationIds = winnersData
        .slice(1) // Skip header
        .map(row => row[regNoIndex])
        .filter(id => id) // Filter out any empty/null IDs
        .map(String);
        
    if (registrationIds.length === 0) {
        return { success: false, message: "No valid registration IDs found in the file." };
    }

    // Query Firestore for all submissions matching the competition and registration IDs
    const submissionsRef = collection(db, "submissions");
    const q = query(submissionsRef, where("competitionId", "==", competitionId), where("registrationId", "in", registrationIds));
    
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return { success: false, message: `No matching submissions found for the provided registration IDs in the "${competitionId}" competition.` };
    }
    
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isWinner: true });
    });

    await batch.commit();
    
    const successMessage = `${snapshot.size} submission(s) successfully marked as winners.`;
    if(snapshot.size < registrationIds.length) {
        return { success: true, message: `${successMessage} Note: ${registrationIds.length - snapshot.size} registration IDs from the file did not match any submissions.` };
    }

    return { success: true, message: successMessage };

  } catch (error) {
    console.error("Error processing winners CSV:", error);
    return { success: false, message: "An error occurred while processing the file. Please check the file format and try again." };
  }
}
