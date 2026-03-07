import puppeteer, { Browser, Page } from 'puppeteer';
import { Config, AvailabilityStatus, MultiPlanAvailabilityStatus } from './types';

export class ApartmentScraper {
  private browser: Browser | null = null;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    console.log('Initializing browser...');
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });
  }

  async checkAvailability(): Promise<AvailabilityStatus> {
    // For backward compatibility, check the first floor plan
    const result = await this.checkMultipleAvailability();
    return result.plans[0];
  }

  async checkMultipleAvailability(): Promise<MultiPlanAvailabilityStatus> {
    if (!this.browser) {
      await this.initialize();
    }

    let page: Page | null = null;

    try {
      console.log(`Checking availability at ${this.config.apartment.url}...`);
      const trackAll = this.config.apartment.trackFloorPlans.includes('*');
      if (trackAll) {
        console.log('Tracking ALL floor plans on the page');
      } else {
        console.log(`Tracking ${this.config.apartment.trackFloorPlans.length} floor plan(s): ${this.config.apartment.trackFloorPlans.join(', ')}`);
      }
      console.log(`Notifications enabled for: ${this.config.apartment.notifyFloorPlans.join(', ')}`);

      page = await this.browser!.newPage();

      // Set user agent to avoid bot detection
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // Set viewport
      await page.setViewport({ width: 1920, height: 1080 });

      // Add rate limiting delay before navigation
      await this.delay(this.config.monitoring.requestDelayMs);

      // Navigate to the apartment page
      await page.goto(this.config.apartment.url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait for floor plan tiles to load
      console.log('Waiting for floor plan tiles to load...');

      try {
        await page.waitForSelector('.floorplan-tile-content', {
          timeout: 10000,
        });
      } catch (error) {
        console.log('Floor plan tiles not found');
        // Return all tracked plans as unavailable
        const trackedPlans = trackAll ? [] : this.config.apartment.trackFloorPlans;
        return {
          timestamp: new Date(),
          url: this.config.apartment.url,
          plans: trackedPlans.map(name => ({
            isAvailable: false,
            timestamp: new Date(),
            url: this.config.apartment.url,
            floorPlanName: name,
            unitCount: null,
            price: null,
            availabilityText: 'Not found',
          })),
        };
      }

      // Extract all floor plans with their availability, unit counts, and prices
      const floorPlans = await page.$$eval('.floorplan-tile-content', (tiles) => {
        return tiles.map((tile) => {
          const titleElement = tile.querySelector('.floorplan-title');
          const availabilityElement = tile.querySelector('.floorplan-availability');
          const detailsElement = tile.querySelector('.floorplan-details');

          const name = titleElement?.textContent?.trim() || '';
          const availabilityText = availabilityElement?.textContent?.trim() || '';
          const details = detailsElement?.textContent?.trim() || '';

          // Extract unit count from text like "4 Units Available"
          let unitCount: number | null = null;
          const unitMatch = availabilityText.match(/(\d+)\s+Unit/i);
          if (unitMatch) {
            unitCount = parseInt(unitMatch[1], 10);
          }

          // Extract price from details or other elements
          // Looking for patterns like "$2,500", "$2500", "2500/month"
          let price: number | null = null;
          const priceMatch = (details + ' ' + availabilityText).match(/\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
          if (priceMatch) {
            const priceStr = priceMatch[1].replace(/,/g, '');
            const parsed = parseFloat(priceStr);
            // Only accept reasonable apartment prices (500-10000)
            if (parsed >= 500 && parsed <= 10000) {
              price = parsed;
            }
          }

          return {
            name,
            availability: availabilityText,
            unitCount,
            price,
          };
        });
      });

      console.log(`Found ${floorPlans.length} floor plans on the page`);

      // Determine which plans to track
      let plansToTrack: string[];
      if (trackAll) {
        plansToTrack = floorPlans.map(fp => fp.name);
      } else {
        plansToTrack = this.config.apartment.trackFloorPlans;
      }

      // Check each tracked floor plan
      const results: AvailabilityStatus[] = [];

      for (const targetName of plansToTrack) {
        const targetFloorPlan = floorPlans.find((fp) =>
          fp.name.toLowerCase().includes(targetName.toLowerCase().split('(')[0].trim().toLowerCase())
        );

        if (!targetFloorPlan) {
          console.log(`⚠️  Floor plan "${targetName}" not found on page`);
          results.push({
            isAvailable: false,
            timestamp: new Date(),
            url: this.config.apartment.url,
            floorPlanName: targetName,
            unitCount: null,
            price: null,
            availabilityText: 'Not found',
          });
          continue;
        }

        const isAvailable = targetFloorPlan.availability
          .toLowerCase()
          .includes(this.config.apartment.availabilityText.toLowerCase());

        const statusIcon = isAvailable ? '✓' : '✗';
        const unitInfo = targetFloorPlan.unitCount !== null ? ` (${targetFloorPlan.unitCount} units)` : '';
        const priceInfo = targetFloorPlan.price !== null ? ` [$${targetFloorPlan.price}]` : '';
        console.log(`${statusIcon} "${targetFloorPlan.name}": ${targetFloorPlan.availability}${unitInfo}${priceInfo}`);

        results.push({
          isAvailable,
          timestamp: new Date(),
          url: this.config.apartment.url,
          floorPlanName: targetFloorPlan.name,
          unitCount: targetFloorPlan.unitCount,
          price: targetFloorPlan.price,
          availabilityText: targetFloorPlan.availability,
        });
      }

      return {
        timestamp: new Date(),
        url: this.config.apartment.url,
        plans: results,
      };
    } catch (error) {
      console.error('Error during scraping:', error);
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async close(): Promise<void> {
    if (this.browser) {
      console.log('Closing browser...');
      await this.browser.close();
      this.browser = null;
    }
  }
}
