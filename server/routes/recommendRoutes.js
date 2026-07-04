import express from "express";
import auth from "../middleware/auth.js";
import { recommendFoods } from "../services/foodRecommendation.js";

const router = express.Router();

router.use(auth);

router.post("/", async (request, response, next) => {
  try {
    const {
      consumedEntries,
      burnedEntries,
      manualConsumedTotal,
      manualBurnedTotal,
      manualWaterMl,
      dietType = "vegetarian",
      allergens = [],
      budget = "any",
      mealType,
      workoutStatus = "none"
    } = request.body;

    const result = await recommendFoods({
      consumedEntries,
      burnedEntries,
      manualConsumedTotal,
      manualBurnedTotal,
      manualWaterMl,
      dietType,
      allergens,
      budget,
      mealType,
      workoutStatus
    });

    return response.json(result);
  } catch (error) {
    return next(error);
  }
});

export default router;
