import express from "express";
import auth from "../middleware/auth.js";
import CalorieDay from "../models/CalorieDay.js";

const router = express.Router();
const cardioMetValues = {
  walking: 3.8,
  running: 9.8,
  cycling: 7.5,
  swimming: 8.3,
  rowing: 7,
  hiit: 10.5
};

function roundCalories(value) {
  return Math.max(0, Math.round(value));
}

function estimateCardioCalories({ exerciseType, durationMinutes, bodyWeight, height }) {
  const met = cardioMetValues[exerciseType] || 5.5;
  const heightFactor = height > 0 ? Math.max(0.92, Math.min(height / 170, 1.08)) : 1;
  return roundCalories((met * 3.5 * bodyWeight) / 200 * durationMinutes * heightFactor);
}

function estimateStrengthCalories({ exerciseType, sets, reps, weightUsed, bodyWeight, height }) {
  const volume = sets * reps * weightUsed;
  const typeFactorMap = {
    squat: 1.16,
    deadlift: 1.22,
    bench: 1.05,
    overhead_press: 1.04,
    rows: 1.08,
    pullups: 1.1
  };
  const typeFactor = typeFactorMap[exerciseType] || 1;
  const bodyFactor = bodyWeight > 0 ? bodyWeight / 70 : 1;
  const heightFactor = height > 0 ? Math.max(0.94, Math.min(height / 170, 1.08)) : 1;
  const workCalories = volume * 0.015 * typeFactor;
  const effortCalories = (sets * 4 + reps * 0.35) * bodyFactor * heightFactor;
  return roundCalories(workCalories + effortCalories);
}

function estimateStrengthWorkoutCalories({
  exerciseType,
  sets,
  restSeconds,
  bodyWeight,
  height
}) {
  const totalVolume = sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
  const totalReps = sets.reduce((sum, set) => sum + set.reps, 0);
  const totalSets = sets.length;
  const totalSetDurationSeconds = sets.reduce((sum, set) => sum + set.durationSeconds, 0);
  const totalRestSeconds = restSeconds.reduce((sum, seconds) => sum + seconds, 0);
  const activeTimeMinutes = totalSetDurationSeconds / 60;
  const totalSessionMinutes = (totalSetDurationSeconds + totalRestSeconds) / 60;
  const typeFactorMap = {
    chest_press: 1,
    squat: 1.4,
    deadlift: 1.6,
    pullup: 1.3,
    shoulder_press: 1.1,
    bicep_curl: 0.8,
    bench: 1.05,
    overhead_press: 1.04,
    rows: 1.08
  };
  const typeFactor = typeFactorMap[exerciseType] || 1;
  const weightFactor = bodyWeight > 0 ? bodyWeight / 70 : 1;
  const heightFactor = height > 0 ? Math.max(0.94, Math.min(height / 170, 1.08)) : 1;
  const baselineBurn = activeTimeMinutes * 3.5 * weightFactor * heightFactor;
  const volumeAdjustment = (totalVolume * typeFactor) / Math.max(bodyWeight, 1) * 0.18;
  const workDensity =
    totalSessionMinutes > 0
      ? Math.max(0.7, Math.min(activeTimeMinutes / totalSessionMinutes, 1.15))
      : 0.7;
  const intensityAdjustment = totalReps * 0.12 + totalSets * 0.8 * workDensity;

  return roundCalories(baselineBurn + volumeAdjustment + intensityAdjustment);
}

function normalizeLegacyBurnedEntry(entry) {
  return {
    label: entry.label,
    entryMode: "manual",
    exerciseType: "",
    durationMinutes: 0,
    sets: [],
    restSeconds: [],
    calories: entry.calories,
    predictedCalories: 0
  };
}

function validateEntries(entries, label) {
  if (!Array.isArray(entries)) {
    const error = new Error(`${label} entries must be an array.`);
    error.status = 400;
    throw error;
  }

  return entries.map((entry) => {
    const name = entry?.label?.trim();
    const calories = Number(entry?.calories);

    if (!name) {
      const error = new Error(`${label} entry labels are required.`);
      error.status = 400;
      throw error;
    }

    if (!Number.isFinite(calories) || calories < 0) {
      const error = new Error(`${label} entry calories must be a valid non-negative number.`);
      error.status = 400;
      throw error;
    }

    const macroFor = (value) => {
      const numeric = Number(value ?? 0);
      return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
    };

    return {
      label: name,
      calories,
      protein: macroFor(entry?.protein),
      carbs: macroFor(entry?.carbs),
      fat: macroFor(entry?.fat),
      source: entry?.source === "scan" ? "scan" : "manual"
    };
  });
}

function validateNumber(value, fieldName) {
  const numericValue = Number(value ?? 0);
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    const error = new Error(`${fieldName} must be a valid non-negative number.`);
    error.status = 400;
    throw error;
  }
  return numericValue;
}

function validateBurnedEntries(entries, bodyWeight, height) {
  if (!Array.isArray(entries)) {
    const error = new Error("Burned entries must be an array.");
    error.status = 400;
    throw error;
  }

  return entries.map((entry) => {
    const label = entry?.label?.trim();
    if (!label) {
      const error = new Error("Burned entry labels are required.");
      error.status = 400;
      throw error;
    }

    const mode = entry?.entryMode || "manual";
    if (!["manual", "cardio", "strength"].includes(mode)) {
      const error = new Error("Burned entry mode is invalid.");
      error.status = 400;
      throw error;
    }

    if (mode === "manual") {
      return {
        label,
        entryMode: "manual",
        exerciseType: "",
        durationMinutes: 0,
        sets: [],
        restSeconds: [],
        calories: validateNumber(entry?.calories, "Manual burned calories"),
        predictedCalories: 0
      };
    }

    if (!bodyWeight) {
      const error = new Error("Body weight is required for predicted exercise calories.");
      error.status = 400;
      throw error;
    }

    const exerciseType = entry?.exerciseType?.trim();
    if (!exerciseType) {
      const error = new Error("Exercise type is required for predicted burned calories.");
      error.status = 400;
      throw error;
    }

    if (mode === "cardio") {
      const durationMinutes = validateNumber(entry?.durationMinutes, "Cardio duration");
      const predictedCalories = estimateCardioCalories({
        exerciseType,
        durationMinutes,
        bodyWeight,
        height
      });

      return {
        label,
        entryMode: "cardio",
        exerciseType,
        durationMinutes,
        sets: [],
        restSeconds: [],
        calories: predictedCalories,
        predictedCalories
      };
    }

    if (!Array.isArray(entry?.sets) || entry.sets.length === 0) {
      const error = new Error("Strength entries need at least one set.");
      error.status = 400;
      throw error;
    }

    const sets = entry.sets.map((set, index) => ({
      weight: validateNumber(set?.weight, `Set ${index + 1} weight`),
      reps: validateNumber(set?.reps, `Set ${index + 1} reps`),
      durationSeconds: validateNumber(set?.durationSeconds, `Set ${index + 1} duration`)
    }));

    if (!sets.some((set) => set.durationSeconds > 0)) {
      const error = new Error("At least one set duration must be greater than zero for strength prediction.");
      error.status = 400;
      throw error;
    }

    const restSeconds = Array.isArray(entry?.restSeconds)
      ? entry.restSeconds.map((seconds, index) =>
          validateNumber(seconds, `Rest interval ${index + 1}`)
        )
      : [];

    const normalizedRestSeconds =
      restSeconds.length > 0
        ? restSeconds.slice(0, Math.max(sets.length - 1, 0))
        : Array.from({ length: Math.max(sets.length - 1, 0) }, () => 75);

    while (normalizedRestSeconds.length < Math.max(sets.length - 1, 0)) {
      normalizedRestSeconds.push(75);
    }

    const predictedCalories = estimateStrengthWorkoutCalories({
      exerciseType,
      bodyWeight,
      height,
      sets,
      restSeconds: normalizedRestSeconds
    });

    return {
      label,
      entryMode: "strength",
      exerciseType,
      durationMinutes: 0,
      sets,
      restSeconds: normalizedRestSeconds,
      calories: predictedCalories,
      predictedCalories
    };
  });
}

function normalizeDay(day, date) {
  if (!day) {
    return {
      date,
      manualConsumedTotal: 0,
      manualBurnedTotal: 0,
      bodyWeight: 0,
      height: 0,
      consumedEntries: [],
      burnedEntries: []
    };
  }

  return {
    ...day,
    bodyWeight: day.bodyWeight ?? 0,
    height: day.height ?? 0,
    burnedEntries: (day.burnedEntries || []).map((entry) =>
      entry.entryMode
        ? {
            ...entry,
            sets: Array.isArray(entry.sets)
              ? entry.sets.map((set) => ({
                  weight: set.weight ?? 0,
                  reps: set.reps ?? 0,
                  durationSeconds: set.durationSeconds ?? 0
                }))
              : entry.sets && entry.reps && entry.weightUsed
                ? [{ weight: entry.weightUsed, reps: entry.reps, durationSeconds: 0 }]
                : [],
            restSeconds: Array.isArray(entry.restSeconds) ? entry.restSeconds : []
          }
        : normalizeLegacyBurnedEntry(entry)
    )
  };
}

router.use(auth);

router.get("/:date", async (request, response, next) => {
  try {
    const day = await CalorieDay.findOne({
      userId: request.user.id,
      date: request.params.date
    }).lean();

    return response.json(normalizeDay(day, request.params.date));
  } catch (error) {
    return next(error);
  }
});

router.put("/:date", async (request, response, next) => {
  try {
    const manualConsumedTotal = validateNumber(request.body.manualConsumedTotal, "Manual consumed total");
    const manualBurnedTotal = validateNumber(request.body.manualBurnedTotal, "Manual burned total");
    const bodyWeight = validateNumber(request.body.bodyWeight, "Body weight");
    const height = validateNumber(request.body.height, "Height");

    const consumedEntries = validateEntries(request.body.consumedEntries ?? [], "Consumed");
    const burnedEntries = validateBurnedEntries(request.body.burnedEntries ?? [], bodyWeight, height);

    const day = await CalorieDay.findOneAndUpdate(
      {
        userId: request.user.id,
        date: request.params.date
      },
      {
        userId: request.user.id,
        date: request.params.date,
        manualConsumedTotal,
        manualBurnedTotal,
        bodyWeight,
        height,
        consumedEntries,
        burnedEntries
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    return response.json({ day: normalizeDay(day.toObject(), request.params.date) });
  } catch (error) {
    return next(error);
  }
});

export default router;
