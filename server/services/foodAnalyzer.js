const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const analysisPrompt = `You are a nutrition estimation assistant. Look at the food image and identify each
distinct dish or food item you can see. Estimate the nutrition for the whole plate as served.

Respond ONLY with strict JSON matching this shape:
{
  "foods": [{ "name": "string", "portion": "string" }],
  "totalCaloriesMin": number,
  "totalCaloriesMax": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "fiber": number,
  "sugar": number,
  "waterMl": number
}

Rules:
- "foods" lists each detected item with a short human portion description (e.g. "2 rotis").
- Calories are kcal for the entire plate. Min/max should bracket a realistic range.
- protein, carbs, fat, fiber, sugar, waterMl are grams (water in ml) for the entire plate (single best estimate).
- If the image clearly contains no food, return an empty "foods" array and zeros.
- Numbers only, no units, no extra commentary.`;

function clampNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? Math.round(numeric) : fallback;
}

function parseDataUrl(image) {
  const match = /^data:(.+?);base64,(.*)$/s.exec(image || "");
  if (!match) {
    const error = new Error("Image must be a base64 data URL.");
    error.status = 400;
    throw error;
  }
  return { mimeType: match[1], base64: match[2] };
}

function normalizeAnalysis(raw) {
  const foods = Array.isArray(raw?.foods)
    ? raw.foods
        .map((item) => ({
          name: String(item?.name || "").trim(),
          portion: String(item?.portion || "").trim()
        }))
        .filter((item) => item.name)
    : [];

  let min = clampNumber(raw?.totalCaloriesMin);
  let max = clampNumber(raw?.totalCaloriesMax);
  if (max < min) {
    [min, max] = [max, min];
  }

  return {
    foods,
    totalCaloriesMin: min,
    totalCaloriesMax: max,
    protein: clampNumber(raw?.protein),
    carbs: clampNumber(raw?.carbs),
    fat: clampNumber(raw?.fat),
    fiber: clampNumber(raw?.fiber),
    sugar: clampNumber(raw?.sugar),
    waterMl: clampNumber(raw?.waterMl)
  };
}

// Deterministic fallback so the full flow works without a Gemini key configured.
function fallbackAnalysis() {
  return {
    foods: [{ name: "Estimated meal", portion: "1 serving" }],
    totalCaloriesMin: 450,
    totalCaloriesMax: 650,
    protein: 25,
    carbs: 55,
    fat: 22,
    fiber: 6,
    sugar: 12,
    waterMl: 200,
    estimateSource: "fallback"
  };
}

async function callGemini({ mimeType, base64, apiKey }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: analysisPrompt },
            { inline_data: { mime_type: mimeType, data: base64 } }
          ]
        }
      ],
      generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const error = new Error(`Gemini request failed (${response.status}). ${detail.slice(0, 200)}`);
    error.status = 502;
    throw error;
  }

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const error = new Error("Gemini returned an empty response.");
    error.status = 502;
    throw error;
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (_parseError) {
    const error = new Error("Gemini returned malformed JSON.");
    error.status = 502;
    throw error;
  }

  return { ...normalizeAnalysis(parsed), estimateSource: "gemini" };
}

export async function analyzeFoodImage(image) {
  const { mimeType, base64 } = parseDataUrl(image);
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return fallbackAnalysis();
  }

  return callGemini({ mimeType, base64, apiKey });
}

// ─── Dish-name-based estimation ──────────────────────────────────────────────

const dishPrompt = `You are a nutrition estimation assistant. Given a dish name, estimate its
nutritional content for a standard single serving.

Respond ONLY with strict JSON matching this shape:
{
  "totalCaloriesMin": number,
  "totalCaloriesMax": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "fiber": number,
  "sugar": number,
  "waterMl": number
}

Rules:
- Calories are kcal for one standard serving. Min/max should bracket a realistic range.
- protein, carbs, fat, fiber, sugar, waterMl are grams (water in ml) for one serving (single best estimate).
- Numbers only, no units, no extra commentary.
- If the dish name is unrecognizable or empty, return zeros.`;

function fallbackByNameAnalysis(dishName) {
  const generic = {
    totalCaloriesMin: 300,
    totalCaloriesMax: 500,
    protein: 15,
    carbs: 40,
    fat: 12,
    fiber: 5,
    sugar: 10,
    waterMl: 150
  };
  return { ...generic, estimateSource: "fallback" };
}

async function callGeminiForDish({ dishName, apiKey }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: `${dishPrompt}\n\nDish name: "${dishName}"` }]
        }
      ],
      generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const error = new Error(`Gemini request failed (${response.status}). ${detail.slice(0, 200)}`);
    error.status = 502;
    throw error;
  }

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const error = new Error("Gemini returned an empty response.");
    error.status = 502;
    throw error;
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (_parseError) {
    const error = new Error("Gemini returned malformed JSON.");
    error.status = 502;
    throw error;
  }

  return { ...normalizeAnalysis(parsed), estimateSource: "gemini" };
}

export async function analyzeFoodByName(dishName) {
  if (!dishName || typeof dishName !== "string" || !dishName.trim()) {
    const error = new Error("A dish name is required.");
    error.status = 400;
    throw error;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return fallbackByNameAnalysis(dishName);
  }

  return callGeminiForDish({ dishName: dishName.trim(), apiKey });
}
