import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { UserResponse } from '../../users/dto/response/user-response.dto';
import { UsersService } from '../../users/users.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<UserResponse> {
    return this.usersService.validateUser(email, password);
  }
}
