import { config } from './config';
import { UploadResult } from '@/types';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

async function getAccessToken(): Promise<string> {
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
    throw new Error('Failed to get access token');
  }

  const data: TokenResponse = await response.json();
  return data.access_token;
}

export async function uploadToGoogleDrive(
  file: Buffer,
  fileName: string,
  mimeType: string
): Promise<UploadResult> {
  try {
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
      throw new Error(`Google Drive upload failed: ${error}`);
    }

    const result = await response.json();

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
