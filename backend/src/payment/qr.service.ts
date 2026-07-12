import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

@Injectable()
export class QrService {
  async generateBase64(data: string): Promise<string> {
    try {
      const base64 = await QRCode.toDataURL(data, {
        errorCorrectionLevel: 'H',
        width: 300,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
      });
      return base64;
    } catch {
      throw new Error('QR Code generation failed');
    }
  }
}
