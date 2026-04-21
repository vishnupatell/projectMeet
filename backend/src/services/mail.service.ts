import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface SendMailInput {
  to: string;
  subject: string;
  text: string;
  html: string;
}

class MailService {
  private transporter: Transporter | null = null;

  private getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;
    if (!config.smtp.host) return null;

    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user
        ? { user: config.smtp.user, pass: config.smtp.pass }
        : undefined,
    });
    return this.transporter;
  }

  async send(input: SendMailInput): Promise<void> {
    const transport = this.getTransporter();
    if (!transport) {
      logger.warn(
        { to: input.to, subject: input.subject },
        'SMTP not configured — email not sent (dev mode). Set SMTP_HOST to enable.',
      );
      return;
    }

    await transport.sendMail({
      from: config.smtp.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    logger.info({ to: input.to, subject: input.subject }, 'Email sent');
  }
}

export const mailService = new MailService();
