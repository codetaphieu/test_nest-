import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameGateway } from './game.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { GameService } from './game.service';
import { GameStateService } from './gameState.service';
import { CraftingEngine } from './engine/crafting.engine';
import { GameRoom } from './entities/game-room.entity';
import { GameRoomPlayer } from './entities/game-room-player.entity';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([GameRoom, GameRoomPlayer]),
        JwtModule.register({
            secret: process.env.JWT_SECRET,
        }),
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
