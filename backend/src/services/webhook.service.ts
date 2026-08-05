import prisma from '../config/database';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';
import crypto from 'crypto';
import https from 'https';
import http from 'http';

export type WebhookEvent =
  | 'meeting.started'
  | 'meeting.ended'
  | 'recording.ready'
  | 'participant.joined'
  | 'participant.left'
  | 'transcript.ready';

export class WebhookService {
  async createWebhook(userId: string, data: { url: string; events: WebhookEvent[]; secret?: string }) {
    const webhook = await prisma.webhook.create({
      data: {
        userId,
        url: data.url,
        events: data.events,
        secret: data.secret || crypto.randomBytes(32).toString('hex'),
      },
    });

    logger.info({ webhookId: webhook.id, userId }, 'Webhook created');
    return webhook;
  }

  async deleteWebhook(webhookId: string, userId: string) {
    const webhook = await prisma.webhook.findFirst({
      where: { id: webhookId, userId },
    });
    if (!webhook) throw new NotFoundError('Webhook');

    await prisma.webhook.delete({ where: { id: webhookId } });
    return { success: true };
  }

  async getUserWebhooks(userId: string) {
    return prisma.webhook.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async triggerEvent(event: WebhookEvent, payload: Record<string, any>) {
    // Find all active webhooks listening to this event
    const webhooks = await prisma.webhook.findMany({
      where: { isActive: true },
    });

    const relevantWebhooks = webhooks.filter((wh) => {
      const events = wh.events as string[];
      return events.includes(event);
    });

    for (const webhook of relevantWebhooks) {
      this.sendWebhook(webhook, event, payload).catch((err) => {
        logger.error({ err, webhookId: webhook.id }, 'Webhook delivery failed');
      });
    }
  }

  private async sendWebhook(
    webhook: { id: string; url: string; secret: string | null },
    event: WebhookEvent,
    payload: Record<string, any>,
  ) {
    const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
    const signature = webhook.secret
      ? crypto.createHmac('sha256', webhook.secret).update(body).digest('hex')
      : '';

    const url = new URL(webhook.url);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': event,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const transport = url.protocol === 'https:' ? https : http;

    return new Promise<void>((resolve, reject) => {
      const req = transport.request(options, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`Webhook returned ${res.statusCode}`));
        }
        res.resume();
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }
}

export const webhookService = new WebhookService();
