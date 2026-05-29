import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenStoreService } from './refresh-token-store.service';

type RefreshTokenPayload = {
    email: string;
    userId: string;
    username: string;
    exp: number;
};

@Injectable()
export class AuthService {
    private readonly refreshTokenTtlSeconds = 7 * 24 * 60 * 60;

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private refreshTokenStore: RefreshTokenStoreService,
    ) { }

    async login(dto: LoginDto) {
        const { email, password } = dto;
        const user = await this.usersService.findByEmail(email);

        if (!user) {
            throw new UnauthorizedException('Tên nông dân này chưa có trong sổ hộ khẩu!');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Mật khẩu sai rồi bạn ơi!');
        }

        const payload = {
            email: user.email,
            userId: user.id,
            username: user.username
        }

        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.jwtService.sign(payload, { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '7d' });
        await this.refreshTokenStore.store(refreshToken, user.id, this.refreshTokenTtlSeconds);

        return {
            accessToken,
            refreshToken,
        };
    }

    async register(dto: RegisterDto) {
        const { email, username, password, confirmPassword } = dto;
        
        const user = await this.usersService.findByEmail(email);
        if (user) {
            throw new ConflictException('Email này đã có người đăng ký rồi!');
        }

        if (password !== confirmPassword) {
            throw new BadRequestException('Mật khẩu xác nhận không khớp!');
        }
        
        const newUser = await this.usersService.create({ email, username, password });
        const payload = {
            email: newUser.email,
            userId: newUser.id,
            username: newUser.username
        }
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.jwtService.sign(payload, { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '7d' });
        await this.refreshTokenStore.store(refreshToken, newUser.id, this.refreshTokenTtlSeconds);

        return {
            message: "Registration successfully himar!",
            accessToken: accessToken,
            refreshToken: refreshToken,
        };
    }

    async refresh(dto: RefreshTokenDto) {
        const { refreshToken } = dto;

        try {
        const payloadOld = await this.jwtService.verify<RefreshTokenPayload>(refreshToken, { 
            secret: process.env.JWT_REFRESH_SECRET 
        });

        const isStoredToken = await this.refreshTokenStore.exists(refreshToken);
        if (!isStoredToken) {
            throw new UnauthorizedException('Refresh token revoked');
        }

        const currentTime = Math.floor(Date.now() / 1000);
        const timeLeft = payloadOld.exp - currentTime;

        if (timeLeft <= 0) {
            throw new UnauthorizedException('Refresh token expired');
        }

        const newPayload = {
            email: payloadOld.email,
            userId: payloadOld.userId,
            username: payloadOld.username
        };

        const accessToken = this.jwtService.sign(newPayload);
        const newRefreshToken = this.jwtService.sign(newPayload, { 
            secret: process.env.JWT_REFRESH_SECRET, 
            expiresIn: timeLeft
        });
            await this.refreshTokenStore.revoke(refreshToken);
            await this.refreshTokenStore.store(newRefreshToken, payloadOld.userId, timeLeft);

            return {
                // message: 'Access token refreshed successfully',
                accessToken: accessToken,
                refreshToken: newRefreshToken,
            };
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async logout(dto: LogoutDto) {
        const { refreshToken } = dto;
        console.log('[AuthService] logout called');

        try {
            const user = await this.jwtService.verify(refreshToken, { secret: process.env.JWT_REFRESH_SECRET });
            if (!user) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            await this.refreshTokenStore.revoke(refreshToken);
            console.log(`[AuthService] user ${user.userId} logged out`);
            return {
                message: 'Logout successful',
            };
        } catch (error) {
            console.log('[AuthService] logout failed: invalid refresh token');
            throw new UnauthorizedException('Invalid refresh token');
        }
    }
}
