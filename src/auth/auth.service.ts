import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
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
        return {
            accessToken: this.jwtService.sign(payload),
            refreshToken: this.jwtService.sign(payload, { 
                secret: process.env.JWT_REFRESH_SECRET, 
                expiresIn: '7d' // Tăng lên 7 ngày cho nông dân đỡ phải login lại nhiều
            }),
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

        // ĐÂY LÀ NƠI PHÉP MÀU XẢY RA: 
        // Gọi sang UsersService để nhận 50 vàng và thẻ bài
        const newUser = await this.usersService.create({ email, username, password });
        const payload = {
            email: newUser.email,
            userId: newUser.id,
            username: newUser.username
        }
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.jwtService.sign(payload, { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '2m' });
        return {
            message: "Registration successfully himar!",
            accessToken: accessToken,
            refreshToken: refreshToken,
        };
    }

    async refresh(dto: RefreshTokenDto) {
        const { refreshToken } = dto;

        try {
        const payloadOld = await this.jwtService.verify(refreshToken, { 
            secret: process.env.JWT_REFRESH_SECRET 
        });

        const currentTime = Math.floor(Date.now() / 1000);
        const timeLeft = payloadOld.exp - currentTime;

        if (timeLeft <= 0) {
            throw new UnauthorizedException('Refresh token expired');
        }

        const newPayload = {
            userId: payloadOld.userId,
            username: payloadOld.username
        };

        const accessToken = this.jwtService.sign(newPayload);
        const newRefreshToken = this.jwtService.sign(newPayload, { 
            secret: process.env.JWT_REFRESH_SECRET, 
            expiresIn: timeLeft
        });
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

        try {
            const user = await this.jwtService.verify(refreshToken, { secret: process.env.JWT_REFRESH_SECRET });
            if (!user) {
                throw new UnauthorizedException('Invalid refresh token');
            }
            
            console.log('user:', user);
            console.log('log out ở đây');
            return {
                message: 'Logout successful',
            };
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }
}