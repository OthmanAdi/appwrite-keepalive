# appwrite-keepalive

Keep your Appwrite free-tier projects alive. Automated. Zero infrastructure.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/OthmanAdi/appwrite-keepalive?style=social)](https://github.com/OthmanAdi/appwrite-keepalive)

---

## Why This Exists

Starting February 27th, 2026, Appwrite pauses free-tier projects with no development activity for 7 consecutive days.

> "Projects on the Free plan with no development activity for 7 consecutive days will be automatically paused."
> — [Appwrite](https://appwrite.io/pricing)

**appwrite-keepalive** sends a heartbeat to your project every 5 days via GitHub Actions. Your project stays active. No manual intervention. No infrastructure to maintain.

---

## Quick Start

### 1. Fork This Repository

Click the **Fork** button at the top right of this page.

### 2. Create an Appwrite API Key

In your [Appwrite Console](https://cloud.appwrite.io/):

1. Go to your project → **Settings** → **API Keys**
2. Click **Create API Key**
3. Name it `keepalive`
4. Under **Scopes**, expand **Databases** and check **all database scopes** (or just enable the entire Databases category)
5. Click **Create**
6. Copy the API key (you won't see it again)

### 3. Add GitHub Secrets

In your forked repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add these secrets:

| Secret | Value |
|--------|-------|
| `APPWRITE_ENDPOINT` | Your API endpoint (see below) |
| `APPWRITE_PROJECT_ID` | Your project ID |
| `APPWRITE_API_KEY` | The API key you created |

**Finding your endpoint:** Your endpoint depends on your region:
- `https://cloud.appwrite.io/v1` (US)
- `https://fra.cloud.appwrite.io/v1` (Frankfurt, Germany)
- `https://nyc.cloud.appwrite.io/v1` (New York)

Check your Appwrite Console → Settings → Overview for the exact endpoint.

### 4. Enable the Workflow

1. Go to **Actions** tab in your forked repo
2. Click **I understand my workflows, go ahead and enable them**
3. Select **Appwrite Keepalive** workflow
4. Click **Run workflow** → **Run workflow** (to test immediately)

Done. Your project will receive a heartbeat every 5 days automatically.

---

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│              GITHUB ACTIONS                             │
│              Runs every 5 days (cron: 0 0 */5 * *)     │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              appwrite-keepalive                         │
│                                                         │
│  1. Connects to your Appwrite project                  │
│  2. Creates "keepalive" database (if needed)           │
│  3. Creates "heartbeats" collection (if needed)        │
│  4. Writes/updates a heartbeat document                │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              YOUR APPWRITE PROJECT                      │
│                                                         │
│  Database: keepalive                                    │
│  Collection: heartbeats                                 │
│  Document: { timestamp: "...", source: "github-actions" }│
│                                                         │
│  ✅ Activity detected → Project NOT paused             │
└─────────────────────────────────────────────────────────┘
```

The heartbeat is a real database write operation. Appwrite registers this as development activity.

---

## Multiple Projects

To keep multiple projects alive with a single GitHub Action:

1. Create API keys for each project (see step 2 above)
2. Add a single secret `APPWRITE_PROJECTS` with this JSON format:

```json
[
  {
    "endpoint": "https://cloud.appwrite.io/v1",
    "projectId": "project-1-id",
    "apiKey": "project-1-api-key",
    "name": "My App"
  },
  {
    "endpoint": "https://cloud.appwrite.io/v1",
    "projectId": "project-2-id",
    "apiKey": "project-2-api-key",
    "name": "My Other App"
  }
]
```

The `name` field is optional but helps identify projects in logs.

---

## Local Usage

You can also run this locally or on any server:

```bash
# Clone the repo
git clone https://github.com/OthmanAdi/appwrite-keepalive.git
cd appwrite-keepalive

# Install dependencies
bun install

# Set environment variables
export APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"
export APPWRITE_PROJECT_ID="your-project-id"
export APPWRITE_API_KEY="your-api-key"

# Run keepalive
bun run keepalive
```

---

## FAQ

**Is this against Appwrite's Terms of Service?**

No. This tool performs legitimate database operations. It's functionally equivalent to having any scheduled job in your application that writes to the database. There's no exploitation or abuse—just a minimal heartbeat to indicate the project is in use.

**Why GitHub Actions?**

- Free (2,000 minutes/month on the free tier)
- Reliable (runs on schedule without your intervention)
- No infrastructure to maintain
- Easy to set up (fork, add secrets, done)

**Why every 5 days?**

Appwrite pauses projects after 7 days of inactivity. Running every 5 days provides a 2-day buffer in case a scheduled run fails or is delayed.

**Can I change the schedule?**

Yes. Edit `.github/workflows/keepalive.yml` and modify the cron expression:

```yaml
on:
  schedule:
    - cron: "0 0 */5 * *"  # Change this
```

Use [crontab.guru](https://crontab.guru/) to build your desired schedule.

**What if I want to pause my project intentionally?**

Disable the GitHub Action:
1. Go to **Actions** → **Appwrite Keepalive**
2. Click **...** → **Disable workflow**

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT License — [Ahmad Othman Ammar Adi](https://github.com/OthmanAdi)

---

## Acknowledgments

- Inspired by [supabase-pause-prevention](https://github.com/travisvn/supabase-pause-prevention)
- Thanks to [Appwrite](https://appwrite.io) for the platform
