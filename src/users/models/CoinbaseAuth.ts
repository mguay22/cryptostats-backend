import { Prop } from '@nestjs/mongoose';

export class CoinbaseAuth {
  @Prop()
  accessToken: string;

  @Prop()
  refreshToken: string;

  @Prop()
  expires: Date;
}
