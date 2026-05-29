import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { GameService } from './game.service';
import { GameStateService } from './gameState.service';
import { CardInstance, CardStack, GameSocketEvent } from './types/types.game';

type GameSocketUser = {
    userId: string;
    email: string;
    username: string;
};

type DropCardOnCardPayload = {
    draggingCardId?: string;
    targetCardId?: string;
    draggingCard?: CardInstance;
    targetCard?: CardInstance;
    x?: number;
    y?: number;
    position?: { x: number; y: number };
};

type DropCardOnStackPayload = {
    draggingCardId?: string;
    targetStackId?: string;
    draggingCard?: CardInstance;
    targetStack?: CardStack;
    x?: number;
    y?: number;
    position?: { x: number; y: number };
};

type DropCardOnEmptyPayload = {
    instanceId?: string;
    draggingCardId?: string;
    draggingCard?: CardInstance;
    x?: number;
    y?: number;
    position?: { x: number; y: number };
};

type DropStackOnEmptyPayload = {
    stackId?: string;
    draggingStackId?: string;
    stack?: CardStack;
    draggingStack?: CardStack;
    x?: number;
    y?: number;
    position?: { x: number; y: number };
};

type DropStackOnCardPayload = {
    draggingStackId?: string;
    targetCardId?: string;
    draggingStack?: CardStack;
    targetCard?: CardInstance;
    x?: number;
    y?: number;
    position?: { x: number; y: number };
};

type DropStackOnStackPayload = {
    draggingStackId?: string;
    targetStackId?: string;
    draggingStack?: CardStack;
    targetStack?: CardStack;
    x?: number;
    y?: number;
    position?: { x: number; y: number };
};

type SplitStackPayload = {
    stackId?: string;
    sourceStackId?: string;
    cardId?: string;
    instanceId?: string;
    x?: number;
    y?: number;
    position?: { x: number; y: number };
};

type BuyPackPayload = {
    packId?: string;
    id?: string;
    x?: number;
    y?: number;
    position?: { x: number; y: number };
};

type SellCardPayload = {
    instanceId?: string;
    cardId?: string;
    card?: CardInstance;
};

@WebSocketGateway({
    cors: {
        origin: 'http://localhost:3000',
        credentials: true,
    },
    namespace: '/game',
})
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly gameService: GameService,
        private readonly gameState: GameStateService,
        private readonly jwtService: JwtService,
    ) {}

    afterInit(server: Server) {
        this.gameService.setBroadcaster((event, data, roomId) => {
            if (!roomId) {
                return;
            }

            server.to(roomId).emit(event, data);
        });
    }

    async handleConnection(client: Socket) {
        const token = client.handshake.auth?.token;

        if (!token || typeof token !== 'string') {
            client.emit('game_error', {
                code: 'unauthorized',
                message: 'Socket connection requires access token',
            });
            client.disconnect(true);
            return;
        }

        try {
            const user = await this.jwtService.verifyAsync<GameSocketUser>(token, {
                secret: process.env.JWT_SECRET,
            });
            const room = await this.gameState.getOrCreateDefaultRoomForUser(user.userId);

            client.data.user = user;
            client.data.roomId = room.id;
            await client.join(room.id);
            this.gameService.resumeCraftingTimers(room.id);

            client.emit('init_state', this.gameState.getState(room.id));
            console.log(`[Socket] Client connected: ${client.id}, user=${user.userId}, room=${room.id}`);
        } catch (error) {
            client.emit('game_error', {
                code: 'unauthorized',
                message: 'Invalid socket access token',
            });
            client.disconnect(true);
        }
    }

    handleDisconnect(client: Socket) {
        console.log(`[Socket] Client disconnected: ${client.id}, room=${client.data.roomId ?? 'none'}`);
    }

    @SubscribeMessage('init_state')
    handleInitState(@ConnectedSocket() client: Socket) {
        const roomId = this.getRoomId(client);
        if (!roomId) {
            return;
        }

        client.emit('init_state', this.gameState.getState(roomId));
    }

    @SubscribeMessage('buy_pack')
    handleBuyPack(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: BuyPackPayload,
    ) {
        const roomId = this.getRoomId(client);
        if (!roomId) {
            return;
        }

        const packId = data.packId ?? data.id;

        if (!packId) {
            client.emit('game_error', {
                code: 'invalid_payload',
                message: 'buy_pack requires packId',
            });
            return;
        }

        void this.emitCommandResult(client, this.gameService.buyPack(packId, this.getPosition(data), roomId));
    }

    @SubscribeMessage('sell_card')
    handleSellCard(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: SellCardPayload,
    ) {
        const roomId = this.getRoomId(client);
        if (!roomId) {
            return;
        }

        const instanceId = data.instanceId ?? data.cardId ?? data.card?.instanceId;

        if (!instanceId) {
            client.emit('game_error', {
                code: 'invalid_payload',
                message: 'sell_card requires instanceId',
            });
            return;
        }

        void this.emitCommandResult(client, this.gameService.sellCard(instanceId, roomId));
    }

    @SubscribeMessage('drop_card_on_card')
    handleDropCardOnCard(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: DropCardOnCardPayload,
    ) {
        const roomId = this.getRoomId(client);
        if (!roomId) {
            return;
        }

        const draggingCardId = data.draggingCardId ?? data.draggingCard?.instanceId;
        const targetCardId = data.targetCardId ?? data.targetCard?.instanceId;

        if (!draggingCardId || !targetCardId) {
            client.emit('game_error', {
                code: 'invalid_payload',
                message: 'drop_card_on_card requires draggingCardId and targetCardId',
            });
            return;
        }

        this.emitCommandResult(
            client,
            this.gameService.dropCardOnCard(draggingCardId, targetCardId, this.getPosition(data), roomId),
        );
    }

    @SubscribeMessage('drop_card_on_stack')
    handleDropCardOnStack(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: DropCardOnStackPayload,
    ) {
        const roomId = this.getRoomId(client);
        if (!roomId) {
            return;
        }

        const draggingCardId = data.draggingCardId ?? data.draggingCard?.instanceId;
        const targetStackId = data.targetStackId ?? data.targetStack?.stackId;

        if (!draggingCardId || !targetStackId) {
            client.emit('game_error', {
                code: 'invalid_payload',
                message: 'drop_card_on_stack requires draggingCardId and targetStackId',
            });
            return;
        }

        this.emitCommandResult(
            client,
            this.gameService.dropCardOnStack(draggingCardId, targetStackId, this.getPosition(data), roomId),
        );
    }

    @SubscribeMessage('drop_card_on_empty')
    handleDropCardOnEmpty(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: DropCardOnEmptyPayload,
    ) {
        const roomId = this.getRoomId(client);
        if (!roomId) {
            return;
        }

        const instanceId = data.instanceId ?? data.draggingCardId ?? data.draggingCard?.instanceId;
        const x = data.x ?? data.position?.x ?? data.draggingCard?.position.x;
        const y = data.y ?? data.position?.y ?? data.draggingCard?.position.y;

        if (!instanceId || typeof x !== 'number' || typeof y !== 'number') {
            client.emit('game_error', {
                code: 'invalid_payload',
                message: 'drop_card_on_empty requires instanceId, x, and y',
            });
            return;
        }

        void this.emitCommandResult(client, this.gameService.dropCardOnEmpty(instanceId, x, y, roomId));
    }

    @SubscribeMessage('drop_stack_on_empty')
    handleDropStackOnEmpty(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: DropStackOnEmptyPayload,
    ) {
        const roomId = this.getRoomId(client);
        if (!roomId) {
            return;
        }

        const stackId = data.stackId ?? data.draggingStackId ?? data.stack?.stackId ?? data.draggingStack?.stackId;
        const x = data.x ?? data.position?.x ?? data.stack?.position.x ?? data.draggingStack?.position.x;
        const y = data.y ?? data.position?.y ?? data.stack?.position.y ?? data.draggingStack?.position.y;

        if (!stackId || typeof x !== 'number' || typeof y !== 'number') {
            client.emit('game_error', {
                code: 'invalid_payload',
                message: 'drop_stack_on_empty requires stackId, x, and y',
            });
            return;
        }

        void this.emitCommandResult(client, this.gameService.dropStackOnEmpty(stackId, x, y, roomId));
    }

    @SubscribeMessage('drop_stack_on_card')
    handleDropStackOnCard(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: DropStackOnCardPayload,
    ) {
        const roomId = this.getRoomId(client);
        if (!roomId) {
            return;
        }

        const draggingStackId = data.draggingStackId ?? data.draggingStack?.stackId;
        const targetCardId = data.targetCardId ?? data.targetCard?.instanceId;

        if (!draggingStackId || !targetCardId) {
            client.emit('game_error', {
                code: 'invalid_payload',
                message: 'drop_stack_on_card requires draggingStackId and targetCardId',
            });
            return;
        }

        this.emitCommandResult(
            client,
            this.gameService.dropStackOnCard(draggingStackId, targetCardId, this.getPosition(data), roomId),
        );
    }

    @SubscribeMessage('drop_stack_on_stack')
    handleDropStackOnStack(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: DropStackOnStackPayload,
    ) {
        const roomId = this.getRoomId(client);
        if (!roomId) {
            return;
        }

        const draggingStackId = data.draggingStackId ?? data.draggingStack?.stackId;
        const targetStackId = data.targetStackId ?? data.targetStack?.stackId;

        if (!draggingStackId || !targetStackId) {
            client.emit('game_error', {
                code: 'invalid_payload',
                message: 'drop_stack_on_stack requires draggingStackId and targetStackId',
            });
            return;
        }

        this.emitCommandResult(
            client,
            this.gameService.dropStackOnStack(draggingStackId, targetStackId, this.getPosition(data), roomId),
        );
    }

    @SubscribeMessage('split_card_from_stack')
    handleSplitCardFromStack(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: SplitStackPayload,
    ) {
        const roomId = this.getRoomId(client);
        if (!roomId) {
            return;
        }

        const stackId = data.stackId ?? data.sourceStackId;
        const cardId = data.cardId ?? data.instanceId;
        const position = this.getPosition(data);

        if (!stackId || !cardId || !position) {
            client.emit('game_error', {
                code: 'invalid_payload',
                message: 'split_card_from_stack requires stackId, cardId, x, and y',
            });
            return;
        }

        this.emitCommandResult(
            client,
            this.gameService.splitCardFromStack(stackId, cardId, position.x, position.y, roomId),
        );
    }

    @SubscribeMessage('split_sub_stack_from_card')
    handleSplitSubStackFromCard(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: SplitStackPayload,
    ) {
        void this.handleSplitStackFromCardPayload(client, data, 'split_sub_stack_from_card');
    }

    @SubscribeMessage('split_stack_from_card')
    handleSplitStackFromCard(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: SplitStackPayload,
    ) {
        void this.handleSplitStackFromCardPayload(client, data, 'split_stack_from_card');
    }

    private async handleSplitStackFromCardPayload(client: Socket, data: SplitStackPayload, eventName: string) {
        const roomId = this.getRoomId(client);
        if (!roomId) {
            return;
        }

        const stackId = data.stackId ?? data.sourceStackId;
        const cardId = data.cardId ?? data.instanceId;
        const position = this.getPosition(data);

        if (!stackId || !cardId || !position) {
            client.emit('game_error', {
                code: 'invalid_payload',
                message: `${eventName} requires stackId, cardId, x, and y`,
            });
            return;
        }

        await this.emitCommandResult(
            client,
            this.gameService.splitSubStackFromCard(stackId, cardId, position.x, position.y, roomId),
        );
    }

    @SubscribeMessage('update_card_position')
    handleUpdateCardPosition(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { instanceId: string, x: number, y: number },
    ) {
        const roomId = this.getRoomId(client);
        if (!roomId) {
            return;
        }

        void this.emitCommandResult(
            client,
            this.gameService.updateCardPosition(data.instanceId, data.x, data.y, roomId),
        );
    }

    @SubscribeMessage('update_stack_position')
    handleUpdateStackPosition(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { stackId: string, x: number, y: number },
    ) {
        const roomId = this.getRoomId(client);
        if (!roomId) {
            return;
        }

        void this.emitCommandResult(
            client,
            this.gameService.updateStackPosition(data.stackId, data.x, data.y, roomId),
        );
    }

    private async emitCommandResult(client: Socket, events: GameSocketEvent[]) {
        const roomId = this.getRoomId(client);
        if (!roomId) {
            return;
        }

        let hasMutationEvent = false;
        for (const event of events) {
            if (event.event === 'game_error') {
                client.emit(event.event, event.data);
                continue;
            }

            hasMutationEvent = true;
            this.server.to(roomId).emit(event.event, event.data);
        }

        if (hasMutationEvent) {
            await this.gameState.persistState(roomId);
        }
    }

    private getRoomId(client: Socket) {
        const roomId = client.data.roomId;
        if (typeof roomId === 'string') {
            return roomId;
        }

        client.emit('game_error', {
            code: 'room_not_joined',
            message: 'Socket has not joined a game room',
        });
        return undefined;
    }

    private getPosition(data: { x?: number; y?: number; position?: { x: number; y: number } }) {
        const x = data.x ?? data.position?.x;
        const y = data.y ?? data.position?.y;

        if (typeof x !== 'number' || typeof y !== 'number') {
            return undefined;
        }

        return { x, y };
    }
}
