# Quick Start Guide - The Triton Apartment Monitor

## Step 1: Configure Your Environment

Edit the `.env` file with your credentials:

```bash
# Already configured for The Triton Foster City
APARTMENT_URL=https://thetritonfostercity.com/lease-now
FLOOR_PLAN_NAME=Plan 1B
AVAILABILITY_TEXT=Available

# Gmail Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com          # ← Change this
SMTP_PASS=your-gmail-app-password       # ← Change this (get from https://myaccount.google.com/apppasswords)
EMAIL_FROM=your-email@gmail.com         # ← Change this
EMAIL_TO=recipient@example.com          # ← Change this

# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxx  # ← Change this
TWILIO_AUTH_TOKEN=your_auth_token       # ← Change this
TWILIO_PHONE_FROM=+1234567890           # ← Your Twilio number
TWILIO_PHONE_TO=+1234567890             # ← Your personal number

# Monitoring Configuration (already optimized)
CHECK_INTERVAL_MINUTES=30
REQUEST_DELAY_MS=2000
```

## Step 2: Test the Scraper

Before setting up notifications, test if the scraper works:

```bash
npm run test
```

Expected output:
```
Starting test...

Configuration loaded successfully
Monitoring: Plan 1B
URL: https://thetritonfostercity.com/lease-now

Checking availability...
Waiting for floor plan tiles to load...
Found 8 floor plans on the page
Found "Plan 1B": 4 Units Available

============================================================
RESULT:
============================================================
Floor Plan: Plan 1B
Available: YES ✓
Checked at: 3/5/2026, 2:30:00 PM
URL: https://thetritonfostercity.com/lease-now
============================================================
```

## Step 3: Run Locally (Testing)

Start the monitor on your computer:

```bash
npm start
```

This will:
1. Test your email and SMS connections
2. Perform an immediate availability check
3. Schedule checks every 30 minutes
4. Send notifications when availability changes

**Press Ctrl+C to stop**

## Step 4: Deploy to Cloud (Production)

Once testing works, deploy to run 24/7:

### Option A: GitHub Actions (FREE! ⭐ Recommended)

**Completely free monitoring using GitHub Actions!**

See **[GITHUB_ACTIONS_DEPLOYMENT.md](GITHUB_ACTIONS_DEPLOYMENT.md)** for detailed setup instructions.

**Quick Summary:**
1. Create a private GitHub repository
2. Add your credentials as GitHub Secrets
3. Push your code
4. Runs every 30 minutes automatically (2,000 free minutes/month)
5. View logs in GitHub Actions tab

**Pros:**
- ✅ **100% FREE** (no credit card needed)
- ✅ Zero infrastructure management
- ✅ Automatic state tracking via git commits
- ✅ Easy to view logs and history

**Cons:**
- ⚠️ GitHub IPs occasionally blocked by some sites (rare)
- ⚠️ Private repos limited to 2,000 minutes/month (use public repo for unlimited)

### Option B: Heroku

1. Install Heroku CLI:
```bash
brew install heroku/brew/heroku
```

2. Login and create app:
```bash
heroku login
heroku create triton-apartment-monitor
```

3. Add buildpacks:
```bash
heroku buildpacks:add jontewks/puppeteer
heroku buildpacks:add heroku/nodejs
```

4. Set environment variables:
```bash
heroku config:set APARTMENT_URL="https://thetritonfostercity.com/lease-now"
heroku config:set FLOOR_PLAN_NAME="Plan 1B"
heroku config:set SMTP_USER="your-email@gmail.com"
heroku config:set SMTP_PASS="your-app-password"
# ... set all other variables
```

5. Create `Procfile`:
```bash
echo "worker: npm start" > Procfile
```

6. Deploy:
```bash
git init
git add .
git commit -m "Initial deployment"
git push heroku main
heroku ps:scale worker=1
```

7. View logs:
```bash
heroku logs --tail
```

### Option C: Run on Your Computer 24/7

Use PM2 to keep it running:

```bash
npm install -g pm2
pm2 start npm --name "apartment-monitor" -- start
pm2 save
pm2 startup  # Follow the instructions to enable startup on boot
```

## Common Floor Plans at The Triton

Available options for `FLOOR_PLAN_NAME`:
- `Plan 1B` - 1BR/1BA (801 sq ft)
- `Plan 2A` - 2BR/2BA
- `Plan 2B` - 2BR/2BA
- `Plan 2C` - 2BR/2BA
- `Plan 3A` - 3BR/2BA
- `Plan 3B` - 3BR/2BA
- `Plan 3C` - 3BR/2BA

## Troubleshooting

### Test fails with "Floor plan not found"
- Check the exact name on the website
- Make sure the URL is correct
- The website might be down

### Connection test fails
- **Email:** Verify Gmail app password (not your regular password)
- **SMS:** Check Twilio credentials and account balance

### No notifications received
- Check state.json - if status was already available, you won't get notified
- Delete state.json to reset and test again
- Check spam folder for emails

## Files Created

```
triton_apartment/
├── src/                    # TypeScript source code
├── dist/                   # Compiled JavaScript
├── .env                    # Your credentials (DON'T commit!)
├── state.json             # Tracks last availability status
└── node_modules/          # Dependencies
```

## Need Help?

See the main README.md for detailed documentation.
