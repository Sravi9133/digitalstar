
'use server';

import { getFirestore, collection, getDocs, query, orderBy, Timestamp, where } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import type { Announcement } from '@/types';

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
