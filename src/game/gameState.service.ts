import { Injectable, Optional } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { randomUUID } from "crypto";
import { Repository } from "typeorm";
import { GameRoom } from "./entities/game-room.entity";
import { GameRoomPlayer } from "./entities/game-room-player.entity";
import { CardInstance, GameState } from "./types/types.game";

const LOCAL_ROOM_ID = "local";

@Injectable()
export class GameStateService {
    private readonly roomStates = new Map<string, GameState>();

    constructor(
        @Optional()
        @InjectRepository(GameRoom)
        private readonly roomRepository?: Repository<GameRoom>,
        @Optional()
        @InjectRepository(GameRoomPlayer)
        private readonly roomPlayerRepository?: Repository<GameRoomPlayer>,
    ) { }

    async getOrCreateDefaultRoomForUser(userId: string) {
        if (!this.roomRepository || !this.roomPlayerRepository) {
            this.roomStates.set(LOCAL_ROOM_ID, this.roomStates.get(LOCAL_ROOM_ID) ?? this.createInitialState());
            return { id: LOCAL_ROOM_ID, ownerUserId: userId };
        }

        let room = await this.roomRepository.findOne({
            where: {
                ownerUserId: userId,
                status: "playing",
            },
            order: {
                updatedAt: "DESC",
            },
        });

        if (!room) {
            room = await this.roomRepository.save({
                ownerUserId: userId,
                status: "playing",
                stateJson: JSON.stringify(this.createInitialState()),
            });

            await this.roomPlayerRepository.save({
                roomId: room.id,
                userId,
                role: "owner",
            });
        }

        if (!this.roomStates.has(room.id)) {
            const loadedState = this.parseState(room.stateJson);
            this.roomStates.set(room.id, loadedState);

            if (room.stateJson !== JSON.stringify(loadedState)) {
                await this.persistState(room.id);
            }
        }

        return room;
    }

    getState(roomId = LOCAL_ROOM_ID) {
        const cachedState = this.roomStates.get(roomId);
        if (cachedState) {
            if (!this.hasWorldObjects(cachedState)) {
                const initialState = this.createInitialState();
                this.roomStates.set(roomId, initialState);
                return initialState;
            }

            return cachedState;
        }

        const initialState = this.createInitialState();
        this.roomStates.set(roomId, initialState);
        return initialState;
    }

    setState(roomId: string, state: GameState) {
        this.roomStates.set(roomId, state);
    }

    async persistState(roomId = LOCAL_ROOM_ID) {
        if (!this.roomRepository || roomId === LOCAL_ROOM_ID) {
            return;
        }

        const state = this.roomStates.get(roomId);
        if (!state) {
            return;
        }

        await this.roomRepository.update(roomId, {
            stateJson: JSON.stringify(state),
        });
    }

    getStack(stackId: string, roomId = LOCAL_ROOM_ID) {
        return this.getState(roomId).stacks[stackId];
    }

    getCard(cardId: string, roomId = LOCAL_ROOM_ID) {
        return this.getState(roomId).cards[cardId];
    }

    private parseState(stateJson: string) {
        try {
            return this.normalizeState(JSON.parse(stateJson) as Partial<GameState>);
        } catch (error) {
            return this.createInitialState();
        }
    }

    private normalizeState(state: Partial<GameState>) {
        const normalizedState: GameState = {
            cards: state.cards ?? {},
            stacks: state.stacks ?? {},
            moon: state.moon ?? 1,
            moonTimeLeft: state.moonTimeLeft ?? 120,
            coins: state.coins ?? 10,
            cardLimit: state.cardLimit ?? 10,
            phase: state.phase ?? "playing",
        };

        if (!this.hasWorldObjects(normalizedState)) {
            return this.createInitialState();
        }

        return normalizedState;
    }

    private hasWorldObjects(state: GameState) {
        return Object.keys(state.cards).length > 0 || Object.keys(state.stacks).length > 0;
    }

    private createInitialState(): GameState {
        const gameState: GameState = {
            cards: {},
            stacks: {},
            moon: 1,
            moonTimeLeft: 120,
            coins: 10,
            cardLimit: 10,
            phase: "playing",
        };

        const initialCards: CardInstance[] = [
            {
                instanceId: randomUUID(),
                defId: 'villager',
                position: { x: 100, y: 100 },
            },
            {
                instanceId: randomUUID(),
                defId: 'wood',
                position: { x: 300, y: 100 },
            },
            {
                instanceId: randomUUID(),
                defId: 'stone',
                position: { x: 500, y: 100 },
            },
        ];

        initialCards.forEach(card => {
            gameState.cards[card.instanceId] = card;
        });

        return gameState;
    }
}
