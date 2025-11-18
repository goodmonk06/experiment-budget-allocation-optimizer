import { logger } from '../logger';

export interface NotificationPayload {
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  metadata?: Record<string, unknown>;
}

export interface INotificationAdapter {
  send(payload: NotificationPayload): Promise<void>;
  isConfigured(): boolean;
}

// In-memory/console notification adapter (default)
export class ConsoleNotificationAdapter implements INotificationAdapter {
  async send(payload: NotificationPayload): Promise<void> {
    logger.info(
      {
        title: payload.title,
        message: payload.message,
        severity: payload.severity,
        metadata: payload.metadata,
      },
      '[NOTIFICATION]'
    );
  }

  isConfigured(): boolean {
    return true;
  }
}

// Webhook notification adapter
export class WebhookNotificationAdapter implements INotificationAdapter {
  constructor(private webhookUrl: string) {}

  async send(payload: NotificationPayload): Promise<void> {
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: payload.title,
          text: payload.message,
          severity: payload.severity,
          timestamp: new Date().toISOString(),
          ...payload.metadata,
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.statusText}`);
      }

      logger.debug({ webhookUrl: this.webhookUrl }, 'Notification sent via webhook');
    } catch (error) {
      logger.error({ error, webhookUrl: this.webhookUrl }, 'Webhook notification failed');
      throw error;
    }
  }

  isConfigured(): boolean {
    return !!this.webhookUrl;
  }
}

// Email notification adapter (stub implementation)
export class EmailNotificationAdapter implements INotificationAdapter {
  constructor(
    private smtpConfig: {
      host: string;
      port: number;
      user: string;
      password: string;
      from: string;
      to: string[];
    }
  ) {}

  async send(payload: NotificationPayload): Promise<void> {
    // In a real implementation, this would use nodemailer or similar
    logger.info(
      {
        to: this.smtpConfig.to,
        subject: payload.title,
        message: payload.message,
      },
      '[EMAIL NOTIFICATION - STUB]'
    );

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  isConfigured(): boolean {
    return !!(this.smtpConfig.host && this.smtpConfig.user && this.smtpConfig.to.length > 0);
  }
}

// Notification service that manages multiple adapters
export class NotificationService {
  private adapters: INotificationAdapter[] = [];

  constructor() {
    // Default to console adapter
    this.adapters.push(new ConsoleNotificationAdapter());
  }

  addAdapter(adapter: INotificationAdapter): void {
    if (adapter.isConfigured()) {
      this.adapters.push(adapter);
      logger.info({ adapter: adapter.constructor.name }, 'Notification adapter added');
    }
  }

  async notify(payload: NotificationPayload): Promise<void> {
    const promises = this.adapters.map((adapter) => adapter.send(payload));
    await Promise.all(promises);
  }
}

export const notificationService = new NotificationService();
