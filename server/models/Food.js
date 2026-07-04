import mongoose from "mongoose";

const foodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    image: { type: String, default: "" },
    servingSize: { type: String, default: "100 g" },
    calories: { type: Number, required: true, min: 0 },
    protein: { type: Number, default: 0, min: 0 },
    carbs: { type: Number, default: 0, min: 0 },
    fat: { type: Number, default: 0, min: 0 },
    fiber: { type: Number, default: 0, min: 0 },
    sugar: { type: Number, default: 0, min: 0 },
    water: { type: Number, default: 0, min: 0 },
    dietType: {
      type: String,
      enum: ["vegetarian", "vegan", "eggetarian", "non-vegetarian"],
      required: true
    },
    allergens: [{ type: String }],
    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "snack", "dinner", "any"],
      default: "any"
    },
    prepTime: { type: Number, default: 15, min: 0 },
    budget: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },
    quickFood: { type: Boolean, default: false },
    preWorkout: { type: Boolean, default: false },
    postWorkout: { type: Boolean, default: false }
  },
  { timestamps: true }
);

foodSchema.index({ dietType: 1 });
foodSchema.index({ mealType: 1 });
foodSchema.index({ budget: 1 });

const Food = mongoose.model("Food", foodSchema);

export default Food;
