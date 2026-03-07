# Apartment Availability Monitor

A TypeScript/Node.js application that monitors apartment website for floor plan availability and sends email + SMS notifications when apartments become available.

**🎉 Deploy for FREE using GitHub Actions!** See [GITHUB_ACTIONS_DEPLOYMENT.md](GITHUB_ACTIONS_DEPLOYMENT.md)

## Features

- **Automated Monitoring**: Checks apartment availability every 30 minutes (configurable)
- **Multiple Floor Plans**: Monitor 1-10+ floor plans simultaneously at no extra cost
- **Dual Notifications**: Sends both email and SMS alerts when availability is detected
- **Error Alerts**: Automatic email notifications if website is down or rate limited ([docs](ERROR_NOTIFICATIONS.md))
- **Rate Limiting**: Built-in delays and proper user-agent headers to respect website policies
- **State Management**: Tracks previous availability status to avoid duplicate notifications
- **Headless Browser**: Uses Puppeteer for reliable web scraping with JavaScript rendering
- **FREE Deployment**: GitHub Actions, Heroku, AWS Lambda, or run locally
- **Zero-Cost Option**: Deploy to GitHub Actions with public repo for unlimited free monitoring

## Prerequisites

- Node.js 16+ and npm (for local development)
- Gmail account (or SMTP server) for email notifications
- Twilio account for SMS notifications (optional)
- GitHub account (for free cloud deployment)

## Installation

1. Clone or navigate to the project directory:
```bash
cd triton_apartment
```

2. Install dependencies (already done):
```bash
npm install
```

3. Create a `.env` file from the example:
```bash
cp .env.example .env
```

4. Configure your `.env` file with the following settings:

### Apartment Website Configuration

```env
APARTMENT_URL=https://thetritonfostercity.com/lease-now
FLOOR_PLAN_NAME=Plan 1B
AVAILABILITY_TEXT=Available
```

**Configuration for The Triton Foster City:**
- The script automatically detects all floor plans on the page
- Set `FLOOR_PLAN_NAME` to the specific plan you want (e.g., "Plan 1B", "Plan 2A", "Plan 3C")
- Available floor plans at The Triton typically include:
  - Plan 1B (1BR/1BA, 801 sq ft)
  - Plan 2A, 2B, 2C (2BR/2BA)
  - Plan 3A, 3B, 3C (3BR/2BA)
- The script checks if the text "Available" appears in the availability status
- Works with text like "4 Units Available", "Now Available", etc.

**Example HTML structure from The Triton:**
```html
<div class="floorplan-tile-content">
  <h3 class="floorplan-title">Plan 1B</h3>
  <p class="floorplan-details">1 BR / 1 BA, 801 sq ft</p>
  <p class="floorplan-availability">4 Units Available</p>
</div>
```

### Email Configuration (Gmail)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_TO=recipient@example.com
```

**Gmail setup:**
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the 16-character app password in `SMTP_PASS`

### Twilio Configuration

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_FROM=+1234567890
TWILIO_PHONE_TO=+1234567890
```

**Twilio setup:**
1. Sign up at https://www.twilio.com/
2. Get a phone number from the console
3. Find your Account SID and Auth Token in the dashboard
4. Set `TWILIO_PHONE_FROM` to your Twilio number
5. Set `TWILIO_PHONE_TO` to your personal number

## Usage

### Testing (Recommended First Step)

Before running the full monitoring system, test that the scraper can correctly access the website:

```bash
npm run test
```

This will:
- Load your configuration from `.env`
- Navigate to the apartment website
- Find all floor plans
- Check availability for your specific floor plan
- Display the result without sending notifications

**Important:** Make sure your `.env` file is configured with at least:
- `APARTMENT_URL`
- `FLOOR_PLAN_NAME`
- Other notification settings can be temporary for testing

### Development

Build and run the full monitoring application:

```bash
npm run dev
```

### Production

Build the TypeScript code:

```bash
npm run build
```

Start the monitor:

```bash
npm start
```

The monitor will:
1. Test email and SMS connections on startup
2. Perform an immediate availability check
3. Continue checking every 30 minutes
4. Send notifications when availability status changes to "available"

## Project Structure

```
triton_apartment/
├── src/
│   ├── index.ts          # Main application with scheduler
│   ├── scraper.ts        # Web scraping with Puppeteer
│   ├── notifier.ts       # Email and SMS notifications
│   ├── config.ts         # Environment configuration
│   └── types.ts          # TypeScript type definitions
├── dist/                 # Compiled JavaScript (generated)
├── .env                  # Environment variables (not in git)
├── .env.example          # Environment template
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── state.json            # Persisted state (generated)
```

## Cloud Deployment

**📚 Deployment Guides:**
- **[GitHub Actions (FREE)](GITHUB_ACTIONS_DEPLOYMENT.md)** - Recommended for zero-cost deployment
- **[Deployment Comparison](DEPLOYMENT_COMPARISON.md)** - Compare all options
- **[Quick Start Guide](QUICKSTART.md)** - Step-by-step setup

### Option 1: GitHub Actions (FREE ⭐ Recommended)

**Completely free monitoring using GitHub Actions!**

See **[GITHUB_ACTIONS_DEPLOYMENT.md](GITHUB_ACTIONS_DEPLOYMENT.md)** for complete instructions.

Quick steps:
1. Create GitHub repository (public for unlimited free minutes)
2. Add credentials as GitHub Secrets
3. Push code to repository
4. Workflow runs automatically every 30 minutes

**Cost:** $0/month (unlimited for public repos)

### Option 2: Heroku

1. Install Heroku CLI and login:
```bash
heroku login
```

2. Create a new Heroku app:
```bash
heroku create your-apartment-monitor
```

3. Add Puppeteer buildpack:
```bash
heroku buildpacks:add jontewks/puppeteer
heroku buildpacks:add heroku/nodejs
```

4. Set environment variables:
```bash
heroku config:set APARTMENT_URL="https://..."
heroku config:set AVAILABILITY_SELECTOR=".availability"
# ... set all other variables from .env
```

5. Deploy:
```bash
git init
git add .
git commit -m "Initial commit"
git push heroku main
```

6. Scale to keep one dyno running:
```bash
heroku ps:scale worker=1
```

Add this to `package.json`:
```json
"scripts": {
  "start": "node dist/index.js"
},
"engines": {
  "node": "20.x"
}
```

Create `Procfile`:
```
worker: npm start
```

### Option 3: AWS Lambda (with EventBridge)

1. Install Serverless Framework:
```bash
npm install -g serverless
```

2. Create `serverless.yml`:
```yaml
service: apartment-monitor

provider:
  name: aws
  runtime: nodejs20.x
  environment:
    APARTMENT_URL: ${env:APARTMENT_URL}
    # ... add all env variables

functions:
  check:
    handler: dist/lambda.handler
    timeout: 60
    events:
      - schedule: rate(30 minutes)

plugins:
  - serverless-plugin-typescript
```

3. Create `src/lambda.ts`:
```typescript
import { ApartmentMonitor } from './index';

export const handler = async () => {
  const monitor = new ApartmentMonitor();
  await monitor.checkAndNotify();
};
```

4. Deploy:
```bash
serverless deploy
```

### Option 4: Digital Ocean App Platform

1. Connect your GitHub repository
2. Set environment variables in the dashboard
3. Deploy with auto-scaling

## Configuration Options

| Variable | Description | Default |
|----------|-------------|---------|
| `CHECK_INTERVAL_MINUTES` | Minutes between checks | 30 |
| `REQUEST_DELAY_MS` | Delay before each request (rate limiting) | 2000 |

## Troubleshooting

### Connection Test Failures

If the connection test fails on startup:

**Email errors:**
- Verify SMTP credentials
- Check if 2FA is enabled and app password is correct
- Ensure less secure app access is NOT needed (use app passwords)

**SMS errors:**
- Verify Twilio Account SID and Auth Token
- Check phone number format (+1234567890)
- Ensure Twilio account has sufficient balance

### Selector Not Found

If the scraper can't find the availability element:
1. Verify the URL loads correctly
2. Check if the website requires login
3. Inspect the HTML structure - it may have changed
4. Try a different selector or use the browser's Copy Selector feature

### Puppeteer Issues on Cloud

If Puppeteer fails in cloud environments:
- Add the Puppeteer buildpack (Heroku)
- Use `puppeteer-core` with Chrome binary
- Increase memory allocation
- Use serverless-chrome layer (AWS Lambda)

## State Management

The application maintains state in `state.json`:
```json
{
  "lastAvailabilityStatus": false,
  "lastCheckTime": "2024-01-15T10:30:00.000Z",
  "notificationCount": 5
}
```

This prevents duplicate notifications and tracks monitoring history.

## Development

Watch mode for development:
```bash
npm run watch
```

This will recompile TypeScript files automatically on changes.

## License

ISC

## Support

For issues or questions, check the logs and state file for debugging information.
