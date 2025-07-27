
'use server';

import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, orderBy, Timestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import type { Announcement } from '@/types';

const db = getFirestore(app);
const announcementsCol = collection(db, 'announcements');

// CREATE
export async function createAnnouncement(data: Omit<Announcement, 'id' | 'createdAt'>) {
    try {
        const docData = {
            ...data,
            createdAt: serverTimestamp(),
        };
        await addDoc(announcementsCol, docData);
        return { success: true, message: 'Announcement created successfully.' };
    } catch (error) {
        console.error("Error creating announcement: ", error);
        return { success: false, message: 'Failed to create announcement.' };
    }
}

// READ
export async function getAnnouncements(): Promise<Announcement[]> {
    try {
        const q = query(announcementsCol, orderBy('createdAt', 'desc'));
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
        return [];
    }
}

// UPDATE
export async function toggleAnnouncementActive(id: string, isActive: boolean) {
    try {
        const docRef = doc(db, 'announcements', id);
        await updateDoc(docRef, { isActive });
        return { success: true, message: `Announcement status updated.` };
    } catch (error) {
        console.error("Error updating announcement: ", error);
        return { success: false, message: 'Failed to update announcement status.' };
    }
}

// DELETE
export async function deleteAnnouncement(id: string) {
    try {
        const docRef = doc(db, 'announcements', id);
        await deleteDoc(docRef);
        return { success: true, message: 'Announcement deleted successfully.' };
    } catch (error) {
        console.error("Error deleting announcement: ", error);
        return { success: false, message: 'Failed to delete announcement.' };
    }
}
