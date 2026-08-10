// ============================================================================
// mail.service.ts — Envio de correo saliente, hoy usado SOLO por
// automations.service.ts (recordatorio de fin de periodo). Wrapper fino
// sobre nodemailer, con UN comportamiento importante: si "SMTP_HOST" no
// esta configurado (ver configuration.ts, "mail"), "send()" NO intenta
// conectarse a nada — deja un aviso en el log y devuelve
// "{ sent: false }". Mismo criterio de "no romper la operacion principal
// por un problema de un sistema secundario" que ya usa trackEvent() en el
// frontend (ver apps/web/lib/analytics.ts): un recordatorio que no se
// pudo mandar no deberia tumbar el job que lo dispara, y en desarrollo
// (sin credenciales SMTP reales) esto deja el envio "listo pero apagado"
// en vez de fallar cada vez que corre el job.
// ============================================================================

import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import type { AppConfig } from '../../config/configuration';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private from = 'Stoka LMS <no-responder@stokalms.com>';

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const mailConfig = this.configService.get<AppConfig['mail']>('mail')!;
    this.from = mailConfig.from;

    if (!mailConfig.host) {
      this.logger.warn(
        'SMTP_HOST no esta configurado — el envio de correo queda desactivado (los recordatorios se registran igual, pero no se mandan).',
      );
      return;
    }

    this.transporter = createTransport({
      host: mailConfig.host,
      port: mailConfig.port,
      secure: mailConfig.secure,
      auth: mailConfig.user ? { user: mailConfig.user, pass: mailConfig.password } : undefined,
    });
    this.logger.log(`Envio de correo configurado (${mailConfig.host}:${mailConfig.port}).`);
  }

  async send(to: string, subject: string, html: string): Promise<{ sent: boolean }> {
    if (!this.transporter) {
      this.logger.debug(`[correo desactivado] Se hubiera enviado "${subject}" a ${to}.`);
      return { sent: false };
    }

    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
      return { sent: true };
    } catch (err) {
      // Un correo que no sale nunca debe tumbar el job que lo disparo (ver
      // la nota grande al inicio del archivo) — se registra y se sigue.
      this.logger.error(
        `No se pudo enviar el correo "${subject}" a ${to}: ${err instanceof Error ? err.message : err}`,
      );
      return { sent: false };
    }
  }
}
