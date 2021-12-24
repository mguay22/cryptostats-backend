import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateUserRequest } from './dto/request/create-user-request.dto';
import { UserResponse } from './dto/response/user-response.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(
    @Body() createUserRequest: CreateUserRequest,
  ): Promise<UserResponse> {
    return this.usersService.createUser(createUserRequest);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getUser(@CurrentUser() user: UserResponse): Promise<UserResponse> {
    return user;
  }
}
