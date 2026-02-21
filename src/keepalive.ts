import { Client, Databases, Permission, Role } from "node-appwrite";
import { KEEPALIVE_CONFIG, type KeepaliveResult, type ProjectConfig } from "./types.js";

/**
 * Performs a keepalive operation on a single Appwrite project.
 * Creates the keepalive database/collection if they don't exist,
 * then upserts a heartbeat document with the current timestamp.
 */
export async function keepaliveProject(config: ProjectConfig): Promise<KeepaliveResult> {
  const { endpoint, projectId, apiKey, name } = config;
  const timestamp = new Date().toISOString();
  const projectLabel = name || projectId;

  try {
    // Initialize Appwrite client
    const client = new Client();
    client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

    const databases = new Databases(client);
    const { DATABASE_ID, COLLECTION_ID, DOCUMENT_ID } = KEEPALIVE_CONFIG;

    // Ensure database exists
    await ensureDatabase(databases);

    // Ensure collection exists with proper attributes
    await ensureCollection(databases);

    // Try to update existing document first
    try {
      await databases.updateDocument({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID,
        documentId: DOCUMENT_ID,
        data: {
          timestamp,
          source: "github-actions",
        },
      });

      console.log(`[${projectLabel}] Heartbeat sent at ${timestamp}`);

      return {
        projectId,
        name,
        success: true,
        message: "Heartbeat sent successfully",
        timestamp,
      };
    } catch (updateError) {
      // Document doesn't exist, create it
      const updateMessage =
        updateError instanceof Error ? updateError.message : String(updateError);

      if (updateMessage.includes("not be found") || updateMessage.includes("404")) {
        await databases.createDocument({
          databaseId: DATABASE_ID,
          collectionId: COLLECTION_ID,
          documentId: DOCUMENT_ID,
          data: {
            timestamp,
            source: "github-actions",
          },
          permissions: [Permission.read(Role.any())],
        });

        console.log(`[${projectLabel}] Created initial heartbeat at ${timestamp}`);

        return {
          projectId,
          name,
          success: true,
          message: "Initial heartbeat created",
          timestamp,
        };
      }

      throw updateError;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${projectLabel}] Keepalive failed: ${errorMessage}`);

    return {
      projectId,
      name,
      success: false,
      message: errorMessage,
      timestamp,
    };
  }
}

/**
 * Ensures the keepalive database exists, creates it if not
 */
async function ensureDatabase(databases: Databases): Promise<void> {
  const { DATABASE_ID, DATABASE_NAME } = KEEPALIVE_CONFIG;

  try {
    await databases.get({ databaseId: DATABASE_ID });
  } catch {
    console.log("Creating keepalive database...");
    await databases.create({
      databaseId: DATABASE_ID,
      name: DATABASE_NAME,
    });
    console.log("Database created.");
  }
}

/**
 * Ensures the heartbeats collection exists with proper attributes
 */
async function ensureCollection(databases: Databases): Promise<void> {
  const { DATABASE_ID, COLLECTION_ID, COLLECTION_NAME } = KEEPALIVE_CONFIG;

  try {
    await databases.getCollection({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID,
    });
  } catch {
    console.log("Creating heartbeats collection...");

    // Create collection
    await databases.createCollection({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID,
      name: COLLECTION_NAME,
      permissions: [Permission.read(Role.any()), Permission.write(Role.any())],
      documentSecurity: false,
      enabled: true,
    });

    // Add timestamp attribute
    await databases.createDatetimeAttribute({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID,
      key: "timestamp",
      required: true,
    });

    // Add source attribute
    await databases.createStringAttribute({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID,
      key: "source",
      size: 64,
      required: true,
    });

    // Wait for attributes to be ready (Appwrite processes them async)
    console.log("Waiting for attributes to be ready...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("Collection created with attributes.");
  }
}

/**
 * Loads project configurations from environment variables
 */
export function loadProjectsFromEnv(): ProjectConfig[] {
  const projects: ProjectConfig[] = [];

  // Check for multi-project JSON config
  const projectsJson = process.env.APPWRITE_PROJECTS;
  if (projectsJson) {
    try {
      const parsed = JSON.parse(projectsJson) as ProjectConfig[];
      if (Array.isArray(parsed)) {
        projects.push(...parsed);
        console.log(`Loaded ${parsed.length} projects from APPWRITE_PROJECTS`);
        return projects;
      }
    } catch {
      console.error("Failed to parse APPWRITE_PROJECTS JSON");
    }
  }

  // Fall back to single project config
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (endpoint && projectId && apiKey) {
    projects.push({ endpoint, projectId, apiKey });
    console.log("Loaded single project from environment variables");
  }

  return projects;
}
