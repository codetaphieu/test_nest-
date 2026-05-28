import { Recipe } from "../types/types.game";
import { CARDS } from "./cards";


export function validateRecipe(recipe: Recipe) {
    if (recipe.inputs.some(input => !(input in CARDS))) {
        throw new Error('Invalid recipe inputs');
    }
    if (!(recipe.outputs.every(output => output in CARDS))) {
        recipe.outputs = ["thẻ thất lạc"];
        throw new Error('Invalid recipe output');
    }
    return recipe;
}

export const RECIPES: Recipe[] = [
    

    {
        id: "axe_recipe",
        inputs: ["wood", "stone"],
        outputs: ["axe"],
        duration: 4000,
        deletedId: ["wood", "stone"],
    },

    {
        id: "berry_recipe",
        inputs: ["berry_bush", "villager"],
        outputs: ["berry"],
        duration: 3000,
        deletedId: [],
    },

    {
        id: "coin_from_berry_recipe",
        inputs: ["berry", "villager"],
        outputs: ["coin"],
        duration: 3000,
        deletedId: ["berry"],
    },

    {
        id: "board_recipe",
        inputs: ["wood", "villager"],
        outputs: ["board"],
        duration: 3500,
        deletedId: ["wood"],
    },

    {
        id: "campfire_recipe",
        inputs: ["wood", "stone"],
        outputs: ["campfire"],
        duration: 5000,
        deletedId: ["wood", "stone"],
    },

    {
        id: "coin_recipe",
        inputs: ["gold_ore", "villager"],
        outputs: ["coin"],
        duration: 4000,
        deletedId: ["gold_ore"],
    },

    {
        id: "cook_meat_recipe",
        inputs: ["raw_meat", "campfire"],
        outputs: ["cooked_meat"],
        duration: 3000,
        deletedId: ["raw_meat"],
    },

    {
        id: "fish_recipe",
        inputs: ["lake", "villager"],
        outputs: ["fish"],
        duration: 3000,
        deletedId: [],
    },

    {
        id: "flour_recipe",
        inputs: ["wheat", "villager"],
        outputs: ["flour"],
        duration: 3500,
        deletedId: ["wheat"],
    },

    {
        id: "house_recipe",
        inputs: ["board", "stone"],
        outputs: ["house"],
        duration: 8000,
        deletedId: ["board", "stone"],
    },

    {
        id: "offspring_recipe",
        inputs: ["house", "villager", "villager"],
        outputs: ["baby"],
        duration: 10000,
        deletedId: ["villager", "villager"],
    },

    {
        id: "iron_bar_recipe",
        inputs: ["iron_ore", "campfire"],
        outputs: ["iron_bar"],
        duration: 5000,
        deletedId: ["iron_ore"],
    },

    {
        id: "knife_recipe",
        inputs: ["iron_bar", "wood"],
        outputs: ["knife"],
        duration: 4000,
        deletedId: ["iron_bar", "wood"],
    },

    {
        id: "pickaxe_recipe",
        inputs: ["wood", "stone"],
        outputs: ["pickaxe"],
        duration: 4000,
        deletedId: ["wood", "stone"],
    },

    {
        id: "plank_recipe",
        inputs: ["board", "villager"],
        outputs: ["plank"],
        duration: 3000,
        deletedId: ["board"],
    },

    {
        id: "rope_recipe",
        inputs: ["fiber"],
        outputs: ["rope"],
        duration: 2000,
        deletedId: ["fiber"],
    },

    {
        id: "stick_recipe",
        inputs: ["farmer", "wood"],
        outputs: ["stick"],
        duration: 3000,
        deletedId: ["wood"],
    },

    {
        id: "spear_recipe",
        inputs: ["wood", "stone"],
        outputs: ["spear"],
        duration: 3500,
        deletedId: ["wood", "stone"],
    },

    {
        id: "sword_recipe",
        inputs: ["iron_bar", "wood"],
        outputs: ["sword"],
        duration: 5000,
        deletedId: ["iron_bar", "wood"],
    },

    {
        id: "tent_recipe",
        inputs: ["fabric", "wood"],
        outputs: ["tent"],
        duration: 6000,
        deletedId: ["fabric", "wood"],
    },

    {
        id: "thread_recipe",
        inputs: ["fiber"],
        outputs: ["thread"],
        duration: 2000,
        deletedId: ["fiber"],
    },

    {
        id: "tool_handle_recipe",
        inputs: ["wood"],
        outputs: ["handle"],
        duration: 2000,
        deletedId: ["wood"],
    },

    {
        id: "wheat_recipe",
        inputs: ["farm", "villager"],
        outputs: ["wheat"],
        duration: 4000,
        deletedId: [],
    },


]
