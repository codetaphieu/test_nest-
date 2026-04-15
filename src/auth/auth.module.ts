import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { JwtRefreshTokenStrategy } from './jwt-refresh.strategy'; 

@Module({
    imports: [
        UsersModule,
        ConfigModule, 
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                // Đổi từ 15s thành 1h để nông dân chơi game ổn định hơn
                signOptions: { expiresIn: '1h' }, 
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [
        AuthService, 
        JwtStrategy, 
        JwtRefreshTokenStrategy // Phải khai báo ở đây thì Refresh Token mới chạy
    ],
    exports : [AuthService, JwtStrategy, JwtRefreshTokenStrategy], // Xuất các provider để GameGateway có thể sử dụng
})
export class AuthModule { }