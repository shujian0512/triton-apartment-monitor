# GitHub Actions Configuration

This directory contains the GitHub Actions workflow for automated apartment monitoring.

## Workflow File

`.github/workflows/monitor.yml` - Runs every 30 minutes to check apartment availability

## How It Works

1. **Trigger**: Runs on schedule (every 30 minutes), manual trigger, or push to main
2. **Setup**: Installs Node.js, dependencies, and Puppeteer requirements
3. **Configure**: Creates `.env` from GitHub Secrets
4. **Execute**: Runs `check-once.js` to check availability
5. **Persist**: Commits updated `state.json` back to repository

## Required Secrets

Configure these in **Settings → Secrets and variables → Actions**:

### Apartment Configuration
- `APARTMENT_URL`
- `FLOOR_PLAN_NAME`
- `AVAILABILITY_TEXT`

### Email Configuration
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`
- `EMAIL_TO`

### SMS Configuration (Optional)
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_FROM`
- `TWILIO_PHONE_TO`

## Manual Trigger

1. Go to **Actions** tab
2. Select **Apartment Availability Monitor**
3. Click **Run workflow**
4. Click **Run workflow** button

## Viewing Logs

1. Go to **Actions** tab
2. Click on any workflow run
3. Click **check-availability** job
4. Expand steps to see output

## State Tracking

The workflow commits `state.json` after each run to track:
- Last availability status
- Last check timestamp
- Total notifications sent

## Modifying Schedule

Edit the cron expression in `monitor.yml`:

```yaml
schedule:
  - cron: '*/30 * * * *'  # Every 30 minutes
```

Common schedules:
- `0 */1 * * *` - Every hour
- `0 */2 * * *` - Every 2 hours
- `0 9-17 * * *` - Every hour from 9 AM to 5 PM
- `*/15 * * * *` - Every 15 minutes

## Cost

**Private Repository:**
- 2,000 free minutes/month
- ~3 minutes per run
- 48 runs/day = 4,320 min/month
- **Exceeds free tier** - consider running hourly or making repo public

**Public Repository:**
- Unlimited free minutes
- Recommended for this use case

## Troubleshooting

### Workflow Not Running

1. Check if Actions is enabled (Settings → Actions)
2. Verify workflow file syntax is correct
3. Check for errors in Actions tab

### Permission Errors

Go to **Settings → Actions → General → Workflow permissions**:
- Select "Read and write permissions"
- Save

### Secrets Not Working

1. Verify all secrets are set (no typos)
2. Secret names are case-sensitive
3. Re-create secrets if needed

## Performance

Each run takes approximately:
- Browser startup: ~30 seconds
- Page load: ~10 seconds
- Scraping: ~5 seconds
- Notifications (if sent): ~5 seconds
- Commit state: ~5 seconds
- **Total: ~2-3 minutes per run**
