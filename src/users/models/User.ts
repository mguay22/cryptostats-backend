import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { CoinbaseAuth } from './CoinbaseAuth';

@Schema({ versionKey: false })
export class User extends Document {
  @Prop()
  email: string;

  @Prop()
  password: string;

  @Prop()
  coinbaseAuth?: CoinbaseAuth;
}

export const UserSchema = SchemaFactory.createForClass(User);
