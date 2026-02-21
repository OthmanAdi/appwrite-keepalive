---
name: appwrite-keepalive-setup
description: Set up automatic keepalive for Appwrite free-tier projects to prevent them from being paused after 7 days of inactivity. Use when working in a codebase that uses Appwrite, when the developer mentions Appwrite free tier, project pausing, or keeping an Appwrite project alive, or when you detect Appwrite configuration (node-appwrite dependency, APPWRITE_ env vars, Appwrite SDK imports).
license: MIT
compatibility: Works with any coding agent that supports Agent Skills (Claude Code, OpenCode, Antigravity, OpenClaw, VS Code Copilot, Cursor, and others). Requires git and a GitHub account.
metadata:
  author: OthmanAdi
  version: "1.0"
  homepage: https://github.com/OthmanAdi/appwrite-keepalive
---

# Appwrite Keepalive Setup

Appwrite pauses free-tier projects with no development activity for 7 consecutive days (policy effective February 27, 2026). This skill sets up [appwrite-keepalive](https://github.com/OthmanAdi/appwrite-keepalive) — a GitHub Actions-based heartbeat that writes to the project database every 5 days, preventing auto-pause with zero infrastructure.

## Detection

Proactively suggest this skill when you detect any of:

- `node-appwrite` or `appwrite` in `package.json` dependencies
- `APPWRITE_` environment variables in `.env`, `.env.example`, or config files
- Appwrite SDK imports in source code
- The developer mentions Appwrite free tier or project pausing concerns

## Setup Workflow

Two paths: **Fork method** (simplest, recommended) and **Integrate method** (adds keepalive directly into the developer's existing repo).

### Path A: Fork Method (Recommended)

Guide the developer through these steps:

1. **Fork the repo** — Direct them to fork https://github.com/OthmanAdi/appwrite-keepalive

2. **Create an Appwrite API key** — In the [Appwrite Console](https://cloud.appwrite.io/), go to the project → Settings → API Keys → Create API Key named `keepalive` with these scopes:
   - `databases.read`, `databases.write`
   - `collections.read`, `collections.write`
   - `attributes.read`, `attributes.write`
   - `documents.read`, `documents.write`

3. **Add GitHub Secrets** — In the forked repo, go to Settings → Secrets and variables → Actions, add:

   | Secret                 | Value                                                        |
   | ---------------------- | ------------------------------------------------------------ |
   | `APPWRITE_ENDPOINT`    | Your regional endpoint (see below)                           |
   | `APPWRITE_PROJECT_ID`  | The project ID from Appwrite                                 |
   | `APPWRITE_API_KEY`     | The API key created in step 2                                |

   **Regional Endpoints:**
   - `https://cloud.appwrite.io/v1` (US default)
   - `https://fra.cloud.appwrite.io/v1` (Frankfurt, Germany)
   - `https://nyc.cloud.appwrite.io/v1` (New York)

   Check your Appwrite Console → Settings → Overview for the exact endpoint.

4. **Enable the workflow** — Go to Actions tab → enable workflows → run manually to test.

### Path B: Integrate Method

Add keepalive directly into the developer's existing repository. Use when they prefer not to maintain a separate fork.

1. **Install dependency:**
   ```bash
   npm install node-appwrite
   ```

2. **Create the keepalive script** at `.github/scripts/keepalive.mjs`:

   ```javascript
   import { Client, Databases, Permission, Role } from "node-appwrite";

   const DB_ID = "keepalive";
   const COLL_ID = "heartbeats";
   const DOC_ID = "status";

   async function run() {
     const client = new Client()
       .setEndpoint(process.env.APPWRITE_ENDPOINT)
       .setProject(process.env.APPWRITE_PROJECT_ID)
       .setKey(process.env.APPWRITE_API_KEY);

     const db = new Databases(client);
     const ts = new Date().toISOString();

     // Ensure database
     try { await db.get({ databaseId: DB_ID }); }
     catch { await db.create({ databaseId: DB_ID, name: "Keepalive" }); }

     // Ensure collection
     try { await db.getCollection({ databaseId: DB_ID, collectionId: COLL_ID }); }
     catch {
       await db.createCollection({
         databaseId: DB_ID, collectionId: COLL_ID, name: "Heartbeats",
         permissions: [Permission.read(Role.any()), Permission.write(Role.any())],
         documentSecurity: false, enabled: true,
       });
       await db.createDatetimeAttribute({
         databaseId: DB_ID, collectionId: COLL_ID, key: "timestamp", required: true,
       });
       await db.createStringAttribute({
         databaseId: DB_ID, collectionId: COLL_ID, key: "source", size: 64, required: true,
       });
       await new Promise(r => setTimeout(r, 2000));
     }

     // Upsert heartbeat
     try {
       await db.updateDocument({
         databaseId: DB_ID, collectionId: COLL_ID, documentId: DOC_ID,
         data: { timestamp: ts, source: "github-actions" },
       });
     } catch {
       await db.createDocument({
         databaseId: DB_ID, collectionId: COLL_ID, documentId: DOC_ID,
         data: { timestamp: ts, source: "github-actions" },
         permissions: [Permission.read(Role.any())],
       });
     }

     console.log(`Heartbeat sent at ${ts}`);
   }

   run().catch(e => { console.error(e); process.exit(1); });
   ```

3. **Create the workflow** at `.github/workflows/keepalive.yml`:

   ```yaml
   name: Appwrite Keepalive

   on:
     schedule:
       - cron: "0 0 */5 * *"
     workflow_dispatch:

   jobs:
     keepalive:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: "20"
         - run: npm install node-appwrite
         - run: node .github/scripts/keepalive.mjs
           env:
             APPWRITE_ENDPOINT: ${{ secrets.APPWRITE_ENDPOINT }}
             APPWRITE_PROJECT_ID: ${{ secrets.APPWRITE_PROJECT_ID }}
             APPWRITE_API_KEY: ${{ secrets.APPWRITE_API_KEY }}
   ```

4. **Add GitHub Secrets** — Same as Path A, step 3.

5. **Commit and push** the new files.

## Multiple Projects

For multiple Appwrite projects, use a single `APPWRITE_PROJECTS` secret containing a JSON array:

```json
[
  { "endpoint": "https://fra.cloud.appwrite.io/v1", "projectId": "proj-1", "apiKey": "key-1", "name": "My App" },
  { "endpoint": "https://cloud.appwrite.io/v1", "projectId": "proj-2", "apiKey": "key-2", "name": "Other App" }
]
```

For the integrate method, update the script to parse `APPWRITE_PROJECTS` and loop over each config. The fork method supports this out of the box.

## Important Notes

- **Not against Appwrite ToS** — performs legitimate database writes, equivalent to any scheduled job.
- **5-day interval** provides a 2-day safety buffer before the 7-day pause threshold.
- Creates a `keepalive` database with a `heartbeats` collection — does not interfere with existing data.
- To intentionally pause a project, disable the GitHub Action workflow.
