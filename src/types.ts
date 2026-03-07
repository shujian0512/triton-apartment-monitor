export interface Config {
  apartment: {
    url: string;
    availabilitySelector: string;
    availabilityText: string;
    trackFloorPlans: string[]; // Floor plans to track (can be ['*'] for all)
    notifyFloorPlans: string[]; // Floor plans to send notifications for (subset of tracked)
  };
  email: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
    to: string;
  };
  sms: {
    accountSid: string;
    authToken: string;
    phoneFrom: string;
    phoneTo: string;
  };
  monitoring: {
    checkIntervalMinutes: number;
    requestDelayMs: number;
  };
  history: {
    retentionDays: number;
  };
}

export interface AvailabilityStatus {
  isAvailable: boolean;
  timestamp: Date;
  url: string;
  floorPlanName: string;
  unitCount?: number | null; // Optional for backward compatibility
  price?: number | null; // Optional for backward compatibility
  availabilityText?: string; // Optional for backward compatibility
}

export interface MultiPlanAvailabilityStatus {
  timestamp: Date;
  url: string;
  plans: AvailabilityStatus[];
}

export interface NotificationResult {
  email: {
    success: boolean;
    error?: string;
  };
  sms: {
    success: boolean;
    error?: string;
  };
}

// Enhanced tracking types
export interface FloorPlanSnapshot {
  floorPlanName: string;
  isAvailable: boolean;
  unitCount: number | null; // Number of units available (null if can't parse)
  price: number | null; // Price in dollars (null if not found)
  availabilityText: string; // Raw availability text
  lastStatusChange: string; // ISO timestamp of last availability change
  lastChecked: string; // ISO timestamp of last check
}

export interface AppStateV2 {
  version: 2;
  lastCheckTime: string | null; // Pacific Time string
  notificationCount: number;
  floorPlans: {
    [floorPlanName: string]: FloorPlanSnapshot;
  };
}

export interface HistoryRecord {
  timestamp: string; // ISO timestamp
  floorPlanName: string;
  isAvailable: boolean;
  unitCount: number | null;
  price: number | null;
  availabilityText: string;
}

export interface AvailabilitySummary {
  generatedAt: string;
  totalChecks: number;
  dateRange: {
    start: string;
    end: string;
  };
  floorPlans: {
    [floorPlanName: string]: {
      currentStatus: {
        isAvailable: boolean;
        unitCount: number | null;
        price: number | null;
        availabilityText: string;
        lastStatusChange: string;
      };
      history: {
        totalChecks: number;
        availabilityChanges: number;
        averageUnitsWhenAvailable: number | null;
        maxUnitsAvailable: number | null;
        minUnitsAvailable: number | null;
        priceHistory: {
          current: number | null;
          min: number | null;
          max: number | null;
        };
      };
    };
  };
}
