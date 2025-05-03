import { useState } from "react";
import { create } from "ipfs-http-client";

const ipfs = create({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
  headers: {
    authorization: `Basic ${Buffer.from(
      `${process.env.NEXT_PUBLIC_INFURA_PROJECT_ID}:${process.env.NEXT_PUBLIC_INFURA_PROJECT_SECRET}`
    ).toString("base64")}`,
  },
});

export function useIPFS() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadToIPFS = async (content: string): Promise<string> => {
    try {
      setIsUploading(true);
      setError(null);

      const { path } = await ipfs.add(content);
      const url = `https://ipfs.io/ipfs/${path}`;

      return url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload to IPFS");
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadFileToIPFS = async (file: File): Promise<string> => {
    try {
      setIsUploading(true);
      setError(null);

      const { path } = await ipfs.add(file);
      const url = `https://ipfs.io/ipfs/${path}`;

      return url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file to IPFS");
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadToIPFS,
    uploadFileToIPFS,
    isUploading,
    error,
  };
} 