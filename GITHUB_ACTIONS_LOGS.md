# GitHub Actions Logs Guide

Complete guide to understanding your GitHub Actions workflow logs.

## How to View Logs

1. Go to your repository on GitHub
2. Click the **Actions** tab
3. Click on any workflow run
4. Click the **check-availability** job
5. Expand individual steps to see detailed logs

## Complete Log Output Example

Here's what you'll see in a typical successful run:

### Step 1: Checkout repository
```
Run actions/checkout@v4
Syncing repository: username/triton-apartment-monitor
```

### Step 2: Setup Node.js
```
Run actions/setup-node@v4
Node version: v20.x
npm cache is restored
```

### Step 3: Install dependencies
```
Run npm ci

added 154 packages in 8s
```

### Step 4: Install Puppeteer dependencies
```
Run sudo apt-get update
Run sudo apt-get install -y libnss3 libatk1.0-0...

Reading package lists... Done
Building dependency tree... Done
libnss3 is already the newest version
...
```

### Step 5: Build TypeScript
```
Run npm run build

> triton_apartment@1.0.0 build
> tsc

✓ TypeScript compilation successful
```

### Step 6: Create .env file from secrets
```
Run cat << EOF > .env

✓ Environment file created
```

### Step 7: Run availability check ⭐ (MOST IMPORTANT)

This is where you see the actual monitoring results:

#### Successful Check - Plans Available

```
Run node dist/check-once.js

[dotenv@17.3.1] injecting env (17) from .env
============================================================
🏠 Apartment Availability Check
============================================================
Timestamp: 2026-03-06T07:30:00.123Z

Previous state loaded:
  Last check: 2026-03-06T07:00:00.000Z
  Notifications sent: 2
  Monitored plans (2):
    - Plan 1B: Available
    - Plan 2A: Not Available

Monitoring 2 floor plan(s):
  1. Plan 1B
  2. Plan 2A
URL: https://thetritonfostercity.com/lease-now

⚠️  SMS notifications disabled (Twilio not configured)
Checking availability...

Initializing browser...
Checking availability at https://thetritonfostercity.com/lease-now...
Monitoring 2 floor plan(s): Plan 1B, Plan 2A
Waiting for floor plan tiles to load...
Found 26 floor plans on the page
✓ "Plan 1B": 4 Units Available
✗ "Plan 2A":

============================================================
RESULTS:
============================================================
✓ Plan 1B: AVAILABLE
✗ Plan 2A: NOT AVAILABLE
============================================================

ℹ️  Plans already available (no change)

✓ State saved to state.json
Closing browser...
============================================================
✓ Check completed successfully
============================================================
```

#### First Detection - Notification Sent

```
Run node dist/check-once.js

============================================================
🏠 Apartment Availability Check
============================================================
Timestamp: 2026-03-06T08:00:00.456Z

No previous state found (first run)

Monitoring 2 floor plan(s):
  1. Plan 1B
  2. Plan 2A
URL: https://thetritonfostercity.com/lease-now

⚠️  SMS notifications disabled (Twilio not configured)
Checking availability...

Initializing browser...
Checking availability at https://thetritonfostercity.com/lease-now...
Monitoring 2 floor plan(s): Plan 1B, Plan 2A
Waiting for floor plan tiles to load...
Found 26 floor plans on the page
✓ "Plan 1B": 4 Units Available
✓ "Plan 2A": 2 Units Available

============================================================
RESULTS:
============================================================
✓ Plan 1B: AVAILABLE
✓ Plan 2A: AVAILABLE
============================================================

🔔 2 floor plan(s) became available! Sending notifications...
  - Plan 1B
  - Plan 2A
Email notification sent successfully

✓ Notifications sent (Total: 1)
  ✓ Email sent to your-configured-email@example.com

✓ State saved to state.json
Closing browser...
============================================================
✓ Check completed successfully
============================================================
```

#### Status Change Detected

```
Run node dist/check-once.js

Previous state loaded:
  Last check: 2026-03-06T08:00:00.000Z
  Notifications sent: 1
  Monitored plans (2):
    - Plan 1B: Not Available
    - Plan 2A: Not Available

Monitoring 2 floor plan(s):
  1. Plan 1B
  2. Plan 2A

Checking availability...
Found 26 floor plans on the page
✓ "Plan 1B": 3 Units Available
✗ "Plan 2A":

============================================================
RESULTS:
============================================================
✓ Plan 1B: AVAILABLE
✗ Plan 2A: NOT AVAILABLE
============================================================

🔔 1 floor plan(s) became available! Sending notifications...
  - Plan 1B
Email notification sent successfully

✓ Notifications sent (Total: 2)
  ✓ Email sent to your-configured-email@example.com

✓ State saved to state.json
```

### Step 8: Commit state changes

```
Run git config --local user.email "github-actions[bot]@users.noreply.github.com"
Run git config --local user.name "github-actions[bot]"
Run git add state.json || true
Run git diff --quiet && git diff --staged --quiet || (git commit -m "Update availability state [skip ci]" && git push)

[main abc1234] Update availability state [skip ci]
 1 file changed, 3 insertions(+), 3 deletions(-)
```

## Key Log Sections to Monitor

### 1. Previous State
```
Previous state loaded:
  Last check: 2026-03-06T07:00:00.000Z
  Notifications sent: 2
  Monitored plans (2):
    - Plan 1B: Available
    - Plan 2A: Not Available
```

**What to look for:**
- ✅ Last check time (should be ~30 min ago)
- ✅ Current status of each plan
- ✅ Total notifications sent

### 2. Floor Plans Detected
```
Found 26 floor plans on the page
✓ "Plan 1B": 4 Units Available
✗ "Plan 2A":
```

**What to look for:**
- ✅ Total plans found (should be ~26 for The Triton)
- ✅ Your monitored plans appear
- ✅ Availability text is correct

### 3. Results Summary
```
============================================================
RESULTS:
============================================================
✓ Plan 1B: AVAILABLE
✗ Plan 2A: NOT AVAILABLE
============================================================
```

**What to look for:**
- ✅ Clear status for each monitored plan
- ✅ Checkmark (✓) = available
- ✅ X mark (✗) = not available

### 4. Notification Status
```
🔔 1 floor plan(s) became available! Sending notifications...
  - Plan 1B
Email notification sent successfully

✓ Notifications sent (Total: 2)
  ✓ Email sent to your-configured-email@example.com
```

**OR if no change:**
```
ℹ️  Plans already available (no change)
```

**OR if no availability:**
```
ℹ️  No changes detected
```

**What to look for:**
- ✅ Only see notification when status CHANGES
- ✅ Email sent successfully
- ✅ Notification count incremented

## Error Scenarios

### Error 1: Website Not Loading
```
✗ Error during check: Error: net::ERR_NAME_NOT_RESOLVED at https://...

Closing browser...
```

**Cause:** Website down or DNS issue
**Action:** Check if website is accessible manually

### Error 2: Floor Plan Not Found
```
Found 26 floor plans on the page
⚠️  Floor plan "Plan 2X" not found on page
Available floor plans: Plan 1B, Plan 2A, Plan 2B, ...
```

**Cause:** Floor plan name typo or website changed
**Action:** Update `FLOOR_PLAN_NAMES` secret

### Error 3: Email Failed
```
Email notification failed: Error: Invalid login: 535 Username and Password not accepted
```

**Cause:** Gmail credentials incorrect
**Action:** Check `SMTP_USER` and `SMTP_PASS` secrets

### Error 4: Selector Not Found
```
Floor plan tiles not found
```

**Cause:** Website structure changed
**Action:** Website may have been updated - needs code fix

### Error 5: Permission Denied
```
fatal: could not create work tree dir 'state.json': Permission denied
```

**Cause:** Workflow doesn't have write permissions
**Action:** Settings → Actions → General → Workflow permissions → "Read and write"

## Monitoring Health

### Healthy Run Indicators

✅ **All these should appear:**
```
✓ TypeScript compilation successful
✓ Environment file created
Found 26 floor plans on the page
✓ Check completed successfully
✓ State saved to state.json
```

### Warning Signs (Not Errors)

⚠️ **These are normal:**
```
⚠️  SMS notifications disabled (Twilio not configured)
ℹ️  Plans already available (no change)
ℹ️  No changes detected
```

### Critical Errors

❌ **These require action:**
```
✗ Error during check: ...
Email notification failed: ...
⚠️  Floor plan "..." not found on page
fatal: ...
```

## Log Retention

- GitHub keeps logs for **90 days**
- Download logs: Click "..." on workflow run → "Download log archive"
- Logs are searchable within GitHub UI

## Quick Debug Checklist

If workflow fails, check in this order:

1. **Step 7 logs** - Most important, shows actual check
2. **Error messages** - Look for red ✗ or "Error:"
3. **State file** - View `state.json` in repository
4. **Secrets** - Verify all required secrets are set
5. **Permissions** - Check workflow has write access

## Example: Finding Your Results Quickly

1. Go to Actions tab
2. Click latest workflow run
3. Click "check-availability" job
4. **Scroll to "Run availability check" step**
5. Look for this section:
   ```
   ============================================================
   RESULTS:
   ============================================================
   ✓ Plan 1B: AVAILABLE
   ✗ Plan 2A: NOT AVAILABLE
   ============================================================
   ```

That's it! Everything you need to know at a glance.

## Viewing State History

To see how availability has changed over time:

1. Go to repository Code tab
2. Click `state.json`
3. Click "History"
4. Each commit shows when state changed

Example commit messages:
```
Update availability state [skip ci]
Update availability state [skip ci]
Update availability state [skip ci]
```

Click each to see the state changes.

## Setting Up Notifications for Failures

To get notified if the workflow fails:

1. Repository → Settings
2. Notifications (in sidebar)
3. Enable "Actions" notifications
4. You'll get email when workflow fails

## Summary

**Look for these key indicators:**

✅ **Success:**
- "✓ Check completed successfully"
- Clear availability status for each plan
- State saved successfully

🔔 **Notification Sent:**
- "🔔 X floor plan(s) became available!"
- "Email notification sent successfully"

⚠️ **No Change (Normal):**
- "ℹ️ Plans already available (no change)"
- "ℹ️ No changes detected"

❌ **Problem:**
- "✗ Error during check"
- "Email notification failed"
- Red X icon on workflow run

Most of the time, you'll see "No changes detected" - which means the monitor is working but apartments haven't changed status. When something becomes available, you'll see the 🔔 notification section **AND** get an email!
