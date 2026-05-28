import { RECIPES } from "../data/recipes"
import { CardStack, Recipe } from "../types/types.game"
import { Injectable } from "@nestjs/common"

@Injectable()
export class CraftingEngine {

    activeRecipe(stack: CardStack): Recipe | null { //active recipe cho stack, trả về recipe nếu có, null nếu không
        return this.findMatchingRecipe(stack);
    }

    findMatchingRecipe(stack: CardStack): Recipe | null {
        const candidates = RECIPES
            .map((recipe, order) => ({ recipe, order }))
            .filter(({ recipe }) => this.stackMatchesInputs(stack, recipe.inputs))
            .sort((a, b) => {
                const inputCountDiff = b.recipe.inputs.length - a.recipe.inputs.length;
                return inputCountDiff !== 0 ? inputCountDiff : a.order - b.order;
            });

        return candidates[0]?.recipe ?? null;
    }

    stackMatchesRecipe(stack: CardStack, recipe: Recipe) {
        return this.stackMatchesInputs(stack, recipe.inputs);
    }

    findRecipeById(recipeId: string): Recipe | null {
        return RECIPES.find(recipe => recipe.id === recipeId) ?? null;
    }

    private stackMatchesInputs(stack: CardStack, inputs: string[]) {
        const available = this.countByDefId(stack.cards.map(card => card.defId));
        const required = this.countByDefId(inputs);

        const availableKeys = Object.keys(available);
        const requiredKeys = Object.keys(required);

        if (availableKeys.length !== requiredKeys.length) {
            return false;
        }

        return requiredKeys.every((defId) => {
            const count = required[defId];
            return (available[defId] ?? 0) === count;
        });
    }

    private countByDefId(defIds: string[]) {
        return defIds.reduce<Record<string, number>>((acc, defId) => {
            acc[defId] = (acc[defId] ?? 0) + 1;
            return acc;
        }, {});
    }
}
