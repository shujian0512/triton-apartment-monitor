import fs from 'fs';
import path from 'path';
import { HistoryManager } from './history';
import { AppStateV2, AvailabilitySummary } from './types';

const STATE_FILE = path.join(__dirname, '..', 'state.json');
const SUMMARY_FILE = path.join(__dirname, '..', 'availability-summary.json');

interface AppStateV1 {
  lastAvailabilityStatus: { [floorPlanName: string]: boolean | null };
  lastCheckTime: string | null;
  notificationCount: number;
}

function loadState(): AppStateV2 | null {
  if (!fs.existsSync(STATE_FILE)) {
    return null;
  }

  try {
    const data = fs.readFileSync(STATE_FILE, 'utf-8');
    const parsed = JSON.parse(data);

    // Check if it's v1 format (no version field or version === 1)
    if (!parsed.version || parsed.version === 1) {
      console.log('⚠️  State file is in v1 format. Run a check to migrate to v2.');
      console.log('   The report tool requires v2 format for enhanced features.\n');
      return null;
    }

    return parsed as AppStateV2;
  } catch (error) {
    console.error('Error loading state:', error);
    return null;
  }
}

function loadSummary(): AvailabilitySummary | null {
  if (!fs.existsSync(SUMMARY_FILE)) {
    return null;
  }

  try {
    const data = fs.readFileSync(SUMMARY_FILE, 'utf-8');
    return JSON.parse(data) as AvailabilitySummary;
  } catch (error) {
    console.error('Error loading summary:', error);
    return null;
  }
}

function formatPacificTime(isoString: string): string {
  return new Date(isoString).toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

function printCurrentStatus() {
  console.log('\n' + '='.repeat(80));
  console.log('CURRENT STATUS');
  console.log('='.repeat(80));

  const state = loadState();
  if (!state) {
    console.log('No state file found. Run a check first.');
    return;
  }

  console.log(`Last Check: ${state.lastCheckTime || 'Never'}`);
  console.log(`Total Notifications Sent: ${state.notificationCount}`);
  console.log(`Tracked Floor Plans: ${Object.keys(state.floorPlans || {}).length}\n`);

  if (!state.floorPlans || Object.keys(state.floorPlans).length === 0) {
    console.log('No floor plan data available yet. Run a check first.');
    return;
  }

  const sortedPlans = Object.entries(state.floorPlans).sort((a, b) => {
    // Sort by availability (available first), then by name
    if (a[1].isAvailable !== b[1].isAvailable) {
      return a[1].isAvailable ? -1 : 1;
    }
    return a[0].localeCompare(b[0]);
  });

  for (const [planName, snapshot] of sortedPlans) {
    const statusIcon = snapshot.isAvailable ? '✓' : '✗';
    const statusColor = snapshot.isAvailable ? '\x1b[32m' : '\x1b[31m'; // Green or Red
    const resetColor = '\x1b[0m';

    console.log(`${statusColor}${statusIcon} ${planName}${resetColor}`);
    console.log(`  Status: ${snapshot.availabilityText}`);

    if (snapshot.unitCount !== null) {
      console.log(`  Units Available: ${snapshot.unitCount}`);
    }

    if (snapshot.price !== null) {
      console.log(`  Price: $${snapshot.price.toLocaleString()}`);
    }

    console.log(`  Last Changed: ${formatPacificTime(snapshot.lastStatusChange)}`);
    console.log(`  Last Checked: ${formatPacificTime(snapshot.lastChecked)}`);
    console.log();
  }
}

function printHistoricalSummary() {
  console.log('='.repeat(80));
  console.log('HISTORICAL SUMMARY');
  console.log('='.repeat(80));

  const summary = loadSummary();
  if (!summary) {
    console.log('No summary file found. Run a check first to generate summary.');
    return;
  }

  console.log(`Generated At: ${formatPacificTime(summary.generatedAt)}`);
  console.log(`Total Checks: ${summary.totalChecks}`);
  console.log(`Date Range: ${formatPacificTime(summary.dateRange.start)} - ${formatPacificTime(summary.dateRange.end)}\n`);

  const sortedPlans = Object.entries(summary.floorPlans).sort((a, b) => {
    // Sort by current availability, then by name
    if (a[1].currentStatus.isAvailable !== b[1].currentStatus.isAvailable) {
      return a[1].currentStatus.isAvailable ? -1 : 1;
    }
    return a[0].localeCompare(b[0]);
  });

  for (const [planName, data] of sortedPlans) {
    const statusIcon = data.currentStatus.isAvailable ? '✓' : '✗';
    const statusColor = data.currentStatus.isAvailable ? '\x1b[32m' : '\x1b[31m';
    const resetColor = '\x1b[0m';

    console.log(`${statusColor}${statusIcon} ${planName}${resetColor}`);
    console.log(`  Current: ${data.currentStatus.availabilityText}`);

    if (data.currentStatus.unitCount !== null) {
      console.log(`  Current Units: ${data.currentStatus.unitCount}`);
    }

    if (data.currentStatus.price !== null) {
      console.log(`  Current Price: $${data.currentStatus.price.toLocaleString()}`);
    }

    console.log(`\n  Historical Data:`);
    console.log(`    Total Checks: ${data.history.totalChecks}`);
    console.log(`    Status Changes: ${data.history.availabilityChanges}`);

    if (data.history.averageUnitsWhenAvailable !== null) {
      console.log(`    Avg Units (when available): ${data.history.averageUnitsWhenAvailable.toFixed(1)}`);
      console.log(`    Max Units: ${data.history.maxUnitsAvailable}`);
      console.log(`    Min Units: ${data.history.minUnitsAvailable}`);
    }

    if (data.history.priceHistory.current !== null) {
      console.log(`    Price Range: $${data.history.priceHistory.min?.toLocaleString()} - $${data.history.priceHistory.max?.toLocaleString()}`);
    }

    console.log();
  }
}

function printPlanHistory(planName: string, days: number = 7) {
  console.log('='.repeat(80));
  console.log(`HISTORY FOR: ${planName} (Last ${days} days)`);
  console.log('='.repeat(80));

  const historyManager = new HistoryManager();
  const allRecords = historyManager.getRecordsForPlan(planName);

  if (allRecords.length === 0) {
    console.log(`No history records found for "${planName}"`);
    return;
  }

  // Filter to last N days
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const recentRecords = allRecords.filter(r => {
    const recordDate = new Date(r.timestamp);
    return recordDate >= cutoffDate;
  });

  console.log(`Total Records: ${recentRecords.length}\n`);

  // Group by date
  const recordsByDate: { [date: string]: typeof recentRecords } = {};

  for (const record of recentRecords) {
    const date = new Date(record.timestamp).toLocaleDateString('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    if (!recordsByDate[date]) {
      recordsByDate[date] = [];
    }
    recordsByDate[date].push(record);
  }

  // Print by date (most recent first)
  const sortedDates = Object.keys(recordsByDate).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  for (const date of sortedDates) {
    const records = recordsByDate[date];
    console.log(`\n${date}:`);

    // Show summary for the day
    const availableCount = records.filter(r => r.isAvailable).length;
    const unavailableCount = records.length - availableCount;

    console.log(`  Checks: ${records.length} (${availableCount} available, ${unavailableCount} unavailable)`);

    // Show status changes
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const prevRecord = i > 0 ? records[i - 1] : null;

      if (!prevRecord || prevRecord.isAvailable !== record.isAvailable) {
        const statusIcon = record.isAvailable ? '✓' : '✗';
        const time = formatPacificTime(record.timestamp).split(', ')[1];
        const unitInfo = record.unitCount !== null ? ` (${record.unitCount} units)` : '';
        const priceInfo = record.price !== null ? ` [$${record.price}]` : '';

        console.log(`  ${time} ${statusIcon} ${record.availabilityText}${unitInfo}${priceInfo}`);
      }
    }
  }

  console.log();
}

function printHelp() {
  console.log('\nApartment Availability Report Tool\n');
  console.log('Usage:');
  console.log('  npm run report              Show current status and historical summary');
  console.log('  npm run report current      Show current status only');
  console.log('  npm run report summary      Show historical summary only');
  console.log('  npm run report history <plan> [days]');
  console.log('                              Show history for specific plan (default: 7 days)');
  console.log('\nExamples:');
  console.log('  npm run report');
  console.log('  npm run report current');
  console.log('  npm run report history "Plan 1B"');
  console.log('  npm run report history "Plan 2A" 30');
  console.log();
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';

  switch (command.toLowerCase()) {
    case 'current':
      printCurrentStatus();
      break;

    case 'summary':
      printHistoricalSummary();
      break;

    case 'history':
      if (args.length < 2) {
        console.error('Error: Plan name required');
        console.log('Usage: npm run report history <plan-name> [days]');
        process.exit(1);
      }
      const planName = args[1];
      const days = args[2] ? parseInt(args[2], 10) : 7;
      printPlanHistory(planName, days);
      break;

    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;

    case 'all':
    default:
      printCurrentStatus();
      printHistoricalSummary();
      break;
  }
}

main();
