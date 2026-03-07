# Monitoring Multiple Floor Plans

You can now monitor multiple floor plans simultaneously! The system will check all specified plans and send a single notification when any of them become available.

## Configuration

### Environment Variable

Use the `FLOOR_PLAN_NAMES` variable in your `.env` file or GitHub Secrets.

**Supported Formats:**
- Comma-separated: `Plan 1B, Plan 2A, Plan 3C`
- Semicolon-separated: `Plan 1B; Plan 2A; Plan 3C`
- Pipe-separated: `Plan 1B | Plan 2A | Plan 3C`

### Examples

**Single Floor Plan:**
```env
FLOOR_PLAN_NAMES=Plan 1B
```

**Multiple Floor Plans:**
```env
FLOOR_PLAN_NAMES=Plan 1B, Plan 2A, Plan 2B
```

**All 1-bedroom Plans:**
```env
FLOOR_PLAN_NAMES=Plan 1B
```

**All 2-bedroom Plans:**
```env
FLOOR_PLAN_NAMES=Plan 2A, Plan 2B, Plan 2C
```

**Mixed Plans:**
```env
FLOOR_PLAN_NAMES=Plan 1B, Plan 2A, Plan 3C
```

## Local Setup

### 1. Update .env File

Edit `/Users/shujianhou/01-Personal/triton_apartment/.env`:

```env
FLOOR_PLAN_NAMES=Plan 1B, Plan 2A, Plan 2B
```

### 2. Test Configuration

```bash
npm run test
```

You should see output like:
```
Monitoring 3 floor plan(s):
  1. Plan 1B
  2. Plan 2A
  3. Plan 2B

RESULTS:
✓ Plan 1B: AVAILABLE
✗ Plan 2A: NOT AVAILABLE
✗ Plan 2B: NOT AVAILABLE
```

### 3. Run Monitor

```bash
npm run check
```

or for continuous monitoring:

```bash
npm start
```

## GitHub Actions Setup

### Update Secret

1. Go to your repository on GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Find the `FLOOR_PLAN_NAMES` secret (or create it if using old `FLOOR_PLAN_NAME`)
4. Update the value:

```
Plan 1B, Plan 2A, Plan 2B
```

**Note:** Use comma-separated format in GitHub Secrets (most reliable)

### Old Variable Name

If you have the old `FLOOR_PLAN_NAME` secret:
1. Delete it (or keep it for backward compatibility)
2. Create new `FLOOR_PLAN_NAMES` secret with your comma-separated list

The system will automatically use `FLOOR_PLAN_NAMES` if available, falling back to `FLOOR_PLAN_NAME` for backward compatibility.

## How It Works

### State Tracking

The system tracks each floor plan separately in `state.json`:

```json
{
  "lastAvailabilityStatus": {
    "Plan 1B": true,
    "Plan 2A": false,
    "Plan 2B": false
  },
  "lastCheckTime": "2026-03-05T23:05:00.000Z",
  "notificationCount": 2
}
```

### Notification Logic

**You'll receive a notification when:**
- **First run:** Any monitored plan is available
- **Status change:** Any plan changes from unavailable → available

**You won't receive duplicate notifications for:**
- Plans that were already available
- Plans that change from available → unavailable (silent update)

### Email Notifications

**Single Plan Available:**
```
Subject: 🏠 Plan 1B is Now Available!
```

**Multiple Plans Available:**
```
Subject: 🏠 3 Floor Plans Now Available!

Body:
✓ Plan 1B - AVAILABLE
✓ Plan 2A - AVAILABLE
✓ Plan 2B - AVAILABLE
```

### SMS Notifications

**Single Plan:**
```
🏠 Plan 1B is now AVAILABLE! Check it out: https://...
```

**Multiple Plans:**
```
🏠 3 floor plans now AVAILABLE: Plan 1B, Plan 2A, Plan 2B. Check them out: https://...
```

## Available Floor Plans at The Triton

```
1-Bedroom:
  - Plan 1B (801 sq ft)

2-Bedroom:
  - Plan 2A
  - Plan 2B
  - Plan 2C

3-Bedroom:
  - Plan 3A
  - Plan 3B
  - Plan 3C
```

## Common Configurations

### Monitor All 1BR Plans
```env
FLOOR_PLAN_NAMES=Plan 1B
```

### Monitor All 2BR Plans
```env
FLOOR_PLAN_NAMES=Plan 2A, Plan 2B, Plan 2C
```

### Monitor All 3BR Plans
```env
FLOOR_PLAN_NAMES=Plan 3A, Plan 3B, Plan 3C
```

### Monitor Specific Square Footage Range
First check website for exact plan names, then:
```env
FLOOR_PLAN_NAMES=Plan 1B, Plan 2A
```

## Troubleshooting

### Floor Plan Not Found

**Error:**
```
⚠️  Floor plan "Plan 2X" not found on page
```

**Solution:**
1. Run `npm run test` to see all available plans on the website
2. Check exact naming (case-sensitive, spaces matter)
3. Update your configuration with the correct name

### Only One Plan Monitoring

**Issue:** Only first plan is checked

**Cause:** Incorrect separator

**Solution:**
```env
# ❌ Wrong (no separator)
FLOOR_PLAN_NAMES=Plan 1B Plan 2A

# ✅ Correct
FLOOR_PLAN_NAMES=Plan 1B, Plan 2A
```

### GitHub Actions Not Using Multiple Plans

**Issue:** GitHub workflow only checks one plan

**Cause:** Old secret name or not updated

**Solution:**
1. Check GitHub Secrets: Must be named `FLOOR_PLAN_NAMES` (plural)
2. Value must be comma-separated: `Plan 1B, Plan 2A`
3. Re-run workflow after updating secret

## Performance

### Local Execution Time

- Single plan: ~10-15 seconds
- Multiple plans: ~10-15 seconds (same page visit)

### GitHub Actions Minutes

- Single plan: ~3 minutes per run
- Multiple plans: ~3 minutes per run (no extra cost!)

**Why?** All plans are checked in a single page load, so monitoring 5 plans costs the same as monitoring 1 plan.

## Best Practices

### 1. Start Small

Begin with 1-2 plans, test the notifications, then add more.

```env
# Start with
FLOOR_PLAN_NAMES=Plan 1B

# Then expand to
FLOOR_PLAN_NAMES=Plan 1B, Plan 2A, Plan 2B
```

### 2. Group by Bedroom Count

Monitor all plans in your desired bedroom count:

```env
FLOOR_PLAN_NAMES=Plan 2A, Plan 2B, Plan 2C
```

### 3. Monitor Backup Options

Include your top choice plus backup plans:

```env
FLOOR_PLAN_NAMES=Plan 2A, Plan 1B
```

### 4. Avoid Monitoring Everything

Don't monitor plans you wouldn't actually rent:

```env
# ❌ Too many (will get unnecessary notifications)
FLOOR_PLAN_NAMES=Plan 1B, Plan 2A, Plan 2B, Plan 2C, Plan 3A, Plan 3B, Plan 3C

# ✅ Focused
FLOOR_PLAN_NAMES=Plan 2A, Plan 2B
```

## Migration from Single Plan

If you're currently monitoring one plan:

### 1. Update .env

```env
# Old
FLOOR_PLAN_NAME=Plan 1B

# New (keep same plan)
FLOOR_PLAN_NAMES=Plan 1B

# Or add more
FLOOR_PLAN_NAMES=Plan 1B, Plan 2A
```

### 2. Update GitHub Secret

1. Delete old `FLOOR_PLAN_NAME` secret
2. Create `FLOOR_PLAN_NAMES` with your comma-separated list

### 3. Rebuild and Deploy

```bash
npm run build
git add .
git commit -m "Add support for multiple floor plans"
git push
```

### 4. Reset State (Optional)

If you want to reset notification history:

```bash
# Local
rm state.json

# GitHub Actions
# Delete state.json from repository (or edit it manually)
```

## Example Scenarios

### Scenario 1: Urgent Move-In

Monitor all available sizes:
```env
FLOOR_PLAN_NAMES=Plan 1B, Plan 2A, Plan 2B, Plan 2C
```

### Scenario 2: Price Conscious

Monitor smaller, more affordable plans:
```env
FLOOR_PLAN_NAMES=Plan 1B, Plan 2A
```

### Scenario 3: Space Preference

Monitor only 3-bedroom plans:
```env
FLOOR_PLAN_NAMES=Plan 3A, Plan 3B, Plan 3C
```

### Scenario 4: Specific Layout

Monitor specific plans after viewing floor layouts:
```env
FLOOR_PLAN_NAMES=Plan 2A, Plan 3B
```

## Summary

✅ **Multiple Plans Supported:** Monitor 1-10+ plans simultaneously
✅ **Same Cost:** No extra GitHub Actions minutes
✅ **Smart Notifications:** Only notifies when availability changes
✅ **Individual Tracking:** Each plan's status tracked separately
✅ **Flexible Format:** Comma, semicolon, or pipe separated
✅ **Backward Compatible:** Old `FLOOR_PLAN_NAME` still works

Monitor as many floor plans as you want—you'll only get notified when they become available!
