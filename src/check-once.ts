import fs from 'fs';
import path from 'path';
import { loadConfig } from './config';
import { ApartmentScraper } from './scraper';
import { Notifier } from './notifier';
import { HistoryManager } from './history';
import { generateDashboard } from './dashboard';
import { AvailabilityStatus, Config, AppStateV2, FloorPlanSnapshot, HistoryRecord } from './types';

const STATE_FILE = path.join(__dirname, '..', 'state.json');

// Legacy state format for migration
interface AppStateV1 {
  lastAvailabilityStatus: { [floorPlanName: string]: boolean | null };
  lastCheckTime: string | null;
  notificationCount: number;
}

function getPacificTime(): string {
  return new Date().toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

function loadState(): AppStateV2 {
  if (!fs.existsSync(STATE_FILE)) {
    return {
      version: 2,
      lastCheckTime: null,
      notificationCount: 0,
      floorPlans: {},
    };
  }

  try {
    const data = fs.readFileSync(STATE_FILE, 'utf-8');
    const parsed = JSON.parse(data);

    // Check if it's v1 format (no version field)
    if (!parsed.version || parsed.version === 1) {
      console.log('Migrating state from v1 to v2 format...');
      const v1State = parsed as AppStateV1;

      // Convert v1 to v2
      const floorPlans: { [name: string]: FloorPlanSnapshot } = {};
      for (const [planName, isAvailable] of Object.entries(v1State.lastAvailabilityStatus)) {
        if (isAvailable !== null) {
          floorPlans[planName] = {
            floorPlanName: planName,
            isAvailable: isAvailable,
            unitCount: null,
            price: null,
            availabilityText: isAvailable ? 'Available' : 'Not Available',
            lastStatusChange: v1State.lastCheckTime || new Date().toISOString(),
            lastChecked: v1State.lastCheckTime || new Date().toISOString(),
          };
        }
      }

      return {
        version: 2,
        lastCheckTime: v1State.lastCheckTime,
        notificationCount: v1State.notificationCount,
        floorPlans,
      };
    }

    return parsed as AppStateV2;
  } catch (error) {
    console.error('Error loading state:', error);
    return {
      version: 2,
      lastCheckTime: null,
      notificationCount: 0,
      floorPlans: {},
    };
  }
}

function saveState(state: AppStateV2): void {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

async function checkOnce() {
  console.log('='.repeat(60));
  console.log('🏠 Apartment Availability Check (Enhanced Tracking)');
  console.log('='.repeat(60));

  const timestamp = getPacificTime();
  console.log(`Timestamp (PT): ${timestamp}\n`);

  // Load state
  const state = loadState();

  console.log('Previous state loaded:');
  console.log(`  State version: v${state.version}`);
  console.log(`  Last check: ${state.lastCheckTime || 'Never'}`);
  console.log(`  Notifications sent: ${state.notificationCount}`);

  const planCount = Object.keys(state.floorPlans).length;
  if (planCount > 0) {
    console.log(`  Tracked plans (${planCount}):`);
    for (const [planName, snapshot] of Object.entries(state.floorPlans)) {
      const statusText = snapshot.isAvailable ? 'Available' : 'Not Available';
      const unitInfo = snapshot.unitCount !== null ? ` (${snapshot.unitCount} units)` : '';
      const priceInfo = snapshot.price !== null ? ` [$${snapshot.price}]` : '';
      console.log(`    - ${planName}: ${statusText}${unitInfo}${priceInfo}`);
    }
  }
  console.log();

  // Load config
  const config = loadConfig();
  const trackAll = config.apartment.trackFloorPlans.includes('*');

  console.log('Configuration:');
  if (trackAll) {
    console.log(`  Tracking: ALL floor plans on the page`);
  } else {
    console.log(`  Tracking ${config.apartment.trackFloorPlans.length} floor plan(s): ${config.apartment.trackFloorPlans.join(', ')}`);
  }
  console.log(`  Notifications for: ${config.apartment.notifyFloorPlans.join(', ')}`);
  console.log(`  URL: ${config.apartment.url}`);
  console.log(`  History retention: ${config.history.retentionDays} days\n`);

  // Initialize scraper, notifier, and history manager
  const scraper = new ApartmentScraper(config);
  const notifier = new Notifier(config);
  const historyManager = new HistoryManager(config.history.retentionDays);

  try {
    // Clean up old history records
    historyManager.cleanupOldRecords();

    // Check availability for all plans
    console.log('Checking availability...\n');
    const multiStatus = await scraper.checkMultipleAvailability();

    console.log('\n' + '='.repeat(60));
    console.log('RESULTS:');
    console.log('='.repeat(60));

    // Update state and determine which plans need notifications
    state.lastCheckTime = new Date().toISOString();
    const plansToNotify: AvailabilityStatus[] = [];
    const historyRecords: HistoryRecord[] = [];

    for (const planStatus of multiStatus.plans) {
      const { floorPlanName, isAvailable, unitCount, price, availabilityText } = planStatus;
      const previousSnapshot = state.floorPlans[floorPlanName];

      // Display result
      const statusIcon = isAvailable ? '✓' : '✗';
      const unitInfo = unitCount !== null ? ` (${unitCount} units)` : '';
      const priceInfo = price !== null ? ` [$${price}]` : '';
      console.log(`${statusIcon} ${floorPlanName}: ${availabilityText}${unitInfo}${priceInfo}`);

      // Determine if status changed
      const statusChanged = previousSnapshot && previousSnapshot.isAvailable !== isAvailable;
      const isNewPlan = !previousSnapshot;

      // Determine if we should notify (only for plans in notifyFloorPlans)
      const shouldNotify = config.apartment.notifyFloorPlans.some(notifyPlan =>
        floorPlanName.toLowerCase().includes(notifyPlan.toLowerCase().split('(')[0].trim())
      ) && (
        (statusChanged && isAvailable) || // Changed from unavailable to available
        (isNewPlan && isAvailable) // First time seeing this plan and it's available
      );

      if (shouldNotify) {
        plansToNotify.push(planStatus);
      }

      // Update state snapshot
      state.floorPlans[floorPlanName] = {
        floorPlanName,
        isAvailable,
        unitCount: unitCount ?? null,
        price: price ?? null,
        availabilityText: availabilityText || (isAvailable ? 'Available' : 'Not Available'),
        lastStatusChange: statusChanged ? new Date().toISOString() : (previousSnapshot?.lastStatusChange || new Date().toISOString()),
        lastChecked: new Date().toISOString(),
      };

      // Create history record
      historyRecords.push({
        timestamp: new Date().toISOString(),
        floorPlanName,
        isAvailable,
        unitCount: unitCount ?? null,
        price: price ?? null,
        availabilityText: availabilityText || (isAvailable ? 'Available' : 'Not Available'),
      });
    }

    console.log('='.repeat(60));

    // Append to history
    historyManager.appendRecords(historyRecords);

    // Generate and save summary
    const summary = historyManager.generateSummary(state.floorPlans);
    historyManager.saveSummary(summary);

    // Send notifications if any plans became available
    if (plansToNotify.length > 0) {
      console.log(`\n🔔 ${plansToNotify.length} floor plan(s) became available! Sending notifications...`);
      plansToNotify.forEach(p => {
        const unitInfo = p.unitCount !== null ? ` (${p.unitCount} units)` : '';
        const priceInfo = p.price !== null ? ` [$${p.price}]` : '';
        console.log(`  - ${p.floorPlanName}${unitInfo}${priceInfo}`);
      });

      try {
        const result = await notifier.sendMultiplePlanNotifications(plansToNotify);

        if (result.email.success || result.sms.success) {
          state.notificationCount += 1;
          console.log(`\n✓ Notifications sent (Total: ${state.notificationCount})`);

          if (result.email.success) {
            console.log(`  ✓ Email sent to ${config.email.to}`);
          }
          if (result.sms.success) {
            console.log(`  ✓ SMS sent to ${config.sms.phoneTo}`);
          }
        } else {
          console.log('\n✗ All notifications failed');
          if (result.email.error) {
            console.log(`  Email error: ${result.email.error}`);
          }
          if (result.sms.error) {
            console.log(`  SMS error: ${result.sms.error}`);
          }
        }
      } catch (error) {
        console.error('Error sending notifications:', error);
      }
    } else {
      const anyAvailable = multiStatus.plans.some(p => p.isAvailable);
      const anyChanged = multiStatus.plans.some(p => {
        const prev = state.floorPlans[p.floorPlanName];
        return prev && prev.isAvailable !== p.isAvailable;
      });

      if (anyChanged) {
        console.log('\nℹ️  Status changed but no new availabilities for notification plans');
      } else if (anyAvailable) {
        console.log('\nℹ️  Plans already available (no change)');
      } else {
        console.log('\nℹ️  No changes detected');
      }
    }

    // Save state
    saveState(state);
    console.log('\n✓ State saved to state.json');
    console.log(`✓ History appended to availability-history.jsonl (${historyRecords.length} records)`);
    console.log('✓ Summary updated in availability-summary.json');

    // Generate HTML dashboard
    try {
      generateDashboard();
    } catch (error) {
      console.error('Warning: Failed to generate dashboard:', error);
    }

    await scraper.close();

    console.log('='.repeat(60));
    console.log('✓ Check completed successfully');
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error during check:', error);

    // Send error notification email
    try {
      await sendErrorNotification(config, error as Error, state);
    } catch (emailError) {
      console.error('Failed to send error notification:', emailError);
    }

    await scraper.close();
    process.exit(1);
  }
}

async function sendErrorNotification(config: Config, error: Error, state: AppStateV2): Promise<void> {
  console.log('\n📧 Sending error notification email...');

  const notifier = new Notifier(config);
  const timestamp = new Date();

  // Determine error type
  let errorType = 'Unknown Error';
  let errorDetails = error.message;
  let suggestions: string[] = [];

  if (error.message.includes('ERR_NAME_NOT_RESOLVED') || error.message.includes('ENOTFOUND')) {
    errorType = '🌐 Website Unreachable';
    errorDetails = 'Could not connect to the apartment website. The website may be down or there may be a network issue.';
    suggestions = [
      'Check if the website is accessible: https://thetritonfostercity.com/lease-now',
      'The website may be temporarily down - the monitor will retry in 30 minutes',
      'If this persists for several hours, the website URL may have changed'
    ];
  } else if (error.message.includes('429') || error.message.includes('Too Many Requests') || error.message.includes('rate limit')) {
    errorType = '⚠️ Rate Limited';
    errorDetails = 'The apartment website is rate limiting our requests. Too many checks in a short period.';
    suggestions = [
      'The monitor will automatically retry in 30 minutes',
      'Rate limiting usually resolves itself within an hour',
      'Consider increasing CHECK_INTERVAL_MINUTES if this happens frequently'
    ];
  } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
    errorType = '⏱️ Connection Timeout';
    errorDetails = 'The website took too long to respond. This could indicate high load on their servers.';
    suggestions = [
      'The monitor will automatically retry in 30 minutes',
      'This is usually temporary and resolves itself'
    ];
  } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
    errorType = '🚫 Access Blocked';
    errorDetails = 'The website is blocking our requests. This could be due to bot detection or IP blocking.';
    suggestions = [
      'GitHub Actions IP addresses may be temporarily blocked',
      'This usually resolves within a few hours',
      'The monitor will keep trying automatically'
    ];
  } else if (error.message.includes('Floor plan') && error.message.includes('not found')) {
    errorType = '🔍 Floor Plan Not Found';
    errorDetails = error.message;
    suggestions = [
      'The floor plan name may have changed on the website',
      'Check the website to verify floor plan names',
      'Update NOTIFY_FLOOR_PLANS secret if needed'
    ];
  } else if (error.message.includes('selector')) {
    errorType = '🎯 Website Structure Changed';
    errorDetails = 'Could not find expected elements on the page. The website layout may have been updated.';
    suggestions = [
      'The website may have been redesigned',
      'The monitor code may need to be updated',
      'Check if the website still shows floor plans at the same URL'
    ];
  }

  const suggestionsList = suggestions.map(s => `<li style="margin: 5px 0;">${s}</li>`).join('');

  const pacificTime = timestamp.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const trackedPlans = Object.keys(state.floorPlans);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #e74c3c;">⚠️ Apartment Monitor Error Alert</h2>

      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #856404;">${errorType}</h3>
        <p style="margin: 10px 0; color: #856404;">${errorDetails}</p>
      </div>

      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Time:</strong> ${pacificTime} PT</p>
        <p style="margin: 5px 0;"><strong>Last Successful Check:</strong> ${state.lastCheckTime || 'Never'}</p>
        <p style="margin: 5px 0;"><strong>Tracking:</strong> ${trackedPlans.length} floor plan(s)</p>
        <p style="margin: 5px 0;"><strong>Total Notifications Sent:</strong> ${state.notificationCount}</p>
      </div>

      ${suggestions.length > 0 ? `
      <div style="margin: 20px 0;">
        <h4 style="color: #333; margin-bottom: 10px;">What This Means:</h4>
        <ul style="color: #555; line-height: 1.6;">
          ${suggestionsList}
        </ul>
      </div>
      ` : ''}

      <div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #0c5460;">✅ No Action Required</h4>
        <p style="margin: 5px 0; color: #0c5460;">The monitor will automatically retry in 30 minutes. Most errors resolve themselves.</p>
      </div>

      <div style="border-top: 1px solid #ddd; padding-top: 15px; margin-top: 20px;">
        <p style="margin: 5px 0;"><strong>Technical Details:</strong></p>
        <pre style="background-color: #f5f5f5; padding: 10px; border-radius: 3px; overflow-x: auto; font-size: 12px;">${error.stack || error.message}</pre>
      </div>

      <p style="margin: 20px 0;">
        <a href="https://github.com/${process.env.GITHUB_REPOSITORY || 'your-repo'}/actions"
           style="background-color: #6c757d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View Logs on GitHub
        </a>
      </p>

      <p style="color: #7f8c8d; font-size: 12px; margin-top: 30px;">
        This is an automated error notification from your Apartment Availability Monitor.
        <br>You will receive these emails only when the monitor encounters an error.
      </p>
    </div>
  `;

  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });

    await transporter.sendMail({
      from: config.email.from,
      to: config.email.to,
      subject: `⚠️ Apartment Monitor Error: ${errorType}`,
      html,
    });

    console.log('✓ Error notification sent to', config.email.to);
  } catch (emailError) {
    console.error('Failed to send error email:', emailError);
    throw emailError;
  }
}

checkOnce();
