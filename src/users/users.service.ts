import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { hash, compare } from 'bcrypt';
import { CreateUserRequest } from './dto/request/create-user-request.dto';
import { UserResponse } from './dto/response/user-response.dto';
import { CoinbaseAuth } from './models/CoinbaseAuth';
import { User } from './models/User';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async createUser(
    createUserRequest: CreateUserRequest,
  ): Promise<UserResponse> {
    await this.validateCreateUserRequest(createUserRequest);
    const user = await this.usersRepository.insertOne({
      ...createUserRequest,
      password: await hash(createUserRequest.password, 10),
    });
    return this.buildResponse(user);
  }

  async updateUser(userId: string, data: Partial<User>): Promise<UserResponse> {
    const user = await this.usersRepository.updateOne(userId, data);
    if (!user) {
      throw new NotFoundException(`User not found by _id: '${userId}'.`);
    }
    return this.buildResponse(user);
  }

  private async validateCreateUserRequest(
    createUserRequest: CreateUserRequest,
  ): Promise<void> {
    const user = await this.usersRepository.findOneByEmail(
      createUserRequest.email,
    );
    if (user) {
      throw new BadRequestException('This email already exists.');
    }
  }

  async validateUser(email: string, password: string): Promise<UserResponse> {
    const user = await this.usersRepository.findOneByEmail(email);
    if (!user) {
      throw new NotFoundException(`User does not exist by email: '${email}'.`);
    }
    const passwordIsValid = await compare(password, user.password);
    if (!passwordIsValid) {
      throw new UnauthorizedException('Credentials are invalid');
    }
    return this.buildResponse(user);
  }

  async getUserById(userId: string): Promise<UserResponse> {
    const user = await this.usersRepository.findOneById(userId);
    if (!user) {
      throw new NotFoundException(`User not found by _id: '${userId}'.`);
    }
    return this.buildResponse(user);
  }

  async getCoinbaseAuth(userId: string): Promise<CoinbaseAuth> {
    const user = await this.usersRepository.findOneById(userId);
    if (!user) {
      throw new NotFoundException(`User not found by _id: '${userId}'.`);
    }
    if (!user.coinbaseAuth) {
      throw new UnauthorizedException(
        `User with _id: '${userId}' has not authorized Coinbase.`,
      );
    }
    return user.coinbaseAuth;
  }

  private buildResponse(user: User): UserResponse {
    return {
      _id: user._id.toHexString(),
      email: user.email,
      isCoinbaseAuthorized: !!user.coinbaseAuth,
    };
  }
}
