
'use server';

import { google } from 'googleapis';
import type { Submission } from '@/types';

// This function will be called from the server-side form submission logic.
export async function writeToGoogleSheet(submissionData: Omit<Submission, 'id'>) {
  console.log("Starting writeToGoogleSheet function execution.");

  try {
    const credentialsJson = process.env.GOOGLE_SHEETS_CREDENTIALS;
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!credentialsJson) {
      console.error("CRITICAL: GOOGLE_SHEETS_CREDENTIALS environment variable not found.");
      return { success: false, message: 'Server configuration error: Credentials missing.' };
    }
    console.log("Successfully found GOOGLE_SHEETS_CREDENTIALS.");
    
    if (!spreadsheetId) {
      console.error("CRITICAL: GOOGLE_SHEET_ID environment variable not found.");
      return { success: false, message: 'Server configuration error: Sheet ID missing.' };
    }
    console.log("Successfully found GOOGLE_SHEET_ID.");

    const credentials = JSON.parse(credentialsJson);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    console.log("Successfully authenticated with Google Sheets API.");

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
        String(submissionData.rank || ''),
        submissionData.refSource || 'Direct',
    ];

    console.log("Formatted row to be appended:", row);

    // Append the new row to the sheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A1', // Assumes your data is in 'Sheet1'. Change if needed.
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [row],
      },
    });

    console.log("Successfully wrote to Google Sheet. Response:", response.status, response.statusText);
    return { success: true, message: 'Successfully written to Google Sheet.' };

  } catch (error: any) {
    console.error('CRITICAL ERROR in writeToGoogleSheet:', error.message, error.stack);
    // Do not re-throw the error to prevent the user from seeing a failure,
    // as the primary data store (Firestore) was successful.
    return { success: false, message: 'Failed to write to Google Sheet due to a server error.' };
  }
}
