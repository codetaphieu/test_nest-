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

        const payload = { email: user.email, userId: user.id, username: user.username };

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

        const payload = { email: newUser.email, userId: newUser.id, username: newUser.username };
        
        return {
            message: "Đăng ký thành công! Nhận ngay 50 vàng khởi nghiệp nhé!",
            accessToken: this.jwtService.sign(payload),
            refreshToken: this.jwtService.sign(payload, { 
                secret: process.env.JWT_REFRESH_SECRET, 
                expiresIn: '7d' 
            }),
        };
    }

    // Các hàm Refresh và Logout giữ nguyên như logic bạn đã viết
    async refresh(dto: RefreshTokenDto) { /* ... giữ nguyên logic xử lý timeLeft ... */ }
    async logout(dto: LogoutDto) { /* ... giữ nguyên logic verify token ... */ }
}