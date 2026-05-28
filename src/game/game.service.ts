import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { CARD_HEIGHT, CARD_WIDTH } from "./data/cards";
import { CraftingEngine } from "./engine/crafting.engine";
import { GameStateService } from "./gameState.service";
import {
    CardInstance,
    CardStack,
    GameSocketEvent,
    Recipe,
    RecipeCompletedPayload,
} from "./types/types.game";

type Broadcaster = (event: string, data: unknown) => void;
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

    dropCardOnCard(draggingCardId: string, targetCardId: string, dropPosition?: Position): GameSocketEvent[] {
        const state = this.gameState.getState();
        const draggingCard = this.detachWorldCard(draggingCardId);
        const targetCard = this.detachWorldCard(targetCardId);

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

        return this.evaluateStackAfterMutation(stack);
    }

    dropCardOnStack(draggingCardId: string, targetStackId: string, dropPosition?: Position): GameSocketEvent[] {
        const state = this.gameState.getState();
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

        return this.evaluateStackAfterMutation(stack);
    }

    updateCardPosition(instanceId: string, x: number, y: number): GameSocketEvent[] {
        return this.dropCardOnEmpty(instanceId, x, y);
    }

    dropCardOnEmpty(instanceId: string, x: number, y: number): GameSocketEvent[] {
        const state = this.gameState.getState();
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

    updateStackPosition(stackId: string, x: number, y: number): GameSocketEvent[] {
        return this.dropStackOnEmpty(stackId, x, y);
    }

    dropStackOnEmpty(stackId: string, x: number, y: number): GameSocketEvent[] {
        const stack = this.gameState.getState().stacks[stackId];

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

    dropStackOnCard(draggingStackId: string, targetCardId: string, dropPosition?: Position): GameSocketEvent[] {
        const state = this.gameState.getState();
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

        return this.evaluateStackAfterMutation(stack);
    }

    dropStackOnStack(draggingStackId: string, targetStackId: string, dropPosition?: Position): GameSocketEvent[] {
        const state = this.gameState.getState();
        const draggingStack = state.stacks[draggingStackId];
        const targetStack = state.stacks[targetStackId];

        if (!draggingStack || !targetStack || draggingStackId === targetStackId) {
            return [this.errorEvent("invalid_drop", "Dragging stack or target stack does not exist")];
        }

        if (!this.canMutateStack(draggingStack) || !this.canMutateStack(targetStack)) {
            return [this.errorEvent("stack_is_crafting", "Cannot merge active crafting stacks")];
        }

        this.clearCraftingTimer(draggingStackId);
        delete state.stacks[draggingStackId];

        targetStack.cards.push(...draggingStack.cards);
        this.applyDropPosition(targetStack, dropPosition);
        this.normalizeStack(targetStack);

        return [
            {
                event: "stack_removed",
                data: { stackId: draggingStackId },
            },
            ...this.evaluateStackAfterMutation(targetStack),
        ];
    }

    splitCardFromStack(stackId: string, cardId: string, x: number, y: number): GameSocketEvent[] {
        const state = this.gameState.getState();
        const stack = state.stacks[stackId];

        if (!stack) {
            return [this.errorEvent("stack_not_found", "Stack does not exist")];
        }

        const cardIndex = stack.cards.findIndex(card => card.instanceId === cardId);
        if (cardIndex < 0) {
            return [this.errorEvent("card_not_found", "Card does not exist in stack")];
        }

        this.cancelStackCrafting(stack);

        const [detachedCard] = stack.cards.splice(cardIndex, 1);
        detachedCard.position = { x, y };
        state.cards[detachedCard.instanceId] = detachedCard;

        const splitPayload = this.createSplitPayload();
        splitPayload.spawnedCards.push(this.snapshotCard(detachedCard));

        const events = this.finishSourceStackAfterSplit(stack, splitPayload);

        return [
            {
                event: "stack_split",
                data: splitPayload,
            },
            ...events,
        ];
    }

    splitSubStackFromCard(stackId: string, cardId: string, x: number, y: number): GameSocketEvent[] {
        const state = this.gameState.getState();
        const sourceStack = state.stacks[stackId];

        if (!sourceStack) {
            return [this.errorEvent("stack_not_found", "Stack does not exist")];
        }

        const splitIndex = sourceStack.cards.findIndex(card => card.instanceId === cardId);
        if (splitIndex < 0) {
            return [this.errorEvent("card_not_found", "Card does not exist in stack")];
        }

        if (splitIndex === 0) {
            return this.dropStackOnEmpty(stackId, x, y);
        }

        if (splitIndex === sourceStack.cards.length - 1) {
            return this.splitCardFromStack(stackId, cardId, x, y);
        }

        this.cancelStackCrafting(sourceStack);

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
            ...this.evaluateStackAfterMutation(sourceStack),
            ...this.evaluateStackAfterMutation(newStack),
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

    private evaluateStackAfterMutation(stack: CardStack): GameSocketEvent[] {
        const recipe = this.craftingEngine.activeRecipe(stack);

        if (!recipe) {
            stack.crafting = { active: false };
            return [{
                event: "stack_updated",
                data: { stack: this.snapshotStack(stack) },
            }];
        }

        this.startRecipe(stack, recipe);

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

    private startRecipe(stack: CardStack, recipe: Recipe) {
        this.clearCraftingTimer(stack.stackId);

        stack.crafting = {
            active: true,
            recipeId: recipe.id,
            startAt: Date.now(),
            duration: recipe.duration,
        };
        stack.progress = 0;

        const timer = setTimeout(() => {
            this.completeRecipe(stack.stackId, recipe.id);
        }, recipe.duration);

        this.craftingTimers.set(stack.stackId, timer);
    }

    private completeRecipe(stackId: string, recipeId: string) {
        this.craftingTimers.delete(stackId);

        const state = this.gameState.getState();
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

        const completion = this.resolveRecipe(stack, recipe);
        const events: GameSocketEvent[] = [{
            event: "recipe_completed",
            data: completion,
        }];

        for (const updatedStack of completion.updatedStacks) {
            const liveStack = state.stacks[updatedStack.stackId];
            if (liveStack) {
                events.push(...this.evaluateStackAfterMutation(liveStack));
            }
        }

        this.emitEvents(events);
    }

    private resolveRecipe(stack: CardStack, recipe: Recipe): RecipeCompletedPayload {
        const state = this.gameState.getState();
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
            this.clearCraftingTimer(stack.stackId);
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

    private detachWorldCard(instanceId: string): CardInstance | null {
        const state = this.gameState.getState();
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

    private cancelStackCrafting(stack: CardStack) {
        this.clearCraftingTimer(stack.stackId);
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

    private finishSourceStackAfterSplit(stack: CardStack, splitPayload: StackSplitPayload): GameSocketEvent[] {
        const state = this.gameState.getState();

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
        return this.evaluateStackAfterMutation(stack);
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

    private emitEvents(events: GameSocketEvent[]) {
        for (const event of events) {
            this.broadcaster(event.event, event.data);
        }
    }

    private clearCraftingTimer(stackId: string) {
        const existingTimer = this.craftingTimers.get(stackId);
        if (existingTimer) {
            clearTimeout(existingTimer);
            this.craftingTimers.delete(stackId);
        }
    }

    private errorEvent(code: string, message: string): GameSocketEvent {
        return {
            event: "game_error",
            data: { code, message },
        };
    }
}
