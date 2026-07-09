import Food from "../models/Food.js";

const GOALS = {
  calories: 2400,
  protein: 50,
  carbs: 275,
  fat: 70,
  fiber: 30,
  sugar: 50
};

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

function mealTypeForCurrentTime() {
  const h = new Date().getHours();
  if (h < 11) return "breakfast";
  if (h < 16) return "lunch";
  if (h < 18) return "snack";
  return "dinner";
}

function scoreFood(food, remaining, mealType, budget, workoutStatus) {
  let score = 0;

  if (food.mealType === mealType) {
    score += 35;
  } else if (food.mealType === "any") {
    score += 2;
  } else if (food.mealType === "snack" && (mealType === "breakfast" || mealType === "lunch" || mealType === "dinner")) {
    score += 5;
  } else {
    score -= 15;
  }

  if (budget === "any" || food.budget === budget) {
    score += 10;
  } else if (budget === "low" && food.budget === "medium") {
    score += 3;
  } else if (budget === "medium" && food.budget === "low") {
    score += 5;
  } else if (budget === "low" && food.budget === "high") {
    score -= 5;
  }

  if (food.quickFood) score += 3;

  if (workoutStatus === "pre" && food.preWorkout) score += 15;
  if (workoutStatus === "post" && food.postWorkout) score += 15;

  if (workoutStatus !== "none") {
    score += Math.min(food.protein / 10, 1) * 20;
  }

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

  if (remaining.sugar <= 0 && food.sugar > 5) {
    score -= food.sugar * 0.5;
  }

  const proteinPer100Cal = food.calories > 0 ? food.protein / (food.calories / 100) : 0;
  if (proteinPer100Cal < 3 && food.calories > 200) {
    score -= 12;
  } else if (proteinPer100Cal < 5 && food.calories > 300) {
    score -= 5;
  }

  if (food.fat > 20 && food.protein < 25) {
    score -= (food.fat - 20) * 1.5;
  }

  if (food.prepTime <= 5) score += 5;
  else if (food.prepTime <= 15) score += 3;
  else if (food.prepTime <= 30) score += 1;

  return Math.max(score, 0);
}

function callGemini(params) {
  const { apiKey, prompt } = params;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.3 }
    })
  });
}

const recommendationPrompt = `You are a personalized nutrition coach. Recommend the best meal for the user.

Return ONLY strict JSON with this shape:
{
  "mealName": "string — recommended dish name",
  "portionSize": "string — e.g. '1 bowl', '100g', '2 rotis'",
  "reason": "string — 1-2 sentence explanation of why this is recommended",
  "protein": number,
  "calories": number,
  "fiber": number,
  "foods": ["list", "of", "key", "ingredients"]
}

Rules:
- mealName should be specific and appetizing.
- reason must reference the user's goal, remaining nutrients, and meal time.
- protein/calories/fiber are for the portion specified.
- Numbers only, no units inside the values.
- No extra commentary outside the JSON.`;

function buildRecommendationPrompt({ goal, dietType, mealType, remaining, candidates }) {
  const candidatesText = candidates
    .map(
      (f, i) =>
        `${i + 1}. ${f.name} — ${f.calories} kcal, ${f.protein}g protein, ${f.fiber}g fiber (${f.mealType}, ${f.budget} budget, ${f.prepTime} min prep)`
    )
    .join("\n");

  return `${recommendationPrompt}

User Profile:
- Goal: ${goal}
- Diet: ${dietType}
- Meal Time: ${mealType}

Remaining Daily Targets:
- Calories: ${remaining.calories} kcal
- Protein: ${remaining.protein} g
- Fiber: ${remaining.fiber} g
- Carbs: ${remaining.carbs} g
- Fat: ${remaining.fat} g

Available Food Options:
${candidatesText}

Recommend the single best meal from the available options above.`;
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
  workoutStatus = "none",
  goal = "maintenance"
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

  const filter = { dietType };
  if (allergens.length > 0) {
    filter.allergens = { $not: { $elemMatch: { $in: allergens } } };
  }

  const foods = await Food.find(filter).lean();

  const scored = foods.map((food) => ({
    ...food,
    score: scoreFood(food, remaining, mealTypeOrDefault, budget, workoutStatus)
  }));

  scored.sort((a, b) => b.score - a.score);
  const candidates = scored.slice(0, 30).map(({ score, ...rest }) => rest);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error("GEMINI_API_KEY is not configured. Set it in your environment variables.");
    error.status = 500;
    throw error;
  }

  const prompt = buildRecommendationPrompt({
    goal,
    dietType,
    mealType: mealTypeOrDefault,
    remaining,
    candidates
  });

  const response = await callGemini({ apiKey, prompt });
  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const error = new Error("Gemini returned an empty response.");
    error.status = 502;
    throw error;
  }

  let recommendation;
  try {
    recommendation = JSON.parse(text);
  } catch (_parseError) {
    const error = new Error("Gemini returned malformed JSON.");
    error.status = 502;
    throw error;
  }

  return {
    recommendation,
    candidates: candidates.slice(0, 5),
    remaining,
    mealType: mealTypeOrDefault,
    totalFoods: foods.length
  };
}
