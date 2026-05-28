import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { GameGateway } from './game.gateway';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module'; // 
import { GameService } from './game.service';
import { GameStateService } from './gameState.service';
import { CraftingEngine } from './engine/crafting.engine';

@Module({
    imports: [
        ConfigModule,

        // JwtModule.registerAsync({
        //   imports: [ConfigModule],
        //   inject: [ConfigService],
        //   useFactory: (configService: ConfigService) => ({
        //     secret: configService.get<string>('JWT_SECRET'),
        //   }),
        // }),

        CacheModule.register({
            ttl: 0,
            max: 100,
        }),
    ],
    providers: [
        GameGateway,
        GameService,
        GameStateService,
        CraftingEngine,
    ],
})
export class GameModule { }