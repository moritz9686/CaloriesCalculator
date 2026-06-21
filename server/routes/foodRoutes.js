import express from "express";
import auth from "../middleware/auth.js";
import CalorieDay from "../models/CalorieDay.js";
import FoodScan from "../models/FoodScan.js";
import { analyzeFoodImage } from "../services/foodAnalyzer.js";

const router = express.Router();

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function serializeScan(scan) {
  return {
    scanId: scan._id.toString(),
    date: scan.date,
    foods: scan.foods,
    totalCaloriesMin: scan.totalCaloriesMin,
    totalCaloriesMax: scan.totalCaloriesMax,
    protein: scan.protein,
    carbs: scan.carbs,
    fat: scan.fat,
    estimateSource: scan.estimateSource,
    isConsumed: scan.isConsumed,
    consumedAt: scan.consumedAt,
    createdAt: scan.createdAt
  };
}

router.use(auth);

// Step 1: analyze a food image. Nothing is added to the daily intake yet.
router.post("/analyze", async (request, response, next) => {
  try {
    const { image } = request.body;
    if (!image || typeof image !== "string") {
      const error = new Error("A food image is required.");
      error.status = 400;
      throw error;
    }

    const date = typeof request.body.date === "string" && request.body.date ? request.body.date : todayString();
    const analysis = await analyzeFoodImage(image);

    const scan = await FoodScan.create({
      userId: request.user.id,
      date,
      image,
      foods: analysis.foods,
      totalCaloriesMin: analysis.totalCaloriesMin,
      totalCaloriesMax: analysis.totalCaloriesMax,
      protein: analysis.protein,
      carbs: analysis.carbs,
      fat: analysis.fat,
      estimateSource: analysis.estimateSource,
      isConsumed: false
    });

    return response.status(201).json(serializeScan(scan));
  } catch (error) {
    return next(error);
  }
});

// Step 2: user confirmed "Yes, I ate this" — add the averaged calories to that day.
router.post("/consume", async (request, response, next) => {
  try {
    const { scanId } = request.body;
    if (!scanId) {
      const error = new Error("scanId is required.");
      error.status = 400;
      throw error;
    }

    const scan = await FoodScan.findOne({ _id: scanId, userId: request.user.id });
    if (!scan) {
      const error = new Error("Food scan not found.");
      error.status = 404;
      throw error;
    }

    if (scan.isConsumed) {
      const error = new Error("This scan has already been added to your daily intake.");
      error.status = 409;
      throw error;
    }

    const avgCalories = Math.round((scan.totalCaloriesMin + scan.totalCaloriesMax) / 2);
    const label =
      scan.foods.length > 0
        ? scan.foods.map((food) => food.name).join(", ").slice(0, 120)
        : "Scanned meal";

    const day = await CalorieDay.findOneAndUpdate(
      { userId: request.user.id, date: scan.date },
      {
        $setOnInsert: { userId: request.user.id, date: scan.date },
        $push: {
          consumedEntries: {
            label,
            calories: avgCalories,
            protein: scan.protein,
            carbs: scan.carbs,
            fat: scan.fat,
            source: "scan"
          }
        }
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    scan.isConsumed = true;
    scan.consumedAt = new Date();
    await scan.save();

    return response.json({
      scan: serializeScan(scan),
      addedCalories: avgCalories,
      date: scan.date,
      consumedEntries: day.consumedEntries
    });
  } catch (error) {
    return next(error);
  }
});

// History of analyses (both consumed and skipped) for the signed-in user.
router.get("/scans", async (request, response, next) => {
  try {
    const scans = await FoodScan.find({ userId: request.user.id })
      .sort({ createdAt: -1 })
      .limit(25)
      .lean();

    return response.json(
      scans.map((scan) => serializeScan({ ...scan, _id: scan._id }))
    );
  } catch (error) {
    return next(error);
  }
});

export default router;
