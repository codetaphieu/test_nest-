import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
// Phải có từ khóa 'export' ở đây
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Không cho phép dùng token hết hạn
      secretOrKey: configService.get<string>('JWT_SECRET'), // Lấy mã bí mật từ .env
    });
  }

  // Hàm này sẽ nạp thông tin người dùng vào object 'req.user'
  async validate(payload: { userId: string; email: string; username: string }) {
    return { 
      userId: payload.userId, 
      email: payload.email, 
      username: payload.username 
    };
  }
}