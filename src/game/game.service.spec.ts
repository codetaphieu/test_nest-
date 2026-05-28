import { randomUUID } from "crypto";
import { CraftingEngine } from "./engine/crafting.engine";
import { GameService } from "./game.service";
import { GameStateService } from "./gameState.service";
import { CardInstance, CardStack, GameSocketEvent } from "./types/types.game";

function createCard(defId: string, x = 0, y = 0): CardInstance {
    return {
        instanceId: randomUUID() as CardInstance["instanceId"],
        defId,
        position: { x, y },
    };
}

describe("GameService authoritative stack and crafting flow", () => {
    let gameState: GameStateService;
    let service: GameService;
    let emittedEvents: GameSocketEvent[];

    beforeEach(() => {
        jest.useFakeTimers();
        gameState = new GameStateService();
        service = new GameService(gameState, new CraftingEngine());
        emittedEvents = [];
        service.setBroadcaster((event, data) => {
            emittedEvents.push({ event, data });
        });
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    it("creates a stack, removes world cards, starts recipe, and completes on the backend timer", () => {
        const state = gameState.getState();
        const wood = Object.values(state.cards).find(card => card.defId === "wood")!;
        const stone = Object.values(state.cards).find(card => card.defId === "stone")!;

        const [startedEvent] = service.dropCardOnCard(wood.instanceId, stone.instanceId);
        const startedData = startedEvent.data as { stackId: string };
        const stackId = startedData.stackId;

        expect(startedEvent.event).toBe("recipe_started");
        expect(state.cards[wood.instanceId]).toBeUndefined();
        expect(state.cards[stone.instanceId]).toBeUndefined();
        expect(state.stacks[stackId].crafting).toMatchObject({
            active: true,
            recipeId: "axe_recipe",
            duration: 4000,
        });

        jest.advanceTimersByTime(4000);

        const completedEvent = emittedEvents.find(event => event.event === "recipe_completed")!;
        const completedData = completedEvent.data as {
            removedStackIds: string[];
            deletedCardIds: string[];
            spawnedCards: CardInstance[];
        };
        expect(completedData.removedStackIds).toEqual([stackId]);
        expect(completedData.deletedCardIds.sort()).toEqual([
            stone.instanceId,
            wood.instanceId,
        ].sort());
        expect(completedData.spawnedCards).toEqual([
            expect.objectContaining({ defId: "axe" }),
        ]);
        expect(state.stacks[stackId]).toBeUndefined();
    });

    it("keeps villager, deletes wood, spawns board, and leaves no stale wood card after villager + wood", () => {
        const state = gameState.getState();
        const villager = Object.values(state.cards).find(card => card.defId === "villager")!;
        const wood = Object.values(state.cards).find(card => card.defId === "wood")!;

        const [startedEvent] = service.dropCardOnCard(wood.instanceId, villager.instanceId, { x: 760, y: 320 });
        const startedData = startedEvent.data as { stackId: string; recipeId: string };
        const stackId = startedData.stackId;

        expect(startedEvent.event).toBe("recipe_started");
        expect(startedData.recipeId).toBe("board_recipe");
        expect(state.stacks[stackId].position).toEqual({ x: 760, y: 320 });
        expect(state.cards[villager.instanceId]).toBeUndefined();
        expect(state.cards[wood.instanceId]).toBeUndefined();

        jest.advanceTimersByTime(3500);

        const completedEvent = emittedEvents.find(event => event.event === "recipe_completed")!;
        const completedData = completedEvent.data as {
            updatedStacks: CardStack[];
            removedStackIds: string[];
            deletedCardIds: string[];
            spawnedCards: CardInstance[];
        };

        expect(completedData.removedStackIds).toEqual([]);
        expect(completedData.deletedCardIds).toEqual([wood.instanceId]);
        expect(completedData.spawnedCards).toEqual([
            expect.objectContaining({ defId: "board" }),
        ]);
        expect(completedData.updatedStacks).toEqual([
            expect.objectContaining({
                stackId,
                crafting: { active: false },
                cards: [expect.objectContaining({ instanceId: villager.instanceId })],
            }),
        ]);
        expect(state.cards[wood.instanceId]).toBeUndefined();
        expect(state.stacks[stackId].cards).toHaveLength(1);
        expect(state.stacks[stackId].cards[0].instanceId).toBe(villager.instanceId);
        expect(Object.values(state.cards).some(card => card.defId === "board")).toBe(true);
    });

    it("deletes the source stack and crafting state after stone + wood completes", () => {
        const state = gameState.getState();
        const wood = Object.values(state.cards).find(card => card.defId === "wood")!;
        const stone = Object.values(state.cards).find(card => card.defId === "stone")!;

        const [startedEvent] = service.dropCardOnCard(stone.instanceId, wood.instanceId);
        const startedData = startedEvent.data as { stackId: string; recipeId: string };
        const stackId = startedData.stackId;

        expect(startedEvent.event).toBe("recipe_started");
        expect(startedData.recipeId).toBe("axe_recipe");

        jest.advanceTimersByTime(4000);

        const completedEvent = emittedEvents.find(event => event.event === "recipe_completed")!;
        const completedData = completedEvent.data as {
            updatedStacks: CardStack[];
            removedStackIds: string[];
            deletedCardIds: string[];
            spawnedCards: CardInstance[];
        };

        expect(completedData.updatedStacks).toEqual([]);
        expect(completedData.removedStackIds).toEqual([stackId]);
        expect(completedData.deletedCardIds.sort()).toEqual([
            stone.instanceId,
            wood.instanceId,
        ].sort());
        expect(completedData.spawnedCards).toEqual([
            expect.objectContaining({ defId: "axe" }),
        ]);
        expect(state.stacks[stackId]).toBeUndefined();
        expect(Object.values(state.cards).some(card => card.defId === "axe")).toBe(true);
    });

    it("does not start crafting when stack has extra cards beyond an exact recipe", () => {
        const state = gameState.getState();
        const villager = Object.values(state.cards).find(card => card.defId === "villager")!;
        const stone = Object.values(state.cards).find(card => card.defId === "stone")!;
        const wood = Object.values(state.cards).find(card => card.defId === "wood")!;

        const [stackUpdatedEvent] = service.dropCardOnCard(stone.instanceId, villager.instanceId);
        const stackId = (stackUpdatedEvent.data as { stack: CardStack }).stack.stackId;

        expect(stackUpdatedEvent.event).toBe("stack_updated");

        const [event] = service.dropCardOnStack(wood.instanceId, stackId);

        expect(event.event).toBe("stack_updated");
        expect(state.stacks[stackId].crafting).toEqual({ active: false });
        expect(state.stacks[stackId].cards.map(card => card.defId).sort()).toEqual([
            "stone",
            "villager",
            "wood",
        ]);
    });

    it("keeps non-consumed cards in the stack and spawns outputs outside the stack", () => {
        const state = gameState.getState();
        const villager = Object.values(state.cards).find(card => card.defId === "villager")!;
        const berry = createCard("berry", 200, 100);
        state.cards[berry.instanceId] = berry;

        const [startedEvent] = service.dropCardOnCard(berry.instanceId, villager.instanceId);
        const startedData = startedEvent.data as { stackId: string };
        const stackId = startedData.stackId;

        expect(startedEvent.event).toBe("recipe_started");
        expect(state.stacks[stackId].crafting.recipeId).toBe("coin_from_berry_recipe");

        jest.advanceTimersByTime(3000);

        const completedEvent = emittedEvents.find(event => event.event === "recipe_completed")!;
        const completedData = completedEvent.data as {
            updatedStacks: unknown[];
            deletedCardIds: string[];
            spawnedCards: CardInstance[];
        };
        expect(completedData.updatedStacks).toEqual([
            expect.objectContaining({
                stackId,
                cards: [expect.objectContaining({ instanceId: villager.instanceId })],
            }),
        ]);
        expect(completedData.deletedCardIds).toEqual([berry.instanceId]);
        expect(completedData.spawnedCards).toEqual([
            expect.objectContaining({ defId: "coin" }),
        ]);
    });

    it("starts recipe after dropping a card on an existing stack", () => {
        const state = gameState.getState();
        const house = createCard("house", 400, 100);
        const villagerA = createCard("villager", 450, 100);
        const villagerB = createCard("villager", 500, 100);
        state.cards[house.instanceId] = house;
        state.cards[villagerA.instanceId] = villagerA;
        state.cards[villagerB.instanceId] = villagerB;

        const [stackUpdatedEvent] = service.dropCardOnCard(villagerA.instanceId, house.instanceId);
        const stackUpdatedData = stackUpdatedEvent.data as { stack: { stackId: string } };
        const stackId = stackUpdatedData.stack.stackId;

        expect(stackUpdatedEvent.event).toBe("stack_updated");

        const [startedEvent] = service.dropCardOnStack(villagerB.instanceId, stackId);
        expect(startedEvent.event).toBe("recipe_started");
        const startedData = startedEvent.data as { recipeId: string };
        expect(startedData.recipeId).toBe("offspring_recipe");

        jest.advanceTimersByTime(10000);

        const completedEvent = emittedEvents.find(event => event.event === "recipe_completed")!;
        const completedData = completedEvent.data as {
            updatedStacks: { cards: CardInstance[] }[];
            deletedCardIds: string[];
            spawnedCards: CardInstance[];
        };
        expect(completedData.updatedStacks[0].cards).toEqual([
            expect.objectContaining({ instanceId: house.instanceId }),
        ]);
        expect(completedData.deletedCardIds.sort()).toEqual([
            villagerA.instanceId,
            villagerB.instanceId,
        ].sort());
        expect(completedData.spawnedCards).toEqual([
            expect.objectContaining({ defId: "baby" }),
        ]);
    });

    it("chains recipes when inputs remain after completion", () => {
        const state = gameState.getState();
        const villager = Object.values(state.cards).find(card => card.defId === "villager")!;
        const berryBush = createCard("berry_bush", 400, 100);
        state.cards[berryBush.instanceId] = berryBush;

        const [startedEvent] = service.dropCardOnCard(villager.instanceId, berryBush.instanceId);
        const stackId = (startedEvent.data as { stackId: string }).stackId;

        expect(startedEvent.event).toBe("recipe_started");
        expect(state.stacks[stackId].crafting.recipeId).toBe("berry_recipe");

        jest.advanceTimersByTime(3000);

        expect(emittedEvents.map(event => event.event)).toEqual([
            "recipe_completed",
            "recipe_started",
        ]);
        expect(state.stacks[stackId].crafting).toMatchObject({
            active: true,
            recipeId: "berry_recipe",
            duration: 3000,
        });
        expect(Object.values(state.cards).some(card => card.defId === "berry")).toBe(true);
    });

    it("moves stacks as authoritative state and syncs child card positions", () => {
        const state = gameState.getState();
        const villager = Object.values(state.cards).find(card => card.defId === "villager")!;
        const house = createCard("house", 400, 100);
        state.cards[house.instanceId] = house;

        const [stackUpdatedEvent] = service.dropCardOnCard(villager.instanceId, house.instanceId);
        const stack = (stackUpdatedEvent.data as { stack: CardStack }).stack;

        const [movedEvent] = service.dropStackOnEmpty(stack.stackId, 700, 260);
        const movedStack = (movedEvent.data as { stack: CardStack }).stack;

        expect(movedEvent.event).toBe("stack_updated");
        expect(movedStack.position).toEqual({ x: 700, y: 260 });
        expect(state.stacks[stack.stackId].position).toEqual({ x: 700, y: 260 });
        expect(state.stacks[stack.stackId].cards.map(card => card.position)).toEqual([
            { x: 700, y: 260 },
            { x: 700, y: 284 },
        ]);
    });

    it("splits a single card from the middle of a stack into a world card", () => {
        const state = gameState.getState();
        const cardA = createCard("house", 100, 100);
        const cardB = createCard("villager", 100, 124);
        const cardC = createCard("stone", 100, 148);
        const stack: CardStack = {
            stackId: randomUUID(),
            cards: [cardA, cardB, cardC],
            position: { x: 100, y: 100 },
            crafting: { active: false },
            progress: 0,
        };
        state.stacks[stack.stackId] = stack;

        const events = service.splitCardFromStack(stack.stackId, cardB.instanceId, 640, 360);
        const splitData = events[0].data as {
            updatedStacks: CardStack[];
            spawnedCards: CardInstance[];
        };

        expect(events[0].event).toBe("stack_split");
        expect(splitData.spawnedCards).toEqual([
            expect.objectContaining({
                instanceId: cardB.instanceId,
                position: { x: 640, y: 360 },
            }),
        ]);
        expect(splitData.updatedStacks[0].cards.map(card => card.instanceId)).toEqual([
            cardA.instanceId,
            cardC.instanceId,
        ]);
        expect(state.cards[cardB.instanceId]).toEqual(expect.objectContaining({
            position: { x: 640, y: 360 },
        }));
        expect(state.stacks[stack.stackId].cards.map(card => card.instanceId)).toEqual([
            cardA.instanceId,
            cardC.instanceId,
        ]);
    });

    it("splits a sub-stack from the selected card through the top of the source stack", () => {
        const state = gameState.getState();
        const cardA = createCard("house", 100, 100);
        const cardB = createCard("villager", 100, 124);
        const cardC = createCard("stone", 100, 148);
        const cardD = createCard("berry", 100, 172);
        const stack: CardStack = {
            stackId: randomUUID(),
            cards: [cardA, cardB, cardC, cardD],
            position: { x: 100, y: 100 },
            crafting: { active: false },
            progress: 0,
        };
        state.stacks[stack.stackId] = stack;

        const events = service.splitSubStackFromCard(stack.stackId, cardC.instanceId, 700, 420);
        const splitData = events[0].data as {
            updatedStacks: CardStack[];
            createdStacks: CardStack[];
        };
        const newStack = splitData.createdStacks[0];

        expect(events[0].event).toBe("stack_split");
        expect(splitData.updatedStacks[0].cards.map(card => card.instanceId)).toEqual([
            cardA.instanceId,
            cardB.instanceId,
        ]);
        expect(newStack.cards.map(card => card.instanceId)).toEqual([
            cardC.instanceId,
            cardD.instanceId,
        ]);
        expect(newStack.position).toEqual({ x: 700, y: 420 });
        expect(state.stacks[stack.stackId].cards.map(card => card.instanceId)).toEqual([
            cardA.instanceId,
            cardB.instanceId,
        ]);
        expect(state.stacks[newStack.stackId].cards.map(card => card.instanceId)).toEqual([
            cardC.instanceId,
            cardD.instanceId,
        ]);
    });

    it("merges stack on stack, removes the dragged stack, and does not craft when merged stack is not an exact recipe", () => {
        const state = gameState.getState();
        const house = createCard("house", 400, 100);
        const villagerA = createCard("villager", 450, 100);
        const villagerB = createCard("villager", 500, 100);
        state.cards[house.instanceId] = house;
        state.cards[villagerA.instanceId] = villagerA;
        state.cards[villagerB.instanceId] = villagerB;

        const [targetStackEvent] = service.dropCardOnCard(villagerA.instanceId, house.instanceId);
        const targetStackId = (targetStackEvent.data as { stack: CardStack }).stack.stackId;

        const unrelatedCard = createCard("stone", 600, 100);
        state.cards[unrelatedCard.instanceId] = unrelatedCard;
        const [draggingStackEvent] = service.dropCardOnCard(unrelatedCard.instanceId, villagerB.instanceId);
        const draggingStackId = (draggingStackEvent.data as { stack: CardStack }).stack.stackId;

        const events = service.dropStackOnStack(draggingStackId, targetStackId);

        expect(events[0]).toEqual({
            event: "stack_removed",
            data: { stackId: draggingStackId },
        });
        expect(events[1].event).toBe("stack_updated");
        expect(state.stacks[draggingStackId]).toBeUndefined();
        expect(state.stacks[targetStackId].cards.map(card => card.instanceId)).toEqual([
            house.instanceId,
            villagerA.instanceId,
            villagerB.instanceId,
            unrelatedCard.instanceId,
        ]);
    });
});
