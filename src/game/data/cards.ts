import { CardDef } from "../types/types.game";

export const CARD_WIDTH = 96;
export const CARD_HEIGHT = 128;

export const CARDS: Record<string, CardDef> = {
    //STRUCTURES

    apple_tree: {
        id: "apple_tree",
        name: "Cây táo",
        type: "Structure",
        sellValue: 0,
    },
    tree: {
        id: "tree",
        name: "Cây",
        type: "Structure",
        sellValue: 1,
        stats: {
            description: "Một cây có thể thu hoạch để lấy gỗ.",
        },
    },
    berry_bush: {
        id: "berry_bush",
        name: "bụi quả mọng",
        type: "Structure",
        sellValue: 1,
    },

    brickyard: {
        id: "brickyard",
        name: "Xưởng gạch",
        type: "Structure",
        sellValue: 1,
    },

    campfire: {
        id: "campfire",
        name: "Lửa trại",
        type: "Structure",
        sellValue: 1,
    },

    farm: { id: "farm",
        name: "Trang trại",
        type: "Structure",
        sellValue: 5,
    },

    garden: { id: "garden",
        name: "Khu vườn",
        type: "Structure",
        sellValue: 5,
    },

    house: { id: "house",
        name: "Nhà",
        type: "Structure",
        sellValue: 3,
    },

    iron_mine: { id: "iron_mine",
        name: "Hầm mỏ",
        type: "Structure",
        sellValue: 5,
    },

    lumber_camp: { id: "lumber_camp",
        name: "Trại cưa",
        type: "Structure",
        sellValue: 5,
    },

    market: { id: "market",
        name: "Chợ",
        type: "Structure",
        sellValue: 5,
    },

    quarry: { id: "quarry",
        name: "Mỏ đá",
        type: "Structure",
        sellValue: 5,
    },

    sawmill: { id: "sawmill",
        name: "Xưởng cưa",
        type: "Structure",
        sellValue: 5,
    },

    shed: { id: "shed",
        name: "Nhà kho nhỏ",
        type: "Structure",
        sellValue: 3,
    },

    smelter: { id: "smelter",
        name: "Lò luyện kim",
        type: "Structure",
        sellValue: 5,
    },

    stove: { id: "stove",
        name: "Bếp lò",
        type: "Structure",
        sellValue: 5,
    },

    temple: { id: "temple",
        name: "Đền thờ",
        type: "Structure",
    },

    warehouse: { id: "warehouse",
        name: "Kho bãi",
        type: "Structure",
        sellValue: 5,
    },



    //VILLAGERS

    archer: { id: "archer",
        name: "Cung thủ",
        type: "Villager",
        stats: {
            healthPoint: 15,
            attackPoint: 3,
            foodCost: 2,
        },
    },

    baby: { id: "baby",
        name: "Trẻ em",
        type: "Villager",
        stats: {
            foodCost: 1,
        },
    },

    builder: { id: "builder",
        name: "Thợ xây",
        type: "Villager",
        stats: {
            healthPoint: 15,
            foodCost: 2,
        },
    },

    cat: { id: "cat",
        name: "Mèo",
        type: "Villager",
        stats: {
            healthPoint: 9,
            attackPoint: 1,
            foodCost: 1,
        },
    },

    dog: { id: "dog",
        name: "Chó",
        type: "Villager",
        stats: {
            healthPoint: 9,
            attackPoint: 1,
            foodCost: 1,
        },
    },

    explorer: { id: "explorer",
        name: "Nhà thám hiểm",
        type: "Villager",
        stats: {
            healthPoint: 15,
            attackPoint: 1,
            foodCost: 2,
        },
    },

    fisher: { id: "fisher",
        name: "Ngư dân",
        type: "Villager",
        stats: {
            healthPoint: 15,
            attackPoint: 1,
            foodCost: 2,
        },
    },

    friendly_pirate: { id: "friendly_pirate",
        name: "Cướp biển thân thiện",
        type: "Villager",
        stats: {
            healthPoint: 15,
            attackPoint: 1,
            foodCost: 2,
        },
    },

    militia: { id: "militia",
        name: "Dân binh",
        type: "Villager",
        stats: {
            healthPoint: 15,
            attackPoint: 2,
            foodCost: 2,
        },
    },

    miner: { id: "miner",
        name: "Thợ mỏ",
        type: "Villager",
        stats: {
            healthPoint: 15,
            attackPoint: 1,
            foodCost: 2,
        },
    },

    swordsman: { id: "swordsman",
        name: "Kiếm sĩ",
        type: "Villager",
        stats: {
            healthPoint: 15,
            attackPoint: 4,
            foodCost: 3,
        },
    },

    trained_monkey: { id: "trained_monkey",
        name: "Khỉ huấn luyện",
        type: "Villager",
        stats: {
            healthPoint: 6,
            attackPoint: 1,
            foodCost: 1,
        },
    },

    villager: { id: "villager",
        name: "Dân làng",
        type: "Villager",
        stats: {
            healthPoint: 15,
            attackPoint: 5,
            foodCost: 2,
        },
    },

    wizard: { id: "wizard",
        name: "Phù thủy",
        type: "Villager",
        stats: {
            healthPoint: 15,
            attackPoint: 5,
            foodCost: 3,
        },
    },

    young_villager: { id: "young_villager",
        name: "Dân làng trẻ",
        type: "Villager",
        stats: {
            healthPoint: 15,
            attackPoint: 3,
            foodCost: 2,
        },
    },









    // RESOURCES

    brick: { id: "brick",
        name: "Gạch",
        type: "Resource",
        sellValue: 3,
    },

    charcoal: { id: "charcoal",
        name: "Than củi",
        type: "Resource",
        sellValue: 1,
    },

    coin: { id: "coin",
        name: "Tiền vàng",
        type: "Resource",
    },

    cotton: { id: "cotton",
        name: "Bông",
        type: "Resource",
        sellValue: 1,
    },

    flint: { id: "flint",
        name: "Đá lửa",
        type: "Resource",
        sellValue: 2,
    },

    gold_bar: { id: "gold_bar",
        name: "Thỏi vàng",
        type: "Resource",
        sellValue: 5,
    },

    iron_bar: { id: "iron_bar",
        name: "Thỏi sắt",
        type: "Resource",
        sellValue: 5,
    },

    iron_ore: { id: "iron_ore",
        name: "Quặng sắt",
        type: "Resource",
        sellValue: 3,
    },

    plank: { id: "plank",
        name: "Ván gỗ",
        type: "Resource",
        sellValue: 3,
    },

    rope: { id: "rope",
        name: "Dây thừng",
        type: "Resource",
        sellValue: 3,
    },

    shell: { id: "shell",
        name: "Vỏ sò",
        type: "Resource",
    },

    stick: { id: "stick",
        name: "Que củi",
        type: "Resource",
        sellValue: 2,
    },

    stone: { id: "stone",
        name: "Đá",
        type: "Resource",
        sellValue: 1,
    },

    wood: { id: "wood",
        name: "Gỗ",
        type: "Resource",
        sellValue: 1,
    },

    wool: { id: "wool",
        name: "Len",
        type: "Resource",
        sellValue: 1,
    },


    //Ideas
    "Idea: AnimalPen": {
        id: "animal_pen",
        name: "Ý tưởng: Chuồng thú",
        type: "Idea",
        sellValue: 1,
        stats: {
            targetRecipeId: "recipe_animal_pen",
            craftTime: 5,
        },
    },

    "Idea: Brickyard": {
        id: "brickyard",
        name: "Ý tưởng: Xưởng gạch",
        type: "Idea",
        sellValue: 1,
        stats: {
            targetRecipeId: "recipe_brickyard",
            craftTime: 5,
        },
    },

    "Idea: Campfire": {
        id: "campfire",
        name: "Ý tưởng: Lửa trại",
        type: "Idea",
        sellValue: 1,
        stats: {
            targetRecipeId: "recipe_campfire",
            craftTime: 2,
        },
    },

    "Idea: Coin_Chest": {
        id: "coin_chest",
        name: "Ý tưởng: Rương tiền",
        type: "Idea",
        sellValue: 1,
        stats: {
            targetRecipeId: "recipe_coin_chest",
            craftTime: 5,
        },
    },

    "Idea: Cooked_Meat": {
        id: "cooked_meat",
        name: "Ý tưởng: Thịt chín",
        type: "Idea",
        sellValue: 1,
        stats: {
            targetRecipeId: "recipe_cooked_meat",
            craftTime: 3,
        },
    },

    "Idea: Farm": {
        id: "farm",
        name: "Ý tưởng: Trang trại",
        type: "Idea",
        sellValue: 1,
        stats: {
            targetRecipeId: "recipe_farm",
            craftTime: 10,
        },
    },

    "Idea: Fruit_Salad": {
        id: "fruit_salad",
        name: "Ý tưởng: Salad trái cây",
        type: "Idea",
        sellValue: 1,
        stats: {
            targetRecipeId: "recipe_fruit_salad",
            craftTime: 3,
        },
    },

    "Idea: Garden": {
        id: "garden",
        name: "Ý tưởng: Khu vườn",
        type: "Idea",
        sellValue: 1,
        stats: {
            targetRecipeId: "recipe_garden",
            craftTime: 5,
        },
    },

    "Idea: Growth": {
        id: "growth",
        name: "Ý tưởng: Trồng trọt",
        type: "Idea",
        sellValue: 1,
        stats: {
            targetRecipeId: "recipe_growth",
            craftTime: 2,
        },
    },

    "Idea: House": {
        id: "house",
        name: "Ý tưởng: Nhà ở",
        type: "Idea",
        sellValue: 1,
        stats: {
            targetRecipeId: "recipe_house",
            craftTime: 5,
        },
    },

    "Idea: Lumber_Camp": {
        id: "lumber_camp",
        name: "Ý tưởng: Trại cưa",
        type: "Idea",
        sellValue: 1,
        stats: {
            targetRecipeId: "recipe_lumber_camp",
            craftTime: 7,
        },
    },

    "Idea: Militia": {
        id: "militia",
        name: "Ý tưởng: Dân binh",
        type: "Idea",
        sellValue: 1,
        stats: {
            targetRecipeId: "recipe_militia",
            craftTime: 5,
        },
    },

    "Idea: Offspring": {
        id: "offspring",
        name: "Ý tưởng: Sinh sản",
        type: "Idea",
        sellValue: 1,
        stats: {
            targetRecipeId: "recipe_offspring",
            craftTime: 10,
        },
    },

    "Idea: Smelter": {
        id: "smelter",
        name: "Ý tưởng: Lò luyện kim",
        type: "Idea",
        sellValue: 1,
        stats: {
            targetRecipeId: "recipe_smelter",
            craftTime: 10,
        },
    },

    "Idea: Warehouse": {
        id: "warehouse",
        name: "Ý tưởng: Kho bãi",
        type: "Idea",
        sellValue: 1,
        stats: {
            targetRecipeId: "recipe_warehouse",
            craftTime: 7,
        },
    },


    // FOOD
    apple: { id: "apple",
        name: "Táo",
        type: "Food",
        sellValue: 1,
        stats: {
            foodValue: 2,
        },
    },

    banana: { id: "banana",
        name: "Chuối",
        type: "Food",
        sellValue: 1,
        stats: {
            foodValue: 2,
        },
    },

    berry: { id: "berry",
        name: "Quả mọng",
        type: "Food",
        sellValue: 1,
        stats: {
            foodValue: 1,
        },
    },

    bread: { id: "bread",
        name: "Bánh mì",
        type: "Food",
        sellValue: 3,
        stats: {
            foodValue: 4,
        },
    },

    carrot: { id: "carrot",
        name: "Cà rốt",
        type: "Food",
        sellValue: 1,
        stats: {
            foodValue: 2,
        },
    },

    cheese: { id: "cheese",
        name: "Phô mai",
        type: "Food",
        sellValue: 2,
        stats: {
            foodValue: 3,
        },
    },

    "Cooked Meat": {
        id: "cooked meat",
        name: "Thịt chín",
        type: "Food",
        sellValue: 2,
        stats: {
            foodValue: 3,
        },
    },

    egg: { id: "egg",
        name: "Trứng",
        type: "Food",
        sellValue: 1,
        stats: {
            foodValue: 1,
        },
    },

    frittata: { id: "frittata",
        name: "Trứng đúc thịt",
        type: "Food",
        sellValue: 3,
        stats: {
            foodValue: 4,
        },
    },

    "Fruit Salad": {
        id: "fruit salad",
        name: "Salad trái cây",
        type: "Food",
        sellValue: 3,
        stats: {
            foodValue: 4,
        },
    },

    milk: { id: "milk",
        name: "Sữa",
        type: "Food",
        sellValue: 1,
        stats: {
            foodValue: 1,
        },
    },

    mushroom: { id: "mushroom",
        name: "Nấm",
        type: "Food",
        sellValue: 1,
        stats: {
            foodValue: 1,
        },
    },

    omelette: { id: "omelette",
        name: "Trứng cuộn",
        type: "Food",
        sellValue: 2,
        stats: {
            foodValue: 3,
        },
    },

    potato: { id: "potato",
        name: "Khoai tây",
        type: "Food",
        sellValue: 1,
        stats: {
            foodValue: 2,
        },
    },

    "Raw Meat": {
        id: "raw meat",
        name: "Thịt sống",
        type: "Food",
        sellValue: 1,
        stats: {
            foodValue: 1,
        },
    },


    // MOBS
    bear: { id: "bear",
        name: "Gấu",
        type: "Mob",
        stats: {
            healthPoint: 25,
            attackPoint: 8,
            defensePoint: 5,
            attackSpeed: 2,
        },
    },


    ghost: { id: "ghost",
        name: "Ma",
        type: "Mob",
        stats: {
            healthPoint: 12,
            attackPoint: 3,
            attackType: "magic",
        },
    },

    goblin: { id: "goblin",
        name: "Goblin",
        type: "Mob",
        stats: {
            healthPoint: 9,
            attackPoint: 3,
            attackSpeed: 4,
        },
    },

    monkey: { id: "monkey",
        name: "Khỉ",
        type: "Mob",
        stats: {
            healthPoint: 10,
            attackPoint: 2,
            attackSpeed: 6,
        },
    },

    rat: { id: "rat",
        name: "Chuột",
        type: "Mob",
        stats: {
            healthPoint: 5,
            attackPoint: 1,
            attackSpeed: 4,
        },
    },

    skeleton: { id: "skeleton",
        name: "Bộ Xương",
        type: "Mob",
        stats: {
            healthPoint: 12,
            attackPoint: 4,
            defensePoint: 2,
        },
    },

    slime: { id: "slime",
        name: "Slime",
        type: "Mob",
        stats: {
            healthPoint: 8,
            attackPoint: 2,
            defensePoint: 1,
        },
    },

    tiger: { id: "tiger",
        name: "Hổ",
        type: "Mob",
        stats: {
            healthPoint: 15,
            attackPoint: 9,
            attackSpeed: 6,
        },
    },

    wolf: { id: "wolf",
        name: "Sói",
        type: "Mob",
        stats: {
            healthPoint: 20,
            attackPoint: 5,
            attackSpeed: 5,
        },
    },

    //Locations
    beach: { id: "beach",
        name: "Bãi Biển",
        type: "Location",
        stats: {
            capacity: 3,
            spawnRate: 0.3,
        },
    },

    cave: { id: "cave",
        name: "Hang Động",
        type: "Location",
        stats: {
            capacity: 2,
            spawnRate: 0.4,
        },
    },

    desert: { id: "desert",
        name: "Sa Mạc",
        type: "Location",
        stats: {
            capacity: 3,
            spawnRate: 0.2,
        },
    },

    forest: { id: "forest",
        name: "Rừng",
        type: "Location",
        stats: {
            capacity: 4,
            spawnRate: 0.5,
        },
    },

    jungle: { id: "jungle",
        name: "Rừng Nhiệt Đới",
        type: "Location",
        stats: {
            capacity: 4,
            spawnRate: 0.6,
        },
    },

    lake: { id: "lake",
        name: "Hồ",
        type: "Location",
        stats: {
            capacity: 3,
            spawnRate: 0.4,
        },
    },

    mountain: { id: "mountain",
        name: "Núi",
        type: "Location",
        stats: {
            capacity: 2,
            spawnRate: 0.3,
        },
    },

    plains: { id: "plains",
        name: "Đồng Bằng",
        type: "Location",
        stats: {
            capacity: 5,
            spawnRate: 0.5,
        },
    },

    ruins: { id: "ruins",
        name: "Tàn Tích",
        type: "Location",
        stats: {
            capacity: 2,
            spawnRate: 0.35,
        },
    },

    swamp: { id: "swamp",
        name: "Đầm Lầy",
        type: "Location",
        stats: {
            capacity: 3,
            spawnRate: 0.45,
        },
    },


    //FISH

    goldfish: { id: "goldfish",
        name: "Cá Vàng",
        type: "Fish",
        stats: {
            healthPoint: 2,
            attackPoint: 1,
            defensePoint: 0,
        },
    },

    salmon: { id: "salmon",
        name: "Cá Hồi",
        type: "Fish",
        stats: {
            healthPoint: 4,
            attackPoint: 2,
            defensePoint: 1,
        },
    },

    tuna: { id: "tuna",
        name: "Cá Ngừ",
        type: "Fish",
        stats: {
            healthPoint: 5,
            attackPoint: 3,
            defensePoint: 2,
        },
    },

    //RUMORS

    "Treasure Map": {
        id: "treasure map",
        name: "Bản Đồ Kho Báu",
        type: "Rumor",
        stats: {
            description: "Một bản đồ cũ dẫn đến kho báu bị mất.",
        },
    },

    "Ancient Artifact": {
        id: "ancientartifact",
        name: "Di Vật Cổ",
        type: "Rumor",
        stats: {
            description: "Một di vật cổ xưa được cho là mang lại sức mạnh.",
        },
    },

    //EQUIPMENT
    axe: { id: "axe",
        name: "Rìu",
        type: "Equipment",
        stats: {
            durability: 100,
            damage: 5,
        },
    },
    armor: { id: "armor",
        name: "Giáp Sắt",
        type: "Equipment",
        sellValue: 10,
        stats: {
            defensePoint: 6,
            durability: 40,
        },
    },

    boots: { id: "boots",
        name: "Giày Da",
        type: "Equipment",
        sellValue: 5,
        stats: {
            durability: 25,
        },
    },

    bow: { id: "bow",
        name: "Cung Gỗ",
        type: "Equipment",
        sellValue: 9,
        stats: {
            attackPoint: 4,
            durability: 30,
        },
    },

    dagger: { id: "dagger",
        name: "Dao Găm",
        type: "Equipment",
        sellValue: 7,
        stats: {
            attackPoint: 3,
            durability: 20,
        },
    },

    helmet: { id: "helmet",
        name: "Mũ Sắt",
        type: "Equipment",
        sellValue: 8,
        stats: {
            durability: 30,
        },
    },

    ring: { id: "ring",
        name: "Nhẫn Ma Thuật",
        type: "Equipment",
        sellValue: 15,
        stats: {
            durability: 50,
        },
    },

    shield: { id: "shield",
        name: "Khiên Gỗ",
        type: "Equipment",
        sellValue: 10,
        stats: {
            durability: 35,
        },
    },

    spear: { id: "spear",
        name: "Giáo",
        type: "Equipment",
        sellValue: 9,
        stats: {
            attackPoint: 5,
            durability: 30,
        },
    },

    sword: { id: "sword",
        name: "Kiếm",
        type: "Equipment",
        sellValue: 11,
        stats: {
            attackPoint: 6,
            durability: 35,
        },
    },

    wand: { id: "wand",
        name: "Gậy Phép",
        type: "Equipment",
        sellValue: 15,
        stats: {
            attackPoint: 2,
            durability: 25,
        },
    },

    //SPIRITS AND CURSES



}
