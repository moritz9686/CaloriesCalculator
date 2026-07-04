import mongoose from "mongoose";
import Food from "./models/Food.js";

import "dotenv/config";
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/calories";

function mapDiet(diet) {
  const map = { "Non-Veg": "non-vegetarian", "Eggetarian": "eggetarian", "Vegan": "vegan", "Vegetarian": "vegetarian" };
  return map[diet] || "vegetarian";
}

function mealTypeForName(name) {
  const breakfast = ["Egg", "Oats", "Chia Seeds", "Flax Seeds", "Greek Yogurt", "Milk"];
  const lunch = ["Chicken Breast", "Tuna", "Tempeh", "Soy Chunks", "Lentils", "Chickpeas", "Kidney Beans", "Black Beans", "Green Peas"];
  const dinner = ["Fish (Salmon)", "Lean Beef"];
  const snack = ["Whey Protein", "Almonds", "Peanuts", "Pumpkin Seeds", "Apple", "Banana", "Sweet Potato"];
  if (breakfast.some(b => name.startsWith(b))) return "breakfast";
  if (lunch.some(l => name.startsWith(l))) return "lunch";
  if (dinner.some(d => name.startsWith(d))) return "dinner";
  if (snack.some(s => name.startsWith(s))) return "snack";
  return "any";
}

function inferBudget(category, name) {
  const expensive = ["Salmon", "Almonds", "Whey", "Pumpkin Seeds", "Chia Seeds", "Avocado", "Tuna", "Lean Beef"];
  if (expensive.some(e => name.includes(e))) return "high";
  const medium = ["Tempeh", "Quinoa", "Flax Seeds", "Greek Yogurt"];
  if (medium.some(e => name.includes(e))) return "medium";
  return "low";
}

function inferQuick(category, name) {
  const slow = ["Lentils", "Chickpeas", "Kidney", "Black Beans", "Tempeh", "Soy Chunks", "Quinoa", "Brown Rice", "Sweet Potato"];
  if (slow.some(s => name.includes(s))) return false;
  return true;
}

function inferPreWorkout(food) {
  return food.fiber < 5 && food.protein > 10;
}

function inferPostWorkout(food) {
  return food.protein > 15;
}

const userFoods = [
  { foodName: "Chicken Breast", category: "Protein", protein: 31, fiber: 0, calories: 165, diet: "Non-Veg", allergens: [] },
  { foodName: "Egg", category: "Protein", protein: 13, fiber: 0, calories: 155, diet: "Eggetarian", allergens: ["Egg"] },
  { foodName: "Fish (Salmon)", category: "Protein", protein: 25, fiber: 0, calories: 208, diet: "Non-Veg", allergens: ["Fish"] },
  { foodName: "Tuna", category: "Protein", protein: 29, fiber: 0, calories: 132, diet: "Non-Veg", allergens: ["Fish"] },
  { foodName: "Lean Beef", category: "Protein", protein: 26, fiber: 0, calories: 250, diet: "Non-Veg", allergens: [] },
  { foodName: "Paneer", category: "Dairy", protein: 18, fiber: 0, calories: 265, diet: "Vegetarian", allergens: ["Milk"] },
  { foodName: "Greek Yogurt", category: "Dairy", protein: 10, fiber: 0, calories: 59, diet: "Vegetarian", allergens: ["Milk"] },
  { foodName: "Milk", category: "Dairy", protein: 3.4, fiber: 0, calories: 61, diet: "Vegetarian", allergens: ["Milk"] },
  { foodName: "Whey Protein", category: "Supplement", protein: 80, fiber: 0, calories: 400, diet: "Vegetarian", allergens: ["Milk"] },
  { foodName: "Tofu", category: "Soy", protein: 17, fiber: 2, calories: 144, diet: "Vegan", allergens: ["Soy"] },
  { foodName: "Tempeh", category: "Soy", protein: 20, fiber: 5, calories: 193, diet: "Vegan", allergens: ["Soy"] },
  { foodName: "Soy Chunks", category: "Soy", protein: 52, fiber: 13, calories: 345, diet: "Vegetarian", allergens: ["Soy"] },
  { foodName: "Lentils (Dal)", category: "Legume", protein: 9, fiber: 8, calories: 116, diet: "Vegan", allergens: [] },
  { foodName: "Chickpeas", category: "Legume", protein: 19, fiber: 17, calories: 364, diet: "Vegan", allergens: [] },
  { foodName: "Kidney Beans (Rajma)", category: "Legume", protein: 24, fiber: 25, calories: 333, diet: "Vegan", allergens: [] },
  { foodName: "Black Beans", category: "Legume", protein: 21, fiber: 16, calories: 339, diet: "Vegan", allergens: [] },
  { foodName: "Green Peas", category: "Vegetable", protein: 5, fiber: 5, calories: 81, diet: "Vegan", allergens: [] },
  { foodName: "Quinoa", category: "Grain", protein: 14, fiber: 7, calories: 120, diet: "Vegan", allergens: [] },
  { foodName: "Oats", category: "Grain", protein: 17, fiber: 10, calories: 389, diet: "Vegan", allergens: ["Gluten (possible)"] },
  { foodName: "Brown Rice", category: "Grain", protein: 2.6, fiber: 1.8, calories: 111, diet: "Vegan", allergens: [] },
  { foodName: "Almonds", category: "Nuts", protein: 21, fiber: 12, calories: 579, diet: "Vegan", allergens: ["Tree Nuts"] },
  { foodName: "Peanuts", category: "Nuts", protein: 26, fiber: 8, calories: 567, diet: "Vegan", allergens: ["Peanut"] },
  { foodName: "Pumpkin Seeds", category: "Seeds", protein: 30, fiber: 6, calories: 559, diet: "Vegan", allergens: [] },
  { foodName: "Chia Seeds", category: "Seeds", protein: 17, fiber: 34, calories: 486, diet: "Vegan", allergens: [] },
  { foodName: "Flax Seeds", category: "Seeds", protein: 18, fiber: 27, calories: 534, diet: "Vegan", allergens: [] },
  { foodName: "Broccoli", category: "Vegetable", protein: 2.8, fiber: 2.6, calories: 34, diet: "Vegan", allergens: [] },
  { foodName: "Spinach", category: "Vegetable", protein: 2.9, fiber: 2.2, calories: 23, diet: "Vegan", allergens: [] },
  { foodName: "Apple", category: "Fruit", protein: 0.3, fiber: 2.4, calories: 52, diet: "Vegan", allergens: [] },
  { foodName: "Banana", category: "Fruit", protein: 1.1, fiber: 2.6, calories: 89, diet: "Vegan", allergens: [] },
  { foodName: "Avocado", category: "Fruit", protein: 2, fiber: 7, calories: 160, diet: "Vegan", allergens: [] },
  { foodName: "Sweet Potato", category: "Vegetable", protein: 1.6, fiber: 3, calories: 86, diet: "Vegan", allergens: [] }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    let count = 0;
    for (const f of userFoods) {
      const doc = {
        name: f.foodName,
        servingSize: "100 g",
        calories: f.calories,
        protein: f.protein,
        carbs: 0,
        fat: 0,
        fiber: f.fiber,
        sugar: 0,
        water: 0,
        dietType: mapDiet(f.diet),
        allergens: f.allergens.map(a => a.toLowerCase()),
        mealType: mealTypeForName(f.foodName),
        prepTime: inferQuick(f.category, f.foodName) ? 5 : 20,
        budget: inferBudget(f.category, f.foodName),
        quickFood: inferQuick(f.category, f.foodName),
        preWorkout: inferPreWorkout(f),
        postWorkout: inferPostWorkout(f)
      };
      // upsert by name
      const existing = await Food.findOne({ name: doc.name });
      if (existing) {
        await Food.updateOne({ name: doc.name }, { $set: doc });
        console.log(`Updated: ${doc.name}`);
      } else {
        await Food.create(doc);
        console.log(`Inserted: ${doc.name}`);
      }
      count++;
    }

    console.log(`\nDone: ${count} foods processed`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seed();
