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
import { GameService } from './game.service';
import { GameStateService } from './gameState.service';
import { CardInstance, CardStack, GameSocketEvent } from './types/types.game';

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
    ) {}

    afterInit(server: Server) {
        this.gameService.setBroadcaster((event, data) => {
            server.emit(event, data);
        });
    }

    handleConnection(client: Socket) {
        console.log(`[Socket] Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`[Socket] Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('init_state')
    handleInitState(@ConnectedSocket() client: Socket) {
        client.emit('init_state', this.gameState.getState());
    }

    @SubscribeMessage('drop_card_on_card')
    handleDropCardOnCard(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: DropCardOnCardPayload,
    ) {
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
            this.gameService.dropCardOnCard(draggingCardId, targetCardId, this.getPosition(data)),
        );
    }

    @SubscribeMessage('drop_card_on_stack')
    handleDropCardOnStack(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: DropCardOnStackPayload,
    ) {
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
            this.gameService.dropCardOnStack(draggingCardId, targetStackId, this.getPosition(data)),
        );
    }

    @SubscribeMessage('drop_card_on_empty')
    handleDropCardOnEmpty(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: DropCardOnEmptyPayload,
    ) {
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

        this.emitCommandResult(client, this.gameService.dropCardOnEmpty(instanceId, x, y));
    }

    @SubscribeMessage('drop_stack_on_empty')
    handleDropStackOnEmpty(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: DropStackOnEmptyPayload,
    ) {
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

        this.emitCommandResult(client, this.gameService.dropStackOnEmpty(stackId, x, y));
    }

    @SubscribeMessage('drop_stack_on_card')
    handleDropStackOnCard(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: DropStackOnCardPayload,
    ) {
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
            this.gameService.dropStackOnCard(draggingStackId, targetCardId, this.getPosition(data)),
        );
    }

    @SubscribeMessage('drop_stack_on_stack')
    handleDropStackOnStack(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: DropStackOnStackPayload,
    ) {
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
            this.gameService.dropStackOnStack(draggingStackId, targetStackId, this.getPosition(data)),
        );
    }

    @SubscribeMessage('split_card_from_stack')
    handleSplitCardFromStack(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: SplitStackPayload,
    ) {
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
            this.gameService.splitCardFromStack(stackId, cardId, position.x, position.y),
        );
    }

    @SubscribeMessage('split_sub_stack_from_card')
    handleSplitSubStackFromCard(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: SplitStackPayload,
    ) {
        this.handleSplitStackFromCardPayload(client, data, 'split_sub_stack_from_card');
    }

    @SubscribeMessage('split_stack_from_card')
    handleSplitStackFromCard(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: SplitStackPayload,
    ) {
        this.handleSplitStackFromCardPayload(client, data, 'split_stack_from_card');
    }

    private handleSplitStackFromCardPayload(client: Socket, data: SplitStackPayload, eventName: string) {
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

        this.emitCommandResult(
            client,
            this.gameService.splitSubStackFromCard(stackId, cardId, position.x, position.y),
        );
    }

    @SubscribeMessage('update_card_position')
    handleUpdateCardPosition(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { instanceId: string, x: number, y: number },
    ) {
        this.emitCommandResult(
            client,
            this.gameService.updateCardPosition(data.instanceId, data.x, data.y),
        );
    }

    @SubscribeMessage('update_stack_position')
    handleUpdateStackPosition(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { stackId: string, x: number, y: number },
    ) {
        this.emitCommandResult(
            client,
            this.gameService.updateStackPosition(data.stackId, data.x, data.y),
        );
    }

    private emitCommandResult(client: Socket, events: GameSocketEvent[]) {
        for (const event of events) {
            if (event.event === 'game_error') {
                client.emit(event.event, event.data);
                continue;
            }

            this.server.emit(event.event, event.data);
        }
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
