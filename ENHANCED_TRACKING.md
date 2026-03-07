# Enhanced Availability Tracking

## Overview

The apartment monitor now includes **enhanced tracking capabilities** that provide comprehensive visibility into apartment availability trends. This update separates tracking from notifications, allowing you to monitor all floor plans while only receiving alerts for specific ones.

## Key Features

### 1. Track ALL Floor Plans
Monitor every floor plan on the apartment website without configuring each one individually.

```env
TRACK_FLOOR_PLANS=*
```

This will automatically discover and track all 26 floor plans at The Triton Foster City.

### 2. Separate Tracking from Notifications
Track many plans, but only get notified about the ones you care about:

```env
TRACK_FLOOR_PLANS=*
NOTIFY_FLOOR_PLANS=Plan 1B, Plan 2A
```

This configuration:
- Tracks all 26 floor plans
- Sends email/SMS notifications only when Plan 1B or Plan 2A become available
- Stores historical data for all tracked plans

### 3. Unit Count Extraction
Automatically extracts the number of available units from text like "4 Units Available":

```
✓ Plan 1B: 4 Units Available (4 units)
✓ Plan 1A: 1 Unit Available (1 units)
```

### 4. Price Tracking
Extracts pricing information when available (feature ready, depends on website displaying prices).

### 5. Historical Data Storage
All check results are stored in `availability-history.jsonl` with:
- Timestamp of each check
- Floor plan name
- Availability status
- Unit count
- Price (when available)
- Raw availability text

**Retention:** 90 days (configurable via `HISTORY_RETENTION_DAYS`)

### 6. Analytics & Reporting
Generate comprehensive reports with:
- Current status for all tracked plans
- Historical trends and statistics
- Availability change counts
- Average units when available
- Min/max units available
- Price trends

## Configuration

### Environment Variables

**Required Updates for GitHub Actions:**
Add these new secrets to your GitHub repository:

```
TRACK_FLOOR_PLANS=*
NOTIFY_FLOOR_PLANS=Plan 1B, Plan 2A
```

**Optional:**
```
HISTORY_RETENTION_DAYS=90
```

### Legacy Compatibility

Old configurations still work! If you don't set `TRACK_FLOOR_PLANS` or `NOTIFY_FLOOR_PLANS`, the system will use `FLOOR_PLAN_NAMES` for backward compatibility:

```env
# Old way (still works):
FLOOR_PLAN_NAMES=Plan 1B, Plan 2A

# Equivalent to new way:
TRACK_FLOOR_PLANS=Plan 1B, Plan 2A
NOTIFY_FLOOR_PLANS=Plan 1B, Plan 2A
```

## Generated Files

### 1. `state.json` (Enhanced)
Now includes detailed snapshots for each floor plan:

```json
{
  "version": 2,
  "lastCheckTime": "03/06/2026, 21:00:15",
  "notificationCount": 5,
  "floorPlans": {
    "Plan 1B": {
      "floorPlanName": "Plan 1B",
      "isAvailable": true,
      "unitCount": 4,
      "price": null,
      "availabilityText": "4 Units Available",
      "lastStatusChange": "2026-03-06T05:00:00.000Z",
      "lastChecked": "2026-03-06T21:00:15.000Z"
    }
  }
}
```

### 2. `availability-history.jsonl` (New)
Append-only historical log in JSON Lines format:

```jsonl
{"timestamp":"2026-03-06T21:00:15.000Z","floorPlanName":"Plan 1B","isAvailable":true,"unitCount":4,"price":null,"availabilityText":"4 Units Available"}
{"timestamp":"2026-03-06T21:30:15.000Z","floorPlanName":"Plan 1B","isAvailable":true,"unitCount":3,"price":null,"availabilityText":"3 Units Available"}
```

### 3. `availability-summary.json` (New)
Analytics and statistics generated after each check:

```json
{
  "generatedAt": "2026-03-06T21:00:15.000Z",
  "totalChecks": 500,
  "dateRange": {
    "start": "2026-01-01T00:00:00.000Z",
    "end": "2026-03-06T21:00:15.000Z"
  },
  "floorPlans": {
    "Plan 1B": {
      "currentStatus": {
        "isAvailable": true,
        "unitCount": 4,
        "price": null,
        "availabilityText": "4 Units Available",
        "lastStatusChange": "2026-03-06T05:00:00.000Z"
      },
      "history": {
        "totalChecks": 150,
        "availabilityChanges": 5,
        "averageUnitsWhenAvailable": 3.5,
        "maxUnitsAvailable": 6,
        "minUnitsAvailable": 1,
        "priceHistory": {
          "current": null,
          "min": null,
          "max": null
        }
      }
    }
  }
}
```

## Reporting Tool

### Basic Usage

View current status and historical summary:
```bash
npm run report
```

### Show Current Status Only
```bash
npm run report current
```

Output:
```
================================================================================
CURRENT STATUS
================================================================================
Last Check: 03/06/2026, 21:00:15
Total Notifications Sent: 5
Tracked Floor Plans: 26

✓ Plan 1B
  Status: 4 Units Available
  Units Available: 4
  Last Changed: 3/6/2026, 5:00:00 AM PDT
  Last Checked: 3/6/2026, 9:00:15 PM PDT

✗ Plan 2A
  Status:
  Last Changed: 3/1/2026, 10:00:00 AM PST
  Last Checked: 3/6/2026, 9:00:15 PM PDT
```

### Show Historical Summary
```bash
npm run report summary
```

Output includes:
- Total checks across all plans
- Date range of historical data
- Per-plan statistics (availability changes, avg units, price trends)

### View Plan-Specific History
```bash
npm run report history "Plan 1B"
npm run report history "Plan 1B" 30  # Last 30 days
```

Output:
```
================================================================================
HISTORY FOR: Plan 1B (Last 7 days)
================================================================================
Total Records: 336

03/06/2026:
  Checks: 48 (45 available, 3 unavailable)
  9:00:15 PM ✓ 4 Units Available (4 units)
  3:00:00 PM ✗
  5:00:00 AM ✓ 4 Units Available (4 units)

03/05/2026:
  Checks: 48 (48 available, 0 unavailable)
  9:00:15 PM ✓ 3 Units Available (3 units)
  ...
```

## Migration from v1 to v2

The system automatically migrates your existing `state.json` from v1 to v2 format on the first run. No manual intervention needed!

**What happens during migration:**
- Converts old boolean availability to new FloorPlanSnapshot format
- Sets initial unit counts and prices to `null`
- Preserves notification count and last check time
- Saves upgraded state as v2

## Monitoring Examples

### Example 1: Track Everything, Notify on Specific Plans
```env
TRACK_FLOOR_PLANS=*
NOTIFY_FLOOR_PLANS=Plan 1B, Plan 2A
```

**Result:**
- Monitors all 26 floor plans at The Triton
- Stores history for all 26 plans
- Only sends email/SMS when Plan 1B or Plan 2A become available
- Full visibility into all apartment availability trends

### Example 2: Track and Notify on Same Plans (v1 behavior)
```env
TRACK_FLOOR_PLANS=Plan 1B, Plan 2A, Plan 3C
NOTIFY_FLOOR_PLANS=Plan 1B, Plan 2A, Plan 3C
```

**Result:**
- Monitors only 3 specific plans
- Sends notifications for all 3 plans when available

### Example 3: Track Specific, Notify Subset
```env
TRACK_FLOOR_PLANS=Plan 1B, Plan 2A, Plan 3A, Plan 3C
NOTIFY_FLOOR_PLANS=Plan 1B, Plan 2A
```

**Result:**
- Monitors 4 specific plans
- Stores history for all 4
- Only notifies on Plan 1B and Plan 2A

## Log Output Examples

### Enhanced Check Output
```
============================================================
🏠 Apartment Availability Check (Enhanced Tracking)
============================================================
Timestamp (PT): 03/06/2026, 21:00:15

Previous state loaded:
  State version: v2
  Last check: 03/06/2026, 20:30:15
  Notifications sent: 5
  Tracked plans (26):
    - Plan 1B: Available (4 units) [$2500]
    - Plan 2A: Not Available

Configuration:
  Tracking: ALL floor plans on the page
  Notifications for: Plan 1B, Plan 2A
  URL: https://thetritonfostercity.com/lease-now
  History retention: 90 days

Checking availability...

============================================================
RESULTS:
============================================================
✓ Plan 1B: 4 Units Available (4 units)
✗ Plan 2A:
✓ Plan 3A: 1 Unit Available (1 units)
...
============================================================

ℹ️  Plans already available (no change)

✓ State saved to state.json
✓ History appended to availability-history.jsonl (26 records)
✓ Summary updated in availability-summary.json
```

## GitHub Actions Integration

The workflow automatically commits three files after each check:
- `state.json` - Current state with all floor plan snapshots
- `availability-history.jsonl` - Append-only historical log
- `availability-summary.json` - Analytics and statistics

**Commit message:**
```
Update availability state and history [skip ci]
```

The `[skip ci]` prevents infinite loop of workflow triggers.

## Data Privacy & Storage

All data is stored in your GitHub repository (public or private):
- **state.json**: ~10-50 KB (depends on number of tracked plans)
- **availability-history.jsonl**: ~1 MB per year (at 30-min intervals, 90-day retention)
- **availability-summary.json**: ~50-200 KB

**Total storage:** < 2 MB with 90-day retention for 26 floor plans

## Troubleshooting

### "Property 'trackFloorPlans' does not exist"
You're using old code. Run `npm run build` to recompile TypeScript.

### No history file generated
History is only created after the first check completes. Run `npm run test` or wait for the next scheduled check.

### Report shows "No state file found"
Run a check first: `npm run test` or wait for GitHub Actions to run.

### Want to reset history
Delete `availability-history.jsonl` and `availability-summary.json`. State will be preserved.

### Want to change retention period
Update `HISTORY_RETENTION_DAYS` in your `.env` or GitHub Secrets, then wait for the next check. Old records will be cleaned up automatically.

## Performance Impact

**Scraping:** No impact. Same page load, more data extraction.
**Storage:** Minimal. ~1 KB per check for 26 plans.
**GitHub Actions runtime:** +2-5 seconds per run for history/summary generation.

## Summary

The enhanced tracking system provides:
- ✅ Track ALL floor plans without manual configuration
- ✅ Separate tracking from notifications (monitor everything, notify on specific plans)
- ✅ Unit count extraction ("4 Units Available" → 4)
- ✅ Price tracking (when available on website)
- ✅ 90-day historical data retention
- ✅ Comprehensive analytics and reporting
- ✅ CLI reporting tool (`npm run report`)
- ✅ Automatic v1 to v2 migration
- ✅ Backward compatible with old configurations
- ✅ Zero manual intervention required

**Upgrade path:** Just update your `.env` or GitHub Secrets with the new variables and you're done!
