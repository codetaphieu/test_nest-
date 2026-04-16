import { 
  WebSocketGateway, 
  SubscribeMessage, 
  WebSocketServer,
  OnGatewayConnection
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from '@nestjs/cache-manager';
import { JwtService } from '@nestjs/jwt'; 
import { UsersService } from '../users/users.service';

const RECIPES = [
  {
    ingredients: ['person', 'resource'],
    names: ['Nông dân', 'Bụi chuối'],
    result: 'Nải chuối',
    time: 5000,
  }
];

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000', 
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'], 
})
export class GameGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private jwtService: JwtService, 
    private usersService: UsersService 
  ) {}

  async handleConnection(client: Socket) {
    try {
      console.log('Chìa khóa xác thực: ', process.env.JWT_SECRET);
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub?.toString() || payload.id?.toString(); 
      client.join(userId);

      const rawData = await this.cacheManager.get(`save_game:${userId}`);
      let game;

      if (rawData) {
        game = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      } else {
        const userDb = await this.usersService.findById(userId);
        let cardsFromDb = [];
        if (userDb && userDb.cards) {
          cardsFromDb = typeof userDb.cards === 'string' ? JSON.parse(userDb.cards) : userDb.cards;
        }

        game = {
          cards: cardsFromDb.length > 0 ? cardsFromDb : [
            { id: Date.now() + 1, name: 'Nông dân', type: 'person', position: { x: 100, y: 100 } },
            { id: Date.now() + 2, name: 'Bụi chuối', type: 'resource', position: { x: 300, y: 100 } }
          ],
          gold: userDb?.gold || 50
        };
        await this.cacheManager.set(`save_game:${userId}`, JSON.stringify(game), 0);
      }

      client.emit('update_state', game);
      console.log(`⚡ Nông dân ${userId} đã vào làng.`);
    } catch (error: any) {
      console.log('Lỗi xác thực:', error.message);
      client.disconnect();
    }
  }

  private checkCollision(posA: any, posB: any): boolean {
    const W = 110; 
    const H = 150;
    return (
      posA.x < posB.x + W &&
      posA.x + W > posB.x &&
      posA.y < posB.y + H &&
      posA.y + H > posB.y
    );
  }

  @SubscribeMessage('move_card')
  handleMoveCard(client: Socket, data: any) {
    const token = client.handshake.auth.token;
    const payload = this.jwtService.verify(token);
    const userId = payload.sub?.toString() || payload.id?.toString();
    client.to(userId).emit('card_moved', data);
  }

  @SubscribeMessage('save_card_position')
  async handleDropCard(client: Socket, data: any) {
    try {
      const token = client.handshake.auth.token;
      const payload = this.jwtService.verify(token);
      const userId = payload.sub?.toString() || payload.id?.toString();

      const { cardId, x, y } = data;
      const rawData = await this.cacheManager.get(`save_game:${userId}`);
      if (!rawData) return;

      let game = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      const movedCard = game.cards.find((c: any) => c.id === cardId);
      
      if (movedCard) {
        movedCard.position = { x, y };

        for (let targetCard of game.cards) {
          if (targetCard.id === cardId) continue;
          if (this.checkCollision(movedCard.position, targetCard.position)) {
            this.processRecipe(userId, movedCard, targetCard);
            break; 
          }
        }
      }

      await this.cacheManager.set(`save_game:${userId}`, JSON.stringify(game), 0);
      this.server.to(userId).emit('card_dropped', data);
    } catch (error: any) {
      console.error('Lỗi khi thả thẻ bài:', error.message);
    }
  }

  private async processRecipe(userId: string, cardA: any, cardB: any) {
    const recipe = RECIPES.find(r => 
      r.ingredients.includes(cardA.type) && 
      r.ingredients.includes(cardB.type) &&
      r.names.includes(cardA.name) && 
      r.names.includes(cardB.name)
    );

    if (recipe) {
      this.server.to(userId).emit('start_recipe', {
        cards: [cardA.id, cardB.id],
        duration: recipe.time,
        result: recipe.result,
      });

      setTimeout(async () => {
        await this.completeRecipe(userId, cardA.id, cardB.id, recipe.result);
      }, recipe.time);
    }
  }

  private async completeRecipe(userId: string, idA: number, idB: number, resultName: string) {
    const rawData = await this.cacheManager.get(`save_game:${userId}`);
    if (!rawData) return;
    let game = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

    const cardA = game.cards.find((c: any) => c.id === idA);
    const cardB = game.cards.find((c: any) => c.id === idB);
    if (!cardA || !cardB) return;

    game.cards = game.cards.filter((c: any) => c.id !== idA && c.id !== idB);
    [cardA, cardB].forEach(c => { if (c.type === 'person') game.cards.push(c); });

    game.cards.push({
      id: Date.now(),
      name: resultName,
      type: 'food',
      position: { x: cardB.position.x, y: cardB.position.y }
    });

    await this.cacheManager.set(`save_game:${userId}`, JSON.stringify(game), 0);
    this.server.to(userId).emit('update_state', game);
    await this.usersService.saveVillageState(userId, game.cards);
  }
}