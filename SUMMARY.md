# Project Summary

## What This Does

Monitors **The Triton Foster City** apartment website for availability of **Plan 1B** (or any floor plan you choose) and sends you **email notifications** when units become available.

## Current Status

✅ **Fully Functional and Tested**

- Web scraper working perfectly (finds Plan 1B on https://thetritonfostercity.com/lease-now)
- Email notifications working (Gmail SMTP configured)
- SMS notifications optional (Twilio not configured, but system works without it)
- GitHub Actions deployment ready

## Quick Commands

```bash
# Test the scraper (no notifications)
npm run test

# Test email notifications
npm run test:notifications

# Run a single check with notifications
npm run check

# Run continuously (local, every 30 min)
npm start
```

## Deployment Status

### ✅ Ready to Deploy

**Recommended: GitHub Actions (FREE)**

1. Create GitHub repository
2. Add these secrets in GitHub Settings:
   - `APARTMENT_URL`: `https://thetritonfostercity.com/lease-now`
   - `FLOOR_PLAN_NAME`: `Plan 1B`
   - `AVAILABILITY_TEXT`: `Available`
   - `SMTP_HOST`: `smtp.gmail.com`
   - `SMTP_PORT`: `587`
   - `SMTP_SECURE`: `false`
   - `SMTP_USER`: `your-email@gmail.com`
   - `SMTP_PASS`: `your-gmail-app-password`
   - `EMAIL_FROM`: `your-email@gmail.com`
   - `EMAIL_TO`: `recipient@example.com`
   - `TWILIO_ACCOUNT_SID`: (any value)
   - `TWILIO_AUTH_TOKEN`: (any value)
   - `TWILIO_PHONE_FROM`: (any value)
   - `TWILIO_PHONE_TO`: (any value)

3. Push code to repository
4. Workflow runs automatically every 30 minutes

See [GITHUB_ACTIONS_DEPLOYMENT.md](GITHUB_ACTIONS_DEPLOYMENT.md) for detailed instructions.

## Files Structure

```
triton_apartment/
├── .github/
│   └── workflows/
│       └── monitor.yml           # GitHub Actions workflow
├── src/
│   ├── index.ts                  # Continuous monitoring (cron-based)
│   ├── check-once.ts             # Single check (for GitHub Actions)
│   ├── scraper.ts                # Web scraping logic
│   ├── notifier.ts               # Email/SMS notifications
│   ├── config.ts                 # Configuration loader
│   ├── types.ts                  # TypeScript types
│   ├── test.ts                   # Scraper test
│   └── test-notifications.ts     # Notification test
├── .env                          # Your credentials (not committed)
├── .env.example                  # Template
├── state.json                    # Tracks availability state
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── README.md                     # Technical documentation
├── QUICKSTART.md                 # Quick setup guide
├── GITHUB_ACTIONS_DEPLOYMENT.md  # GitHub Actions guide
├── DEPLOYMENT_COMPARISON.md      # Compare all deployment options
└── SUMMARY.md                    # This file
```

## How It Works

### 1. Scraping Process

1. Launches headless Chrome browser (Puppeteer)
2. Navigates to https://thetritonfostercity.com/lease-now
3. Finds all floor plan tiles (currently 26 plans)
4. Searches for "Plan 1B" in the list
5. Extracts availability text (e.g., "4 Units Available")
6. Checks if text contains "Available"

### 2. Notification Logic

- **First Run:** If apartment is available, sends notification
- **Subsequent Runs:** Only sends notification when status changes from unavailable → available
- **State Tracking:** Saves status in `state.json` to prevent spam

### 3. Current Availability

**As of last check:**
- Floor Plan: Plan 1B (1BR/1BA, 801 sq ft)
- Status: **AVAILABLE** ✓
- Units: 4 units available
- You've already received 1 notification email

## Cost Breakdown

### GitHub Actions (Recommended)

**Free Tier:**
- 2,000 minutes/month (private repo)
- Unlimited (public repo)

**Current Usage:**
- 48 checks/day × 3 min/check = 144 min/day
- 4,320 min/month (exceeds private repo limit)

**Solution:**
- **Option A:** Make repo public (unlimited FREE)
- **Option B:** Run hourly instead of every 30 min (2,160 min/month - fits free tier)

**Our Recommendation:** Public repo for unlimited free monitoring

### Alternative Options

| Option | Monthly Cost |
|--------|--------------|
| GitHub Actions (public repo) | $0 |
| GitHub Actions (private, hourly) | $0 |
| Local with PM2 | $0-2 (electricity) |
| Heroku | $7 |
| AWS Lambda | $0.21 |

## Next Steps

### To Deploy to GitHub Actions:

1. **Create GitHub Repository**
   ```bash
   # On github.com
   New repository → triton-apartment-monitor
   Choose: Public (for free unlimited minutes)
   Don't initialize with README
   ```

2. **Add Secrets**
   - Repository Settings → Secrets and variables → Actions
   - Add all secrets listed above

3. **Push Code**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/triton-apartment-monitor.git
   git branch -M main
   git push -u origin main
   ```

4. **Verify**
   - Go to Actions tab
   - Should see workflow running
   - Check logs for success

### To Run Locally:

```bash
# One-time check
npm run build
npm run check

# Continuous monitoring
npm start

# Keep running with PM2
npm install -g pm2
pm2 start npm --name "apartment" -- start
pm2 save
```

## Monitoring & Logs

### GitHub Actions
- View logs: Repository → Actions tab → Click on run
- Manual trigger: Actions → Apartment Availability Monitor → Run workflow
- State history: View `state.json` file in repository

### Local
- Console output shows all logs
- State saved in local `state.json` file

## Troubleshooting

### No Email Received

1. Check spam folder
2. Verify Gmail app password (no spaces!)
3. Run `npm run test:notifications` to test
4. Check GitHub Actions logs for errors

### "Floor Plan Not Found"

1. Verify floor plan name in config (`Plan 1B`)
2. Check website hasn't changed
3. Run `npm run test` locally to debug

### GitHub Actions Not Running

1. Verify Actions is enabled (Settings → Actions)
2. Check workflow permissions (Settings → Actions → General → Read/write)
3. Look for error messages in Actions tab

## Configuration

### Change Floor Plan

Edit `.env` or GitHub Secret:
```
FLOOR_PLAN_NAME=Plan 2A
```

Available plans at The Triton:
- Plan 1B (1BR/1BA)
- Plan 2A, 2B, 2C (2BR/2BA)
- Plan 3A, 3B, 3C (3BR/2BA)

### Change Check Frequency

**GitHub Actions:** Edit `.github/workflows/monitor.yml`
```yaml
schedule:
  - cron: '0 */1 * * *'  # Every hour
```

**Local:** Edit `.env`
```
CHECK_INTERVAL_MINUTES=60
```

## Security Notes

- ✅ Gmail app password used (not real password)
- ✅ `.env` file not committed to git
- ✅ GitHub Secrets encrypted
- ✅ No sensitive data in state.json
- ⚠️ Don't share your app password

## Support

**Documentation:**
- Full guide: [README.md](README.md)
- Quick start: [QUICKSTART.md](QUICKSTART.md)
- GitHub Actions: [GITHUB_ACTIONS_DEPLOYMENT.md](GITHUB_ACTIONS_DEPLOYMENT.md)
- Comparison: [DEPLOYMENT_COMPARISON.md](DEPLOYMENT_COMPARISON.md)

**Common Issues:**
- Check logs in GitHub Actions tab
- Run `npm run test` locally to debug
- Verify all secrets are set correctly

## Success Metrics

✅ Scraper finds floor plans: **26 plans detected**
✅ Targets correct plan: **Plan 1B found**
✅ Detects availability: **"4 Units Available" ✓**
✅ Email working: **Test email sent successfully**
✅ GitHub Actions ready: **Workflow configured**

**You're all set!** 🎉

Deploy to GitHub Actions and start monitoring for free!
