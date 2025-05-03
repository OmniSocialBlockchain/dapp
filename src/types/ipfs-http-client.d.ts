declare module 'ipfs-http-client' {
  import { CID } from 'multiformats/cid';
  import { AbortOptions } from 'ipfs-core-types/src/utils';

  export interface AddOptions extends AbortOptions {
    cidVersion?: 0 | 1;
    hashAlg?: string;
    onlyHash?: boolean;
    pin?: boolean;
    progress?: (bytes: number, path?: string) => void;
    rawLeaves?: boolean;
    trickle?: boolean;
    wrapWithDirectory?: boolean;
  }

  export interface AddResult {
    path: string;
    cid: CID;
    size: number;
    mode?: number;
    mtime?: { secs: number; nsecs?: number };
  }

  export interface IPFSHTTPClient {
    add(data: string | Uint8Array | Blob, options?: AddOptions): Promise<AddResult>;
    // Add other methods as needed
  }

  export function create(config: {
    host: string;
    port: number;
    protocol: string;
    headers?: Record<string, string>;
  }): IPFSHTTPClient;
} 