import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { analyzeDay } from "./coachShared.js";
import SmartNotifications from "./SmartNotifications.jsx";
import Suggestions from "./Suggestions.jsx";
import NutritionOverview from "./NutritionOverview.jsx";
import AICoach from "./AICoach.jsx";
import FoodRecommendation from "./FoodRecommendation.jsx";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const emptyEntry = { label: "", calories: "", protein: "", carbs: "", fat: "", fiber: "", sugar: "", waterMl: "" };
const emptyBurnedEntry = {
  label: "",
  entryMode: "manual",
  exerciseType: "walking",
  calories: "",
  durationMinutes: "",
  sets: [{ weight: "", reps: "", durationSeconds: "" }],
  restSeconds: [],
  predictedCalories: 0
};
const cardioMetValues = {
  walking: 3.8,
  running: 9.8,
  cycling: 7.5,
  swimming: 8.3,
  rowing: 7,
  hiit: 10.5
};
const cardioExerciseOptions = ["walking", "running", "cycling", "swimming", "rowing", "hiit"];
const strengthExerciseOptions = [
  "chest_press",
  "squat",
  "deadlift",
  "pullup",
  "shoulder_press",
  "bicep_curl"
];

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function createEmptyDay(date = todayString()) {
  return {
    date,
    manualConsumedTotal: "",
    manualBurnedTotal: "",
    manualWaterMl: "",
    bodyWeight: "",
    height: "",
    consumedEntries: [{ ...emptyEntry }],
    burnedEntries: [{ ...emptyBurnedEntry }]
  };
}

function sumEntries(entries) {
  return entries.reduce((total, entry) => {
    const value = Number(entry.calories);
    return total + (Number.isFinite(value) ? value : 0);
  }, 0);
}

function sumWaterMl(entries) {
  return entries.reduce((total, entry) => {
    const value = Number(entry.waterMl);
    return total + (Number.isFinite(value) ? value : 0);
  }, 0);
}

function sanitizeEntries(entries) {
  return entries
    .filter((entry) => entry.label.trim() || entry.calories !== "")
    .map((entry) => ({
      label: entry.label.trim() || "Untitled",
      calories: Number(entry.calories || 0),
      protein: Number(entry.protein || 0),
      carbs: Number(entry.carbs || 0),
      fat: Number(entry.fat || 0),
      fiber: Number(entry.fiber || 0),
      sugar: Number(entry.sugar || 0),
      waterMl: Number(entry.waterMl || 0),
      source: entry.source === "scan" ? "scan" : "manual"
    }));
}

function normalizeBurnedEntry(entry) {
  return {
    ...emptyBurnedEntry,
    ...entry,
    entryMode: entry?.entryMode || "manual",
    exerciseType: entry?.exerciseType || "walking",
    calories: entry?.calories ?? "",
    durationMinutes: entry?.durationMinutes ?? "",
    sets:
      Array.isArray(entry?.sets) && entry.sets.length
        ? entry.sets.map((set) => ({
            weight: set.weight ?? "",
            reps: set.reps ?? "",
            durationSeconds: set.durationSeconds ?? ""
          }))
        : [{ weight: "", reps: "", durationSeconds: "" }],
    restSeconds: Array.isArray(entry?.restSeconds) ? entry.restSeconds : [],
    predictedCalories: entry?.predictedCalories ?? 0
  };
}

function estimateCardioCalories(exerciseType, durationMinutes, bodyWeight, height) {
  const met = cardioMetValues[exerciseType] || 5.5;
  const heightFactor = height > 0 ? Math.max(0.92, Math.min(height / 170, 1.08)) : 1;
  return Math.max(0, Math.round((met * 3.5 * bodyWeight) / 200 * durationMinutes * heightFactor));
}

function estimateStrengthCalories(exerciseType, sets, restSeconds, bodyWeight, height) {
  const totalVolume = sets.reduce(
    (sum, set) => sum + Number(set.weight || 0) * Number(set.reps || 0),
    0
  );
  const totalReps = sets.reduce((sum, set) => sum + Number(set.reps || 0), 0);
  const totalSets = sets.length;
  const totalSetDurationSeconds = sets.reduce(
    (sum, set) => sum + Number(set.durationSeconds || 0),
    0
  );
  const totalRestSeconds = restSeconds.reduce((sum, seconds) => sum + Number(seconds || 0), 0);
  const activeTimeMinutes = totalSetDurationSeconds / 60;
  const totalSessionMinutes = (totalSetDurationSeconds + totalRestSeconds) / 60;
  const typeFactorMap = {
    chest_press: 1,
    squat: 1.4,
    deadlift: 1.6,
    pullup: 1.3,
    shoulder_press: 1.1,
    bicep_curl: 0.8
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
  return Math.max(0, Math.round(baselineBurn + volumeAdjustment + intensityAdjustment));
}

function getPredictedCalories(entry, bodyWeight, height) {
  const numericBodyWeight = Number(bodyWeight || 0);
  const numericHeight = Number(height || 0);
  if (!numericBodyWeight) {
    return 0;
  }

  if (entry.entryMode === "cardio") {
    return estimateCardioCalories(
      entry.exerciseType,
      Number(entry.durationMinutes || 0),
      numericBodyWeight,
      numericHeight
    );
  }

  if (entry.entryMode === "strength") {
    return estimateStrengthCalories(
      entry.exerciseType,
      entry.sets || [],
      entry.restSeconds || [],
      numericBodyWeight,
      numericHeight
    );
  }

  return Number(entry.calories || 0);
}

function totalFor(manualValue, entries) {
  return Number(manualValue || 0) + sumEntries(entries);
}

function totalBurnedFor(manualValue, entries, bodyWeight, height) {
  return (
    Number(manualValue || 0) +
    entries.reduce((total, entry) => total + getPredictedCalories(entry, bodyWeight, height), 0)
  );
}

function Field({ label, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}

function EntryList({ title, entries, onChange, onAdd, onRemove, onAskAI, estimatingIndex }) {
  return (
    <section className="panel entry-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">{title}</p>
          <h3>{title === "Food Entries" ? "Track what you ate" : "Track what you burned"}</h3>
        </div>
        <button type="button" className="ghost-button" onClick={onAdd}>
          Add Row
        </button>
      </div>
      <div className="entry-list">
        {entries.length > 0 && (
          <div className="entry-row entry-row--header">
            <span>Label</span>
            <span>Calories (kcal)</span>
            <span>Protein (g)</span>
            <span>Fiber (g)</span>
            <span />
          </div>
        )}
        {entries.map((entry, index) => (
          <div className="entry-row" key={`${title}-${index}`}>
            <input
              type="text"
              placeholder="Label"
              value={entry.label}
              onChange={(event) => onChange(index, "label", event.target.value)}
            />
            <input
              type="number"
              min="0"
              placeholder="Cal (kcal)"
              value={entry.calories}
              onChange={(event) => onChange(index, "calories", event.target.value)}
            />
            <input
              type="number"
              min="0"
              placeholder="Protein (g)"
              value={entry.protein}
              onChange={(event) => onChange(index, "protein", event.target.value)}
            />
            <input
              type="number"
              min="0"
              placeholder="Fiber (g)"
              value={entry.fiber}
              onChange={(event) => onChange(index, "fiber", event.target.value)}
            />
            <div className="entry-ai-wrap">
              {onAskAI ? (
                <button
                  type="button"
                  className="ai-estimate-btn"
                  onClick={() => onAskAI(index)}
                  disabled={estimatingIndex === index || !entry.label.trim()}
                  title="Estimate calories with AI"
                >
                  {estimatingIndex === index ? (
                    <span className="mini-spinner" />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2l2.4 7.2L21 12l-6.6 2.8L12 22l-2.4-7.2L3 12l6.6-2.8z" />
                    </svg>
                  )}
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ExerciseEntrySummary({ entry, onExpand, onRemove, disabled }) {
  const modeLabel =
    entry.entryMode === "cardio"
      ? entry.exerciseType?.replace("_", " ")
      : entry.entryMode === "strength"
        ? entry.exerciseType?.replace("_", " ")
        : "Manual";
  const calories = entry.entryMode === "manual"
    ? entry.calories
    : entry.predictedCalories || entry.calories;

  return (
    <div className="exercise-summary">
      <div className="exercise-summary__info">
        <span className="exercise-summary__label">{entry.label || "Exercise"}</span>
        <span className="exercise-summary__type">{modeLabel}</span>
      </div>
      <div className="exercise-summary__cal">
        <strong>{calories}</strong>
        <small>kcal</small>
      </div>
      <div className="exercise-summary__actions">
        <button
          type="button"
          className="ghost-button exercise-summary__edit-btn"
          onClick={onExpand}
        >
          Edit
        </button>
        <button
          type="button"
          className="remove-button exercise-summary__remove-btn"
          onClick={onRemove}
          disabled={disabled}
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function ExerciseEntryList({ entries, bodyWeight, height, onChange, onAdd, onRemove, expandedIndices, onExpand }) {
  return (
    <section className="panel entry-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Exercise Entries</p>
          <h3>Track what you burned</h3>
        </div>
        <button type="button" className="ghost-button" onClick={onAdd}>
          Add Row
        </button>
      </div>
      <div className="entry-list">
        {entries.map((entry, index) => {
          const predictedCalories = getPredictedCalories(entry, bodyWeight, height);
          const isExpanded = expandedIndices.includes(index);
          const isManual = entry.entryMode === "manual";
          const isCardio = entry.entryMode === "cardio";
          const typeOptions = isCardio ? cardioExerciseOptions : strengthExerciseOptions;

          if (!isExpanded) {
            return (
              <ExerciseEntrySummary
                key={`exercise-${index}`}
                entry={{ ...entry, predictedCalories }}
                onExpand={() => onExpand(index)}
                onRemove={() => onRemove(index)}
                disabled={entries.length === 1}
              />
            );
          }

          return (
            <div className="exercise-card" key={`exercise-${index}`}>
              <div className="exercise-topline">
                <input
                  type="text"
                  placeholder="Exercise label"
                  value={entry.label}
                  onChange={(event) => onChange(index, "label", event.target.value)}
                />
                <select
                  value={entry.entryMode}
                  onChange={(event) => onChange(index, "entryMode", event.target.value)}
                >
                  <option value="manual">Manual</option>
                  <option value="cardio">Cardio</option>
                  <option value="strength">Strength</option>
                </select>
                <button
                  type="button"
                  className="remove-button"
                  onClick={() => onRemove(index)}
                  disabled={entries.length === 1}
                >
                  Remove
                </button>
              </div>

              {isManual ? (
                <div className="exercise-grid">
                  <input
                    type="number"
                    min="0"
                    placeholder="Burned calories"
                    value={entry.calories}
                    onChange={(event) => onChange(index, "calories", event.target.value)}
                  />
                </div>
              ) : (
                <>
                  <div className="exercise-grid">
                    <select
                      value={entry.exerciseType}
                      onChange={(event) => onChange(index, "exerciseType", event.target.value)}
                    >
                      {typeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option.replace("_", " ")}
                        </option>
                      ))}
                    </select>

                    {isCardio ? (
                      <input
                        type="number"
                        min="0"
                        placeholder="Duration (min)"
                        value={entry.durationMinutes}
                        onChange={(event) => onChange(index, "durationMinutes", event.target.value)}
                      />
                    ) : null}
                  </div>
                  {!isCardio ? (
                    <div className="strength-builder">
                      <p className="helper-text">
                        Default rest between sets is <strong>75 seconds</strong> if you leave a rest
                        field empty.
                      </p>
                      {(entry.sets || []).map((set, setIndex) => (
                        <div className="strength-row" key={`${index}-set-${setIndex}`}>
                          <span className="set-badge">Set {setIndex + 1}</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="Weight"
                            value={set.weight}
                            onChange={(event) =>
                              onChange(index, "setWeight", event.target.value, setIndex)
                            }
                          />
                          <input
                            type="number"
                            min="0"
                            placeholder="Reps"
                            value={set.reps}
                            onChange={(event) =>
                              onChange(index, "setReps", event.target.value, setIndex)
                            }
                          />
                          <input
                            type="number"
                            min="0"
                            placeholder="Duration (sec)"
                            value={set.durationSeconds}
                            onChange={(event) =>
                              onChange(index, "setDurationSeconds", event.target.value, setIndex)
                            }
                          />
                          <button
                            type="button"
                            className="ghost-button"
                            onClick={() => onChange(index, "removeSet", "", setIndex)}
                            disabled={(entry.sets || []).length === 1}
                          >
                            Remove Set
                          </button>
                        </div>
                      ))}
                      {(entry.sets || []).slice(0, -1).map((_, restIndex) => (
                        <div className="strength-row rest-row" key={`${index}-rest-${restIndex}`}>
                          <span className="set-badge">Rest {restIndex + 1}</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="Rest seconds (default 75)"
                            value={entry.restSeconds?.[restIndex] ?? ""}
                            onChange={(event) =>
                              onChange(index, "restSeconds", event.target.value, restIndex)
                            }
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => onChange(index, "addSet", "")}
                      >
                        Add Set
                      </button>
                    </div>
                  ) : null}
                  <p className="prediction-chip">
                    Predicted burn: <strong>{predictedCalories}</strong> calories
                  </p>
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function sanitizeBurnedEntries(entries) {
  return entries
    .filter(
      (entry) =>
        entry.label.trim() ||
        entry.calories !== "" ||
        entry.durationMinutes !== "" ||
        (entry.sets || []).some(
          (set) => set.weight !== "" || set.reps !== "" || set.durationSeconds !== ""
        )
    )
    .map((entry) => ({
      label: entry.label.trim() || "Untitled exercise",
      entryMode: entry.entryMode,
      exerciseType: entry.exerciseType,
      calories: Number(entry.calories || 0),
      durationMinutes: Number(entry.durationMinutes || 0),
      sets: (entry.sets || []).map((set) => ({
        weight: Number(set.weight || 0),
        reps: Number(set.reps || 0),
        durationSeconds: Number(set.durationSeconds || 0)
      })),
      restSeconds: (entry.restSeconds || []).map((seconds) => Number(seconds || 0)),
      predictedCalories: Number(entry.predictedCalories || 0)
    }));
}

function removeStrengthSet(entry, setIndexToRemove) {
  const currentSets = entry.sets || [];
  const currentRests = entry.restSeconds || [];

  if (currentSets.length <= 1) {
    return {
      ...entry,
      sets: [{ weight: "", reps: "", durationSeconds: "" }],
      restSeconds: []
    };
  }

  const nextSets = currentSets.filter((_, setIndex) => setIndex !== setIndexToRemove);

  let nextRests = [];

  if (setIndexToRemove === 0) {
    nextRests = currentRests.slice(1);
  } else if (setIndexToRemove === currentSets.length - 1) {
    nextRests = currentRests.slice(0, -1);
  } else {
    const before = currentRests.slice(0, setIndexToRemove - 1);
    const mergedRest =
      Number(currentRests[setIndexToRemove - 1] || 0) +
      Number(currentRests[setIndexToRemove] || 0);
    const after = currentRests.slice(setIndexToRemove + 1);
    nextRests = [...before, String(mergedRest), ...after];
  }

  return {
    ...entry,
    sets: nextSets,
    restSeconds: nextRests.slice(0, Math.max(nextSets.length - 1, 0))
  };
}

function App() {
  const [mode, setMode] = useState("login");
  const [authForm, setAuthForm] = useState({ email: "", password: "", name: "" });
  const [token, setToken] = useState(() => localStorage.getItem("calories-token") || "");
  const [userName, setUserName] = useState(() => localStorage.getItem("calories-user-name") || "");
  const [day, setDay] = useState(createEmptyDay());
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scanImage, setScanImage] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [consuming, setConsuming] = useState(false);
  const [scanError, setScanError] = useState("");
  const [scanMessage, setScanMessage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [estimatingEntry, setEstimatingEntry] = useState(null);
  const [savedConsumed, setSavedConsumed] = useState(0);
  const [savedBurned, setSavedBurned] = useState(0);
  const [savedWater, setSavedWater] = useState(0);
  const [expandedBurnEntries, setExpandedBurnEntries] = useState([]);
  const [customWaterMl, setCustomWaterMl] = useState("");
  const [userDiet, setUserDiet] = useState(() => localStorage.getItem("calories-diet") || "vegetarian");
  const [page, setPage] = useState(() => {
    const hash = window.location.hash.slice(1);
    if (hash === "dashboard") return "dashboard";
    if (hash === "coach") return "coach";
    if (hash === "recommend") return "recommend";
    return "nutrition";
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    function onHashChange() {
      const hash = window.location.hash.slice(1);
      if (hash === "dashboard") setPage("dashboard");
      else if (hash === "coach") setPage("coach");
      else if (hash === "recommend") setPage("recommend");
      else setPage("nutrition");
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const analysis = useMemo(
    () => analyzeDay(day.consumedEntries, day.burnedEntries, day.manualWaterMl, savedConsumed, savedBurned),
    [day.consumedEntries, day.burnedEntries, day.manualWaterMl, savedConsumed, savedBurned]
  );

  function goToNutrition() {
    window.location.hash = "";
  }

  function goToDashboard() {
    window.location.hash = "dashboard";
  }

  function goToCoach() {
    window.location.hash = "coach";
  }

  function goToRecommend() {
    window.location.hash = "recommend";
  }

  const netCalories = savedConsumed - savedBurned;

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    async function loadDay() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_BASE_URL}/days/${day.date}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.message || "Could not load your day.");
        }

        if (!cancelled) {
          setDay({
            date: payload.date,
            manualConsumedTotal: String(payload.manualConsumedTotal ?? ""),
            manualBurnedTotal: String(payload.manualBurnedTotal ?? ""),
            manualWaterMl: String(payload.manualWaterMl ?? ""),
            bodyWeight: String(payload.bodyWeight ?? ""),
            height: String(payload.height ?? ""),
            consumedEntries: payload.consumedEntries.length ? payload.consumedEntries : [{ ...emptyEntry }],
            burnedEntries: payload.burnedEntries.length
              ? payload.burnedEntries.map(normalizeBurnedEntry)
              : [{ ...emptyBurnedEntry }]
          });
          setSavedConsumed(
            totalFor(payload.manualConsumedTotal, payload.consumedEntries)
          );
          setSavedBurned(
            totalBurnedFor(payload.manualBurnedTotal, payload.burnedEntries, payload.bodyWeight, payload.height)
          );
          setSavedWater(
            Number(payload.manualWaterMl || 0) + sumWaterMl(payload.consumedEntries)
          );
          setExpandedBurnEntries([]);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDay();

    return () => {
      cancelled = true;
    };
  }, [day.date, token]);

  function updateEntry(type, index, field, value, childIndex) {
    setDay((currentDay) => {
      const key = type === "consumed" ? "consumedEntries" : "burnedEntries";
      const nextEntries = currentDay[key].map((entry, entryIndex) => {
        if (entryIndex !== index) {
          return entry;
        }

        if (type === "burned" && field === "entryMode") {
          return normalizeBurnedEntry({
            ...entry,
            entryMode: value,
            exerciseType: value === "strength" ? "chest_press" : "walking",
            calories: value === "manual" ? entry.calories : "",
            durationMinutes: "",
            sets: [{ weight: "", reps: "", durationSeconds: "" }],
            restSeconds: [],
            predictedCalories: 0
          });
        }

        if (type === "burned" && field === "addSet") {
          return {
            ...entry,
            sets: [...(entry.sets || []), { weight: "", reps: "", durationSeconds: "" }],
            restSeconds: [...(entry.restSeconds || []), ""]
          };
        }

        if (type === "burned" && field === "removeSet") {
          return removeStrengthSet(entry, childIndex);
        }

        if (type === "burned" && field === "setWeight") {
          return {
            ...entry,
            sets: (entry.sets || []).map((set, setIndex) =>
              setIndex === childIndex ? { ...set, weight: value } : set
            )
          };
        }

        if (type === "burned" && field === "setReps") {
          return {
            ...entry,
            sets: (entry.sets || []).map((set, setIndex) =>
              setIndex === childIndex ? { ...set, reps: value } : set
            )
          };
        }

        if (type === "burned" && field === "setDurationSeconds") {
          return {
            ...entry,
            sets: (entry.sets || []).map((set, setIndex) =>
              setIndex === childIndex ? { ...set, durationSeconds: value } : set
            )
          };
        }

        if (type === "burned" && field === "restSeconds") {
          const nextRests = [...(entry.restSeconds || [])];
          nextRests[childIndex] = value;
          return {
            ...entry,
            restSeconds: nextRests
          };
        }

        return { ...entry, [field]: value };
      });

      return { ...currentDay, [key]: nextEntries };
    });
  }

  function addEntry(type) {
    if (type === "burned") {
      setExpandedBurnEntries((prev) => [0, ...prev.map((i) => i + 1)]);
      setDay((currentDay) => {
        return {
          ...currentDay,
          burnedEntries: [{ ...emptyBurnedEntry }, ...currentDay.burnedEntries]
        };
      });
      return;
    }
    setDay((currentDay) => {
      return {
        ...currentDay,
        consumedEntries: [...currentDay.consumedEntries, { ...emptyEntry }]
      };
    });
  }

  function removeEntry(type, index) {
    if (type === "burned") {
      setExpandedBurnEntries((prev) =>
        prev
          .filter((i) => i !== index)
          .map((i) => (i > index ? i - 1 : i))
      );
    }
    setDay((currentDay) => {
      const key = type === "consumed" ? "consumedEntries" : "burnedEntries";
      const nextEntries = currentDay[key].filter((_, entryIndex) => entryIndex !== index);
      return {
        ...currentDay,
        [key]:
          nextEntries.length ? nextEntries : [type === "consumed" ? { ...emptyEntry } : { ...emptyBurnedEntry }]
      };
    });
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Could not read the image file."));
      reader.readAsDataURL(file);
    });
  }

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    const file = event.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setScanError("Please drop a valid image file.");
      return;
    }

    setScanError("");
    setScanMessage("");
    setScanResult(null);

    readFileAsDataUrl(file).then(setScanImage).catch((err) => setScanError(err.message));
  }, []);

  function handleDropZoneClick() {
    fileInputRef.current?.click();
  }

  async function handleImageSelect(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setScanError("");
    setScanMessage("");
    setScanResult(null);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setScanImage(dataUrl);
    } catch (readError) {
      setScanError(readError.message);
    }
  }

  async function handleAnalyzeFood() {
    if (!scanImage) {
      setScanError("Choose a food photo first.");
      return;
    }

    setScanLoading(true);
    setScanError("");
    setScanMessage("");
    setScanResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/food/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ image: scanImage, date: day.date })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || "Could not analyze the image.");
      }

      setScanResult(payload);
      if (payload.estimateSource === "fallback") {
        setScanMessage("Showing a sample estimate (no AI key configured).");
      }
    } catch (analyzeError) {
      setScanError(analyzeError.message);
    } finally {
      setScanLoading(false);
    }
  }

  async function handleAskAI(index) {
    const label = day.consumedEntries[index]?.label?.trim();
    if (!label) {
      return;
    }

    setEstimatingEntry(index);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/food/estimate-by-name`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ dishName: label })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || "Could not estimate calories.");
      }

      const avgCalories = Math.round((payload.totalCaloriesMin + payload.totalCaloriesMax) / 2);

      setDay((currentDay) => {
        const nextEntries = currentDay.consumedEntries.map((entry, entryIndex) => {
          if (entryIndex !== index) {
            return entry;
          }
          return {
            ...entry,
            calories: avgCalories,
            protein: payload.protein,
            carbs: payload.carbs,
            fat: payload.fat,
            fiber: payload.fiber,
            sugar: payload.sugar,
            waterMl: payload.waterMl
          };
        });
        return { ...currentDay, consumedEntries: nextEntries };
      });

      if (payload.estimateSource === "fallback") {
        setMessage("Sample estimate shown (no AI key configured).");
      } else {
        setMessage(`Estimated ~${avgCalories} kcal for "${label}".`);
      }
    } catch (estimateError) {
      setError(estimateError.message);
    } finally {
      setEstimatingEntry(null);
    }
  }

  async function handleConsumeScan() {
    if (!scanResult) {
      return;
    }

    setConsuming(true);
    setScanError("");
    setScanMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/food/consume`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ scanId: scanResult.scanId })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || "Could not add this meal.");
      }

      const newEntry = {
        label:
          scanResult.foods.length > 0
            ? scanResult.foods.map((food) => food.name).join(", ")
            : "Scanned meal",
        calories: payload.addedCalories,
        protein: scanResult.protein,
        carbs: scanResult.carbs,
        fat: scanResult.fat,
        fiber: scanResult.fiber,
        sugar: scanResult.sugar,
        waterMl: scanResult.waterMl,
        source: "scan"
      };

      setDay((currentDay) => ({
        ...currentDay,
        consumedEntries: [
          ...currentDay.consumedEntries.filter(
            (entry) => entry.label.trim() || entry.calories !== ""
          ),
          newEntry
        ]
      }));

      setScanResult(null);
      setScanImage("");
      setScanMessage(`Added ${payload.addedCalories} kcal to ${payload.date}.`);
    } catch (consumeError) {
      setScanError(consumeError.message);
    } finally {
      setConsuming(false);
    }
  }

  function handleRejectScan() {
    setScanResult(null);
    setScanImage("");
    setScanMessage("No problem — nothing was added to your intake.");
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(authForm)
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || "Authentication failed.");
      }

      localStorage.setItem("calories-token", payload.token);
      localStorage.setItem("calories-user-name", payload.user.name);
      setToken(payload.token);
      setUserName(payload.user.name);
      window.location.hash = "";
      setMessage(mode === "signup" ? "Account created." : "Welcome back.");
    } catch (authError) {
      setError(authError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveDay() {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/days/${day.date}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          manualConsumedTotal: Number(day.manualConsumedTotal || 0),
          manualBurnedTotal: Number(day.manualBurnedTotal || 0),
          manualWaterMl: Number(day.manualWaterMl || 0),
          bodyWeight: Number(day.bodyWeight || 0),
          height: Number(day.height || 0),
          consumedEntries: sanitizeEntries(day.consumedEntries),
          burnedEntries: sanitizeBurnedEntries(day.burnedEntries)
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || "Could not save calories.");
      }

      setMessage("Calories saved successfully.");
      setDay({
        date: payload.day.date,
        manualConsumedTotal: String(payload.day.manualConsumedTotal ?? ""),
        manualBurnedTotal: String(payload.day.manualBurnedTotal ?? ""),
        manualWaterMl: String(payload.day.manualWaterMl ?? ""),
        bodyWeight: String(payload.day.bodyWeight ?? ""),
        height: String(payload.day.height ?? ""),
        consumedEntries: payload.day.consumedEntries.length ? payload.day.consumedEntries : [{ ...emptyEntry }],
        burnedEntries: payload.day.burnedEntries.length
          ? payload.day.burnedEntries.map(normalizeBurnedEntry)
          : [{ ...emptyBurnedEntry }]
      });
      setSavedConsumed(
        totalFor(payload.day.manualConsumedTotal, payload.day.consumedEntries)
      );
      setSavedBurned(
        totalBurnedFor(payload.day.manualBurnedTotal, payload.day.burnedEntries, payload.day.bodyWeight, payload.day.height)
      );
      setSavedWater(
        Number(payload.day.manualWaterMl || 0) + sumWaterMl(payload.day.consumedEntries)
      );
      setExpandedBurnEntries([]);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    localStorage.removeItem("calories-token");
    localStorage.removeItem("calories-user-name");
    setToken("");
    setUserName("");
    setDay(createEmptyDay());
    setMessage("");
    setError("");
  }

  if (!token) {
    return (
      <main className="shell auth-shell">
        <section className="hero-card">
          <p className="eyebrow">Calories Tracker</p>
          <h1>Track what you consume and burn in one secure place.</h1>
          <p className="hero-copy">
            Start with a simple web dashboard today. Your data stays tied to your account so we can
            grow this into mobile later without rebuilding the backend.
          </p>
        </section>

        <section className="panel auth-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">{mode === "login" ? "Welcome back" : "Create account"}</p>
              <h2>{mode === "login" ? "Log in" : "Sign up"}</h2>
            </div>
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError("");
                setMessage("");
              }}
            >
              {mode === "login" ? "Need an account?" : "Have an account?"}
            </button>
          </div>

          <form className="form-stack" onSubmit={handleAuthSubmit}>
            {mode === "signup" ? (
              <Field
                label="Name"
                type="text"
                value={authForm.name}
                onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })}
                required
              />
            ) : null}
            <Field
              label="Email"
              type="email"
              value={authForm.email}
              onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
              required
            />
            <Field
              label="Password"
              type="password"
              value={authForm.password}
              onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
              required
              minLength="6"
            />

            {error ? <p className="status error">{error}</p> : null}
            {message ? <p className="status success">{message}</p> : null}

            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  if (page === "dashboard") {
    return (
      <main className="shell dashboard-shell">
        <nav className="app-nav">
          <span className="app-nav__title">CaloriesTracker</span>
          <div className="app-nav__links">
            <button
              type="button"
              className={`app-nav__link ${page === "nutrition" ? "app-nav__link--active" : ""}`}
              onClick={goToNutrition}
            >
              Nutrition
            </button>
            <button
              type="button"
              className={`app-nav__link ${page === "dashboard" ? "app-nav__link--active" : ""}`}
              onClick={goToDashboard}
            >
              Daily Log
            </button>
            <button
              type="button"
              className={`app-nav__link ${page === "coach" ? "app-nav__link--active" : ""}`}
              onClick={goToCoach}
            >
              AI Coach
            </button>
            <button
              type="button"
              className={`app-nav__link ${page === "recommend" ? "app-nav__link--active" : ""}`}
              onClick={goToRecommend}
            >
              Recommend
            </button>
          </div>
          <button type="button" className="ghost-button app-nav__logout" onClick={logout}>
            Log out
          </button>
        </nav>

        <section className="hero-card wide">
          <div className="hero-topline">
            <div>
              <p className="eyebrow">Daily Log</p>
              <h1>Daily Log</h1>
            </div>
          </div>
          <p className="hero-copy">
            Track your food, workouts, and daily calorie balance. This version focuses on the
            consumed and burned flow only.
          </p>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Selected day</p>
              <h2>Your entries</h2>
            </div>
            <Field
              label="Date"
              type="date"
              value={day.date}
              onChange={(event) =>
                setDay((currentDay) => ({
                  ...currentDay,
                  date: event.target.value
                }))
              }
            />
          </div>

          <div className="totals-grid">
            <div className="stat-card">
              <span>Burned</span>
              <strong>{savedBurned}</strong>
            </div>
          </div>
        </section>

        <section className="manual-grid">
          <section className="panel">
            <p className="eyebrow">Quick totals</p>
            <h3>Manual consumed calories</h3>
            <Field
              label="Consumed calories"
              type="number"
              min="0"
              value={day.manualConsumedTotal}
              onChange={(event) =>
                setDay((currentDay) => ({
                  ...currentDay,
                  manualConsumedTotal: event.target.value
                }))
              }
            />
          </section>

          <section className="panel">
            <p className="eyebrow">Quick totals</p>
            <h3>Manual burned calories</h3>
            <Field
              label="Burned calories"
              type="number"
              min="0"
              value={day.manualBurnedTotal}
              onChange={(event) =>
                setDay((currentDay) => ({
                  ...currentDay,
                  manualBurnedTotal: event.target.value
                }))
              }
            />
          </section>

          <section className="panel">
            <p className="eyebrow">Prediction inputs</p>
            <h3>Body measurements</h3>
            <div className="measurements-grid">
              <Field
                label="Body weight"
                type="number"
                min="0"
                value={day.bodyWeight}
                onChange={(event) =>
                  setDay((currentDay) => ({
                    ...currentDay,
                    bodyWeight: event.target.value
                  }))
                }
              />
              <Field
                label="Height"
                type="number"
                min="0"
                value={day.height}
                onChange={(event) =>
                  setDay((currentDay) => ({
                    ...currentDay,
                    height: event.target.value
                  }))
                }
              />
            </div>
            <p className="status">Prediction uses your body weight and height for cardio and strength estimates.</p>
          </section>
        </section>

        <section className="panel scan-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">AI Food Scan</p>
              <h3>Snap a meal, estimate before you log it</h3>
            </div>
          </div>

          <div
            className={`drop-zone ${isDragOver ? "drop-zone--active" : ""} ${scanImage ? "drop-zone--has-image" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={scanImage ? undefined : handleDropZoneClick}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (!scanImage && (event.key === "Enter" || event.key === " ")) {
                handleDropZoneClick();
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              hidden
            />

            {scanImage ? (
              <img className="scan-preview" src={scanImage} alt="Selected meal preview" />
            ) : (
              <div className="drop-zone__placeholder">
                <svg className="drop-zone__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <p className="drop-zone__title">Upload a food photo</p>
                <p className="drop-zone__hint">Click to browse or drag &amp; drop</p>
              </div>
            )}

            {scanImage ? (
              <div className="drop-zone__overlay">
                <button
                  type="button"
                  className="ghost-button drop-zone__change-btn"
                  onClick={(event) => {
                    event.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Change photo
                </button>
              </div>
            ) : null}
          </div>

          {scanImage ? (
            <button
              type="button"
              className="primary-button"
              onClick={handleAnalyzeFood}
              disabled={scanLoading}
            >
              {scanLoading ? (
                <span className="btn-loading">
                  <span className="spinner" />
                  Analyzing...
                </span>
              ) : (
                "Analyze Food"
              )}
            </button>
          ) : null}

          {scanResult ? (
            <div className="scan-result">
              <div className="scan-result__header">
                <div>
                  <p className="eyebrow">Detected meal</p>
                  {scanResult.foods.length > 0 ? (
                    <ul className="scan-foods">
                      {scanResult.foods.map((food, index) => (
                        <li key={`scan-food-${index}`}>
                          {food.name}
                          {food.portion ? <span> · {food.portion}</span> : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="status">No food was confidently detected in this image.</p>
                  )}
                </div>
                {scanResult.estimateSource === "fallback" ? (
                  <span className="estimate-badge estimate-badge--fallback">Fallback</span>
                ) : (
                  <span className="estimate-badge estimate-badge--ai">AI</span>
                )}
              </div>

              <div className="scan-macros">
                <div className="macro-card macro-card--cal">
                  <svg className="macro-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20v-6M9 18l3-3 3 3" />
                    <path d="M12 4C9.5 6.5 8 9 8 12a4 4 0 0 0 8 0c0-3-1.5-5.5-4-8z" />
                  </svg>
                  <span className="macro-card__label">Calories</span>
                  <strong className="macro-card__value">
                    {scanResult.totalCaloriesMin} - {scanResult.totalCaloriesMax}
                  </strong>
                  <small className="macro-card__unit">kcal</small>
                </div>
                <div className="macro-card macro-card--protein">
                  <svg className="macro-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M20 4H6.5A2.5 2.5 0 0 0 4 6.5V20" />
                  </svg>
                  <span className="macro-card__label">Protein</span>
                  <strong className="macro-card__value">{scanResult.protein}</strong>
                  <small className="macro-card__unit">g</small>
                </div>
                <div className="macro-card macro-card--carbs">
                  <svg className="macro-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  <span className="macro-card__label">Carbs</span>
                  <strong className="macro-card__value">{scanResult.carbs}</strong>
                  <small className="macro-card__unit">g</small>
                </div>
                <div className="macro-card macro-card--fat">
                  <svg className="macro-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                  <span className="macro-card__label">Fat</span>
                  <strong className="macro-card__value">{scanResult.fat}</strong>
                  <small className="macro-card__unit">g</small>
                </div>
              </div>

              <div className="scan-confirm">
                <p className="scan-confirm__question">Did you eat this?</p>
                <div className="scan-actions">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={handleConsumeScan}
                    disabled={consuming}
                  >
                    {consuming ? (
                      <span className="btn-loading">
                        <span className="spinner" />
                        Adding...
                      </span>
                    ) : (
                      "Yes, log it"
                    )}
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={handleRejectScan}
                    disabled={consuming}
                  >
                    No, skip
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {scanError ? <p className="status error">{scanError}</p> : null}
          {scanMessage ? <p className="status success">{scanMessage}</p> : null}
        </section>

        <section className="panel water-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Hydration</p>
              <h3>Water intake</h3>
            </div>
            <div className="water-total">
              <span className="water-total__value">{Number(day.manualWaterMl || 0) + sumWaterMl(day.consumedEntries)}</span>
              <span className="water-total__sep">/</span>
              <span className="water-total__goal">3000</span>
              <span className="water-total__unit">ml</span>
            </div>
          </div>

          <div className="water-bar-track">
            <div
              className="water-bar-fill"
              style={{ width: `${Math.min(((Number(day.manualWaterMl || 0) + sumWaterMl(day.consumedEntries)) / 3000) * 100, 100)}%` }}
            />
          </div>

          <p className="water-from-food">
            {sumWaterMl(day.consumedEntries)} ml from food entries
          </p>

          <div className="water-quick-add">
            <button
              type="button"
              className="water-btn"
              onClick={() =>
                setDay((prev) => ({
                  ...prev,
                  manualWaterMl: String(Number(prev.manualWaterMl || 0) + 250)
                }))
              }
            >
              +250 ml
            </button>
            <button
              type="button"
              className="water-btn"
              onClick={() =>
                setDay((prev) => ({
                  ...prev,
                  manualWaterMl: String(Number(prev.manualWaterMl || 0) + 500)
                }))
              }
            >
              +500 ml
            </button>
            <div className="water-custom-add">
              <input
                type="number"
                min="0"
                className="water-custom-input"
                placeholder="Custom ml"
                value={customWaterMl}
                onChange={(e) => setCustomWaterMl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = Number(customWaterMl);
                    if (val > 0) {
                      setDay((prev) => ({
                        ...prev,
                        manualWaterMl: String(Number(prev.manualWaterMl || 0) + val)
                      }));
                      setCustomWaterMl("");
                    }
                  }
                }}
              />
              <button
                type="button"
                className="water-btn water-btn--add"
                onClick={() => {
                  const val = Number(customWaterMl);
                  if (val > 0) {
                    setDay((prev) => ({
                      ...prev,
                      manualWaterMl: String(Number(prev.manualWaterMl || 0) + val)
                    }));
                    setCustomWaterMl("");
                  }
                }}
              >
                Add
              </button>
            </div>
          </div>
        </section>

        <section className="entries-grid">
          <EntryList
            title="Food Entries"
            entries={day.consumedEntries}
            onChange={(index, field, value) => updateEntry("consumed", index, field, value)}
            onAdd={() => addEntry("consumed")}
            onRemove={(index) => removeEntry("consumed", index)}
            onAskAI={handleAskAI}
            estimatingIndex={estimatingEntry}
          />
          <ExerciseEntryList
            entries={day.burnedEntries}
            bodyWeight={day.bodyWeight}
            height={day.height}
            onChange={(index, field, value, childIndex) =>
              updateEntry("burned", index, field, value, childIndex)
            }
            onAdd={() => addEntry("burned")}
            onRemove={(index) => removeEntry("burned", index)}
            expandedIndices={expandedBurnEntries}
            onExpand={(index) => setExpandedBurnEntries((prev) => [...prev, index])}
          />
        </section>

        {loading ? <p className="status">Loading your saved day...</p> : null}
        {error ? <p className="status error">{error}</p> : null}
        {message ? <p className="status success">{message}</p> : null}

        <div className="save-row">
          <button type="button" className="primary-button" onClick={handleSaveDay} disabled={saving}>
            {saving ? "Saving..." : "Save Day"}
          </button>
        </div>
      </main>
    );
  }

  if (page === "coach") {
    return (
      <main className="shell">
        <nav className="app-nav">
          <span className="app-nav__title">CaloriesTracker</span>
          <div className="app-nav__links">
            <button
              type="button"
              className={`app-nav__link ${page === "nutrition" ? "app-nav__link--active" : ""}`}
              onClick={goToNutrition}
            >
              Nutrition
            </button>
            <button
              type="button"
              className={`app-nav__link ${page === "dashboard" ? "app-nav__link--active" : ""}`}
              onClick={goToDashboard}
            >
              Daily Log
            </button>
            <button
              type="button"
              className={`app-nav__link ${page === "coach" ? "app-nav__link--active" : ""}`}
              onClick={goToCoach}
            >
              AI Coach
            </button>
            <button
              type="button"
              className={`app-nav__link ${page === "recommend" ? "app-nav__link--active" : ""}`}
              onClick={goToRecommend}
            >
              Recommend
            </button>
          </div>
          <button type="button" className="ghost-button app-nav__logout" onClick={logout}>
            Log out
          </button>
        </nav>
        <AICoach
          consumedEntries={day.consumedEntries}
          burnedEntries={day.burnedEntries}
          manualWaterMl={day.manualWaterMl}
          manualConsumedTotal={day.manualConsumedTotal}
          manualBurnedTotal={day.manualBurnedTotal}
          savedConsumed={savedConsumed}
          savedBurned={savedBurned}
          savedWater={savedWater}
          bodyWeight={day.bodyWeight}
          height={day.height}
          userName={userName}
          dietType={userDiet}
        />
      </main>
    );
  }

  if (page === "recommend") {
    return (
      <main className="shell">
        <nav className="app-nav">
          <span className="app-nav__title">CaloriesTracker</span>
          <div className="app-nav__links">
            <button
              type="button"
              className={`app-nav__link ${page === "nutrition" ? "app-nav__link--active" : ""}`}
              onClick={goToNutrition}
            >
              Nutrition
            </button>
            <button
              type="button"
              className={`app-nav__link ${page === "dashboard" ? "app-nav__link--active" : ""}`}
              onClick={goToDashboard}
            >
              Daily Log
            </button>
            <button
              type="button"
              className={`app-nav__link ${page === "coach" ? "app-nav__link--active" : ""}`}
              onClick={goToCoach}
            >
              AI Coach
            </button>
            <button
              type="button"
              className={`app-nav__link ${page === "recommend" ? "app-nav__link--active" : ""}`}
              onClick={goToRecommend}
            >
              Recommend
            </button>
          </div>
          <button type="button" className="ghost-button app-nav__logout" onClick={logout}>
            Log out
          </button>
        </nav>
        <FoodRecommendation
          token={token}
          consumedEntries={day.consumedEntries}
          burnedEntries={day.burnedEntries}
          manualConsumedTotal={day.manualConsumedTotal}
          manualBurnedTotal={day.manualBurnedTotal}
          manualWaterMl={day.manualWaterMl}
          dietType={userDiet}
          onDietChange={setUserDiet}
        />
      </main>
    );
  }

  return (
    <main className="shell">
      <nav className="app-nav">
        <span className="app-nav__title">CaloriesTracker</span>
        <div className="app-nav__links">
          <button
            type="button"
            className={`app-nav__link ${page === "nutrition" ? "app-nav__link--active" : ""}`}
            onClick={goToNutrition}
          >
            Nutrition
          </button>
          <button
            type="button"
            className={`app-nav__link ${page === "dashboard" ? "app-nav__link--active" : ""}`}
            onClick={goToDashboard}
          >
            Daily Log
          </button>
          <button
            type="button"
            className={`app-nav__link ${page === "coach" ? "app-nav__link--active" : ""}`}
            onClick={goToCoach}
          >
            AI Coach
          </button>
          <button
            type="button"
            className={`app-nav__link ${page === "recommend" ? "app-nav__link--active" : ""}`}
            onClick={goToRecommend}
          >
            Recommend
          </button>
        </div>
        <button type="button" className="ghost-button app-nav__logout" onClick={logout}>
          Log out
        </button>
      </nav>
      <div className="nutrition-page">
        <section className="hero-card wide">
          <p className="eyebrow">Calories Tracker</p>
          <h1>Welcome, {userName}.</h1>
          <p className="hero-copy">Track what you consume and burn in one secure place.</p>
        </section>
        <SmartNotifications analysis={analysis} />
        <NutritionOverview entries={day.consumedEntries} loading={loading} manualWaterMl={day.manualWaterMl} />
      </div>
    </main>
  );

}

export default App;
