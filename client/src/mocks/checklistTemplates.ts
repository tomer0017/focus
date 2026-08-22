import type { ChecklistGroup, ChecklistTemplate } from "../types";

/**
 * Built-in trip templates.
 *
 * Items carry a `textKey` rather than words, so a template ships in Hebrew and
 * English without either language being written into stored data. The moment
 * the user edits an item it becomes their own text and the key is dropped.
 */

let counter = 0;
const nextId = (prefix: string): string => `${prefix}-${(counter += 1)}`;

function group(titleKey: string, keys: string[]): ChecklistGroup {
  return {
    id: nextId("g"),
    titleKey,
    items: keys.map((textKey) => ({ id: nextId("i"), textKey, done: false })),
  };
}

const DOCUMENTS = ["passport", "visa", "insurance", "tickets", "licence", "copies"];
const CLOTHES_SHORT = ["outfits", "underwear", "walkingShoes", "layer", "sleepwear"];
const CLOTHES_LONG = ["outfits", "underwear", "walkingShoes", "layer", "sleepwear", "laundryBag", "smartOutfit"];
const TOILETRIES = ["toothbrush", "shampoo", "sunscreen", "razor", "deodorant"];
const ELECTRONICS = ["charger", "adapter", "powerBank", "headphones", "camera"];
const HEALTH = ["regularMeds", "painkillers", "plasters", "stomach", "prescriptions"];
const MONEY = ["cash", "cards", "notifyBank", "budget"];
const BEFORE_LEAVING = ["checkIn", "alarm", "bins", "plants", "windows", "chargeDevices"];
const BEFORE_RETURNING = ["souvenirs", "receipts", "chargersCollected", "hotelSafe"];

/**
 * Shopping lists.
 *
 * Grouped by where things are in a shop rather than by meal, because that is
 * the order somebody walks a supermarket in and the whole value of a printed
 * list is not doubling back. The holiday list is deliberately short: it is the
 * *extra* shop, not a second full weekly one.
 */
const SHOPPING_TEMPLATES: ChecklistTemplate[] = [
  {
    id: "shop-weekly",
    nameKey: "templates.shopWeekly",
    category: "shopping",
    recommended: true,
    groups: [
      group("groups.produce", ["tomatoes", "cucumbers", "onions", "lemons", "herbs", "fruit"]),
      group("groups.dairy", ["milk", "eggs", "yoghurt", "cheese", "butter"]),
      group("groups.bakery", ["bread", "pita"]),
      group("groups.dryGoods", ["rice", "pasta", "oil", "coffee", "cereal"]),
      group("groups.meatFish", ["chicken", "mince"]),
      group("groups.household", ["dishSoap", "binBags", "laundry"]),
    ],
  },
  {
    id: "shop-monthly",
    nameKey: "templates.shopMonthly",
    category: "shopping",
    groups: [
      group("groups.dryGoods", ["flour", "sugar", "tins", "legumes", "oilLarge"]),
      group("groups.frozen", ["frozenVeg", "iceCream", "frozenFish"]),
      group("groups.household", ["toiletPaper", "kitchenRoll", "cleaner", "sponges", "foil"]),
      group("groups.drinks", ["water", "juice", "soda"]),
    ],
  },
  {
    id: "shop-holiday",
    nameKey: "templates.shopHoliday",
    category: "shopping",
    groups: [
      group("groups.holidayTable", ["wine", "candles", "flowers", "nuts", "dessert"]),
      group("groups.produce", ["saladVeg", "seasonalFruit", "herbs"]),
      group("groups.meatFish", ["mainCut", "fish"]),
      group("groups.bakery", ["challah", "cake"]),
    ],
  },
  {
    id: "shop-hosting",
    nameKey: "templates.shopHosting",
    category: "shopping",
    groups: [
      group("groups.holidayTable", ["wine", "softDrinks", "nibbles", "dessert", "napkins"]),
      group("groups.produce", ["saladVeg", "herbs", "lemons"]),
      group("groups.dairy", ["cheeseBoard", "cream"]),
    ],
  },
];

export const BUILT_IN_TEMPLATES: ChecklistTemplate[] = [
  ...SHOPPING_TEMPLATES,
  {
    id: "trip-short",
    nameKey: "templates.tripShort",
    category: "trip",
    groups: [
      group("groups.documents", DOCUMENTS.slice(0, 4)),
      group("groups.clothes", CLOTHES_SHORT),
      group("groups.toiletries", TOILETRIES.slice(0, 3)),
      group("groups.electronics", ELECTRONICS.slice(0, 3)),
      group("groups.health", HEALTH.slice(0, 3)),
      group("groups.money", MONEY.slice(0, 3)),
      group("groups.beforeLeaving", BEFORE_LEAVING.slice(0, 4)),
    ],
  },
  {
    id: "trip-standard",
    nameKey: "templates.tripStandard",
    category: "trip",
    recommended: true,
    groups: [
      group("groups.documents", DOCUMENTS),
      group("groups.clothes", CLOTHES_LONG),
      group("groups.toiletries", TOILETRIES),
      group("groups.electronics", ELECTRONICS),
      group("groups.health", HEALTH),
      group("groups.money", MONEY),
      group("groups.beforeLeaving", BEFORE_LEAVING),
      group("groups.beforeReturning", BEFORE_RETURNING),
    ],
  },
  {
    id: "trip-long",
    nameKey: "templates.tripLong",
    category: "trip",
    groups: [
      group("groups.documents", [...DOCUMENTS, "backupCopies"]),
      group("groups.clothes", [...CLOTHES_LONG, "seasonSwap"]),
      group("groups.toiletries", [...TOILETRIES, "refills"]),
      group("groups.electronics", [...ELECTRONICS, "cableBag"]),
      group("groups.health", [...HEALTH, "vaccinations"]),
      group("groups.money", [...MONEY, "longStayCard"]),
      group("groups.gear", ["dayPack", "laundryKit", "lock", "waterBottle"]),
      group("groups.beforeLeaving", [...BEFORE_LEAVING, "mailHold", "standingOrders"]),
      group("groups.beforeReturning", BEFORE_RETURNING),
    ],
  },
  {
    id: "trip-camping",
    nameKey: "templates.tripCamping",
    category: "trip",
    groups: [
      group("groups.gear", ["tent", "sleepingBag", "mattress", "headlamp", "stove", "gas", "chairs", "tarp"]),
      group("groups.clothes", ["warmLayer", "rainLayer", "hikingShoes", "spareSocks", "hat"]),
      group("groups.food", ["water", "coolerBox", "breakfast", "dinner", "snacks", "coffee"]),
      group("groups.health", ["firstAid", "bugSpray", "sunscreenCamp"]),
      group("groups.beforeLeaving", ["fuel", "weatherCheck", "firePermit", "tellSomeone"]),
    ],
  },
  {
    id: "trip-hotel-weekend",
    nameKey: "templates.tripHotelWeekend",
    category: "trip",
    groups: [
      group("groups.documents", ["idCard", "booking", "parking"]),
      group("groups.clothes", ["outfits", "swimwear", "smartOutfit", "sleepwear"]),
      group("groups.toiletries", ["toothbrush", "skincare", "deodorant"]),
      group("groups.electronics", ["charger", "headphones"]),
      group("groups.beforeLeaving", ["checkInTime", "bins", "alarm"]),
    ],
  },
];

/** Templates for a given purpose, for the picker's filter. */
export function templatesFor(
  category: ChecklistTemplate["category"],
  templates: ChecklistTemplate[] = BUILT_IN_TEMPLATES
): ChecklistTemplate[] {
  return templates.filter((template) => (template.category ?? "general") === category);
}
