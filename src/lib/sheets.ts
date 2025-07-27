
'use server';

import { google } from 'googleapis';
import type { Submission } from '@/types';

// This function will be called from the server-side form submission logic.
export async function writeToGoogleSheet(submissionData: Omit<Submission, 'id'>) {
  try {
    const credentialsJson = process.env.GOOGLE_SHEETS_CREDENTIALS;
    if (!credentialsJson) {
      throw new Error("GOOGLE_SHEETS_CREDENTIALS environment variable not set.");
    }
    
    const credentials = JSON.parse(credentialsJson);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) {
        throw new Error("GOOGLE_SHEET_ID environment variable not set.");
    }

    // IMPORTANT: The order here MUST match the order of headers in your Google Sheet
    const row = [
        submissionData.submittedAt.toISOString(),
        submissionData.competitionName,
        submissionData.name || '',
        submissionData.email || '',
        submissionData.phone || '',
        submissionData.university || '',
        submissionData.registrationId || '',
        submissionData.instagramHandle || '',
        submissionData.school || '',
        submissionData.postLink || '',
        submissionData.redditPostLink || '',
        submissionData.fileName || '',
        submissionData.fileUrl || '',
        submissionData.isWinner || false,
        submissionData.rank || '',
        submissionData.refSource || 'Direct',
    ];

    // Append the new row to the sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A1', // Assumes your data is in 'Sheet1'. Change if needed.
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [row],
      },
    });

    return { success: true, message: 'Successfully written to Google Sheet.' };

  } catch (error: any) {
    console.error('Error writing to Google Sheet:', error.message, error.stack);
    // Do not re-throw the error to prevent the user from seeing a failure,
    // as the primary data store (Firestore) was successful.
    return { success: false, message: 'Failed to write to Google Sheet.' };
  }
}
