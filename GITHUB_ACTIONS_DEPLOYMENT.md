# GitHub Actions Deployment Guide

Deploy your apartment monitor to GitHub Actions for **FREE** 24/7 monitoring!

## Why GitHub Actions?

- ✅ **Completely Free** - 2,000 minutes/month for private repos (unlimited for public)
- ✅ **No Server Required** - Zero infrastructure to manage
- ✅ **Automatic State Tracking** - Commits state.json to track availability changes
- ✅ **Easy to Monitor** - View logs directly in GitHub UI
- ✅ **Manual Triggers** - Run checks on-demand from GitHub
- ⚠️ **Limitation** - Some apartment sites may block GitHub IPs (rare for The Triton)

## Setup Instructions

### Step 1: Create a GitHub Repository

1. Go to https://github.com/new
2. Create a **private** repository (e.g., `triton-apartment-monitor`)
3. Don't initialize with README (we'll push existing code)

### Step 2: Configure Repository Secrets

In your GitHub repository, go to **Settings → Secrets and variables → Actions → New repository secret**

Add the following secrets (one by one):

| Secret Name | Value | Example |
|-------------|-------|---------|
| `APARTMENT_URL` | The apartment website URL | `https://thetritonfostercity.com/lease-now` |
| `FLOOR_PLAN_NAMES` | Floor plans to monitor (comma-separated for multiple) | `Plan 1B, Plan 2A` or just `Plan 1B` |
| `AVAILABILITY_TEXT` | Text indicating availability | `Available` |
| `SMTP_HOST` | Email server | `smtp.gmail.com` |
| `SMTP_PORT` | Email port | `587` |
| `SMTP_SECURE` | Use secure connection | `false` |
| `SMTP_USER` | Your Gmail address | `your-email@gmail.com` |
| `SMTP_PASS` | Gmail app password | `your-gmail-app-password` (get from https://myaccount.google.com/apppasswords) |
| `EMAIL_FROM` | Sender email | `your-email@gmail.com` |
| `EMAIL_TO` | Recipient email | `recipient@example.com` |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID (optional) | `ACxxxxxxxxx` or leave empty |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token (optional) | `your_token` or leave empty |
| `TWILIO_PHONE_FROM` | Twilio phone number (optional) | `+1234567890` or leave empty |
| `TWILIO_PHONE_TO` | Your phone number (optional) | `+1234567890` or leave empty |

**Notes:**
- If you don't want SMS notifications, just put any placeholder value for the Twilio secrets
- **Multiple Floor Plans:** Use comma-separated values in `FLOOR_PLAN_NAMES`, e.g., `Plan 1B, Plan 2A, Plan 2B` (see [MULTIPLE_FLOOR_PLANS.md](MULTIPLE_FLOOR_PLANS.md))

### Step 3: Push Code to GitHub

From your project directory:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Apartment availability monitor"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/triton-apartment-monitor.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 4: Enable Actions

1. Go to your repository on GitHub
2. Click the **Actions** tab
3. If prompted, click "I understand my workflows, go ahead and enable them"

### Step 5: Verify It's Working

The workflow will automatically:
- Run every 30 minutes (starts immediately after push)
- Check The Triton website for Plan 1B availability
- Send email notifications when status changes
- Commit the state to `state.json`

**To manually trigger a check:**
1. Go to **Actions** tab
2. Click **Apartment Availability Monitor** workflow
3. Click **Run workflow** → **Run workflow**

## How It Works

### Workflow Schedule

The workflow runs on three triggers:

1. **Scheduled** - Every 30 minutes via cron: `*/30 * * * *`
2. **Manual** - Click "Run workflow" in GitHub UI
3. **On Push** - When you push to main branch (for testing)

### State Persistence

After each check, the workflow commits `state.json` to your repository:

```json
{
  "lastAvailabilityStatus": false,
  "lastCheckTime": "2026-03-05T22:30:00.000Z",
  "notificationCount": 3
}
```

This prevents duplicate notifications and tracks your monitoring history.

### Logs

View execution logs:
1. Go to **Actions** tab
2. Click on any workflow run
3. Click **check-availability** job
4. Expand steps to see detailed logs

## Monitoring Your GitHub Actions

### View Run History

- **Actions** tab shows all workflow runs
- Green checkmark = successful check
- Red X = failed (check logs for errors)

**📋 See [GITHUB_ACTIONS_LOGS.md](GITHUB_ACTIONS_LOGS.md) for complete log examples and what to look for!**

### Check Recent Activity

```bash
# Clone your repo to see state history
git clone https://github.com/YOUR_USERNAME/triton-apartment-monitor.git
cd triton-apartment-monitor
git log --all --oneline -- state.json
```

### Email Notifications

You'll receive emails when:
- First run and apartment is available
- Status changes from unavailable → available
- You won't get emails for every check (only on status change)

## Troubleshooting

### Workflow Not Running

**Problem:** No runs appear after 30 minutes

**Solution:**
1. Check Actions tab is enabled
2. Verify secrets are set correctly
3. Look for error messages in Actions tab
4. Manually trigger to test

### Email Not Sending

**Problem:** Check succeeds but no email received

**Solutions:**
1. Verify Gmail app password in secrets (no spaces!)
2. Check spam folder
3. Manually run workflow and check logs
4. Test locally first: `npm run test:notifications`

### GitHub IP Blocked

**Problem:** Logs show "Access Denied" or 403 errors

**Solutions:**
1. The Triton usually doesn't block GitHub IPs
2. If blocked, consider:
   - Adding a delay: increase `REQUEST_DELAY_MS` in workflow
   - Using a proxy service (costs money)
   - Switching to local deployment with PM2

### State Not Updating

**Problem:** state.json not being committed

**Solutions:**
1. Check workflow has write permissions:
   - Go to **Settings → Actions → General**
   - Scroll to "Workflow permissions"
   - Select "Read and write permissions"
   - Save

## Cost Analysis

### Free Tier Limits

**Private Repository:**
- 2,000 minutes/month free
- Each check takes ~2-3 minutes
- Runs every 30 minutes = 48 runs/day = 1,440 runs/month
- Estimated usage: ~4,320 minutes/month
- **You'll need to upgrade** or use a public repo

**Public Repository:**
- **Unlimited minutes** (completely free!)
- Only downside: your code is public (secrets stay private)

### Recommendation

**Option 1: Make Repository Public**
```bash
# In repository Settings → Danger Zone → Change visibility → Public
```
- Completely free forever
- Secrets remain private
- Your monitoring logic is visible (not a security issue)

**Option 2: Upgrade to GitHub Pro**
- $4/month for 3,000 minutes
- Still cheaper than any cloud hosting

**Option 3: Run Less Frequently**
- Change cron to `0 */1 * * *` (every hour)
- Reduces to ~720 runs/month (~2,160 minutes)
- Fits in free tier!

## Modifying the Schedule

Edit `.github/workflows/monitor.yml`:

```yaml
schedule:
  # Every hour
  - cron: '0 */1 * * *'

  # Every 2 hours
  - cron: '0 */2 * * *'

  # Only during business hours (9 AM - 5 PM PST)
  - cron: '0 9-17 * * *'

  # Every 15 minutes (aggressive)
  - cron: '*/15 * * * *'
```

After changing, commit and push:
```bash
git add .github/workflows/monitor.yml
git commit -m "Update monitoring schedule"
git push
```

## Stopping the Monitor

### Temporarily Pause
1. Go to **Actions** tab
2. Click workflow name
3. Click "..." menu → **Disable workflow**

### Permanently Stop
1. Delete `.github/workflows/monitor.yml`
2. Or delete the entire repository

## Advanced: Monitoring Multiple Floor Plans

To monitor multiple floor plans, duplicate the workflow file:

```bash
cp .github/workflows/monitor.yml .github/workflows/monitor-plan2a.yml
```

Edit the new file and change the `FLOOR_PLAN_NAME` secret reference.

## Security Notes

- ✅ Secrets are encrypted and never exposed in logs
- ✅ State file doesn't contain sensitive data
- ✅ Email/SMS credentials stay in GitHub Secrets
- ⚠️ Don't commit `.env` file (already in .gitignore)
- ⚠️ Use app passwords, not your real Gmail password

## Summary

**Total Setup Time:** ~10 minutes

**Monthly Cost:** $0 (if using public repo or running hourly)

**Maintenance:** Zero - just check your email for alerts

This is the **perfect solution** for apartment hunting without spending money on cloud infrastructure!
