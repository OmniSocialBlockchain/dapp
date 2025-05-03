import { NextApiRequest, NextApiResponse } from 'next';
import { create } from 'ipfs-http-client';
import formidable from 'formidable';
import { promises as fs } from 'fs';
import { type File } from 'formidable';
import { type IPFSHTTPClient } from 'ipfs-http-client';

// Validate environment variables
if (!process.env.INFURA_PROJECT_ID || !process.env.INFURA_PROJECT_SECRET) {
  throw new Error('Missing required environment variables for IPFS configuration');
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/json',
  'text/plain',
] as const;

const ipfs: IPFSHTTPClient = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: `Basic ${Buffer.from(
      `${process.env.INFURA_PROJECT_ID}:${process.env.INFURA_PROJECT_SECRET}`
    ).toString('base64')}`,
  },
});

export const config = {
  api: {
    bodyParser: false,
  },
};

interface FormidableFile {
  mimetype: string | null;
  size: number;
  filepath: string;
}

async function validateFile(file: FormidableFile | undefined): Promise<void> {
  if (!file) {
    throw new Error('No file uploaded');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype as typeof ALLOWED_MIME_TYPES[number])) {
    throw new Error(`File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let content: Buffer;
    let contentType: string;

    if (req.headers['content-type']?.includes('multipart/form-data')) {
      const form = formidable({
        maxFileSize: MAX_FILE_SIZE,
        filter: ({ mimetype }: { mimetype: string | null }) => 
          ALLOWED_MIME_TYPES.includes(mimetype as typeof ALLOWED_MIME_TYPES[number]),
      });

      const [fields, files] = await form.parse(req);
      const file = files.file?.[0] as FormidableFile;

      await validateFile(file);
      content = await fs.readFile(file.filepath);
      contentType = file.mimetype || 'application/octet-stream';

      // Clean up temporary file
      await fs.unlink(file.filepath).catch(console.error);
    } else {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      content = Buffer.concat(chunks);
      contentType = 'application/json';
    }

    const { cid } = await ipfs.add(content);
    const url = `https://ipfs.io/ipfs/${cid.toString()}`;

    res.status(200).json({ 
      hash: cid.toString(), 
      url,
      contentType,
    });
  } catch (error) {
    console.error('IPFS upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload to IPFS';
    res.status(500).json({ 
      error: errorMessage,
      code: error instanceof Error ? error.name : 'UPLOAD_ERROR',
    });
  }
} 