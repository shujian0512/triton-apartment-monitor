# Error Notifications

The monitor automatically sends you an email alert whenever it encounters an error. This helps you stay informed about any issues without having to check GitHub Actions logs manually.

## When You'll Get Alerts

You'll receive an email notification for:

### 🌐 Website Unreachable
**When:** The apartment website is down or unreachable
**Email Subject:** `⚠️ Apartment Monitor Error: 🌐 Website Unreachable`

**What it means:**
- The website may be temporarily down
- Network connectivity issues
- DNS resolution problems

**What to do:**
- Usually nothing - the monitor will retry automatically in 30 minutes
- Check if the website is accessible manually
- If it persists for 24+ hours, the website URL may have changed

### ⚠️ Rate Limited
**When:** Too many requests to the apartment website
**Email Subject:** `⚠️ Apartment Monitor Error: ⚠️ Rate Limited`

**What it means:**
- The website is limiting the number of requests
- GitHub Actions IP may be temporarily blocked
- Checking too frequently

**What to do:**
- Nothing - rate limits usually clear within an hour
- The monitor will automatically retry
- If frequent, consider running hourly instead of every 30 minutes

### ⏱️ Connection Timeout
**When:** Website takes too long to respond
**Email Subject:** `⚠️ Apartment Monitor Error: ⏱️ Connection Timeout`

**What it means:**
- Website is slow or under heavy load
- Temporary performance issues

**What to do:**
- Nothing - this is usually temporary
- The monitor will retry automatically

### 🚫 Access Blocked
**When:** Website is blocking the monitor's requests
**Email Subject:** `⚠️ Apartment Monitor Error: 🚫 Access Blocked`

**What it means:**
- Bot detection triggered
- GitHub Actions IP temporarily blocked
- Firewall or security rules changed

**What to do:**
- Wait - blocks usually clear within hours
- If persistent, may need to switch to local monitoring
- The monitor will keep trying automatically

### 🔍 Floor Plan Not Found
**When:** Configured floor plan name doesn't exist
**Email Subject:** `⚠️ Apartment Monitor Error: 🔍 Floor Plan Not Found`

**What it means:**
- Floor plan name changed on website
- Typo in your configuration
- Floor plan was removed

**What to do:**
- Check the website for current floor plan names
- Update `FLOOR_PLAN_NAMES` secret in GitHub
- Run `npm run test` locally to see available plans

### 🎯 Website Structure Changed
**When:** Website HTML structure has changed
**Email Subject:** `⚠️ Apartment Monitor Error: 🎯 Website Structure Changed`

**What it means:**
- Website was redesigned
- HTML elements changed
- Selectors no longer work

**What to do:**
- The code may need updates
- Contact support or check for updates
- This requires manual intervention

## Example Error Email

You'll receive a detailed email like this:

```
⚠️ Apartment Monitor Error Alert

⚠️ Rate Limited
The apartment website is rate limiting our requests. Too many checks in a short period.

Time: 3/6/2026, 11:30:00 AM
Last Successful Check: 3/6/2026, 11:00:00 AM
Monitoring: Plan 1B, Plan 2A
Total Notifications Sent: 5

What This Means:
• The monitor will automatically retry in 30 minutes
• Rate limiting usually resolves itself within an hour
• Consider increasing CHECK_INTERVAL_MINUTES if this happens frequently

✅ No Action Required
The monitor will automatically retry in 30 minutes. Most errors resolve themselves.

Technical Details:
[Stack trace details]

[View Logs on GitHub]
```

## Email Content Breakdown

Each error email includes:

### 1. Error Type & Description
Clear explanation of what went wrong

### 2. Context Information
- When the error occurred
- Last successful check time
- What floor plans you're monitoring
- How many notifications have been sent

### 3. What This Means
- Plain English explanation
- Specific suggestions for this error type
- Whether action is needed

### 4. Automatic Retry Notice
Reminder that the monitor will keep trying automatically

### 5. Technical Details
Full error message and stack trace for debugging

### 6. Link to Logs
Direct link to GitHub Actions logs

## How Often Will I Get Error Emails?

**One email per error occurrence** - You'll get:
- ✅ One email when an error first happens
- ✅ Another email if a different error occurs
- ❌ NOT repeated emails for the same ongoing error

**Why?** Each workflow run is independent, so if the same error persists for multiple runs, you'll get one email per run.

## Success Notifications

You will **NOT** get emails for:
- ✅ Successful checks with no changes
- ✅ Successful checks with no availability

You **WILL** get emails for:
- 🔔 When apartments become available (success notification)
- ⚠️ When the monitor encounters errors (error notification)

## Reducing Error Emails

### Option 1: Run Less Frequently

Edit `.github/workflows/monitor.yml`:
```yaml
schedule:
  # Every hour instead of 30 minutes
  - cron: '0 */1 * * *'
```

**Benefit:** Reduces chance of rate limiting, fewer error emails

### Option 2: Add Retry Logic

The monitor already retries automatically every 30 minutes. Temporary errors usually resolve themselves.

### Option 3: Silence Specific Errors

If you're getting too many error emails for a specific issue, you can modify the code to skip certain error types.

## Testing Error Notifications

To test if error notifications work, you can temporarily break the configuration:

1. In GitHub Secrets, change `APARTMENT_URL` to an invalid URL
2. Wait for the next scheduled run (or manually trigger)
3. You should receive an error email
4. Change the URL back to the correct value

## Disabling Error Notifications

If you don't want error notifications, you can modify `src/check-once.ts`:

```typescript
} catch (error) {
  console.error('\n✗ Error during check:', error);

  // Comment out this block to disable error emails:
  // try {
  //   await sendErrorNotification(config, error as Error, state);
  // } catch (emailError) {
  //   console.error('Failed to send error notification:', emailError);
  // }

  await scraper.close();
  process.exit(1);
}
```

Then rebuild and push:
```bash
npm run build
git add .
git commit -m "Disable error notifications"
git push
```

## Monitoring Health

### Healthy Pattern
- No error emails for days/weeks
- Only availability notification emails when apartments are available
- Green checkmarks in GitHub Actions

### Needs Attention
- Multiple error emails per day
- Same error type repeatedly
- Red X marks in GitHub Actions for multiple runs

### Critical Issue
- "Website Structure Changed" error
- "Floor Plan Not Found" persisting after verification
- Continuous "Access Blocked" for 24+ hours

## FAQ

**Q: Will I get spammed with error emails?**
A: No. You get one email per error per run (every 30 minutes at most).

**Q: What if I'm on vacation and don't want error emails?**
A: Pause the workflow: Actions tab → Workflow → "..." menu → Disable workflow

**Q: Can I get error notifications via SMS too?**
A: Currently only email. SMS could be added but would use your Twilio credits.

**Q: How do I know the monitor is still working?**
A: Check GitHub Actions tab - you should see green checkmarks every 30 minutes.

**Q: Do I need to do anything when I get an error email?**
A: Usually no - most errors resolve automatically. Only act if the error persists for 24+ hours.

## Summary

✅ **Automatic error notifications** keep you informed
✅ **Detailed explanations** help you understand what happened
✅ **No action required** for most errors - monitor retries automatically
✅ **Smart categorization** tells you the specific issue
✅ **One email per error** - not spam

You'll only get emails when:
1. 🔔 An apartment becomes available (good news!)
2. ⚠️ The monitor encounters an error (FYI)

Most of the time, you won't get any emails - which means everything is working fine and apartments aren't available yet!
