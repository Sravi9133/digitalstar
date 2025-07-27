
'use server';

import { google } from 'googleapis';
import type { Submission } from '@/types';

// This is a Server Action that can be called from client components.
export async function writeToGoogleSheet(submissionData: Omit<Submission, 'id'>) {
  console.log("SERVER ACTION: writeToGoogleSheet started.");

  const credentialsJson = process.env.GOOGLE_SHEETS_CREDENTIALS;
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!credentialsJson) {
    console.error("SERVER ACTION ERROR: GOOGLE_SHEETS_CREDENTIALS environment variable not found.");
    return { success: false, message: 'Server configuration error: Credentials missing.' };
  }
  
  if (!spreadsheetId) {
    console.error("SERVER ACTION ERROR: GOOGLE_SHEET_ID environment variable not found.");
    return { success: false, message: 'Server configuration error: Sheet ID missing.' };
  }

  try {
    const credentials = JSON.parse(credentialsJson);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    console.log("SERVER ACTION: Successfully authenticated with Google Sheets API.");

    const rowData = submissionData as any;

    // IMPORTANT: The order here MUST match the order of headers in your Google Sheet
    const row = [
        rowData.submittedAt.toISOString(),
        rowData.competitionName || '',
        rowData.name || '',
        rowData.email || '',
        rowData.phone || '',
        rowData.university || '',
        rowData.registrationId || '',
        rowData.instagramHandle || '',
        rowData.school || '',
        rowData.postLink || '',
        rowData.redditPostLink || '',
        rowData.fileName || '',
        rowData.fileUrl || '',
        rowData.isWinner || false,
        String(rowData.rank || ''),
        rowData.refSource || 'Direct',
    ];

    console.log("SERVER ACTION: Formatted row to be appended:", row);

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [row],
      },
    });

    console.log("SERVER ACTION: Successfully wrote to Google Sheet. Response:", response.status, response.statusText);
    return { success: true, message: 'Successfully written to Google Sheet.' };

  } catch (error: any) {
    console.error('SERVER ACTION CRITICAL ERROR:', error.message, error.stack);
    return { success: false, message: 'Failed to write to Google Sheet due to a server error.' };
  }
}
