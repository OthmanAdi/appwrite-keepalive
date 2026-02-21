#!/usr/bin/env bun
/**
 * Setup script for appwrite-keepalive
 *
 * Creates the keepalive database and collection in your Appwrite project.
 * Run this once before enabling the GitHub Action.
 *
 * Usage: bun run setup
 */

import { Client, Databases, Permission, Role } from "node-appwrite";
import { KEEPALIVE_CONFIG } from "./types.js";

async function setup(): Promise<void> {
  console.log("appwrite-keepalive setup");
  console.log("─".repeat(40));

  const endpoint = process.env.APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!endpoint || !projectId || !apiKey) {
    console.error("Missing required environment variables:");
    if (!endpoint) console.error("  - APPWRITE_ENDPOINT");
    if (!projectId) console.error("  - APPWRITE_PROJECT_ID");
    if (!apiKey) console.error("  - APPWRITE_API_KEY");
    process.exit(1);
  }

  console.log(`Endpoint: ${endpoint}`);
  console.log(`Project: ${projectId}`);
  console.log("");

  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

  const databases = new Databases(client);
  const { DATABASE_ID, DATABASE_NAME, COLLECTION_ID, COLLECTION_NAME } = KEEPALIVE_CONFIG;

  // Create database
  console.log("Creating database...");
  try {
    await databases.create({
      databaseId: DATABASE_ID,
      name: DATABASE_NAME,
    });
    console.log(`  Created: ${DATABASE_NAME} (${DATABASE_ID})`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("already exists")) {
      console.log(`  Exists: ${DATABASE_NAME} (${DATABASE_ID})`);
    } else {
      throw error;
    }
  }

  // Create collection
  console.log("Creating collection...");
  try {
    await databases.createCollection({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID,
      name: COLLECTION_NAME,
      permissions: [Permission.read(Role.any()), Permission.write(Role.any())],
      documentSecurity: false,
      enabled: true,
    });
    console.log(`  Created: ${COLLECTION_NAME} (${COLLECTION_ID})`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("already exists")) {
      console.log(`  Exists: ${COLLECTION_NAME} (${COLLECTION_ID})`);
    } else {
      throw error;
    }
  }

  // Create attributes
  console.log("Creating attributes...");

  try {
    await databases.createDatetimeAttribute({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID,
      key: "timestamp",
      required: true,
    });
    console.log("  Created: timestamp (datetime)");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("already exists")) {
      console.log("  Exists: timestamp (datetime)");
    } else {
      throw error;
    }
  }

  try {
    await databases.createStringAttribute({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID,
      key: "source",
      size: 64,
      required: true,
    });
    console.log("  Created: source (string)");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("already exists")) {
      console.log("  Exists: source (string)");
    } else {
      throw error;
    }
  }

  console.log("");
  console.log("─".repeat(40));
  console.log("Setup complete.");
  console.log("");
  console.log("Next steps:");
  console.log("1. Add these secrets to your GitHub repo:");
  console.log("   - APPWRITE_ENDPOINT");
  console.log("   - APPWRITE_PROJECT_ID");
  console.log("   - APPWRITE_API_KEY");
  console.log("");
  console.log("2. Enable the GitHub Action workflow");
  console.log("");
  console.log("Your project will stay alive.");
}

setup().catch((error) => {
  console.error("Setup failed:", error);
  process.exit(1);
});
