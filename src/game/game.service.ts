import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { CARD_HEIGHT, CARD_WIDTH, CARDS } from "./data/cards";
import { PACKS } from "./data/packs";
import { CraftingEngine } from "./engine/crafting.engine";
import { GameStateService } from "./gameState.service";
import {
    CardInstance,
    CardStack,
    GameSocketEvent,
    Recipe,
    RecipeCompletedPayload,
} from "./types/types.game";

type Broadcaster = (event: string, data: unknown, roomId?: string) => void;
type Position = { x: number; y: number };

const STACK_CARD_OFFSET_Y = 24;

type StackSplitPayload = {
    updatedStacks: CardStack[];
    removedStackIds: string[];
    spawnedCards: CardInstance[];
    createdStacks: CardStack[];
};

@Injectable()
export class GameService {
    private readonly craftingTimers = new Map<string, NodeJS.Timeout>();
    private broadcaster: Broadcaster = () => undefined;

    constructor(
        private readonly gameState: GameStateService,
        private readonly craftingEngine: CraftingEngine,
    ) { }

    setBroadcaster(broadcaster: Broadcaster) {
        this.broadcaster = broadcaster;
    }

    resumeCraftingTimers(roomId: string) {
        const state = this.gameState.getState(roomId);

        for (const stack of Object.values(state.stacks)) {
            if (!stack.crafting.active || !stack.crafting.recipeId || !stack.crafting.startAt || !stack.crafting.duration) {
                continue;
            }

            const recipe = this.craftingEngine.findRecipeById(stack.crafting.recipeId);
            if (!recipe) {
                stack.crafting = { active: false };
                stack.progress = 0;
                continue;
            }

            const elapsed = Date.now() - stack.crafting.startAt;
            const remaining = stack.crafting.duration - elapsed;

            if (remaining <= 0) {
                setTimeout(() => {
                    this.completeRecipe(stack.stackId, recipe.id, roomId);
                }, 0);
                continue;
            }

            this.setRecipeTimer(stack, recipe, roomId, remaining);
        }
    }

    buyPack(packId: string, position?: Position, roomId?: string): GameSocketEvent[] {
        const state = this.gameState.getState(roomId);
        const pack = PACKS[packId];

        if (!pack) {
            return [this.errorEvent("pack_not_found", "Pack does not exist")];
        }

        if (state.coins < pack.cost) {
            return [this.errorEvent("not_enough_coins", "Not enough coins to buy this pack")];
        }

        const currentCardCount = Object.keys(state.cards).length + Object.values(state.stacks)
            .reduce((total, stack) => total + stack.cards.length, 0);
        if (currentCardCount + pack.numberOfItems > state.cardLimit) {
            return [this.errorEvent("card_limit_reached", "Not enough card capacity to open this pack")];
        }

        state.coins -= pack.cost;

        const spawnedCards = Array.from({ length: pack.numberOfItems }, (_, index) => {
            const card = this.createCardInstance(
                this.rollPackCard(packId),
                this.getPackSpawnPosition(position ?? { x: 240, y: 220 }, index),
            );
            state.cards[card.instanceId] = card;
            return this.snapshotCard(card);
        });

        return [
            {
                event: "economy_updated",
                data: { coins: state.coins },
            },
            {
                event: "cards_spawned",
                data: { cards: spawnedCards },
            },
        ];
    }

    sellCard(instanceId: string, roomId?: string): GameSocketEvent[] {
        const state = this.gameState.getState(roomId);
        const card = state.cards[instanceId];

        if (!card) {
            return [this.errorEvent("card_not_found", "Card does not exist in world cards")];
        }

        const cardDef = CARDS[card.defId];
        const sellValue = card.defId === "coin" ? 1 : cardDef?.sellValue;
        if (!cardDef || sellValue === undefined || sellValue <= 0) {
            return [this.errorEvent("card_cannot_be_sold", "This card cannot be sold")];
        }

        delete state.cards[instanceId];
        state.coins += sellValue;

        return [
            {
                event: "card_removed",
                data: { instanceId },
            },
            {
                event: "economy_updated",
                data: { coins: state.coins },
            },
        ];
    }

    dropCardOnCard(draggingCardId: string, targetCardId: string, dropPosition?: Position, roomId?: string): GameSocketEvent[] {
        const state = this.gameState.getState(roomId);
        const draggingCard = this.detachWorldCard(draggingCardId, roomId);
        const targetCard = this.detachWorldCard(targetCardId, roomId);

        if (!draggingCard || !targetCard || draggingCardId === targetCardId) {
            if (draggingCard) {
                state.cards[draggingCard.instanceId] = draggingCard;
            }
            if (targetCard) {
                state.cards[targetCard.instanceId] = targetCard;
            }
            return [this.errorEvent("invalid_drop", "Dragging card or target card does not exist")];
        }

        const stack = this.createNewStack(draggingCard, targetCard, dropPosition);
        state.stacks[stack.stackId] = stack;

        return this.evaluateStackAfterMutation(stack, roomId);
    }

    dropCardOnStack(draggingCardId: string, targetStackId: string, dropPosition?: Position, roomId?: string): GameSocketEvent[] {
        const state = this.gameState.getState(roomId);
        const stack = state.stacks[targetStackId];
        const draggingCard = state.cards[draggingCardId];

        if (!draggingCard || !stack) {
            return [this.errorEvent("invalid_drop", "Dragging card or target stack does not exist")];
        }

        if (!this.canMutateStack(stack)) {
            return [this.errorEvent("stack_is_crafting", "Cannot add cards to an active crafting stack")];
        }

        delete state.cards[draggingCard.instanceId];
        stack.cards.push(draggingCard);
        this.applyDropPosition(stack, dropPosition);
        this.normalizeStack(stack);

        return this.evaluateStackAfterMutation(stack, roomId);
    }

    updateCardPosition(instanceId: string, x: number, y: number, roomId?: string): GameSocketEvent[] {
        return this.dropCardOnEmpty(instanceId, x, y, roomId);
    }

    dropCardOnEmpty(instanceId: string, x: number, y: number, roomId?: string): GameSocketEvent[] {
        const state = this.gameState.getState(roomId);
        const card = state.cards[instanceId];

        if (!card) {
            return [this.errorEvent("card_not_found", "Card does not exist in world cards")];
        }

        card.position = { x, y };

        return [{
            event: "card_position_updated",
            data: { instanceId, x, y },
        }];
    }

    updateStackPosition(stackId: string, x: number, y: number, roomId?: string): GameSocketEvent[] {
        return this.dropStackOnEmpty(stackId, x, y, roomId);
    }

    dropStackOnEmpty(stackId: string, x: number, y: number, roomId?: string): GameSocketEvent[] {
        const stack = this.gameState.getState(roomId).stacks[stackId];

        if (!stack) {
            return [this.errorEvent("stack_not_found", "Stack does not exist")];
        }

        stack.position = { x, y };
        this.normalizeStack(stack);

        return [{
            event: "stack_updated",
            data: { stack: this.snapshotStack(stack) },
        }];
    }

    dropStackOnCard(draggingStackId: string, targetCardId: string, dropPosition?: Position, roomId?: string): GameSocketEvent[] {
        const state = this.gameState.getState(roomId);
        const stack = state.stacks[draggingStackId];
        const targetCard = state.cards[targetCardId];

        if (!stack || !targetCard) {
            return [this.errorEvent("invalid_drop", "Dragging stack or target card does not exist")];
        }

        if (!this.canMutateStack(stack)) {
            return [this.errorEvent("stack_is_crafting", "Cannot merge an active crafting stack")];
        }

        delete state.cards[targetCardId];
        stack.cards = [targetCard, ...stack.cards];
        stack.position = { ...(dropPosition ?? targetCard.position) };
        this.normalizeStack(stack);

        return this.evaluateStackAfterMutation(stack, roomId);
    }

    dropStackOnStack(draggingStackId: string, targetStackId: string, dropPosition?: Position, roomId?: string): GameSocketEvent[] {
        const state = this.gameState.getState(roomId);
        const draggingStack = state.stacks[draggingStackId];
        const targetStack = state.stacks[targetStackId];

        if (!draggingStack || !targetStack || draggingStackId === targetStackId) {
            return [this.errorEvent("invalid_drop", "Dragging stack or target stack does not exist")];
        }

        if (!this.canMutateStack(draggingStack) || !this.canMutateStack(targetStack)) {
            return [this.errorEvent("stack_is_crafting", "Cannot merge active crafting stacks")];
        }

        this.clearCraftingTimer(draggingStackId, roomId);
        delete state.stacks[draggingStackId];

        targetStack.cards.push(...draggingStack.cards);
        this.applyDropPosition(targetStack, dropPosition);
        this.normalizeStack(targetStack);

        return [
            {
                event: "stack_removed",
                data: { stackId: draggingStackId },
            },
            ...this.evaluateStackAfterMutation(targetStack, roomId),
        ];
    }

    splitCardFromStack(stackId: string, cardId: string, x: number, y: number, roomId?: string): GameSocketEvent[] {
        const state = this.gameState.getState(roomId);
        const stack = state.stacks[stackId];

        if (!stack) {
            return [this.errorEvent("stack_not_found", "Stack does not exist")];
        }

        const cardIndex = stack.cards.findIndex(card => card.instanceId === cardId);
        if (cardIndex < 0) {
            return [this.errorEvent("card_not_found", "Card does not exist in stack")];
        }

        this.cancelStackCrafting(stack, roomId);

        const [detachedCard] = stack.cards.splice(cardIndex, 1);
        detachedCard.position = { x, y };
        state.cards[detachedCard.instanceId] = detachedCard;

        const splitPayload = this.createSplitPayload();
        splitPayload.spawnedCards.push(this.snapshotCard(detachedCard));

        const events = this.finishSourceStackAfterSplit(stack, splitPayload, roomId);

        return [
            {
                event: "stack_split",
                data: splitPayload,
            },
            ...events,
        ];
    }

    splitSubStackFromCard(stackId: string, cardId: string, x: number, y: number, roomId?: string): GameSocketEvent[] {
        const state = this.gameState.getState(roomId);
        const sourceStack = state.stacks[stackId];

        if (!sourceStack) {
            return [this.errorEvent("stack_not_found", "Stack does not exist")];
        }

        const splitIndex = sourceStack.cards.findIndex(card => card.instanceId === cardId);
        if (splitIndex < 0) {
            return [this.errorEvent("card_not_found", "Card does not exist in stack")];
        }

        if (splitIndex === 0) {
            return this.dropStackOnEmpty(stackId, x, y, roomId);
        }

        if (splitIndex === sourceStack.cards.length - 1) {
            return this.splitCardFromStack(stackId, cardId, x, y, roomId);
        }

        this.cancelStackCrafting(sourceStack, roomId);

        const newStackCards = sourceStack.cards.splice(splitIndex);
        const newStack = this.createStackFromCards(newStackCards, { x, y });
        state.stacks[newStack.stackId] = newStack;
        this.normalizeStack(sourceStack);

        const splitPayload = this.createSplitPayload();
        splitPayload.updatedStacks.push(this.snapshotStack(sourceStack));
        splitPayload.createdStacks.push(this.snapshotStack(newStack));

        return [
            {
                event: "stack_split",
                data: splitPayload,
            },
            ...this.evaluateStackAfterMutation(sourceStack, roomId),
            ...this.evaluateStackAfterMutation(newStack, roomId),
        ];
    }

    findCardAtPosition(
        x: number,
        y: number,
        cards: Record<string, CardInstance>,
        excludeId: string
    ): CardInstance | null {
        return Object.values(cards).find(card => {
            if (card.instanceId === excludeId) return false

            const cx = card.position.x
            const cy = card.position.y

            return (
                x >= cx - CARD_WIDTH &&
                x <= cx + CARD_WIDTH &&
                y >= cy - CARD_HEIGHT &&
                y <= cy + CARD_HEIGHT
            )
        }) ?? null
    }

    private evaluateStackAfterMutation(stack: CardStack, roomId?: string): GameSocketEvent[] {
        const recipe = this.craftingEngine.activeRecipe(stack);

        if (!recipe) {
            stack.crafting = { active: false };
            return [{
                event: "stack_updated",
                data: { stack: this.snapshotStack(stack) },
            }];
        }

        this.startRecipe(stack, recipe, roomId);

        return [{
            event: "recipe_started",
            data: {
                stack: this.snapshotStack(stack),
                stackId: stack.stackId,
                recipeId: recipe.id,
                duration: recipe.duration,
                startAt: stack.crafting.startAt,
            },
        }];
    }

    private startRecipe(stack: CardStack, recipe: Recipe, roomId?: string) {
        this.clearCraftingTimer(stack.stackId, roomId);

        stack.crafting = {
            active: true,
            recipeId: recipe.id,
            startAt: Date.now(),
            duration: recipe.duration,
        };
        stack.progress = 0;

        this.setRecipeTimer(stack, recipe, roomId, recipe.duration);
    }

    private completeRecipe(stackId: string, recipeId: string, roomId?: string) {
        this.craftingTimers.delete(this.timerKey(stackId, roomId));

        const state = this.gameState.getState(roomId);
        const stack = state.stacks[stackId];
        const recipe = this.craftingEngine.findRecipeById(recipeId);

        if (
            !stack ||
            !recipe ||
            stack.crafting.recipeId !== recipeId ||
            !stack.crafting.active ||
            !this.craftingEngine.stackMatchesRecipe(stack, recipe)
        ) {
            return;
        }

        const completion = this.resolveRecipe(stack, recipe, roomId);
        const events: GameSocketEvent[] = [{
            event: "recipe_completed",
            data: completion,
        }];

        for (const updatedStack of completion.updatedStacks) {
            const liveStack = state.stacks[updatedStack.stackId];
            if (liveStack) {
                events.push(...this.evaluateStackAfterMutation(liveStack, roomId));
            }
        }

        void this.gameState.persistState(roomId);
        this.emitEvents(events, roomId);
    }

    private resolveRecipe(stack: CardStack, recipe: Recipe, roomId?: string): RecipeCompletedPayload {
        const state = this.gameState.getState(roomId);
        const deletedCardIds = new Set<string>();
        const consumedIndexes = new Set<number>();

        for (const deletedDefId of recipe.deletedId ?? []) {
            const index = stack.cards.findIndex((card, cardIndex) => {
                return !consumedIndexes.has(cardIndex) && card.defId === deletedDefId;
            });

            if (index >= 0) {
                consumedIndexes.add(index);
                deletedCardIds.add(stack.cards[index].instanceId);
            }
        }

        const remainingCards = stack.cards.filter((_, index) => !consumedIndexes.has(index));
        const spawnedCards = recipe.outputs.map((defId, index) => {
            return this.createCardInstance(defId, this.getSpawnPosition(stack, index));
        });

        for (const card of spawnedCards) {
            state.cards[card.instanceId] = card;
        }

        const updatedStacks: CardStack[] = [];
        const removedStackIds: string[] = [];

        if (remainingCards.length === 0) {
            this.clearCraftingTimer(stack.stackId, roomId);
            delete state.stacks[stack.stackId];
            removedStackIds.push(stack.stackId);
        } else {
            stack.cards = remainingCards;
            stack.crafting = { active: false };
            stack.progress = 0;
            this.normalizeStack(stack);
            updatedStacks.push(this.snapshotStack(stack));
        }

        return {
            updatedStacks,
            removedStackIds,
            spawnedCards: spawnedCards.map(card => this.snapshotCard(card)),
            deletedCardIds: Array.from(deletedCardIds),
        };
    }

    private createNewStack(
        cardA: CardInstance,
        cardB: CardInstance,
        position?: Position,
    ): CardStack {
        const stack = this.createStackFromCards(
            [cardB, cardA],
            position ?? cardB.position,
        );
        return stack;
    }

    private createStackFromCards(cards: CardInstance[], position: Position): CardStack {
        const stack = {
            stackId: randomUUID(),
            cards,
            position: { ...position },
            crafting: {
                active: false,
            },
            progress: 0,
        };
        this.normalizeStack(stack);
        return stack;
    }

    private createCardInstance(defId: string, position: Position): CardInstance {
        return {
            instanceId: randomUUID(),
            defId,
            position,
        };
    }

    private getSpawnPosition(stack: CardStack, index: number) {
        return {
            x: stack.position.x + 120 + (index * 28),
            y: stack.position.y + (index * 28),
        };
    }

    private getPackSpawnPosition(position: Position, index: number) {
        return {
            x: position.x + (index * 28),
            y: position.y + (index * 28),
        };
    }

    private rollPackCard(packId: string) {
        const pack = PACKS[packId];
        const rand = Math.random();
        let acc = 0;

        for (const item of pack.items) {
            acc += item.chance;
            if (rand <= acc) {
                return item.defId;
            }
        }

        return pack.items[0].defId;
    }

    private detachWorldCard(instanceId: string, roomId?: string): CardInstance | null {
        const state = this.gameState.getState(roomId);
        const card = state.cards[instanceId];
        if (!card) {
            return null;
        }

        delete state.cards[instanceId];
        return card;
    }

    private canMutateStack(stack: CardStack) {
        return !stack.crafting.active;
    }

    private cancelStackCrafting(stack: CardStack, roomId?: string) {
        this.clearCraftingTimer(stack.stackId, roomId);
        stack.crafting = { active: false };
        stack.progress = 0;
    }

    private applyDropPosition(stack: CardStack, dropPosition?: Position) {
        if (!dropPosition) {
            return;
        }

        stack.position = { ...dropPosition };
    }

    private createSplitPayload(): StackSplitPayload {
        return {
            updatedStacks: [],
            removedStackIds: [],
            spawnedCards: [],
            createdStacks: [],
        };
    }

    private finishSourceStackAfterSplit(stack: CardStack, splitPayload: StackSplitPayload, roomId?: string): GameSocketEvent[] {
        const state = this.gameState.getState(roomId);

        if (stack.cards.length === 0) {
            delete state.stacks[stack.stackId];
            splitPayload.removedStackIds.push(stack.stackId);
            return [{
                event: "stack_removed",
                data: { stackId: stack.stackId },
            }];
        }

        this.normalizeStack(stack);
        splitPayload.updatedStacks.push(this.snapshotStack(stack));
        return this.evaluateStackAfterMutation(stack, roomId);
    }

    private normalizeStack(stack: CardStack) {
        stack.cards.forEach((card, index) => {
            card.position = {
                x: stack.position.x,
                y: stack.position.y + (index * STACK_CARD_OFFSET_Y),
            };
        });
    }

    private snapshotStack(stack: CardStack): CardStack {
        return {
            ...stack,
            position: { ...stack.position },
            crafting: { ...stack.crafting },
            cards: stack.cards.map(card => this.snapshotCard(card)),
        };
    }

    private snapshotCard(card: CardInstance): CardInstance {
        return {
            ...card,
            position: { ...card.position },
            stats: card.stats ? { ...card.stats } : undefined,
        };
    }

    private emitEvents(events: GameSocketEvent[], roomId?: string) {
        for (const event of events) {
            this.broadcaster(event.event, event.data, roomId);
        }
    }

    private setRecipeTimer(stack: CardStack, recipe: Recipe, roomId: string | undefined, delay: number) {
        this.clearCraftingTimer(stack.stackId, roomId);

        const timer = setTimeout(() => {
            this.completeRecipe(stack.stackId, recipe.id, roomId);
        }, delay);

        this.craftingTimers.set(this.timerKey(stack.stackId, roomId), timer);
    }

    private clearCraftingTimer(stackId: string, roomId?: string) {
        const key = this.timerKey(stackId, roomId);
        const existingTimer = this.craftingTimers.get(key);
        if (existingTimer) {
            clearTimeout(existingTimer);
            this.craftingTimers.delete(key);
        }
    }

    private timerKey(stackId: string, roomId?: string) {
        return `${roomId ?? "local"}:${stackId}`;
    }

    private errorEvent(code: string, message: string): GameSocketEvent {
        return {
            event: "game_error",
            data: { code, message },
        };
    }
}
