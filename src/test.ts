import { loadConfig } from './config';
import { ApartmentScraper } from './scraper';

async function test() {
  console.log('Starting test...\n');

  try {
    const config = loadConfig();
    console.log('Configuration loaded successfully');
    const trackAll = config.apartment.trackFloorPlans.includes('*');
    if (trackAll) {
      console.log('Tracking: ALL floor plans on the page');
    } else {
      console.log(`Tracking ${config.apartment.trackFloorPlans.length} floor plan(s):`);
      config.apartment.trackFloorPlans.forEach((name: string, i: number) => {
        console.log(`  ${i + 1}. ${name}`);
      });
    }
    console.log(`Notifications for: ${config.apartment.notifyFloorPlans.join(', ')}`);
    console.log(`URL: ${config.apartment.url}\n`);

    const scraper = new ApartmentScraper(config);

    console.log('Checking availability...\n');
    const multiStatus = await scraper.checkMultipleAvailability();

    console.log('\n' + '='.repeat(60));
    console.log('RESULTS:');
    console.log('='.repeat(60));
    for (const status of multiStatus.plans) {
      const unitInfo = status.unitCount !== null && status.unitCount !== undefined ? ` (${status.unitCount} units)` : '';
      const priceInfo = status.price !== null && status.price !== undefined ? ` [$${status.price}]` : '';
      console.log(`${status.isAvailable ? '✓' : '✗'} ${status.floorPlanName}: ${status.availabilityText}${unitInfo}${priceInfo}`);
    }
    console.log(`Checked at: ${multiStatus.timestamp.toLocaleString()}`);
    console.log(`URL: ${multiStatus.url}`);
    console.log('='.repeat(60));

    await scraper.close();
    process.exit(0);
  } catch (error) {
    console.error('\nTest failed:', error);
    process.exit(1);
  }
}

test();
