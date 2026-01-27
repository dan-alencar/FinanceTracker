export const classes = [
  {
    id: "forge-guardian",
    name: "Forge Guardian",
    description: "Tanky protector who budgets with iron discipline."
  },
  {
    id: "rune-archer",
    name: "Rune Archer",
    description: "Quick strategist who snipes impulse purchases."
  },
  {
    id: "ember-alchemist",
    name: "Ember Alchemist",
    description: "Creative crafter turning savings into power."
  }
];

export const appearances = [
  { id: "ember", label: "Ember Glow" },
  { id: "crystal", label: "Crystal Armor" },
  { id: "shadow", label: "Shadow Forge" },
  { id: "moss", label: "Mossy Traveler" },
  { id: "starlit", label: "Starlit Crown" }
];

export const categories = [
  "Food",
  "Transport",
  "Entertainment",
  "Education",
  "Health",
  "Other"
];

export const shopItems = [
  {
    id: "axe-skin",
    name: "Obsidian Axe",
    category: "Weapon",
    slot: "tool",
    price: 120,
    assetUrl: "https://placehold.co/100x100?text=Axe"
  },
  {
    id: "hood",
    name: "Shadow Hood",
    category: "Headgear",
    slot: "helmet",
    price: 90,
    assetUrl: "https://placehold.co/100x100?text=Hood"
  },
  {
    id: "shield",
    name: "Titan Shield",
    category: "Shield",
    slot: "tool",
    price: 140,
    assetUrl: "https://placehold.co/100x100?text=Shield"
  },
  {
    id: "boots",
    name: "Swift Boots",
    category: "Boots",
    slot: "accessory",
    price: 70,
    assetUrl: "https://placehold.co/100x100?text=Boots"
  },
  {
    id: "cape",
    name: "Aurora Cape",
    category: "Cape",
    slot: "cloak",
    price: 110,
    assetUrl: "https://placehold.co/100x100?text=Cape"
  },
  {
    id: "hammer",
    name: "Solar Hammer",
    category: "Weapon",
    slot: "tool",
    price: 150,
    assetUrl: "https://placehold.co/100x100?text=Hammer"
  },
  {
    id: "pet",
    name: "Stone Golem Pet",
    category: "Companion",
    slot: "accessory",
    price: 200,
    assetUrl: "https://placehold.co/100x100?text=Pet"
  },
  {
    id: "ring",
    name: "Guild Ring",
    category: "Accessory",
    slot: "accessory",
    price: 60,
    assetUrl: "https://placehold.co/100x100?text=Ring"
  },
  {
    id: "gloves",
    name: "Forge Gloves",
    category: "Gloves",
    slot: "accessory",
    price: 80,
    assetUrl: "https://placehold.co/100x100?text=Gloves"
  },
  {
    id: "banner",
    name: "Victory Banner",
    category: "Decoration",
    slot: "background",
    price: 130,
    assetUrl: "https://placehold.co/100x100?text=Banner"
  }
];

export const achievements = [
  {
    code: "first-log",
    name: "First Log",
    description: "Record your very first expense.",
    title: "Rookie Scribe"
  },
  {
    code: "streak-7",
    name: "7-Day Streak",
    description: "Log expenses seven days in a row.",
    title: "Streak Warden"
  },
  {
    code: "budget-keeper",
    name: "Budget Keeper",
    description: "Stay within three monthly budgets.",
    title: "Keeper of Coin"
  },
  {
    code: "guild-treasurer",
    name: "Guild Treasurer",
    description: "Reach 50 total transactions.",
    title: "Guild Treasurer"
  },
  {
    code: "armory-collector",
    name: "Armory Collector",
    description: "Own five cosmetics from the Armory.",
    title: "Armory Curator"
  },
  {
    code: "steady-hand",
    name: "Steady Hand",
    description: "Maintain a 3-day streak.",
    title: "Steady Hand"
  }
];

export const counselorMessages = [
  {
    id: "welcome",
    title: "Welcome to the Guild",
    body: "Every coin logged is a rune carved into your future. Start with one transaction today!",
    sentAt: "2024-05-12"
  },
  {
    id: "tip",
    title: "Tip: Daily Streaks",
    body: "Log at least one expense per day to keep your streak alive. Streak rewards boost XP!",
    sentAt: "2024-05-14"
  }
];
