import nodemailer, { Transporter } from 'nodemailer';
import { Twilio } from 'twilio';
import { Config, AvailabilityStatus, NotificationResult } from './types';

export class Notifier {
  private config: Config;
  private emailTransporter: Transporter;
  private twilioClient: Twilio | null = null;
  private smsEnabled: boolean;

  constructor(config: Config) {
    this.config = config;

    // Initialize email transporter
    this.emailTransporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });

    // Check if Twilio is configured
    this.smsEnabled = Boolean(
      config.sms.accountSid &&
      config.sms.accountSid.startsWith('AC') &&
      config.sms.authToken &&
      config.sms.authToken !== 'your_auth_token'
    );

    // Initialize Twilio client only if configured
    if (this.smsEnabled) {
      this.twilioClient = new Twilio(
        config.sms.accountSid,
        config.sms.authToken
      );
    } else {
      console.log('⚠️  SMS notifications disabled (Twilio not configured)');
    }
  }

  async sendNotifications(
    status: AvailabilityStatus
  ): Promise<NotificationResult> {
    const result: NotificationResult = {
      email: { success: false },
      sms: { success: false },
    };

    // Prepare notification promises
    const promises: Promise<void>[] = [this.sendEmail(status)];

    if (this.smsEnabled) {
      promises.push(this.sendSMS(status));
    }

    // Send notifications in parallel
    const [emailResult, smsResult] = await Promise.allSettled(promises);

    // Process email result
    if (emailResult.status === 'fulfilled') {
      result.email = { success: true };
      console.log('Email notification sent successfully');
    } else {
      result.email = {
        success: false,
        error: emailResult.reason?.message || 'Unknown error',
      };
      console.error('Email notification failed:', result.email.error);
    }

    // Process SMS result (only if SMS is enabled)
    if (this.smsEnabled && smsResult) {
      if (smsResult.status === 'fulfilled') {
        result.sms = { success: true };
        console.log('SMS notification sent successfully');
      } else {
        result.sms = {
          success: false,
          error: smsResult.reason?.message || 'Unknown error',
        };
        console.error('SMS notification failed:', result.sms.error);
      }
    } else if (!this.smsEnabled) {
      result.sms = { success: false, error: 'SMS disabled (Twilio not configured)' };
    }

    return result;
  }

  private async sendEmail(status: AvailabilityStatus): Promise<void> {
    const subject = `🏠 ${status.floorPlanName} is Now Available!`;
    const pacificTime = status.timestamp.toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2ecc71;">Good News! Your Apartment is Available!</h2>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 10px 0;"><strong>Floor Plan:</strong> ${status.floorPlanName}</p>
          <p style="margin: 10px 0;"><strong>Status:</strong> <span style="color: #2ecc71; font-weight: bold;">AVAILABLE</span></p>
          <p style="margin: 10px 0;"><strong>Checked at:</strong> ${pacificTime} PT</p>
        </div>
        <p style="margin: 20px 0;">
          <a href="${status.url}"
             style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Apartment Listing
          </a>
        </p>
        <p style="color: #7f8c8d; font-size: 12px; margin-top: 30px;">
          This notification was sent by your Apartment Availability Monitor.
        </p>
      </div>
    `;

    await this.emailTransporter.sendMail({
      from: this.config.email.from,
      to: this.config.email.to,
      subject,
      html,
    });
  }

  async sendMultiplePlanNotifications(
    availablePlans: AvailabilityStatus[]
  ): Promise<NotificationResult> {
    const result: NotificationResult = {
      email: { success: false },
      sms: { success: false },
    };

    if (availablePlans.length === 0) {
      return result;
    }

    // Prepare notification promises
    const promises: Promise<void>[] = [this.sendMultiPlanEmail(availablePlans)];

    if (this.smsEnabled) {
      promises.push(this.sendMultiPlanSMS(availablePlans));
    }

    // Send notifications in parallel
    const [emailResult, smsResult] = await Promise.allSettled(promises);

    // Process email result
    if (emailResult.status === 'fulfilled') {
      result.email = { success: true };
      console.log('Email notification sent successfully');
    } else {
      result.email = {
        success: false,
        error: emailResult.reason?.message || 'Unknown error',
      };
      console.error('Email notification failed:', result.email.error);
    }

    // Process SMS result (only if SMS is enabled)
    if (this.smsEnabled && smsResult) {
      if (smsResult.status === 'fulfilled') {
        result.sms = { success: true };
        console.log('SMS notification sent successfully');
      } else {
        result.sms = {
          success: false,
          error: smsResult.reason?.message || 'Unknown error',
        };
        console.error('SMS notification failed:', result.sms.error);
      }
    } else if (!this.smsEnabled) {
      result.sms = { success: false, error: 'SMS disabled (Twilio not configured)' };
    }

    return result;
  }

  private async sendMultiPlanEmail(plans: AvailabilityStatus[]): Promise<void> {
    const planCount = plans.length;
    const subject = planCount === 1
      ? `🏠 ${plans[0].floorPlanName} is Now Available!`
      : `🏠 ${planCount} Floor Plans Now Available!`;

    const pacificTime = plans[0].timestamp.toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    const planRows = plans.map(plan => `
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #2ecc71;">
        <p style="margin: 5px 0;"><strong style="font-size: 16px;">${plan.floorPlanName}</strong></p>
        <p style="margin: 5px 0; color: #2ecc71; font-weight: bold;">✓ AVAILABLE</p>
      </div>
    `).join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2ecc71;">Good News! ${planCount === 1 ? 'Your Apartment is' : 'Apartments are'} Available!</h2>
        <p style="color: #555;">The following floor plan${planCount > 1 ? 's' : ''} ${planCount > 1 ? 'are' : 'is'} now available:</p>
        ${planRows}
        <p style="margin: 30px 0 20px 0;">
          <a href="${plans[0].url}"
             style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Apartment Listings
          </a>
        </p>
        <p style="color: #7f8c8d; font-size: 12px; margin-top: 30px;">
          Checked at: ${pacificTime} PT<br>
          This notification was sent by your Apartment Availability Monitor.
        </p>
      </div>
    `;

    await this.emailTransporter.sendMail({
      from: this.config.email.from,
      to: this.config.email.to,
      subject,
      html,
    });
  }

  private async sendMultiPlanSMS(plans: AvailabilityStatus[]): Promise<void> {
    if (!this.twilioClient) {
      throw new Error('Twilio client not initialized');
    }

    const planList = plans.map(p => p.floorPlanName).join(', ');
    const message = plans.length === 1
      ? `🏠 ${plans[0].floorPlanName} is now AVAILABLE! Check it out: ${plans[0].url}`
      : `🏠 ${plans.length} floor plans now AVAILABLE: ${planList}. Check them out: ${plans[0].url}`;

    await this.twilioClient.messages.create({
      body: message,
      from: this.config.sms.phoneFrom,
      to: this.config.sms.phoneTo,
    });
  }

  private async sendSMS(status: AvailabilityStatus): Promise<void> {
    if (!this.twilioClient) {
      throw new Error('Twilio client not initialized');
    }

    const message = `🏠 ${status.floorPlanName} is now AVAILABLE! Check it out: ${status.url}`;

    await this.twilioClient.messages.create({
      body: message,
      from: this.config.sms.phoneFrom,
      to: this.config.sms.phoneTo,
    });
  }

  async testConnections(): Promise<void> {
    console.log('Testing email connection...');
    try {
      await this.emailTransporter.verify();
      console.log('✓ Email connection successful');
    } catch (error) {
      console.error('✗ Email connection failed:', error);
      throw new Error('Email configuration is invalid');
    }

    if (this.smsEnabled && this.twilioClient) {
      console.log('Testing Twilio connection...');
      try {
        await this.twilioClient.api.accounts(this.config.sms.accountSid).fetch();
        console.log('✓ Twilio connection successful');
      } catch (error) {
        console.error('✗ Twilio connection failed:', error);
        throw new Error('Twilio configuration is invalid');
      }
    } else {
      console.log('⚠️  Skipping Twilio test (not configured)');
    }
  }
}
