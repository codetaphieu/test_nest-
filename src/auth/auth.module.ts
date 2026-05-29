import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { JwtRefreshTokenStrategy } from './jwt-refresh.strategy'; 
import { RefreshTokenStoreService } from './refresh-token-store.service';

@Module({
    imports: [
        UsersModule,
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '1h' },
        }), 
    ],
    controllers: [AuthController],
    providers: [
        AuthService, 
        JwtStrategy, 
        JwtRefreshTokenStrategy,
        RefreshTokenStoreService,
    ],
    exports : [AuthService, JwtStrategy, JwtRefreshTokenStrategy], 
})
export class AuthModule { }