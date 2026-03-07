import { loadConfig } from './config';
import { Notifier } from './notifier';
import { AvailabilityStatus } from './types';

async function testNotifications() {
  console.log('Testing Notification System');
  console.log('='.repeat(60));

  try {
    const config = loadConfig();
    const notifier = new Notifier(config);

    // Test connections first
    console.log('\n1. Testing connections...\n');
    await notifier.testConnections();

    console.log('\n2. Sending test notifications...\n');

    // Create mock availability statuses for all notification plans
    const mockStatuses: AvailabilityStatus[] = config.apartment.notifyFloorPlans.map((name: string) => ({
      isAvailable: true,
      timestamp: new Date(),
      url: config.apartment.url,
      floorPlanName: name,
      unitCount: 3,
      price: 2500,
      availabilityText: '3 Units Available',
    }));

    console.log(`Testing with ${mockStatuses.length} floor plan(s):\n`);
    mockStatuses.forEach((s, i) => console.log(`  ${i + 1}. ${s.floorPlanName}`));
    console.log();

    // Send notifications
    const result = await notifier.sendMultiplePlanNotifications(mockStatuses);

    console.log('\n' + '='.repeat(60));
    console.log('NOTIFICATION TEST RESULTS:');
    console.log('='.repeat(60));

    if (result.email.success) {
      console.log('✓ Email sent successfully to:', config.email.to);
    } else {
      console.log('✗ Email failed:', result.email.error);
    }

    if (result.sms.success) {
      console.log('✓ SMS sent successfully to:', config.sms.phoneTo);
    } else {
      console.log('✗ SMS failed:', result.sms.error);
    }

    console.log('='.repeat(60));

    if (result.email.success || result.sms.success) {
      console.log('\n✓ At least one notification method is working!');
      console.log('Check your email inbox and phone for test messages.\n');
    } else {
      console.log('\n✗ All notifications failed. Check your configuration.\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Test failed:', error);
    console.error('\nPlease check your .env file configuration.\n');
    process.exit(1);
  }
}

testNotifications();
