import { Injectable } from "@nestjs/common";
import { CardInstance, CardStack, GameState } from "./types/types.game";

@Injectable()
export class GameStateService {
    private readonly gameState: GameState;
    constructor() {
        this.gameState = {
            cards: {},  // instanceId → CardInstance
            stacks: {},    // stackId → CardStack
            moon: 1,                     // vòng hiện tại
            moonTimeLeft: 120,                 // millisecond còn lại
            coins: 0,
            cardLimit: 10,                     // số thẻ tối đa trên bàn
            phase: "playing",
        }

        this.initGameState();
    }

    initGameState() {
        const initialCards: CardInstance[] = [
            {
                instanceId: crypto.randomUUID(),
                defId: 'villager',
                position: { x: 100, y: 100 },
            },
            {
                instanceId: crypto.randomUUID(),
                defId: 'wood',
                position: { x: 300, y: 100 },
            },
            {
                instanceId: crypto.randomUUID(),
                defId: 'stone',
                position: { x: 500, y: 100 },
            },
        ];

        initialCards.forEach(card => {
            this.gameState.cards[card.instanceId] = card;
        });
        return {
            event: 'init_state',
            data: this.gameState,
        }
    }

    getState() {
        return this.gameState;
    }

    getStack(stackId: string) {
        return this.gameState.stacks[stackId];
    }

    getCard(cardId: string) {
        return this.gameState.cards[cardId];
    }


}