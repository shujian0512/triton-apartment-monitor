import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { loadConfig } from './config';
import { ApartmentScraper } from './scraper';
import { Notifier } from './notifier';
import { AvailabilityStatus } from './types';

const STATE_FILE = path.join(__dirname, '..', 'state.json');

interface AppState {
  lastAvailabilityStatus: boolean | null;
  lastCheckTime: string | null;
  notificationCount: number;
}

class ApartmentMonitor {
  private config = loadConfig();
  private scraper = new ApartmentScraper(this.config);
  private notifier = new Notifier(this.config);
  private state: AppState = {
    lastAvailabilityStatus: null,
    lastCheckTime: null,
    notificationCount: 0,
  };

  constructor() {
    this.loadState();
  }

  private loadState(): void {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const data = fs.readFileSync(STATE_FILE, 'utf-8');
        this.state = JSON.parse(data);
        console.log('State loaded:', this.state);
      }
    } catch (error) {
      console.error('Error loading state:', error);
    }
  }

  private saveState(): void {
    try {
      fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }

  async checkAndNotify(): Promise<void> {
    const timestamp = new Date().toISOString();
    console.log(`\n[${ timestamp}] Starting availability check...`);

    try {
      const status: AvailabilityStatus = await this.scraper.checkAvailability();

      console.log(`Availability status: ${status.isAvailable ? 'AVAILABLE ✓' : 'NOT AVAILABLE ✗'}`);

      // Update state
      this.state.lastCheckTime = timestamp;

      // Check if availability status has changed
      const statusChanged =
        this.state.lastAvailabilityStatus !== null &&
        this.state.lastAvailabilityStatus !== status.isAvailable;

      // Send notifications if:
      // 1. Status changed from unavailable to available
      // 2. This is the first check and the apartment is available
      const shouldNotify =
        (statusChanged && status.isAvailable) ||
        (this.state.lastAvailabilityStatus === null && status.isAvailable);

      if (shouldNotify) {
        console.log('🔔 Availability detected! Sending notifications...');

        const result = await this.notifier.sendNotifications(status);

        if (result.email.success || result.sms.success) {
          this.state.notificationCount += 1;
          console.log(`✓ Notifications sent (Total: ${this.state.notificationCount})`);
        } else {
          console.error('✗ All notifications failed');
        }
      } else if (statusChanged && !status.isAvailable) {
        console.log('Status changed to unavailable (no notification sent)');
      } else {
        console.log('No change in availability (no notification needed)');
      }

      // Update last known status
      this.state.lastAvailabilityStatus = status.isAvailable;
      this.saveState();

    } catch (error) {
      console.error('Error during check:', error);
    }

    console.log(`Next check in ${this.config.monitoring.checkIntervalMinutes} minutes`);
  }

  async start(): Promise<void> {
    console.log('='.repeat(60));
    console.log('🏠 Apartment Availability Monitor');
    console.log('='.repeat(60));
    const trackAll = this.config.apartment.trackFloorPlans.includes('*');
    if (trackAll) {
      console.log('Tracking: ALL floor plans on the page');
    } else {
      console.log(`Tracking ${this.config.apartment.trackFloorPlans.length} floor plan(s):`);
      this.config.apartment.trackFloorPlans.forEach((name: string, i: number) => {
        console.log(`  ${i + 1}. ${name}`);
      });
    }
    console.log(`Notifications for: ${this.config.apartment.notifyFloorPlans.join(', ')}`);
    console.log(`URL: ${this.config.apartment.url}`);
    console.log(`Check interval: Every ${this.config.monitoring.checkIntervalMinutes} minutes`);
    console.log('='.repeat(60));

    // Test connections
    try {
      console.log('\nTesting notification connections...');
      await this.notifier.testConnections();
      console.log('✓ All connections verified\n');
    } catch (error) {
      console.error('✗ Connection test failed:', error);
      console.error('Please check your .env configuration\n');
      process.exit(1);
    }

    // Run initial check
    await this.checkAndNotify();

    // Schedule periodic checks
    const cronExpression = `*/${this.config.monitoring.checkIntervalMinutes} * * * *`;
    console.log(`\nScheduled with cron expression: ${cronExpression}`);

    cron.schedule(cronExpression, async () => {
      await this.checkAndNotify();
    });

    console.log('Monitor is running... (Press Ctrl+C to stop)\n');
  }

  async stop(): Promise<void> {
    console.log('\nShutting down...');
    await this.scraper.close();
    process.exit(0);
  }
}

// Main execution
const monitor = new ApartmentMonitor();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await monitor.stop();
});

process.on('SIGTERM', async () => {
  await monitor.stop();
});

// Start monitoring
monitor.start().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
