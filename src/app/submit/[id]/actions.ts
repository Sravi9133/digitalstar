
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
    cache: 'no-cache',
  });

  const tokens = await response.json();

  if (!response.ok) {
    console.error('SERVER ACTION ERROR: Failed to get access token.', tokens);
    throw new Error('Could not retrieve access token.');
  }
  
  console.log('SERVER ACTION: Access token retrieved successfully.');
  return tokens.access_token;
}

export async function writeToGoogleSheet(submissionData: Omit<Submission, 'id' | 'submittedAt'>) {
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
      new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false }), // Format date for IST
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
        cache: 'no-cache',
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


export async function getProgramCode(registrationId: string): Promise<{success: boolean; code?: string; message: string}> {
  if (!registrationId) {
    return { success: false, message: 'Registration ID is required.' };
  }

  const url = `https://services.lpu.in/api/programsearch/GetReportingSchedule/All/${registrationId}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'accept': '*/*',
        'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'origin': 'https://www.lpu.in',
        'referer': 'https://www.lpu.in/admission/reporting-schedule.php',
        'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      return { success: false, message: `API request failed with status: ${response.status}` };
    }

    const data = await response.json();
    const officialCode = data?.[0]?.OfficialCode;
    
    if (officialCode) {
      return { success: true, code: officialCode, message: 'Successfully fetched program code.' };
    } else {
      return { success: false, message: 'OfficialCode not found in API response.' };
    }

  } catch (error: any) {
    console.error('Error fetching program code:', error);
    return { success: false, message: 'An unexpected error occurred while fetching program details.' };
  }
}
