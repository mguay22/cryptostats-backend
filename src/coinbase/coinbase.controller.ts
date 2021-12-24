import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserResponse } from '../users/dto/response/user-response.dto';
import { CoinbaseAuthService } from './coinbase-auth.service';
import { CoinbaseService } from './coinbase.service';

@Controller('coinbase')
export class CoinbaseController {
  constructor(
    private readonly coinbaseAuthService: CoinbaseAuthService,
    private readonly coinbaseService: CoinbaseService,
  ) {}

  @Get('auth')
  @UseGuards(JwtAuthGuard)
  authorize(@Res() response: Response): void {
    this.coinbaseAuthService.authorize(response);
  }

  @Get('auth/callback')
  @UseGuards(JwtAuthGuard)
  handleCallback(@Req() request: Request, @Res() response: Response): void {
    this.coinbaseAuthService.handleCallback(request, response);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  getCoinbaseData(@CurrentUser() user: UserResponse): Promise<any> {
    return this.coinbaseService.getPrimaryAccountTransactions(user._id);
  }
}
