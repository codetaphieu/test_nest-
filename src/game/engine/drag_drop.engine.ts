// import { Injectable, Inject } from "@nestjs/common";
// import { CardInstance, CardStack } from "../types/types.game";
// import { UUID } from "crypto";
// import { CARD_HEIGHT, CARD_WIDTH } from "../data/cards";
// import { GameStateService } from "../gameState.service";
// import { CraftingEngine } from "./crafting.engine";
// import { Server } from "socket.io";


// @Injectable()
// export class DragDropEngine {

//     constructor(
//         private readonly gameState: GameStateService,
//         private crafting: CraftingEngine,
//         @Inject('GAME_SERVER') private server: Server,
//     ) { }

//     dropCard(draggingCard: CardInstance) {
//         const gameState =
//             this.gameState.getState();

//         const hitCard =
//             this.findCardAtPosition(
//                 draggingCard.position.x,
//                 draggingCard.position.y,
//                 gameState.cards,
//                 draggingCard.instanceId
//             );

//         const existingStack =
//             Object.values(gameState.stacks)
//                 .find(stack =>

//                     stack.cards.some(
//                         card =>
//                             card.instanceId ===
//                             hitCard!.instanceId
//                     )

//                 );

//         const stack =
//             existingStack
//                 ? this.addCardToStack(
//                     existingStack,
//                     draggingCard
//                 )
//                 : this.createNewStack(
//                     draggingCard,
//                     hitCard!
//                 );

//         delete gameState.cards[
//             draggingCard.instanceId
//         ];

//         delete gameState.cards[
//             hitCard!.instanceId
//         ];

//         const crafting =
//             this.crafting.activeRecipe(
//                 stack
//             );

//         if (!crafting) {

//             this.server.emit(
//                 "stack_updated",
//                 stack
//             );

//             return;
//         }


//         this.server.emit(
//             "recipe_started",
//             {
//                 stackId: stack.stackId,
//                 crafting,
//             }
//         );

//         setTimeout(() => {

//             const recipe =
//                 this.crafting
//                     .findMatchingRecipe(
//                         stack
//                     );

//             if (!recipe) {
//                 return;
//             }

//             stack.cards = [];

//             const outputCards =
//                 recipe.outputs.map(
//                     defId => ({

//                         instanceId:
//                             crypto.randomUUID(),

//                         defId,

//                         position:
//                             stack.position,

//                     })
//                 );

//             stack.cards.push(
//                 ...outputCards
//             );

//             stack.crafting = {
//                 active: false,
//             };

//             this.server.emit(
//                 "recipe_completed",
//                 {
//                     stackId: stack.stackId,

//                     outputs:
//                         outputCards,
//                 }
//             );

//         }, stack.crafting.duration);

//     }

//     findCardAtPosition(
//         x: number,
//         y: number,
//         cards: Record<string, CardInstance>,
//         excludeId: UUID
//     ): CardInstance | null {
//         return Object.values(cards).find(card => {
//             if (card.instanceId === excludeId) return false

//             const cx = card.position.x
//             const cy = card.position.y

//             return (
//                 x >= cx &&
//                 x <= cx + CARD_WIDTH &&
//                 y >= cy &&
//                 y <= cy + CARD_HEIGHT
//             )
//         }) ?? null
//     }

//     addCardToStack(
//         stack: CardStack,
//         card: CardInstance
//     ): CardStack {
//         return {
//             ...stack,
//             cards: [...stack.cards, card],
//         }
//     }

//     createNewStack(
//         cardA: CardInstance,
//         cardB: CardInstance
//     ): CardStack {
//         return {
//             stackId: crypto.randomUUID(),
//             cards: [cardA, cardB],
//             position: { x: cardB.position.x, y: cardB.position.y },
//             crafting: {
//                 active: false,
//             },
//             progress: 0,
//         }
//     }
// }
