import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor() {
        const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
        if (!jwtRefreshSecret) {
            throw new Error('JWT_REFRESH_SECRET is not defined');
        }

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtRefreshSecret,
        });
    }

    validate(payload: { userId: string, username: string }) {
        return {
            userId: payload.userId,
            username: payload.username,
        };
    }
}
