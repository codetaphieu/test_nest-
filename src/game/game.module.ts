import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { GameGateway } from './game.gateway';
import { UsersModule } from '../users/users.module'; 
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module'; // 

@Module({
  imports: [
    UsersModule,
    AuthModule, 
    ConfigModule, // Khai báo ConfigModule
    
    // Đổi từ register sang registerAsync để đồng bộ 100% với AuthModule
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
    }),
    
    // Đăng ký CacheModule
    CacheModule.register({
      ttl: 0,
      max: 100, 
    }),
  ],
  providers: [GameGateway],
})
export class GameModule {}