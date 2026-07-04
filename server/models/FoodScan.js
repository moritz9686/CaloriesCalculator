import mongoose from "mongoose";

const detectedFoodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    portion: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { _id: false }
);

const foodScanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    date: {
      type: String,
      required: true
    },
    image: {
      type: String,
      default: ""
    },
    foods: {
      type: [detectedFoodSchema],
      default: []
    },
    totalCaloriesMin: {
      type: Number,
      default: 0,
      min: 0
    },
    totalCaloriesMax: {
      type: Number,
      default: 0,
      min: 0
    },
    protein: {
      type: Number,
      default: 0,
      min: 0
    },
    carbs: {
      type: Number,
      default: 0,
      min: 0
    },
    fat: {
      type: Number,
      default: 0,
      min: 0
    },
    fiber: {
      type: Number,
      default: 0,
      min: 0
    },
    sugar: {
      type: Number,
      default: 0,
      min: 0
    },
    waterMl: {
      type: Number,
      default: 0,
      min: 0
    },
    estimateSource: {
      type: String,
      enum: ["gemini", "fallback"],
      default: "fallback"
    },
    isConsumed: {
      type: Boolean,
      default: false
    },
    consumedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

foodScanSchema.index({ userId: 1, createdAt: -1 });

const FoodScan = mongoose.model("FoodScan", foodScanSchema);

export default FoodScan;
