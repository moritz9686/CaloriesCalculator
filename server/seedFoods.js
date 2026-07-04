import mongoose from "mongoose";
import Food from "./models/Food.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/calories";

const foods = [
  // ============ BREAKFAST ============
  { name:"Oats Porridge",image:"",servingSize:"200 g",calories:154,protein:5.4,carbs:27, fat:2.6,fiber:4.1,sugar:1.2,water:0,dietType:"vegan",allergens:[],mealType:"breakfast",prepTime:10,budget:"low",quickFood:true,preWorkout:true,postWorkout:false },
  { name:"Greek Yogurt with Honey",image:"",servingSize:"200 g",calories:180,protein:15,carbs:20, fat:4.5,fiber:0,sugar:16,water:0,dietType:"vegetarian",allergens:["dairy"],mealType:"breakfast",prepTime:5,budget:"medium",quickFood:true,preWorkout:true,postWorkout:true },
  { name:"Scrambled Eggs",image:"",servingSize:"2 eggs",calories:182,protein:12,carbs:1.4, fat:14,fiber:0,sugar:0.6,water:0,dietType:"eggetarian",allergens:["eggs"],mealType:"breakfast",prepTime:8,budget:"low",quickFood:true,preWorkout:true,postWorkout:true },
  { name:"Banana Pancakes",image:"",servingSize:"3 pancakes",calories:310,protein:8,carbs:50, fat:9,fiber:2.5,sugar:14,water:0,dietType:"eggetarian",allergens:["eggs","dairy","gluten"],mealType:"breakfast",prepTime:20,budget:"low",quickFood:false,preWorkout:true,postWorkout:false },
  { name:"Smoothie Bowl",image:"",servingSize:"300 g",calories:280,protein:6,carbs:55, fat:5,fiber:8,sugar:28,water:0,dietType:"vegan",allergens:[],mealType:"breakfast",prepTime:10,budget:"medium",quickFood:true,preWorkout:true,postWorkout:false },
  { name:"Egg White Omelette",image:"",servingSize:"3 egg whites",calories:78,protein:17,carbs:1.2, fat:0.6,fiber:0,sugar:0.5,water:0,dietType:"eggetarian",allergens:["eggs"],mealType:"breakfast",prepTime:8,budget:"low",quickFood:true,preWorkout:true,postWorkout:true },
  { name:"Idli Sambar",image:"",servingSize:"3 idli + sambar",calories:250,protein:9,carbs:48, fat:3.5,fiber:5,sugar:2,water:0,dietType:"vegan",allergens:["gluten"],mealType:"breakfast",prepTime:25,budget:"low",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"Dosa",image:"",servingSize:"2 dosa",calories:268,protein:6,carbs:48, fat:6,fiber:3,sugar:1,water:0,dietType:"vegan",allergens:["gluten"],mealType:"breakfast",prepTime:20,budget:"low",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"Poha",image:"",servingSize:"250 g",calories:220,protein:5,carbs:40, fat:5,fiber:3,sugar:2,water:0,dietType:"vegan",allergens:["gluten"],mealType:"breakfast",prepTime:12,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Upma",image:"",servingSize:"250 g",calories:230,protein:5,carbs:42, fat:5,fiber:3.5,sugar:1,water:0,dietType:"vegan",allergens:["gluten"],mealType:"breakfast",prepTime:15,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Paratha with Curd",image:"",servingSize:"2 paratha",calories:350,protein:8,carbs:48, fat:14,fiber:4,sugar:2,water:0,dietType:"vegetarian",allergens:["dairy","gluten"],mealType:"breakfast",prepTime:25,budget:"low",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"Chia Pudding",image:"",servingSize:"200 g",calories:180,protein:6,carbs:20, fat:8,fiber:10,sugar:6,water:0,dietType:"vegan",allergens:[],mealType:"breakfast",prepTime:5,budget:"medium",quickFood:true,preWorkout:true,postWorkout:false },
  { name:"Peanut Butter Toast",image:"",servingSize:"2 slices",calories:320,protein:12,carbs:30, fat:18,fiber:4,sugar:4,water:0,dietType:"vegan",allergens:["gluten","peanuts"],mealType:"breakfast",prepTime:5,budget:"low",quickFood:true,preWorkout:true,postWorkout:true },
  { name:"Avocado Toast",image:"",servingSize:"2 slices",calories:310,protein:7,carbs:28, fat:19,fiber:7,sugar:2,water:0,dietType:"vegan",allergens:["gluten"],mealType:"breakfast",prepTime:8,budget:"medium",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Cereal with Milk",image:"",servingSize:"250 g",calories:220,protein:7,carbs:38, fat:4.5,fiber:2,sugar:12,water:0,dietType:"vegetarian",allergens:["dairy","gluten"],mealType:"breakfast",prepTime:3,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Muesli with Yogurt",image:"",servingSize:"250 g",calories:260,protein:9,carbs:40, fat:7,fiber:5,sugar:14,water:0,dietType:"vegetarian",allergens:["dairy","gluten"],mealType:"breakfast",prepTime:5,budget:"medium",quickFood:true,preWorkout:true,postWorkout:true },
  { name:"Bread Omelette",image:"",servingSize:"2 slices + 2 eggs",calories:310,protein:16,carbs:28, fat:15,fiber:1.5,sugar:2,water:0,dietType:"eggetarian",allergens:["eggs","gluten"],mealType:"breakfast",prepTime:10,budget:"low",quickFood:true,preWorkout:true,postWorkout:true },
  { name:"Aloo Paratha",image:"",servingSize:"2 paratha",calories:380,protein:7,carbs:50, fat:17,fiber:4.5,sugar:1.5,water:0,dietType:"vegetarian",allergens:["dairy","gluten"],mealType:"breakfast",prepTime:30,budget:"low",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"Ragi Dosa",image:"",servingSize:"2 dosa",calories:240,protein:7,carbs:42, fat:5,fiber:6,sugar:1,water:0,dietType:"vegan",allergens:[],mealType:"breakfast",prepTime:20,budget:"low",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"Sprouts Salad",image:"",servingSize:"200 g",calories:140,protein:10,carbs:22, fat:2,fiber:6,sugar:3,water:0,dietType:"vegan",allergens:[],mealType:"breakfast",prepTime:10,budget:"low",quickFood:true,preWorkout:true,postWorkout:false },

  // ============ LUNCH ============
  { name:"Grilled Chicken Breast",image:"",servingSize:"150 g",calories:248,protein:46,carbs:0, fat:5.6,fiber:0,sugar:0,water:0,dietType:"non-vegetarian",allergens:[],mealType:"lunch",prepTime:20,budget:"medium",quickFood:true,preWorkout:false,postWorkout:true },
  { name:"Brown Rice with Dal",image:"",servingSize:"300 g",calories:330,protein:14,carbs:58, fat:4,fiber:7,sugar:1,water:0,dietType:"vegan",allergens:[],mealType:"lunch",prepTime:35,budget:"low",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"Chicken Curry with Rice",image:"",servingSize:"350 g",calories:480,protein:30,carbs:50, fat:16,fiber:2,sugar:3,water:0,dietType:"non-vegetarian",allergens:[],mealType:"lunch",prepTime:40,budget:"medium",quickFood:false,preWorkout:false,postWorkout:true },
  { name:"Vegetable Biryani",image:"",servingSize:"300 g",calories:380,protein:8,carbs:55, fat:14,fiber:4,sugar:3,water:0,dietType:"vegan",allergens:[],mealType:"lunch",prepTime:40,budget:"medium",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"Egg Curry with Roti",image:"",servingSize:"3 roti + curry",calories:420,protein:20,carbs:50, fat:16,fiber:5,sugar:2,water:0,dietType:"eggetarian",allergens:["eggs","gluten"],mealType:"lunch",prepTime:30,budget:"low",quickFood:false,preWorkout:false,postWorkout:true },
  { name:"Fish Curry with Rice",image:"",servingSize:"350 g",calories:440,protein:32,carbs:45, fat:15,fiber:1.5,sugar:1,water:0,dietType:"non-vegetarian",allergens:["fish"],mealType:"lunch",prepTime:35,budget:"medium",quickFood:false,preWorkout:false,postWorkout:true },
  { name:"Dal Tadka with Rice",image:"",servingSize:"300 g",calories:340,protein:13,carbs:58, fat:5,fiber:6,sugar:1,water:0,dietType:"vegan",allergens:[],mealType:"lunch",prepTime:30,budget:"low",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"Chole Bhature",image:"",servingSize:"1 serving",calories:480,protein:14,carbs:60, fat:22,fiber:8,sugar:4,water:0,dietType:"vegan",allergens:["gluten"],mealType:"lunch",prepTime:45,budget:"low",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"Palak Paneer with Roti",image:"",servingSize:"3 roti + sabzi",calories:410,protein:18,carbs:45, fat:18,fiber:6,sugar:2,water:0,dietType:"vegetarian",allergens:["dairy","gluten"],mealType:"lunch",prepTime:35,budget:"medium",quickFood:false,preWorkout:false,postWorkout:true },
  { name:"Soba Noodle Salad",image:"",servingSize:"300 g",calories:280,protein:10,carbs:48, fat:5,fiber:4,sugar:6,water:0,dietType:"vegan",allergens:["gluten"],mealType:"lunch",prepTime:15,budget:"medium",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Grilled Fish with Veggies",image:"",servingSize:"250 g",calories:310,protein:35,carbs:10, fat:14,fiber:3,sugar:4,water:0,dietType:"non-vegetarian",allergens:["fish"],mealType:"lunch",prepTime:25,budget:"high",quickFood:true,preWorkout:false,postWorkout:true },
  { name:"Pasta Primavera",image:"",servingSize:"300 g",calories:340,protein:9,carbs:55, fat:9,fiber:5,sugar:6,water:0,dietType:"vegan",allergens:["gluten"],mealType:"lunch",prepTime:20,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Quinoa Buddha Bowl",image:"",servingSize:"350 g",calories:380,protein:14,carbs:52, fat:12,fiber:8,sugar:5,water:0,dietType:"vegan",allergens:[],mealType:"lunch",prepTime:25,budget:"medium",quickFood:true,preWorkout:false,postWorkout:true },
  { name:"Chicken Salad Wrap",image:"",servingSize:"1 wrap",calories:340,protein:28,carbs:30, fat:12,fiber:3,sugar:3,water:0,dietType:"non-vegetarian",allergens:["gluten"],mealType:"lunch",prepTime:15,budget:"medium",quickFood:true,preWorkout:false,postWorkout:true },
  { name:"Tofu Stir Fry with Rice",image:"",servingSize:"300 g",calories:320,protein:16,carbs:42, fat:10,fiber:5,sugar:4,water:0,dietType:"vegan",allergens:["soy"],mealType:"lunch",prepTime:20,budget:"medium",quickFood:true,preWorkout:false,postWorkout:true },

  // ============ SNACKS ============
  { name:"Mixed Nuts",image:"",servingSize:"30 g",calories:173,protein:5,carbs:6, fat:16,fiber:2.5,sugar:1.5,water:0,dietType:"vegan",allergens:["tree nuts"],mealType:"snack",prepTime:1,budget:"medium",quickFood:true,preWorkout:true,postWorkout:false },
  { name:"Protein Shake (Whey)",image:"",servingSize:"1 scoop",calories:120,protein:24,carbs:3, fat:1.5,fiber:0.5,sugar:1,water:0,dietType:"vegetarian",allergens:["dairy"],mealType:"snack",prepTime:3,budget:"high",quickFood:true,preWorkout:true,postWorkout:true },
  { name:"Protein Shake (Soy)",image:"",servingSize:"1 scoop",calories:110,protein:22,carbs:4, fat:1,fiber:1,sugar:1,water:0,dietType:"vegan",allergens:["soy"],mealType:"snack",prepTime:3,budget:"high",quickFood:true,preWorkout:true,postWorkout:true },
  { name:"Apple with Peanut Butter",image:"",servingSize:"1 apple + 2 tbsp",calories:230,protein:8,carbs:28, fat:12,fiber:5,sugar:16,water:0,dietType:"vegan",allergens:["peanuts"],mealType:"snack",prepTime:2,budget:"low",quickFood:true,preWorkout:true,postWorkout:false },
  { name:"Banana",image:"",servingSize:"1 medium",calories:105,protein:1.3,carbs:27, fat:0.4,fiber:3.1,sugar:14,water:0,dietType:"vegan",allergens:[],mealType:"snack",prepTime:1,budget:"low",quickFood:true,preWorkout:true,postWorkout:false },
  { name:"Roasted Chickpeas",image:"",servingSize:"50 g",calories:160,protein:8,carbs:22, fat:4.5,fiber:6,sugar:2,water:0,dietType:"vegan",allergens:[],mealType:"snack",prepTime:2,budget:"low",quickFood:true,preWorkout:true,postWorkout:false },
  { name:"Hummus with Veggies",image:"",servingSize:"200 g",calories:200,protein:7,carbs:18, fat:13,fiber:6,sugar:3,water:0,dietType:"vegan",allergens:["sesame"],mealType:"snack",prepTime:5,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Fruit Yogurt",image:"",servingSize:"200 g",calories:160,protein:8,carbs:26, fat:3,fiber:0.5,sugar:20,water:0,dietType:"vegetarian",allergens:["dairy"],mealType:"snack",prepTime:2,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Trail Mix",image:"",servingSize:"40 g",calories:190,protein:5,carbs:20, fat:12,fiber:3,sugar:10,water:0,dietType:"vegan",allergens:["tree nuts","peanuts"],mealType:"snack",prepTime:1,budget:"medium",quickFood:true,preWorkout:true,postWorkout:false },
  { name:"Dark Chocolate (70%)",image:"",servingSize:"30 g",calories:170,protein:2.5,carbs:15, fat:12,fiber:3,sugar:8,water:0,dietType:"vegan",allergens:[],mealType:"snack",prepTime:1,budget:"medium",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Cottage Cheese (Paneer) Snack",image:"",servingSize:"100 g",calories:220,protein:18,carbs:4, fat:16,fiber:0,sugar:1,water:0,dietType:"vegetarian",allergens:["dairy"],mealType:"snack",prepTime:3,budget:"low",quickFood:true,preWorkout:true,postWorkout:true },
  { name:"Edamame",image:"",servingSize:"150 g",calories:180,protein:16,carbs:14, fat:7,fiber:7,sugar:3,water:0,dietType:"vegan",allergens:["soy"],mealType:"snack",prepTime:5,budget:"low",quickFood:true,preWorkout:true,postWorkout:true },
  { name:"Rice Cakes with Avocado",image:"",servingSize:"2 cakes",calories:140,protein:3,carbs:18, fat:8,fiber:3,sugar:1,water:0,dietType:"vegan",allergens:[],mealType:"snack",prepTime:3,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Granola Bar",image:"",servingSize:"1 bar",calories:140,protein:4,carbs:22, fat:5,fiber:3,sugar:8,water:0,dietType:"vegan",allergens:["gluten"],mealType:"snack",prepTime:1,budget:"medium",quickFood:true,preWorkout:true,postWorkout:false },

  // ============ DINNER ============
  { name:"Grilled Salmon with Asparagus",image:"",servingSize:"250 g",calories:360,protein:40,carbs:5, fat:20,fiber:2.5,sugar:1.5,water:0,dietType:"non-vegetarian",allergens:["fish"],mealType:"dinner",prepTime:25,budget:"high",quickFood:true,preWorkout:false,postWorkout:true },
  { name:"Vegetable Stir Fry with Tofu",image:"",servingSize:"300 g",calories:280,protein:14,carbs:25, fat:14,fiber:7,sugar:6,water:0,dietType:"vegan",allergens:["soy"],mealType:"dinner",prepTime:20,budget:"medium",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Chicken Tikka",image:"",servingSize:"200 g",calories:310,protein:35,carbs:6, fat:16,fiber:1,sugar:2,water:0,dietType:"non-vegetarian",allergens:[],mealType:"dinner",prepTime:30,budget:"medium",quickFood:false,preWorkout:false,postWorkout:true },
  { name:"Dal Khichdi",image:"",servingSize:"300 g",calories:280,protein:11,carbs:50, fat:4,fiber:5,sugar:1,water:0,dietType:"vegan",allergens:[],mealType:"dinner",prepTime:30,budget:"low",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"Paneer Butter Masala with Naan",image:"",servingSize:"1 serving",calories:520,protein:20,carbs:45, fat:30,fiber:3,sugar:5,water:0,dietType:"vegetarian",allergens:["dairy","gluten"],mealType:"dinner",prepTime:35,budget:"medium",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"Egg Fried Rice",image:"",servingSize:"300 g",calories:380,protein:16,carbs:48, fat:14,fiber:1.5,sugar:2,water:0,dietType:"eggetarian",allergens:["eggs"],mealType:"dinner",prepTime:20,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Mushroom Masala with Roti",image:"",servingSize:"3 roti + sabzi",calories:350,protein:12,carbs:48, fat:12,fiber:6,sugar:3,water:0,dietType:"vegan",allergens:["gluten"],mealType:"dinner",prepTime:30,budget:"low",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"Lentil Soup",image:"",servingSize:"300 ml",calories:180,protein:12,carbs:28, fat:2,fiber:8,sugar:2,water:0,dietType:"vegan",allergens:[],mealType:"dinner",prepTime:25,budget:"low",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"Chicken Noodle Soup",image:"",servingSize:"350 ml",calories:220,protein:18,carbs:24, fat:5,fiber:1.5,sugar:2,water:0,dietType:"non-vegetarian",allergens:["gluten"],mealType:"dinner",prepTime:25,budget:"medium",quickFood:true,preWorkout:false,postWorkout:true },
  { name:"Grilled Vegetables with Hummus",image:"",servingSize:"300 g",calories:260,protein:9,carbs:28, fat:14,fiber:9,sugar:8,water:0,dietType:"vegan",allergens:["sesame"],mealType:"dinner",prepTime:20,budget:"medium",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Fish Tikka",image:"",servingSize:"200 g",calories:280,protein:30,carbs:4, fat:16,fiber:0.5,sugar:1,water:0,dietType:"non-vegetarian",allergens:["fish"],mealType:"dinner",prepTime:25,budget:"high",quickFood:true,preWorkout:false,postWorkout:true },
  { name:"Vegetable Pasta",image:"",servingSize:"300 g",calories:340,protein:10,carbs:55, fat:9,fiber:5,sugar:5,water:0,dietType:"vegan",allergens:["gluten"],mealType:"dinner",prepTime:20,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Stuffed Bell Peppers",image:"",servingSize:"2 peppers",calories:290,protein:14,carbs:30, fat:14,fiber:6,sugar:8,water:0,dietType:"vegan",allergens:[],mealType:"dinner",prepTime:35,budget:"medium",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"Thai Green Curry with Rice",image:"",servingSize:"350 g",calories:380,protein:12,carbs:48, fat:16,fiber:4,sugar:5,water:0,dietType:"vegan",allergens:[],mealType:"dinner",prepTime:30,budget:"medium",quickFood:false,preWorkout:false,postWorkout:false },

  // ============ NON-VEG ADDITIONS ============
  { name:"Egg Bhurji",image:"",servingSize:"2 eggs",calories:190,protein:13,carbs:2, fat:15,fiber:0.5,sugar:1,water:0,dietType:"eggetarian",allergens:["eggs"],mealType:"breakfast",prepTime:10,budget:"low",quickFood:true,preWorkout:false,postWorkout:true },
  { name:"Chicken Sandwich",image:"",servingSize:"1 sandwich",calories:350,protein:25,carbs:35, fat:12,fiber:2.5,sugar:3,water:0,dietType:"non-vegetarian",allergens:["gluten"],mealType:"lunch",prepTime:12,budget:"medium",quickFood:true,preWorkout:false,postWorkout:true },
  { name:"Tuna Salad",image:"",servingSize:"200 g",calories:220,protein:30,carbs:8, fat:9,fiber:2,sugar:3,water:0,dietType:"non-vegetarian",allergens:["fish"],mealType:"lunch",prepTime:10,budget:"medium",quickFood:true,preWorkout:false,postWorkout:true },
  { name:"Mutton Curry with Rice",image:"",servingSize:"350 g",calories:520,protein:28,carbs:48, fat:24,fiber:1.5,sugar:2,water:0,dietType:"non-vegetarian",allergens:[],mealType:"dinner",prepTime:60,budget:"high",quickFood:false,preWorkout:false,postWorkout:true },
  { name:"Prawn Stir Fry",image:"",servingSize:"200 g",calories:210,protein:25,carbs:8, fat:9,fiber:1,sugar:3,water:0,dietType:"non-vegetarian",allergens:["shellfish"],mealType:"dinner",prepTime:15,budget:"high",quickFood:true,preWorkout:false,postWorkout:true },
  { name:"Chicken Wrap",image:"",servingSize:"1 wrap",calories:320,protein:26,carbs:28, fat:12,fiber:2,sugar:2,water:0,dietType:"non-vegetarian",allergens:["gluten"],mealType:"lunch",prepTime:15,budget:"medium",quickFood:true,preWorkout:false,postWorkout:true },

  // ============ VEGAN PROTEIN SOURCES ============
  { name:"Lentil Curry (Dal)",image:"",servingSize:"250 g",calories:200,protein:14,carbs:32, fat:2.5,fiber:10,sugar:2,water:0,dietType:"vegan",allergens:[],mealType:"lunch",prepTime:30,budget:"low",quickFood:false,preWorkout:false,postWorkout:true },
  { name:"Chickpea Curry (Chole)",image:"",servingSize:"250 g",calories:260,protein:12,carbs:38, fat:7,fiber:10,sugar:5,water:0,dietType:"vegan",allergens:[],mealType:"lunch",prepTime:35,budget:"low",quickFood:false,preWorkout:false,postWorkout:true },
  { name:"Soybean Curry",image:"",servingSize:"250 g",calories:240,protein:18,carbs:20, fat:10,fiber:7,sugar:3,water:0,dietType:"vegan",allergens:["soy"],mealType:"lunch",prepTime:30,budget:"low",quickFood:false,preWorkout:false,postWorkout:true },
  { name:"Tofu Bhurji",image:"",servingSize:"200 g",calories:180,protein:14,carbs:8, fat:12,fiber:3,sugar:2,water:0,dietType:"vegan",allergens:["soy"],mealType:"breakfast",prepTime:12,budget:"low",quickFood:true,preWorkout:true,postWorkout:true },

  // ============ MORE VARIETY ============
  { name:"Sweet Potato",image:"",servingSize:"150 g",calories:135,protein:3,carbs:31, fat:0.2,fiber:4.5,sugar:10,water:0,dietType:"vegan",allergens:[],mealType:"snack",prepTime:30,budget:"low",quickFood:false,preWorkout:true,postWorkout:false },
  { name:"Curd Rice",image:"",servingSize:"300 g",calories:280,protein:8,carbs:48, fat:6,fiber:0.5,sugar:4,water:0,dietType:"vegetarian",allergens:["dairy"],mealType:"lunch",prepTime:10,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Lemon Rice",image:"",servingSize:"300 g",calories:300,protein:5,carbs:55, fat:7,fiber:1,sugar:2,water:0,dietType:"vegan",allergens:[],mealType:"lunch",prepTime:15,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Coconut Rice",image:"",servingSize:"300 g",calories:340,protein:5,carbs:48, fat:15,fiber:2,sugar:3,water:0,dietType:"vegan",allergens:[],mealType:"lunch",prepTime:20,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Roti with Baingan Bharta",image:"",servingSize:"3 roti + sabzi",calories:330,protein:8,carbs:48, fat:12,fiber:6,sugar:4,water:0,dietType:"vegan",allergens:["gluten"],mealType:"dinner",prepTime:30,budget:"low",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"Paneer Tikka",image:"",servingSize:"200 g",calories:280,protein:20,carbs:8, fat:20,fiber:2,sugar:3,water:0,dietType:"vegetarian",allergens:["dairy"],mealType:"snack",prepTime:25,budget:"medium",quickFood:false,preWorkout:false,postWorkout:true },
  { name:"Gobi Manchurian",image:"",servingSize:"200 g",calories:260,protein:5,carbs:30, fat:15,fiber:4,sugar:6,water:0,dietType:"vegan",allergens:["gluten"],mealType:"snack",prepTime:20,budget:"low",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"Masala Dosa",image:"",servingSize:"2 dosa",calories:320,protein:7,carbs:50, fat:10,fiber:3.5,sugar:2,water:0,dietType:"vegan",allergens:["gluten"],mealType:"breakfast",prepTime:25,budget:"low",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"Veg Noodles",image:"",servingSize:"300 g",calories:310,protein:7,carbs:50, fat:9,fiber:3,sugar:4,water:0,dietType:"vegan",allergens:["gluten"],mealType:"dinner",prepTime:15,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Overnight Oats",image:"",servingSize:"200 g",calories:220,protein:8,carbs:38, fat:4.5,fiber:5,sugar:6,water:0,dietType:"vegan",allergens:[],mealType:"breakfast",prepTime:5,budget:"low",quickFood:true,preWorkout:true,postWorkout:false },
  { name:"Stuffed Paratha (Mix Veg)",image:"",servingSize:"2 paratha",calories:360,protein:8,carbs:46, fat:16,fiber:5,sugar:2,water:0,dietType:"vegetarian",allergens:["dairy","gluten"],mealType:"breakfast",prepTime:30,budget:"low",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"Vegetable Soup",image:"",servingSize:"300 ml",calories:120,protein:4,carbs:18, fat:3.5,fiber:5,sugar:6,water:0,dietType:"vegan",allergens:[],mealType:"dinner",prepTime:20,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Tomato Soup",image:"",servingSize:"300 ml",calories:110,protein:2,carbs:20, fat:2.5,fiber:2,sugar:10,water:0,dietType:"vegan",allergens:[],mealType:"dinner",prepTime:15,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Spinach Soup",image:"",servingSize:"300 ml",calories:100,protein:4,carbs:12, fat:4,fiber:4,sugar:3,water:0,dietType:"vegan",allergens:[],mealType:"dinner",prepTime:15,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Mushroom Soup",image:"",servingSize:"300 ml",calories:130,protein:5,carbs:14, fat:6,fiber:2,sugar:4,water:0,dietType:"vegan",allergens:[],mealType:"dinner",prepTime:20,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },

  // ============ POST-WORKOUT SPECIALS ============
  { name:"Chocolate Milk",image:"",servingSize:"250 ml",calories:190,protein:8,carbs:28, fat:5,fiber:1,sugar:24,water:0,dietType:"vegetarian",allergens:["dairy"],mealType:"snack",prepTime:2,budget:"low",quickFood:true,preWorkout:false,postWorkout:true },
  { name:"Coconut Water",image:"",servingSize:"250 ml",calories:45,protein:0.5,carbs:9, fat:0,fiber:0,sugar:7,water:250,dietType:"vegan",allergens:[],mealType:"snack",prepTime:1,budget:"low",quickFood:true,preWorkout:false,postWorkout:true },
  { name:"Beetroot Juice",image:"",servingSize:"250 ml",calories:100,protein:2,carbs:22, fat:0.5,fiber:1,sugar:16,water:0,dietType:"vegan",allergens:[],mealType:"snack",prepTime:5,budget:"low",quickFood:true,preWorkout:true,postWorkout:false },
  { name:"Tender Coconut",image:"",servingSize:"1 coconut",calories:60,protein:1,carbs:12, fat:0.5,fiber:0,sugar:8,water:300,dietType:"vegan",allergens:[],mealType:"snack",prepTime:2,budget:"low",quickFood:true,preWorkout:false,postWorkout:true },

  // ============ INDIAN STAPLES ============
  { name:"Sambar Rice",image:"",servingSize:"300 g",calories:310,protein:10,carbs:55, fat:5,fiber:6,sugar:2,water:0,dietType:"vegan",allergens:[],mealType:"lunch",prepTime:35,budget:"low",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"Curry Leaf Rice",image:"",servingSize:"300 g",calories:290,protein:5,carbs:50, fat:8,fiber:1.5,sugar:1,water:0,dietType:"vegan",allergens:[],mealType:"lunch",prepTime:20,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Tomato Rice",image:"",servingSize:"300 g",calories:280,protein:5,carbs:50, fat:7,fiber:2,sugar:3,water:0,dietType:"vegan",allergens:[],mealType:"lunch",prepTime:20,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Puliyogare (Tamarind Rice)",image:"",servingSize:"300 g",calories:310,protein:5,carbs:52, fat:9,fiber:2,sugar:4,water:0,dietType:"vegan",allergens:[],mealType:"lunch",prepTime:20,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Rava Kesari",image:"",servingSize:"200 g",calories:340,protein:4,carbs:58, fat:11,fiber:1,sugar:25,water:0,dietType:"vegetarian",allergens:["dairy","gluten"],mealType:"breakfast",prepTime:15,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Rava Dosa",image:"",servingSize:"2 dosa",calories:240,protein:5,carbs:38, fat:8,fiber:2,sugar:1,water:0,dietType:"vegan",allergens:["gluten"],mealType:"breakfast",prepTime:15,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Neer Dosa",image:"",servingSize:"4 dosa",calories:200,protein:3,carbs:38, fat:4,fiber:0.5,sugar:0.5,water:0,dietType:"vegan",allergens:[],mealType:"breakfast",prepTime:15,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Appam with Stew",image:"",servingSize:"3 appam + stew",calories:340,protein:7,carbs:50, fat:13,fiber:3,sugar:4,water:0,dietType:"vegan",allergens:[],mealType:"breakfast",prepTime:30,budget:"low",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"Mysore Bonda",image:"",servingSize:"4 bonda",calories:280,protein:6,carbs:38, fat:12,fiber:3,sugar:2,water:0,dietType:"vegan",allergens:["gluten"],mealType:"snack",prepTime:20,budget:"low",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"Vada",image:"",servingSize:"2 vada",calories:180,protein:6,carbs:22, fat:8,fiber:3,sugar:1,water:0,dietType:"vegan",allergens:["gluten"],mealType:"snack",prepTime:20,budget:"low",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"Medu Vada",image:"",servingSize:"2 vada",calories:190,protein:5,carbs:20, fat:10,fiber:2.5,sugar:1,water:0,dietType:"vegan",allergens:["gluten"],mealType:"breakfast",prepTime:25,budget:"low",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"Masala Vada",image:"",servingSize:"4 vada",calories:260,protein:9,carbs:28, fat:13,fiber:5,sugar:2,water:0,dietType:"vegan",allergens:["gluten"],mealType:"snack",prepTime:25,budget:"low",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"Ragi Malt",image:"",servingSize:"250 ml",calories:140,protein:4,carbs:28, fat:1.5,fiber:3,sugar:5,water:0,dietType:"vegan",allergens:[],mealType:"snack",prepTime:10,budget:"low",quickFood:true,preWorkout:true,postWorkout:false },

  // ============ DRINKS & BEVERAGES ============
  { name:"Green Tea",image:"",servingSize:"250 ml",calories:2,protein:0,carbs:0.5, fat:0,fiber:0,sugar:0,water:250,dietType:"vegan",allergens:[],mealType:"any",prepTime:3,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Black Coffee",image:"",servingSize:"250 ml",calories:2,protein:0.2,carbs:0, fat:0,fiber:0,sugar:0,water:250,dietType:"vegan",allergens:[],mealType:"any",prepTime:3,budget:"low",quickFood:true,preWorkout:true,postWorkout:false },
  { name:"Lemon Water",image:"",servingSize:"250 ml",calories:6,protein:0.1,carbs:2, fat:0,fiber:0,sugar:1,water:250,dietType:"vegan",allergens:[],mealType:"any",prepTime:1,budget:"low",quickFood:true,preWorkout:true,postWorkout:true },
  { name:"Buttermilk (Chaas)",image:"",servingSize:"250 ml",calories:50,protein:2.5,carbs:5, fat:2,fiber:0,sugar:3,water:0,dietType:"vegetarian",allergens:["dairy"],mealType:"any",prepTime:3,budget:"low",quickFood:true,preWorkout:false,postWorkout:true },
  { name:"Fresh Orange Juice",image:"",servingSize:"250 ml",calories:110,protein:1.5,carbs:26, fat:0.5,fiber:0.5,sugar:20,water:0,dietType:"vegan",allergens:[],mealType:"any",prepTime:5,budget:"low",quickFood:true,preWorkout:true,postWorkout:false },
  { name:"Pomegranate Juice",image:"",servingSize:"250 ml",calories:130,protein:1.5,carbs:30, fat:0.5,fiber:0.5,sugar:25,water:0,dietType:"vegan",allergens:[],mealType:"any",prepTime:5,budget:"medium",quickFood:true,preWorkout:true,postWorkout:false },
  { name:"Mango Smoothie",image:"",servingSize:"300 ml",calories:210,protein:4,carbs:40, fat:4.5,fiber:2,sugar:30,water:0,dietType:"vegan",allergens:[],mealType:"any",prepTime:5,budget:"medium",quickFood:true,preWorkout:false,postWorkout:false },

  // ============ SALADS ============
  { name:"Greek Salad",image:"",servingSize:"250 g",calories:180,protein:5,carbs:10, fat:14,fiber:3,sugar:5,water:0,dietType:"vegetarian",allergens:["dairy"],mealType:"lunch",prepTime:10,budget:"medium",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Caesar Salad",image:"",servingSize:"250 g",calories:220,protein:12,carbs:12, fat:15,fiber:3,sugar:3,water:0,dietType:"eggetarian",allergens:["eggs","dairy"],mealType:"lunch",prepTime:12,budget:"medium",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Kale & Quinoa Salad",image:"",servingSize:"250 g",calories:260,protein:10,carbs:34, fat:10,fiber:6,sugar:4,water:0,dietType:"vegan",allergens:[],mealType:"lunch",prepTime:15,budget:"medium",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Waldorf Salad",image:"",servingSize:"250 g",calories:200,protein:3,carbs:18, fat:14,fiber:3,sugar:10,water:0,dietType:"vegan",allergens:["tree nuts"],mealType:"lunch",prepTime:12,budget:"medium",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Cucumber Salad",image:"",servingSize:"200 g",calories:45,protein:1.5,carbs:8, fat:1,fiber:2,sugar:3,water:0,dietType:"vegan",allergens:[],mealType:"any",prepTime:8,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Fruit Salad",image:"",servingSize:"200 g",calories:120,protein:1.5,carbs:28, fat:0.5,fiber:4,sugar:20,water:0,dietType:"vegan",allergens:[],mealType:"snack",prepTime:10,budget:"low",quickFood:true,preWorkout:true,postWorkout:false },

  // ============ WHOLE GRAINS ============
  { name:"Brown Rice",image:"",servingSize:"200 g",calories:220,protein:5,carbs:46, fat:1.8,fiber:3.5,sugar:0.5,water:0,dietType:"vegan",allergens:[],mealType:"any",prepTime:30,budget:"low",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"White Rice",image:"",servingSize:"200 g",calories:260,protein:4,carbs:56, fat:0.4,fiber:0.6,sugar:0.1,water:0,dietType:"vegan",allergens:[],mealType:"any",prepTime:20,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Quinoa",image:"",servingSize:"200 g",calories:240,protein:8,carbs:44, fat:4,fiber:5,sugar:1.5,water:0,dietType:"vegan",allergens:[],mealType:"any",prepTime:20,budget:"medium",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Whole Wheat Bread",image:"",servingSize:"2 slices",calories:160,protein:6,carbs:28, fat:2,fiber:4,sugar:3,water:0,dietType:"vegan",allergens:["gluten"],mealType:"any",prepTime:2,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Multigrain Roti",image:"",servingSize:"3 roti",calories:240,protein:8,carbs:44, fat:3.5,fiber:6,sugar:1,water:0,dietType:"vegan",allergens:["gluten"],mealType:"any",prepTime:25,budget:"low",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"Bajra Roti",image:"",servingSize:"3 roti",calories:280,protein:7,carbs:48, fat:6,fiber:7,sugar:1,water:0,dietType:"vegan",allergens:[],mealType:"any",prepTime:25,budget:"low",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"Jowar Roti",image:"",servingSize:"3 roti",calories:260,protein:7,carbs:46, fat:4,fiber:6,sugar:1,water:0,dietType:"vegan",allergens:[],mealType:"any",prepTime:25,budget:"low",quickFood:false,preWorkout:false,postWorkout:false },

  // ============ HIGH PROTEIN MEALS ============
  { name:"Soya Chunks Curry",image:"",servingSize:"250 g",calories:240,protein:20,carbs:18, fat:10,fiber:7,sugar:2,water:0,dietType:"vegan",allergens:["soy"],mealType:"lunch",prepTime:30,budget:"low",quickFood:false,preWorkout:false,postWorkout:true },
  { name:"Chicken Keema",image:"",servingSize:"200 g",calories:310,protein:28,carbs:6, fat:20,fiber:1,sugar:2,water:0,dietType:"non-vegetarian",allergens:[],mealType:"dinner",prepTime:25,budget:"medium",quickFood:false,preWorkout:false,postWorkout:true },
  { name:"Egg Curry",image:"",servingSize:"2 eggs + gravy",calories:280,protein:16,carbs:10, fat:20,fiber:2,sugar:3,water:0,dietType:"eggetarian",allergens:["eggs"],mealType:"dinner",prepTime:25,budget:"low",quickFood:false,preWorkout:false,postWorkout:true },
  { name:"Fish Curry",image:"",servingSize:"250 g",calories:300,protein:28,carbs:8, fat:18,fiber:1,sugar:2,water:0,dietType:"non-vegetarian",allergens:["fish"],mealType:"dinner",prepTime:30,budget:"medium",quickFood:false,preWorkout:false,postWorkout:true },
  { name:"Tandoori Chicken",image:"",servingSize:"200 g",calories:280,protein:32,carbs:4, fat:15,fiber:0.5,sugar:1,water:0,dietType:"non-vegetarian",allergens:[],mealType:"dinner",prepTime:40,budget:"medium",quickFood:false,preWorkout:false,postWorkout:true },
  { name:"Grilled Prawns",image:"",servingSize:"200 g",calories:220,protein:24,carbs:4, fat:12,fiber:0,sugar:1,water:0,dietType:"non-vegetarian",allergens:["shellfish"],mealType:"dinner",prepTime:15,budget:"high",quickFood:true,preWorkout:false,postWorkout:true },
  { name:"Chicken Roast",image:"",servingSize:"200 g",calories:290,protein:30,carbs:2, fat:18,fiber:0,sugar:1,water:0,dietType:"non-vegetarian",allergens:[],mealType:"dinner",prepTime:50,budget:"medium",quickFood:false,preWorkout:false,postWorkout:true },
  { name:"Egg White Omelette with Spinach",image:"",servingSize:"4 egg whites",calories:110,protein:22,carbs:2, fat:1.5,fiber:1,sugar:0.5,water:0,dietType:"eggetarian",allergens:["eggs"],mealType:"breakfast",prepTime:10,budget:"low",quickFood:true,preWorkout:true,postWorkout:true },
  { name:"Peanut Chaat",image:"",servingSize:"150 g",calories:250,protein:12,carbs:20, fat:14,fiber:5,sugar:4,water:0,dietType:"vegan",allergens:["peanuts"],mealType:"snack",prepTime:10,budget:"low",quickFood:true,preWorkout:true,postWorkout:false },

  // ============ QUICK FIXES ============
  { name:"Instant Noodles",image:"",servingSize:"1 packet",calories:350,protein:6,carbs:52, fat:13,fiber:1.5,sugar:3,water:0,dietType:"vegan",allergens:["gluten"],mealType:"lunch",prepTime:5,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Maggie with Veggies",image:"",servingSize:"1 serving",calories:380,protein:8,carbs:54, fat:14,fiber:3,sugar:4,water:0,dietType:"vegan",allergens:["gluten"],mealType:"lunch",prepTime:10,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"French Fries",image:"",servingSize:"150 g",calories:320,protein:4,carbs:38, fat:17,fiber:3.5,sugar:1,water:0,dietType:"vegan",allergens:[],mealType:"snack",prepTime:15,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },

  // ============ FRUITS ============
  { name:"Apple",image:"",servingSize:"1 medium",calories:95,protein:0.5,carbs:25, fat:0.3,fiber:4.5,sugar:19,water:0,dietType:"vegan",allergens:[],mealType:"snack",prepTime:1,budget:"low",quickFood:true,preWorkout:true,postWorkout:false },
  { name:"Orange",image:"",servingSize:"1 medium",calories:62,protein:1.2,carbs:15, fat:0.2,fiber:3.1,sugar:12,water:0,dietType:"vegan",allergens:[],mealType:"snack",prepTime:1,budget:"low",quickFood:true,preWorkout:true,postWorkout:false },
  { name:"Mango",image:"",servingSize:"1 medium",calories:150,protein:1.4,carbs:38, fat:0.6,fiber:3.5,sugar:32,water:0,dietType:"vegan",allergens:[],mealType:"snack",prepTime:2,budget:"medium",quickFood:true,preWorkout:true,postWorkout:false },
  { name:"Papaya",image:"",servingSize:"200 g",calories:86,protein:1.3,carbs:22, fat:0.3,fiber:4,sugar:14,water:0,dietType:"vegan",allergens:[],mealType:"snack",prepTime:3,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Watermelon",image:"",servingSize:"300 g",calories:90,protein:1.8,carbs:22, fat:0.4,fiber:1.2,sugar:18,water:270,dietType:"vegan",allergens:[],mealType:"snack",prepTime:3,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Blueberries",image:"",servingSize:"100 g",calories:57,protein:0.7,carbs:14, fat:0.3,fiber:2.4,sugar:10,water:0,dietType:"vegan",allergens:[],mealType:"snack",prepTime:1,budget:"high",quickFood:true,preWorkout:true,postWorkout:false },
  { name:"Strawberries",image:"",servingSize:"150 g",calories:48,protein:1,carbs:12, fat:0.5,fiber:3,sugar:7,water:0,dietType:"vegan",allergens:[],mealType:"snack",prepTime:2,budget:"medium",quickFood:true,preWorkout:true,postWorkout:false },
  { name:"Guava",image:"",servingSize:"1 medium",calories:68,protein:2.6,carbs:14, fat:0.6,fiber:5.4,sugar:9,water:0,dietType:"vegan",allergens:[],mealType:"snack",prepTime:1,budget:"low",quickFood:true,preWorkout:true,postWorkout:false },
  { name:"Pineapple",image:"",servingSize:"150 g",calories:75,protein:0.8,carbs:19, fat:0.2,fiber:2,sugar:14,water:0,dietType:"vegan",allergens:[],mealType:"snack",prepTime:5,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Grapes",image:"",servingSize:"150 g",calories:100,protein:1.1,carbs:26, fat:0.2,fiber:1.4,sugar:23,water:0,dietType:"vegan",allergens:[],mealType:"snack",prepTime:1,budget:"low",quickFood:true,preWorkout:true,postWorkout:false },
  { name:"Pears",image:"",servingSize:"1 medium",calories:100,protein:0.6,carbs:26, fat:0.2,fiber:5.5,sugar:17,water:0,dietType:"vegan",allergens:[],mealType:"snack",prepTime:1,budget:"low",quickFood:true,preWorkout:true,postWorkout:false },

  // ============ ADDITIONAL VARIETY ============
  { name:"Veg Pulao",image:"",servingSize:"300 g",calories:340,protein:7,carbs:52, fat:11,fiber:3,sugar:2,water:0,dietType:"vegan",allergens:[],mealType:"lunch",prepTime:30,budget:"low",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"Methi Thepla",image:"",servingSize:"3 thepla",calories:260,protein:7,carbs:38, fat:9,fiber:5,sugar:2,water:0,dietType:"vegan",allergens:["gluten"],mealType:"breakfast",prepTime:25,budget:"low",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"Dhokla",image:"",servingSize:"6 pieces",calories:210,protein:7,carbs:34, fat:5,fiber:3,sugar:4,water:0,dietType:"vegan",allergens:["gluten"],mealType:"snack",prepTime:30,budget:"low",quickFood:false,preWorkout:false,postWorkout:true },
  { name:"Khandvi",image:"",servingSize:"8 pieces",calories:190,protein:6,carbs:20, fat:10,fiber:1,sugar:2,water:0,dietType:"vegan",allergens:["gluten"],mealType:"snack",prepTime:35,budget:"low",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"Samosa",image:"",servingSize:"2 samosa",calories:280,protein:5,carbs:34, fat:15,fiber:3,sugar:2,water:0,dietType:"vegan",allergens:["gluten"],mealType:"snack",prepTime:5,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Pav Bhaji",image:"",servingSize:"1 serving",calories:380,protein:8,carbs:48, fat:18,fiber:5,sugar:5,water:0,dietType:"vegan",allergens:["gluten"],mealType:"dinner",prepTime:35,budget:"low",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"Bhel Puri",image:"",servingSize:"200 g",calories:180,protein:4,carbs:30, fat:5,fiber:3,sugar:6,water:0,dietType:"vegan",allergens:["gluten"],mealType:"snack",prepTime:10,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Ragda Patties",image:"",servingSize:"2 patties",calories:290,protein:8,carbs:38, fat:12,fiber:5,sugar:4,water:0,dietType:"vegan",allergens:["gluten"],mealType:"snack",prepTime:30,budget:"low",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"Sev Puri",image:"",servingSize:"6 pieces",calories:220,protein:4,carbs:28, fat:11,fiber:2.5,sugar:4,water:0,dietType:"vegan",allergens:["gluten"],mealType:"snack",prepTime:8,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Idiyappam with Curry",image:"",servingSize:"4 idiyappam",calories:260,protein:5,carbs:50, fat:4.5,fiber:2,sugar:1,water:0,dietType:"vegan",allergens:[],mealType:"breakfast",prepTime:30,budget:"low",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"Putu",image:"",servingSize:"4 pieces",calories:180,protein:4,carbs:38, fat:1.5,fiber:3,sugar:8,water:0,dietType:"vegan",allergens:[],mealType:"breakfast",prepTime:20,budget:"low",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"Millet Upma",image:"",servingSize:"250 g",calories:210,protein:6,carbs:38, fat:4.5,fiber:5,sugar:1,water:0,dietType:"vegan",allergens:[],mealType:"breakfast",prepTime:20,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Broccoli Soup",image:"",servingSize:"300 ml",calories:110,protein:4,carbs:14, fat:4.5,fiber:4,sugar:4,water:0,dietType:"vegan",allergens:[],mealType:"dinner",prepTime:20,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Corn & Peas Pulao",image:"",servingSize:"300 g",calories:310,protein:8,carbs:50, fat:8,fiber:4,sugar:3,water:0,dietType:"vegan",allergens:[],mealType:"lunch",prepTime:25,budget:"low",quickFood:true,preWorkout:false,postWorkout:false },
  { name:"Vegetable Khichdi",image:"",servingSize:"300 g",calories:260,protein:9,carbs:45, fat:5,fiber:6,sugar:2,water:0,dietType:"vegan",allergens:[],mealType:"lunch",prepTime:30,budget:"low",quickFood:false,preWorkout:false,postWorkout:true },
  { name:"Paneer Stuffed Paratha",image:"",servingSize:"2 paratha",calories:400,protein:15,carbs:42, fat:19,fiber:4,sugar:2,water:0,dietType:"vegetarian",allergens:["dairy","gluten"],mealType:"breakfast",prepTime:30,budget:"medium",quickFood:false,preWorkout:false,postWorkout:true },
  { name:"Kerala Parotta with Veg Kurma",image:"",servingSize:"2 parotta + kurma",calories:460,protein:9,carbs:52, fat:24,fiber:3,sugar:3,water:0,dietType:"vegan",allergens:["gluten"],mealType:"dinner",prepTime:35,budget:"low",quickFood:false,preWorkout:false,postWorkout:false },
  { name:"Chana Masala",image:"",servingSize:"250 g",calories:270,protein:12,carbs:38, fat:8,fiber:9,sugar:5,water:0,dietType:"vegan",allergens:[],mealType:"lunch",prepTime:30,budget:"low",quickFood:false,preWorkout:false,postWorkout:true },
  { name:"Rajma Curry",image:"",servingSize:"250 g",calories:260,protein:12,carbs:36, fat:8,fiber:8,sugar:3,water:0,dietType:"vegan",allergens:[],mealType:"lunch",prepTime:40,budget:"low",quickFood:false,preWorkout:false,postWorkout:true },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    await Food.deleteMany({});
    console.log("Cleared existing foods");

    const inserted = await Food.insertMany(foods);
    console.log(`Seeded ${inserted.length} foods`);

    await mongoose.disconnect();
    console.log("Done");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seed();
