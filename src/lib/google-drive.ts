import { config } from './config';
import { UploadResult } from '@/types';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

// Cache for access token to avoid too many refresh requests
let cachedAccessToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedAccessToken && Date.now() < tokenExpiry - 300000) {
    return cachedAccessToken;
  }

  const tokenUrl = 'https://oauth2.googleapis.com/token';

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.googleDrive.clientId,
      client_secret: config.googleDrive.clientSecret,
      refresh_token: config.googleDrive.refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Token refresh failed:', errorText);
    throw new Error('Failed to get access token');
  }

  const data: TokenResponse = await response.json();
  cachedAccessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in * 1000);
  return data.access_token;
}

export async function uploadToGoogleDrive(
  file: Buffer,
  fileName: string,
  mimeType: string,
  retryCount: number = 0
): Promise<UploadResult> {
  const MAX_RETRIES = 2;
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

  try {
    // Check file size
    if (file.length > MAX_FILE_SIZE) {
      return {
        success: false,
        message: `הקובץ גדול מדי (${(file.length / 1024 / 1024).toFixed(1)}MB). מקסימום 10MB`,
      };
    }

    console.log(`Uploading ${fileName} (${(file.length / 1024).toFixed(1)}KB)...`);
    
    const accessToken = await getAccessToken();

    // Create file metadata
    const metadata = {
      name: fileName,
      parents: [config.googleDrive.folderId],
    };

    // Create multipart body
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const close_delim = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n` +
      'Content-Transfer-Encoding: base64\r\n\r\n' +
      file.toString('base64') +
      close_delim;

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`Google Drive upload failed (attempt ${retryCount + 1}):`, error);
      
      // Retry on server errors (5xx) or rate limiting (429)
      if ((response.status >= 500 || response.status === 429) && retryCount < MAX_RETRIES) {
        console.log(`Retrying upload in ${(retryCount + 1) * 2} seconds...`);
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
        return uploadToGoogleDrive(file, fileName, mimeType, retryCount + 1);
      }
      
      throw new Error(`Google Drive upload failed: ${response.status} - ${error}`);
    }

    const result = await response.json();
    console.log(`Successfully uploaded ${fileName}`);

    return {
      success: true,
      fileUrl: result.webViewLink,
      fileId: result.id,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return {
      success: false,
      message,
    };
  }
}
