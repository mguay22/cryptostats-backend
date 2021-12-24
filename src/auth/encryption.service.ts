import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes256';

  constructor(private readonly configService: ConfigService) {}

  encrypt(data: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      Buffer.concat(
        [
          Buffer.from(this.configService.get('ENCRYPTION_KEY')),
          Buffer.alloc(32),
        ],
        32,
      ),
      iv,
    );
    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decrypt(data: string): string {
    const textParts = data.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      Buffer.concat(
        [
          Buffer.from(this.configService.get('ENCRYPTION_KEY')),
          Buffer.alloc(32),
        ],
        32,
      ),
      iv,
    );
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }
}
