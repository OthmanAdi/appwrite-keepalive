/**
 * Configuration for a single Appwrite project
 */
export interface ProjectConfig {
  /** Appwrite API endpoint (e.g., https://cloud.appwrite.io/v1) */
  endpoint: string;
  /** Appwrite project ID */
  projectId: string;
  /** Appwrite API key with database permissions */
  apiKey: string;
  /** Optional friendly name for logging */
  name?: string;
}

/**
 * Result of a keepalive operation for a single project
 */
export interface KeepaliveResult {
  projectId: string;
  name?: string;
  success: boolean;
  message: string;
  timestamp: string;
}

/**
 * Database and collection IDs used by appwrite-keepalive
 */
export const KEEPALIVE_CONFIG = {
  DATABASE_ID: "_keepalive",
  DATABASE_NAME: "Keepalive",
  COLLECTION_ID: "heartbeats",
  COLLECTION_NAME: "Heartbeats",
  DOCUMENT_ID: "status",
} as const;
