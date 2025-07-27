
'use server';

import { google } from 'googleapis';
import type { Submission } from '@/types';
import * as dotenv from 'dotenv';

// Force-load environment variables from .env file
dotenv.config();

// This function will be called from the server-side form submission logic.
export async function writeToGoogleSheet(submissionData: Omit<Submission, 'id'>) {
  console.log("Attempting to write to Google Sheet...");

  const credentialsJson = process.env.GOOGLE_SHEETS_CREDENTIALS;
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!credentialsJson) {
    console.error("GOOGLE_SHEETS_CREDENTIALS environment variable not set or not found.");
    return { success: false, message: 'Server configuration error: Credentials missing.' };
  }
  if (!spreadsheetId) {
    console.error("GOOGLE_SHEET_ID environment variable not set or not found.");
    return { success: false, message: 'Server configuration error: Sheet ID missing.' };
  }
  
  console.log("Credentials and Sheet ID found in environment variables.");

  try {
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
        submissionData.rank || '',
        submissionData.refSource || 'Direct',
    ];

    console.log("Appending row to sheet:", row);

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
    console.error('Error writing to Google Sheet:', error.message, error.stack);
    // Do not re-throw the error to prevent the user from seeing a failure,
    // as the primary data store (Firestore) was successful.
    return { success: false, message: 'Failed to write to Google Sheet.' };
  }
}
