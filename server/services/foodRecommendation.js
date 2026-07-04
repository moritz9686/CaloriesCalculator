import Food from "../models/Food.js";

const GOALS = {
  calories: 2400,
  protein: 50,
  carbs: 275,
  fat: 70,
  fiber: 30,
  sugar: 50
};

function mealTypeForCurrentTime() {
  const h = new Date().getHours();
  if (h < 11) return "breakfast";
  if (h < 16) return "lunch";
  if (h < 18) return "snack";
  return "dinner";
}

function scoreFood(food, remaining, mealType, budget, workoutStatus) {
  let score = 0;

  // Meal type match — exact match strongly preferred, "any" is filler
  if (food.mealType === mealType) {
    score += 35;
  } else if (food.mealType === "any") {
    score += 2;
  } else if (food.mealType === "snack" && (mealType === "breakfast" || mealType === "lunch" || mealType === "dinner")) {
    score += 5;
  } else {
    score -= 15;
  }

  // Budget match
  if (budget === "any" || food.budget === budget) {
    score += 10;
  } else if (budget === "low" && food.budget === "medium") {
    score += 3;
  } else if (budget === "medium" && food.budget === "low") {
    score += 5;
  } else if (budget === "low" && food.budget === "high") {
    score -= 5;
  }

  // Quick food preference (if not specified, neutral)
  if (food.quickFood) score += 3;

  // Workout alignment
  if (workoutStatus === "pre" && food.preWorkout) score += 15;
  if (workoutStatus === "post" && food.postWorkout) score += 15;

  // Extra protein boost when workout is selected
  if (workoutStatus !== "none") {
    score += Math.min(food.protein / 10, 1) * 20;
  }

  // Nutrient gap filling — higher score for foods that fill gaps
  // Protein bonus is halved for meal type mismatch, unless workout is selected
  let proteinMultiplier = 1;
  if (workoutStatus === "none" && food.mealType !== mealType) {
    proteinMultiplier = 0.5;
  }
  if (remaining.protein > 0) {
    score += Math.min(food.protein / Math.max(remaining.protein, 1), 1) * 25 * proteinMultiplier;
  }
  if (remaining.fiber > 0) {
    score += Math.min(food.fiber / Math.max(remaining.fiber, 1), 1) * 15;
  }
  if (remaining.calories > 0) {
    const calRatio = food.calories / Math.max(remaining.calories, 1);
    if (calRatio <= 1) {
      score += calRatio * 10;
    } else {
      score += Math.max(0, 10 - (calRatio - 1) * 5);
    }
  }
  if (remaining.carbs > 0) {
    score += Math.min(food.carbs / Math.max(remaining.carbs, 1), 1) * 5;
  }
  if (remaining.fat > 0) {
    score += Math.min(food.fat / Math.max(remaining.fat, 1), 1) * 5;
  }

  // Sugar penalty — if still have sugar budget, sweet foods are ok
  if (remaining.sugar <= 0 && food.sugar > 5) {
    score -= food.sugar * 0.5;
  }

  // Calorie density penalty — penalize heavy dishes with low protein-per-calorie ratio
  const proteinPer100Cal = food.calories > 0 ? food.protein / (food.calories / 100) : 0;
  if (proteinPer100Cal < 3 && food.calories > 200) {
    score -= 12;
  } else if (proteinPer100Cal < 5 && food.calories > 300) {
    score -= 5;
  }

  // High fat penalty — penalize dishes high in fat that aren't offset by high protein
  if (food.fat > 20 && food.protein < 25) {
    score -= (food.fat - 20) * 1.5;
  }

  // Prep time bonus
  if (food.prepTime <= 5) score += 5;
  else if (food.prepTime <= 15) score += 3;
  else if (food.prepTime <= 30) score += 1;

  return Math.max(score, 0);
}

function generateExplanation(food, remaining, mealType, workoutStatus) {
  const reasons = [];

  const nutrients = [];
  if (remaining.protein > 0 && food.protein >= 10) nutrients.push("protein");
  if (remaining.fiber > 0 && food.fiber >= 3) nutrients.push("fiber");
  if (remaining.calories > 0 && food.calories > 100) nutrients.push("calories");

  if (nutrients.length > 0) {
    reasons.push(`Rich in ${nutrients.join(", ")} to meet today's targets`);
  } else if (food.calories < 100) {
    reasons.push("Light option — fits your remaining calorie budget");
  }

  if (food.preWorkout && workoutStatus === "pre") {
    reasons.push("Great pre-workout fuel for sustained energy");
  }
  if (food.postWorkout && workoutStatus === "post") {
    reasons.push("Ideal post-workout recovery meal");
  }

  if (food.quickFood && food.prepTime <= 10) {
    reasons.push("Quick to prepare — ready in minutes");
  }

  if (food.mealType === mealType || food.mealType === "any") {
    reasons.push(`Perfect ${mealType} choice`);
  }

  if (food.fiber >= 5) {
    reasons.push("High in fiber — great for digestion and satiety");
  }

  if (reasons.length === 0) {
    reasons.push("Balanced option that fits your daily nutrition");
  }

  return reasons.slice(0, 2).join(". ") + ".";
}

export async function recommendFoods({
  consumedEntries = [],
  burnedEntries = [],
  manualConsumedTotal = 0,
  manualBurnedTotal = 0,
  manualWaterMl = 0,
  dietType = "vegetarian",
  allergens = [],
  budget = "any",
  mealType,
  workoutStatus = "none"
}) {
  const mealTypeOrDefault = mealType || mealTypeForCurrentTime();

  function sumKey(entries, key) {
    let total = 0;
    for (const e of entries) {
      const v = Number(e[key]);
      if (Number.isFinite(v) && v > 0) total += v;
    }
    return total;
  }

  const consumedCal = Number(manualConsumedTotal || 0) + sumKey(consumedEntries, "calories");
  const protein = sumKey(consumedEntries, "protein");
  const carbs = sumKey(consumedEntries, "carbs");
  const fat = sumKey(consumedEntries, "fat");
  const fiber = sumKey(consumedEntries, "fiber");
  const sugar = sumKey(consumedEntries, "sugar");

  const remaining = {
    calories: Math.max(0, GOALS.calories - consumedCal),
    protein: Math.max(0, GOALS.protein - protein),
    carbs: Math.max(0, GOALS.carbs - carbs),
    fat: Math.max(0, GOALS.fat - fat),
    fiber: Math.max(0, GOALS.fiber - fiber),
    sugar: Math.max(0, GOALS.sugar - sugar)
  };

  // Build filter
  const filter = { dietType };

  // Allergen exclusion
  if (allergens.length > 0) {
    filter.allergens = { $not: { $elemMatch: { $in: allergens } } };
  }

  const foods = await Food.find(filter).lean();

  const scored = foods.map((food) => ({
    ...food,
    score: scoreFood(food, remaining, mealTypeOrDefault, budget, workoutStatus),
    explanation: generateExplanation(food, remaining, mealTypeOrDefault, workoutStatus)
  }));

  scored.sort((a, b) => b.score - a.score);

  const top5 = scored.slice(0, 5).map(({ score, ...rest }) => rest);

  return {
    recommendations: top5,
    remaining,
    mealType: mealTypeOrDefault,
    totalFoods: foods.length
  };
}
