
'use server';

import type { Submission } from '@/types';
import { createSign } from 'crypto';

// Helper function to create a signed JWT
async function createJwt(client_email: string, private_key: string) {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const claimSet = {
    iss: client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600, // Token valid for 1 hour
    iat: now,
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedClaimSet = Buffer.from(JSON.stringify(claimSet)).toString('base64url');
  
  const signatureInput = `${encodedHeader}.${encodedClaimSet}`;
  
  const sign = createSign('RSA-SHA256');
  sign.update(signatureInput);
  sign.end();
  
  const signature = sign.sign(private_key, 'base64url');

  return `${signatureInput}.${signature}`;
}

// Helper function to get an access token
async function getAccessToken(client_email: string, private_key: string) {
  console.log('SERVER ACTION: Creating JWT for authentication...');
  const jwt = await createJwt(client_email, private_key);
  console.log('SERVER ACTION: JWT created. Requesting access token...');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const tokens = await response.json();

  if (!response.ok) {
    console.error('SERVER ACTION ERROR: Failed to get access token.', tokens);
    throw new Error('Could not retrieve access token.');
  }
  
  console.log('SERVER ACTION: Access token retrieved successfully.');
  return tokens.access_token;
}

export async function writeToGoogleSheet(submissionData: Omit<Submission, 'id'>) {
  console.log("SERVER ACTION: writeToGoogleSheet started.");

  const credentialsJson = process.env.GOOGLE_SHEETS_CREDENTIALS;
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!credentialsJson) {
    const message = 'Server configuration error: GOOGLE_SHEETS_CREDENTIALS missing.';
    console.error(`SERVER ACTION ERROR: ${message}`);
    return { success: false, message };
  }
  
  if (!spreadsheetId) {
    const message = 'Server configuration error: GOOGLE_SHEET_ID missing.';
    console.error(`SERVER ACTION ERROR: ${message}`);
    return { success: false, message };
  }

  let credentials;
  try {
    credentials = JSON.parse(credentialsJson);
  } catch (error) {
    const message = 'Server configuration error: Malformed credentials JSON.';
    console.error(`SERVER ACTION CRITICAL ERROR: ${message}`, error);
    return { success: false, message };
  }

  try {
    const { client_email, private_key } = credentials;
    const accessToken = await getAccessToken(client_email, private_key.replace(/\\n/g, '\n'));

    const rowData = submissionData as any;
    // This order MUST match the Google Sheet columns exactly.
    const row = [
      '', // S.No. - Intentionally left blank, can be filled by sheet formula
      String(rowData.competitionName || ''),
      String(rowData.submittedAt ? new Date(rowData.submittedAt).toISOString() : new Date().toISOString()),
      String(rowData.name || ''),
      String(rowData.email || ''),
      String(rowData.phone || ''),
      String(rowData.university || ''),
      String(rowData.registrationId || ''),
      String(rowData.instagramHandle || ''),
      String(rowData.school || ''),
      String(rowData.postLink || ''),
      String(rowData.redditPostLink || ''),
      String(rowData.fileName || ''),
      String(rowData.fileUrl || ''),
      String(rowData.isWinner || 'false'),
      String(rowData.rank || ''),
      String(rowData.refSource || 'Direct'),
    ];

    console.log("SERVER ACTION: Formatted row to be appended:", row);
    
    const range = 'Sheet1'; // Append to the whole sheet
    const valueInputOption = 'USER_ENTERED';
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=${valueInputOption}`;

    const appendResponse = await fetch(appendUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            values: [row],
        }),
    });

    const appendResult = await appendResponse.json();

    if (!appendResponse.ok) {
        console.error("SERVER ACTION ERROR: Failed to append data to sheet. API Response:", appendResult);
        throw new Error('Google Sheets API append call failed.');
    }

    console.log("SERVER ACTION: Successfully wrote to Google Sheet. Response:", appendResult);
    return { success: true, message: 'Successfully written to Google Sheet.' };

  } catch (error: any) {
    console.error('SERVER ACTION CRITICAL ERROR: The API call process failed.', error);
    // Log the entire error object for detailed debugging
    console.error('Full error object:', JSON.stringify(error, null, 2));
    return { success: false, message: 'Failed to write to Google Sheet due to a server error.' };
  }
}
