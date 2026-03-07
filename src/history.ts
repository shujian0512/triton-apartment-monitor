import fs from 'fs';
import path from 'path';
import { HistoryRecord, AvailabilitySummary, FloorPlanSnapshot } from './types';

const HISTORY_FILE = path.join(__dirname, '..', 'availability-history.jsonl');
const SUMMARY_FILE = path.join(__dirname, '..', 'availability-summary.json');

export class HistoryManager {
  private retentionDays: number;

  constructor(retentionDays: number = 90) {
    this.retentionDays = retentionDays;
  }

  /**
   * Append a record to the history file
   */
  appendRecord(record: HistoryRecord): void {
    const line = JSON.stringify(record) + '\n';
    fs.appendFileSync(HISTORY_FILE, line, 'utf-8');
  }

  /**
   * Append multiple records at once
   */
  appendRecords(records: HistoryRecord[]): void {
    const lines = records.map(r => JSON.stringify(r)).join('\n') + '\n';
    fs.appendFileSync(HISTORY_FILE, lines, 'utf-8');
  }

  /**
   * Read all records from history file
   */
  readAllRecords(): HistoryRecord[] {
    if (!fs.existsSync(HISTORY_FILE)) {
      return [];
    }

    const content = fs.readFileSync(HISTORY_FILE, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line.length > 0);

    return lines.map(line => {
      try {
        return JSON.parse(line) as HistoryRecord;
      } catch (error) {
        console.error('Error parsing history line:', line, error);
        return null;
      }
    }).filter((record): record is HistoryRecord => record !== null);
  }

  /**
   * Clean up old records beyond retention period
   */
  cleanupOldRecords(): number {
    const records = this.readAllRecords();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    const filteredRecords = records.filter(record => {
      const recordDate = new Date(record.timestamp);
      return recordDate >= cutoffDate;
    });

    const removedCount = records.length - filteredRecords.length;

    if (removedCount > 0) {
      // Rewrite the file with filtered records
      const lines = filteredRecords.map(r => JSON.stringify(r)).join('\n') + '\n';
      fs.writeFileSync(HISTORY_FILE, lines, 'utf-8');
      console.log(`Cleaned up ${removedCount} old history records (retention: ${this.retentionDays} days)`);
    }

    return removedCount;
  }

  /**
   * Get records for a specific floor plan
   */
  getRecordsForPlan(floorPlanName: string): HistoryRecord[] {
    const allRecords = this.readAllRecords();
    return allRecords.filter(r => r.floorPlanName === floorPlanName);
  }

  /**
   * Get records within a date range
   */
  getRecordsInRange(startDate: Date, endDate: Date): HistoryRecord[] {
    const allRecords = this.readAllRecords();
    return allRecords.filter(r => {
      const recordDate = new Date(r.timestamp);
      return recordDate >= startDate && recordDate <= endDate;
    });
  }

  /**
   * Generate summary statistics from history
   */
  generateSummary(currentState: { [floorPlanName: string]: FloorPlanSnapshot }): AvailabilitySummary {
    const allRecords = this.readAllRecords();

    if (allRecords.length === 0) {
      return {
        generatedAt: new Date().toISOString(),
        totalChecks: 0,
        dateRange: {
          start: new Date().toISOString(),
          end: new Date().toISOString(),
        },
        floorPlans: {},
      };
    }

    // Group records by floor plan
    const planRecords: { [planName: string]: HistoryRecord[] } = {};

    for (const record of allRecords) {
      if (!planRecords[record.floorPlanName]) {
        planRecords[record.floorPlanName] = [];
      }
      planRecords[record.floorPlanName].push(record);
    }

    // Calculate statistics for each floor plan
    const floorPlans: AvailabilitySummary['floorPlans'] = {};

    for (const [planName, records] of Object.entries(planRecords)) {
      const currentSnapshot = currentState[planName];

      // Calculate availability changes
      let availabilityChanges = 0;
      for (let i = 1; i < records.length; i++) {
        if (records[i].isAvailable !== records[i - 1].isAvailable) {
          availabilityChanges++;
        }
      }

      // Calculate unit statistics (when available)
      const availableRecords = records.filter(r => r.isAvailable && r.unitCount !== null);
      const unitCounts = availableRecords.map(r => r.unitCount!);

      const averageUnitsWhenAvailable = unitCounts.length > 0
        ? unitCounts.reduce((sum, count) => sum + count, 0) / unitCounts.length
        : null;

      const maxUnitsAvailable = unitCounts.length > 0
        ? Math.max(...unitCounts)
        : null;

      const minUnitsAvailable = unitCounts.length > 0
        ? Math.min(...unitCounts)
        : null;

      // Calculate price statistics
      const priceRecords = records.filter(r => r.price !== null);
      const prices = priceRecords.map(r => r.price!);

      const currentPrice = currentSnapshot?.price ?? null;
      const minPrice = prices.length > 0 ? Math.min(...prices) : null;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : null;

      floorPlans[planName] = {
        currentStatus: {
          isAvailable: currentSnapshot?.isAvailable ?? false,
          unitCount: currentSnapshot?.unitCount ?? null,
          price: currentSnapshot?.price ?? null,
          availabilityText: currentSnapshot?.availabilityText ?? 'Unknown',
          lastStatusChange: currentSnapshot?.lastStatusChange ?? new Date().toISOString(),
        },
        history: {
          totalChecks: records.length,
          availabilityChanges,
          averageUnitsWhenAvailable,
          maxUnitsAvailable,
          minUnitsAvailable,
          priceHistory: {
            current: currentPrice,
            min: minPrice,
            max: maxPrice,
          },
        },
      };
    }

    // Get date range
    const timestamps = allRecords.map(r => new Date(r.timestamp).getTime());
    const startDate = new Date(Math.min(...timestamps));
    const endDate = new Date(Math.max(...timestamps));

    return {
      generatedAt: new Date().toISOString(),
      totalChecks: allRecords.length,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      floorPlans,
    };
  }

  /**
   * Save summary to file
   */
  saveSummary(summary: AvailabilitySummary): void {
    fs.writeFileSync(SUMMARY_FILE, JSON.stringify(summary, null, 2), 'utf-8');
  }

  /**
   * Load summary from file
   */
  loadSummary(): AvailabilitySummary | null {
    if (!fs.existsSync(SUMMARY_FILE)) {
      return null;
    }

    try {
      const content = fs.readFileSync(SUMMARY_FILE, 'utf-8');
      return JSON.parse(content) as AvailabilitySummary;
    } catch (error) {
      console.error('Error loading summary:', error);
      return null;
    }
  }
}
