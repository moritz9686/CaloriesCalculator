import mongoose from "mongoose";

const entrySchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true
    },
    calories: {
      type: Number,
      required: true,
      min: 0
    },
    protein: {
      type: Number,
      min: 0,
      default: 0
    },
    carbs: {
      type: Number,
      min: 0,
      default: 0
    },
    fat: {
      type: Number,
      min: 0,
      default: 0
    },
    source: {
      type: String,
      enum: ["manual", "scan"],
      default: "manual"
    }
  },
  { _id: false }
);

const burnedEntrySchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true
    },
    entryMode: {
      type: String,
      enum: ["manual", "cardio", "strength"],
      default: "manual"
    },
    exerciseType: {
      type: String,
      trim: true,
      default: ""
    },
    durationMinutes: {
      type: Number,
      min: 0,
      default: 0
    },
    sets: {
      type: [
        new mongoose.Schema(
          {
            weight: {
              type: Number,
              min: 0,
              default: 0
            },
            reps: {
              type: Number,
              min: 0,
              default: 0
            },
            durationSeconds: {
              type: Number,
              min: 0,
              default: 0
            }
          },
          { _id: false }
        )
      ],
      default: []
    },
    restSeconds: {
      type: [Number],
      default: []
    },
    calories: {
      type: Number,
      required: true,
      min: 0
    },
    predictedCalories: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  { _id: false }
);

const calorieDaySchema = new mongoose.Schema(
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
    manualConsumedTotal: {
      type: Number,
      default: 0,
      min: 0
    },
    manualBurnedTotal: {
      type: Number,
      default: 0,
      min: 0
    },
    bodyWeight: {
      type: Number,
      default: 0,
      min: 0
    },
    height: {
      type: Number,
      default: 0,
      min: 0
    },
    consumedEntries: {
      type: [entrySchema],
      default: []
    },
    burnedEntries: {
      type: [burnedEntrySchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

calorieDaySchema.index({ userId: 1, date: 1 }, { unique: true });

const CalorieDay = mongoose.model("CalorieDay", calorieDaySchema);

export default CalorieDay;
