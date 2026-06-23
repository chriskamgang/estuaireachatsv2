import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const NEXAH_BASE_URL = 'https://smsvas.com/bulk/public/index.php/api/v1';
const CONFIG_KEY = 'nexah_sms_config';

export interface NexahSmsConfig {
  user: string;
  password: string;
  senderid: string;
  enabled: boolean;
  webhookUrl: string;
}

const DEFAULT_CONFIG: NexahSmsConfig = {
  user: '',
  password: '',
  senderid: 'EstuaireAchats',
  enabled: true,
  webhookUrl: '',
};

@Injectable()
export class NexahSmsService {
  private readonly logger = new Logger('NexahSmsService');

  constructor(private prisma: PrismaService) {}

  // ==================== CONFIG ====================

  async getConfig(): Promise<NexahSmsConfig> {
    const setting = await this.prisma.businessSetting.findUnique({
      where: { type: CONFIG_KEY },
    });

    if (!setting || setting.value === null) {
      return { ...DEFAULT_CONFIG };
    }

    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(setting.value) };
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }

  async saveConfig(config: Partial<NexahSmsConfig>): Promise<NexahSmsConfig> {
    const current = await this.getConfig();
    const merged = { ...current, ...config };
    const serialized = JSON.stringify(merged);

    await this.prisma.businessSetting.upsert({
      where: { type: CONFIG_KEY },
      update: { value: serialized },
      create: { type: CONFIG_KEY, value: serialized },
    });

    this.logger.log('[NexahSMS] Configuration mise a jour');
    return merged;
  }

  // ==================== SEND SMS ====================

  /**
   * Formate un numero de telephone camerounais avec le prefixe 237.
   */
  private formatNumber(phone: string): string {
    let cleaned = phone.replace(/\s+/g, '').replace(/[^0-9+]/g, '');

    // Retirer le + au debut
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.slice(1);
    }

    // Ajouter 237 si pas present
    if (!cleaned.startsWith('237')) {
      cleaned = '237' + cleaned;
    }

    return cleaned;
  }

  /**
   * Envoyer un SMS a un ou plusieurs numeros.
   */
  async sendSms(
    to: string | string[],
    message: string,
  ): Promise<{ sent: boolean; response: any; recipients: number }> {
    const config = await this.getConfig();

    if (!config.enabled) {
      this.logger.warn('[NexahSMS] SMS desactive dans la configuration');
      return { sent: false, response: { error: 'SMS desactive' }, recipients: 0 };
    }

    if (!config.user || !config.password) {
      this.logger.warn('[NexahSMS] Credentials manquants');
      return { sent: false, response: { error: 'Credentials non configures' }, recipients: 0 };
    }

    const numbers = Array.isArray(to) ? to : [to];
    const formattedNumbers = numbers.map((n) => this.formatNumber(n));
    const mobiles = formattedNumbers.join(',');

    try {
      const res = await fetch(`${NEXAH_BASE_URL}/sendsms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: config.user,
          password: config.password,
          senderid: config.senderid,
          sms: message,
          mobiles,
        }),
      });

      const data = await res.json();

      this.logger.log(
        `[NexahSMS] SMS envoye a ${formattedNumbers.length} destinataire(s)`,
      );

      return {
        sent: true,
        response: data,
        recipients: formattedNumbers.length,
      };
    } catch (error: any) {
      this.logger.error(`[NexahSMS] Erreur envoi SMS: ${error.message}`);
      return {
        sent: false,
        response: { error: error.message },
        recipients: 0,
      };
    }
  }

  /**
   * Envoyer un SMS en masse.
   */
  async sendBulkSms(
    mobiles: string[],
    message: string,
    senderid?: string,
  ): Promise<{ sent: boolean; response: any; recipients: number }> {
    const config = await this.getConfig();

    if (!config.enabled) {
      return { sent: false, response: { error: 'SMS desactive' }, recipients: 0 };
    }

    if (!config.user || !config.password) {
      return { sent: false, response: { error: 'Credentials non configures' }, recipients: 0 };
    }

    const formattedNumbers = mobiles.map((n) => this.formatNumber(n));
    const mobilesStr = formattedNumbers.join(',');

    try {
      const res = await fetch(`${NEXAH_BASE_URL}/sendsms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: config.user,
          password: config.password,
          senderid: senderid || config.senderid,
          sms: message,
          mobiles: mobilesStr,
        }),
      });

      const data = await res.json();

      this.logger.log(
        `[NexahSMS] SMS bulk envoye a ${formattedNumbers.length} destinataire(s)`,
      );

      return {
        sent: true,
        response: data,
        recipients: formattedNumbers.length,
      };
    } catch (error: any) {
      this.logger.error(`[NexahSMS] Erreur envoi bulk SMS: ${error.message}`);
      return {
        sent: false,
        response: { error: error.message },
        recipients: 0,
      };
    }
  }

  // ==================== BALANCE ====================

  async getBalance(): Promise<{
    credit: number;
    accountexpdate: string;
    balanceexpdate: string;
  }> {
    const config = await this.getConfig();

    if (!config.user || !config.password) {
      throw new Error('Credentials Nexah non configures');
    }

    try {
      const res = await fetch(`${NEXAH_BASE_URL}/smscredit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: config.user,
          password: config.password,
        }),
      });

      const data = await res.json();

      return {
        credit: data.credit ?? data.Credit ?? 0,
        accountexpdate: data.accountexpdate ?? data.AccountExpDate ?? '',
        balanceexpdate: data.balanceexpdate ?? data.BalanceExpDate ?? '',
      };
    } catch (error: any) {
      this.logger.error(`[NexahSMS] Erreur recuperation solde: ${error.message}`);
      throw error;
    }
  }

  // ==================== DELIVERY REPORT ====================

  handleDeliveryReport(
    dlrlist: Array<{
      reponsecode: string;
      status: string;
      messageid: string;
      mobileno: string;
      submittime: string;
      senttime: string;
      deliverytime: string;
    }>,
  ) {
    for (const report of dlrlist) {
      this.logger.log(
        `[NexahSMS] DR - MessageID: ${report.messageid}, Status: ${report.status}, Mobile: ${report.mobileno}, DeliveryTime: ${report.deliverytime}`,
      );
    }

    return { received: true, count: dlrlist.length };
  }
}
