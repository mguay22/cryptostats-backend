import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { lastValueFrom } from 'rxjs';
import { EncryptionService } from '../auth/encryption.service';
import { UserResponse } from '../users/dto/response/user-response.dto';
import { CoinbaseAuth } from '../users/models/CoinbaseAuth';
import { UsersService } from '../users/users.service';

@Injectable()
export class CoinbaseAuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly usersService: UsersService,
    private readonly encryptionService: EncryptionService,
  ) {}

  public authorize(res: Response): void {
    res.redirect(this.buildAuthorizeUrl().href);
    return;
  }

  private buildAuthorizeUrl() {
    const authorizeUrl = new URL('https://coinbase.com/oauth/authorize');
    authorizeUrl.searchParams.append('response_type', 'code');
    authorizeUrl.searchParams.append(
      'client_id',
      this.configService.get('COINBASE_CLIENT_ID'),
    );
    authorizeUrl.searchParams.append(
      'redirect_uri',
      this.configService.get('COINBASE_REDIRECT_URI'),
    );
    authorizeUrl.searchParams.append(
      'scope',
      'wallet:transactions:read,wallet:accounts:read',
    );
    return authorizeUrl;
  }

  public handleCallback(req: Request, res: Response): void {
    const { code } = req.query;
    const { user } = req;
    this.getTokensFromCode(code as string).subscribe(async tokensResponse => {
      await this.updateUserCoinbaseAuth(
        tokensResponse.data,
        ((user as unknown) as UserResponse)._id,
      );
      res.redirect(this.configService.get('AUTH_REDIRECT_URI'));
    });
  }

  private getTokensFromCode(code: string) {
    return this.httpService.post('https://api.coinbase.com/oauth/token', {
      grant_type: 'authorization_code',
      code,
      client_id: this.configService.get('COINBASE_CLIENT_ID'),
      client_secret: this.configService.get('COINBASE_CLIENT_SECRET'),
      redirect_uri: this.configService.get('COINBASE_REDIRECT_URI'),
    });
  }

  private async updateUserCoinbaseAuth(tokenPayload: any, userId: string) {
    const {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
    } = tokenPayload;
    const expires = new Date();
    expires.setSeconds(expires.getSeconds() + expiresIn);
    await this.usersService.updateUser(userId, {
      coinbaseAuth: {
        accessToken: this.encryptionService.encrypt(accessToken),
        refreshToken: this.encryptionService.encrypt(refreshToken),
        expires,
      },
    });
  }

  async getAccessToken(userId: string): Promise<string> {
    const coinbaseAuth = await this.usersService.getCoinbaseAuth(userId);
    if (new Date().getTime() >= coinbaseAuth.expires.getTime()) {
      const response$ = this.refreshAccessToken(coinbaseAuth);
      const response = await lastValueFrom(response$);
      await this.updateUserCoinbaseAuth(response.data, userId);
      return response.data.access_token;
    }
    return this.encryptionService.decrypt(coinbaseAuth.accessToken);
  }

  private refreshAccessToken(coinbaseAuth: CoinbaseAuth) {
    return this.httpService.post('https://www.coinbase.com/oauth/token', {
      grant_type: 'refresh_token',
      refresh_token: this.encryptionService.decrypt(coinbaseAuth.refreshToken),
      client_id: this.configService.get('COINBASE_CLIENT_ID'),
      client_secret: this.configService.get('COINBASE_CLIENT_SECRET'),
    });
  }
}
