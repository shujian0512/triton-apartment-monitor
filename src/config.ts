import dotenv from 'dotenv';
import { Config } from './types';

dotenv.config();

function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  return value;
}

function getEnvVarNumber(name: string, defaultValue?: number): number {
  const value = process.env[name];
  if (value) {
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      throw new Error(`Environment variable ${name} must be a number`);
    }
    return num;
  }
  if (defaultValue !== undefined) {
    return defaultValue;
  }
  throw new Error(`Environment variable ${name} is required but not set`);
}

function getEnvVarBoolean(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) {
    return defaultValue;
  }
  return value.toLowerCase() === 'true';
}

function parseFloorPlans(value: string): string[] {
  // Support comma-separated, semicolon-separated, or pipe-separated values
  const separators = [',', ';', '|'];
  let plans: string[] = [];

  for (const separator of separators) {
    if (value.includes(separator)) {
      plans = value.split(separator).map(p => p.trim()).filter(p => p.length > 0);
      break;
    }
  }

  // If no separator found, treat as single plan
  if (plans.length === 0) {
    plans = [value.trim()];
  }

  return plans;
}

export function loadConfig(): Config {
  // Support both old and new configuration variables for backward compatibility
  const trackFloorPlansRaw = getEnvVar('TRACK_FLOOR_PLANS',
    getEnvVar('FLOOR_PLAN_NAMES',
      getEnvVar('FLOOR_PLAN_NAME', '*')
    )
  );

  const notifyFloorPlansRaw = getEnvVar('NOTIFY_FLOOR_PLANS',
    getEnvVar('FLOOR_PLAN_NAMES',
      getEnvVar('FLOOR_PLAN_NAME', 'Plan 1B')
    )
  );

  return {
    apartment: {
      url: getEnvVar('APARTMENT_URL'),
      availabilitySelector: getEnvVar('AVAILABILITY_SELECTOR', '.floorplan-availability'),
      availabilityText: getEnvVar('AVAILABILITY_TEXT'),
      trackFloorPlans: parseFloorPlans(trackFloorPlansRaw),
      notifyFloorPlans: parseFloorPlans(notifyFloorPlansRaw),
    },
    email: {
      host: getEnvVar('SMTP_HOST'),
      port: getEnvVarNumber('SMTP_PORT', 587),
      secure: getEnvVarBoolean('SMTP_SECURE', false),
      user: getEnvVar('SMTP_USER'),
      pass: getEnvVar('SMTP_PASS'),
      from: getEnvVar('EMAIL_FROM'),
      to: getEnvVar('EMAIL_TO'),
    },
    sms: {
      accountSid: getEnvVar('TWILIO_ACCOUNT_SID'),
      authToken: getEnvVar('TWILIO_AUTH_TOKEN'),
      phoneFrom: getEnvVar('TWILIO_PHONE_FROM'),
      phoneTo: getEnvVar('TWILIO_PHONE_TO'),
    },
    monitoring: {
      checkIntervalMinutes: getEnvVarNumber('CHECK_INTERVAL_MINUTES', 30),
      requestDelayMs: getEnvVarNumber('REQUEST_DELAY_MS', 2000),
    },
    history: {
      retentionDays: getEnvVarNumber('HISTORY_RETENTION_DAYS', 90),
    },
  };
}
