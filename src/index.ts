#!/usr/bin/env bun
/**
 * appwrite-keepalive
 *
 * Keep your Appwrite free-tier projects alive.
 * Automated. Zero infrastructure.
 *
 * Author: Ahmad Othman Ammar Adi
 * License: MIT
 */

import { keepaliveProject, loadProjectsFromEnv } from "./keepalive.js";
import type { KeepaliveResult } from "./types.js";

async function main(): Promise<void> {
  console.log("appwrite-keepalive v1.0.0");
  console.log("─".repeat(40));

  const projects = loadProjectsFromEnv();

  if (projects.length === 0) {
    console.error("No projects configured.");
    console.error("");
    console.error("Set environment variables:");
    console.error("  APPWRITE_ENDPOINT    - Your Appwrite endpoint");
    console.error("  APPWRITE_PROJECT_ID  - Your project ID");
    console.error("  APPWRITE_API_KEY     - Your API key");
    console.error("");
    console.error("Or for multiple projects:");
    console.error("  APPWRITE_PROJECTS    - JSON array of project configs");
    process.exit(1);
  }

  console.log(`Processing ${projects.length} project(s)...\n`);

  const results: KeepaliveResult[] = [];

  for (const project of projects) {
    const result = await keepaliveProject(project);
    results.push(result);
  }

  // Summary
  console.log("");
  console.log("─".repeat(40));
  console.log("Summary:");

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`  Successful: ${successful}`);
  console.log(`  Failed: ${failed}`);

  if (failed > 0) {
    console.log("");
    console.log("Failed projects:");
    for (const result of results.filter((r) => !r.success)) {
      console.log(`  - ${result.name || result.projectId}: ${result.message}`);
    }
    process.exit(1);
  }

  console.log("");
  console.log("All projects alive.");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
