import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import * as QRCode from 'qrcode';
import { join } from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires

@Injectable()
export class WhatsAppService implements OnModuleDestroy {
  private readonly logger = new Logger(WhatsAppService.name);
  private socket: WASocket | null = null;
  private qrCode: string | null = null;
  private status: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  private reconnectTimer: NodeJS.Timeout | null = null;
  private readonly authDir = join(process.cwd(), 'whatsapp-auth');

  getStatus() {
    return { status: this.status, qrCode: this.qrCode };
  }

  async connect() {
    if (this.status === 'connecting') return;
    this.status = 'connecting';
    this.qrCode = null;

    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
      const { version } = await fetchLatestBaileysVersion();

      this.socket = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true,
        browser: ['EstuaireAchats', 'Chrome', '1.0.0'],
        generateHighQualityLinkPreview: false,
      });

      this.socket.ev.on('creds.update', saveCreds);

      this.socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.qrCode = await QRCode.toDataURL(qr);
          this.status = 'connecting';
          this.logger.log('QR Code genere, en attente de scan...');
        }

        if (connection === 'open') {
          this.status = 'connected';
          this.qrCode = null;
          this.logger.log('WhatsApp connecte !');
        }

        if (connection === 'close') {
          this.status = 'disconnected';
          this.qrCode = null;
          const reason = (lastDisconnect?.error as any)?.output?.statusCode;

          if (reason === DisconnectReason.loggedOut) {
            this.logger.warn('WhatsApp deconnecte (logout). Suppression de la session.');
            // Ne pas reconnecter automatiquement si deconnecte manuellement
          } else {
            this.logger.warn(`WhatsApp deconnecte (raison: ${reason}). Reconnexion dans 5s...`);
            this.scheduleReconnect();
          }
        }
      });
    } catch (error) {
      this.logger.error('Erreur connexion WhatsApp:', error);
      this.status = 'disconnected';
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => this.connect(), 5000);
  }

  async disconnect() {
    if (this.socket) {
      await this.socket.logout().catch(() => {});
      this.socket = null;
    }
    this.status = 'disconnected';
    this.qrCode = null;
    // Supprimer les fichiers de session
    const fs = await import('fs');
    if (fs.existsSync(this.authDir)) {
      fs.rmSync(this.authDir, { recursive: true, force: true });
    }
    this.logger.log('WhatsApp deconnecte et session supprimee');
  }

  async sendMessage(phone: string, message: string): Promise<boolean> {
    if (this.status !== 'connected' || !this.socket) {
      this.logger.warn('WhatsApp non connecte, message non envoye');
      return false;
    }

    try {
      // Formater le numero: enlever le + et ajouter @s.whatsapp.net
      const jid = this.formatPhoneNumber(phone) + '@s.whatsapp.net';
      await this.socket.sendMessage(jid, { text: message });
      this.logger.log(`Message WhatsApp envoye a ${phone}`);
      return true;
    } catch (error) {
      this.logger.error(`Erreur envoi WhatsApp a ${phone}:`, error);
      return false;
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Enlever espaces, tirets, parentheses
    let cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
    // Si commence par 0, ajouter le code pays Cameroun (237)
    if (cleaned.startsWith('0')) {
      cleaned = '237' + cleaned.substring(1);
    }
    // Si ne commence pas par le code pays
    if (!cleaned.startsWith('237') && cleaned.length <= 9) {
      cleaned = '237' + cleaned;
    }
    return cleaned;
  }

  // ─── MESSAGES TEMPLATES ─────────────────────────────────────

  async sendOrderConfirmationToClient(phone: string, orderNumber: string, total: number) {
    const message =
      `🛒 *EstuaireAchats - Commande Confirmee*\n\n` +
      `Bonjour,\n` +
      `Votre commande *#${orderNumber}* de *${new Intl.NumberFormat('fr-FR').format(total)} FCFA* a ete recue avec succes.\n\n` +
      `Notre equipe va confirmer votre commande sous peu.\n` +
      `Merci pour votre confiance !\n\n` +
      `_EstuaireAchats - Achetez en toute confiance_`;
    return this.sendMessage(phone, message);
  }

  async sendNewOrderToSeller(phone: string, orderNumber: string, total: number, clientName: string) {
    const message =
      `📦 *EstuaireAchats - Nouvelle Commande*\n\n` +
      `Vous avez recu une nouvelle commande !\n\n` +
      `N° Commande: *#${orderNumber}*\n` +
      `Client: *${clientName}*\n` +
      `Montant: *${new Intl.NumberFormat('fr-FR').format(total)} FCFA*\n\n` +
      `Un agent va vous contacter pour confirmer la disponibilite.\n` +
      `Preparez la commande.\n\n` +
      `_EstuaireAchats - Espace Vendeur_`;
    return this.sendMessage(phone, message);
  }

  async sendNewOrderToCallCenter(phone: string, orderNumber: string, total: number, clientName: string, clientPhone: string, shopName: string) {
    const message =
      `📞 *EstuaireAchats - Call Center*\n\n` +
      `Nouvelle commande a traiter !\n\n` +
      `N° Commande: *#${orderNumber}*\n` +
      `Client: *${clientName}* (${clientPhone})\n` +
      `Boutique: *${shopName}*\n` +
      `Montant: *${new Intl.NumberFormat('fr-FR').format(total)} FCFA*\n\n` +
      `Appelez la boutique pour confirmer la disponibilite.`;
    return this.sendMessage(phone, message);
  }

  async sendOrderStatusToClient(phone: string, orderNumber: string, status: string) {
    const statusLabels: Record<string, string> = {
      CONFIRMED: 'confirmee ✅',
      PROCESSING: 'en cours de preparation 🔄',
      SHIPPED: 'expediee 🚚',
      DELIVERED: 'livree 📦✅',
      CANCELLED: 'annulee ❌',
    };
    const label = statusLabels[status] || status;
    const message =
      `📋 *EstuaireAchats - Mise a jour*\n\n` +
      `Votre commande *#${orderNumber}* est maintenant *${label}*.\n\n` +
      `_EstuaireAchats - Achetez en toute confiance_`;
    return this.sendMessage(phone, message);
  }

  onModuleDestroy() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.socket) {
      this.socket.end(undefined);
    }
  }
}
