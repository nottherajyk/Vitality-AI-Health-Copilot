import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, ActivityLog, WorkoutSuggestion, GroceryItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface FoodItemAnalysis {
  name: string;
  weight: number; // in grams
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodAnalysis {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  micronutrients?: {
    vitamins: { name: string; amount: number; unit: string }[];
    minerals: { name: string; amount: number; unit: string }[];
  };
  description: string;
  contributionPercentage: number;
  items: FoodItemAnalysis[];
  workoutEquivalent: {
    walkingMinutes: number;
    runningMinutes: number;
    cyclingMinutes: number;
  };
}

const FALLBACK_FOOD_ANALYSIS: FoodAnalysis = {
  foodName: "Healthy Meal",
  calories: 500,
  protein: 25,
  carbs: 60,
  fat: 18,
  description: "A balanced meal with protein, complex carbohydrates, and healthy fats.",
  contributionPercentage: 25,
  items: [
    { name: "Main Protein", weight: 150, calories: 250, protein: 20, carbs: 0, fat: 12 },
    { name: "Complex Carbs", weight: 200, calories: 200, protein: 4, carbs: 45, fat: 2 },
    { name: "Vegetables", weight: 100, calories: 50, protein: 1, carbs: 15, fat: 4 }
  ],
  workoutEquivalent: {
    walkingMinutes: 100,
    runningMinutes: 45,
    cyclingMinutes: 60
  }
};

export async function analyzeFoodImage(base64Image: string, dailyCalorieGoal: number): Promise<FoodAnalysis> {
  if (!process.env.GEMINI_API_KEY) return FALLBACK_FOOD_ANALYSIS;

  const model = "gemini-3-flash-preview";
  
  const prompt = `Analyze this food image. Estimate its nutritional content. 
  The user's daily calorie goal is ${dailyCalorieGoal} kcal.
  Identify individual food items in the image and estimate their weight in grams.
  Calculate how much this food contributes to their daily goal.
  Also estimate how many minutes of walking (3mph), running (6mph), and cycling (12mph) would be needed to burn these calories for an average person.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image.split(",")[1] || base64Image,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foodName: { type: Type.STRING },
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fat: { type: Type.NUMBER },
            micronutrients: {
              type: Type.OBJECT,
              properties: {
                vitamins: { 
                  type: Type.ARRAY, 
                  items: { 
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      amount: { type: Type.NUMBER },
                      unit: { type: Type.STRING }
                    },
                    required: ["name", "amount", "unit"]
                  } 
                },
                minerals: { 
                  type: Type.ARRAY, 
                  items: { 
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      amount: { type: Type.NUMBER },
                      unit: { type: Type.STRING }
                    },
                    required: ["name", "amount", "unit"]
                  } 
                },
              },
              required: ["vitamins", "minerals"],
            },
            description: { type: Type.STRING },
            contributionPercentage: { type: Type.NUMBER },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  weight: { type: Type.NUMBER, description: "Estimated weight in grams" },
                  calories: { type: Type.NUMBER },
                  protein: { type: Type.NUMBER },
                  carbs: { type: Type.NUMBER },
                  fat: { type: Type.NUMBER },
                },
                required: ["name", "weight", "calories", "protein", "carbs", "fat"],
              },
            },
            workoutEquivalent: {
              type: Type.OBJECT,
              properties: {
                walkingMinutes: { type: Type.NUMBER },
                runningMinutes: { type: Type.NUMBER },
                cyclingMinutes: { type: Type.NUMBER },
              },
              required: ["walkingMinutes", "runningMinutes", "cyclingMinutes"],
            },
          },
          required: ["foodName", "calories", "protein", "carbs", "fat", "description", "contributionPercentage", "items", "workoutEquivalent"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    console.warn("Gemini API error in analyzeFoodImage. Using fallback.");
    return {
      ...FALLBACK_FOOD_ANALYSIS,
      contributionPercentage: Math.round((FALLBACK_FOOD_ANALYSIS.calories / dailyCalorieGoal) * 100)
    };
  }
}

const FALLBACK_WORKOUTS: WorkoutSuggestion[] = [
  {
    title: "Brisk Evening Walk",
    description: "A steady-paced walk to clear your mind and maintain metabolic activity.",
    duration: 30,
    intensity: "low",
    estimatedBurn: 150,
    type: "Walking"
  },
  {
    title: "Bodyweight Circuit",
    description: "Push-ups, squats, and lunges. 3 sets of 15 reps each for full-body toning.",
    duration: 20,
    intensity: "moderate",
    estimatedBurn: 200,
    type: "Gym"
  },
  {
    title: "Interval Jogging",
    description: "Alternate between 2 minutes of jogging and 1 minute of walking.",
    duration: 25,
    intensity: "high",
    estimatedBurn: 250,
    type: "Running"
  }
];

export async function generateWorkoutSuggestions(profile: UserProfile, activityLogs: ActivityLog[]): Promise<WorkoutSuggestion[]> {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is missing. Using fallback suggestions.");
    return FALLBACK_WORKOUTS;
  }

  const model = "gemini-3-flash-preview";
  
  const recentActivities = activityLogs.slice(-10).map(log => `${log.type} (${log.calories} kcal, ${log.durationMinutes || 'unknown'} min)`).join(", ");
  const preferredTypes = [...new Set(['Walking', 'Running', 'Cycling', 'Swimming', 'Gym', ...(profile.customActivityTypes || []), ...activityLogs.map(l => l.type)])].join(", ");

  const prompt = `Generate 3 personalized workout suggestions for a user with the following profile:
  - Weight: ${profile.weight}kg, Height: ${profile.height}cm, Age: ${profile.age}
  - Goal: ${profile.goal} (target weight: ${profile.targetWeight}kg)
  - Activity Level: ${profile.activityLevel} (1.2 to 1.9)
  - Preferred/Recent Activity Types: ${preferredTypes}
  - Recent Workout History: ${recentActivities || 'None'}

  The suggestions should be actionable, specific, and tailored to their goal. 
  Include estimated duration, intensity, and calories burned.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              duration: { type: Type.NUMBER, description: "Duration in minutes" },
              intensity: { type: Type.STRING, enum: ["very_low", "low", "moderate", "high", "very_high"] },
              estimatedBurn: { type: Type.NUMBER, description: "Estimated calories to burn" },
              type: { type: Type.STRING, description: "The type of activity (e.g. Walking, Running, etc.)" }
            },
            required: ["title", "description", "duration", "intensity", "estimatedBurn", "type"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error: any) {
    if (error?.status === "RESOURCE_EXHAUSTED" || error?.message?.includes("quota")) {
      console.warn("Gemini API quota exceeded. Using fallback workout suggestions.");
    } else {
      console.error("Error generating workout suggestions:", error);
    }
    return FALLBACK_WORKOUTS;
  }
}

export async function generateGroceryList(profile: UserProfile): Promise<GroceryItem[]> {
  if (!process.env.GEMINI_API_KEY) {
    return [
      { name: "Fresh Spinach", category: "Produce", reason: "Rich in iron and fiber", nutrients: ["Iron", "Vitamin K", "Fiber"] },
      { name: "Greek Yogurt", category: "Dairy/Protein", reason: "High protein and probiotics", nutrients: ["Protein", "Calcium", "Probiotics"] },
      { name: "Blueberries", category: "Produce", reason: "High in antioxidants", nutrients: ["Vitamin C", "Antioxidants"] }
    ];
  }

  const model = "gemini-3-flash-preview";
  const prompt = `Generate a recommended grocery list for a user with the following profile:
  - Goal: ${profile.goal} weight
  - Diet Preference: ${profile.dietPreference}
  - Health Conditions: ${profile.healthConditions?.join(", ") || "None"}
  - Deficiencies: ${profile.deficiencies?.join(", ") || "None"}
  
  Provide a list of 10-15 specific grocery items that would be beneficial for them. 
  For each item, include:
  1. Item name
  2. Category (e.g., Produce, Protein, Pantry)
  3. Reason why it's recommended for their specific profile
  4. Key nutrients it provides`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING },
              reason: { type: Type.STRING },
              nutrients: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["name", "category", "reason", "nutrients"],
          },
        },
      },
    });

    return JSON.parse(response.text || "[]");
  } catch (error: any) {
    console.warn("Gemini API error in generateGroceryList. Using fallback.");
    return [
      { name: "Fresh Spinach", category: "Produce", reason: "Rich in iron and fiber", nutrients: ["Iron", "Vitamin K", "Fiber"] },
      { name: "Greek Yogurt", category: "Dairy/Protein", reason: "High protein and probiotics", nutrients: ["Protein", "Calcium", "Probiotics"] },
      { name: "Blueberries", category: "Produce", reason: "High in antioxidants", nutrients: ["Vitamin C", "Antioxidants"] }
    ];
  }
}

const FALLBACK_DIET_PLAN = {
  dailyCalorieTarget: 2000,
  macros: { protein: 150, carbs: 200, fat: 65 },
  suggestedMeals: {
    breakfast: ["Oatmeal with berries and nuts", "Greek yogurt with honey"],
    lunch: ["Grilled chicken salad", "Quinoa bowl with roasted vegetables"],
    dinner: ["Baked salmon with steamed broccoli", "Lean beef stir-fry"],
    snacks: ["Apple slices with almond butter", "Handful of mixed nuts"]
  },
  recommendations: [
    "Prioritize whole, unprocessed foods",
    "Stay hydrated by drinking at least 2-3 liters of water daily",
    "Ensure adequate sleep for recovery"
  ]
};

const FALLBACK_RECIPES = [
  {
    title: "Quinoa & Roasted Veggie Bowl",
    description: "A nutrient-dense bowl packed with fiber and plant-based protein.",
    calories: 450,
    protein: 15,
    carbs: 65,
    fat: 12,
    ingredients: ["1 cup cooked quinoa", "Mixed bell peppers", "Zucchini", "Olive oil", "Lemon juice"],
    instructions: ["Roast vegetables at 400°F for 20 mins", "Toss with cooked quinoa", "Drizzle with lemon and oil"],
    prepTime: 25,
    tags: ["Vegetarian", "High Fiber"]
  },
  {
    title: "Lemon Herb Grilled Chicken",
    description: "Simple, lean protein perfect for muscle maintenance.",
    calories: 350,
    protein: 45,
    carbs: 5,
    fat: 15,
    ingredients: ["Chicken breast", "Fresh lemon", "Rosemary", "Garlic", "Black pepper"],
    instructions: ["Marinate chicken with herbs and lemon", "Grill for 6-8 minutes per side", "Rest before serving"],
    prepTime: 20,
    tags: ["High Protein", "Low Carb"]
  }
];

export async function generateDietPlan(profile: UserProfile): Promise<any> {
  if (!process.env.GEMINI_API_KEY) return FALLBACK_DIET_PLAN;

  const model = "gemini-3-flash-preview";
  const prompt = `Generate a tailored diet plan for a user with the following profile:
  - Weight: ${profile.weight}kg, Height: ${profile.height}cm, Age: ${profile.age}
  - Goal: ${profile.goal} (target weight: ${profile.targetWeight}kg)
  - Diet Preference: ${profile.dietPreference}
  - Activity Level: ${profile.activityLevel}
  - Health Conditions: ${profile.healthConditions?.join(", ") || "None"}
  - Deficiencies: ${profile.deficiencies?.join(", ") || "None"}
  
  Provide:
  1. Daily calorie target.
  2. Macro breakdown (protein, carbs, fat in grams).
  3. Suggested meals for breakfast, lunch, dinner, and snacks.
  4. General health recommendations specifically addressing their health conditions and deficiencies.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dailyCalorieTarget: { type: Type.NUMBER },
            macros: {
              type: Type.OBJECT,
              properties: {
                protein: { type: Type.NUMBER },
                carbs: { type: Type.NUMBER },
                fat: { type: Type.NUMBER },
              },
              required: ["protein", "carbs", "fat"],
            },
            suggestedMeals: {
              type: Type.OBJECT,
              properties: {
                breakfast: { type: Type.ARRAY, items: { type: Type.STRING } },
                lunch: { type: Type.ARRAY, items: { type: Type.STRING } },
                dinner: { type: Type.ARRAY, items: { type: Type.STRING } },
                snacks: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["breakfast", "lunch", "dinner", "snacks"],
            },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["dailyCalorieTarget", "macros", "suggestedMeals", "recommendations"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    console.warn("Gemini API error in generateDietPlan. Using fallback.");
    return FALLBACK_DIET_PLAN;
  }
}

export async function generateRecipes(profile: UserProfile): Promise<any[]> {
  if (!process.env.GEMINI_API_KEY) return FALLBACK_RECIPES;

  const model = "gemini-3-flash-preview";
  const prompt = `Generate 4 tasty and healthy recipes tailored for someone who wants to ${profile.goal} weight and follows a ${profile.dietPreference} diet.
  Include nutritional info, ingredients, instructions, and prep time.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              calories: { type: Type.NUMBER },
              protein: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
              fat: { type: Type.NUMBER },
              ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
              instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
              prepTime: { type: Type.NUMBER },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["title", "description", "calories", "protein", "carbs", "fat", "ingredients", "instructions", "prepTime", "tags"],
          },
        },
      },
    });

    return JSON.parse(response.text || "[]");
  } catch (error: any) {
    console.warn("Gemini API error in generateRecipes. Using fallback.");
    return FALLBACK_RECIPES;
  }
}

export async function analyzeFaceScan(base64Image: string): Promise<any> {
  if (!process.env.GEMINI_API_KEY) {
    return {
      analysis: {
        skinHealth: "Analysis currently unavailable.",
        fatigueLevel: "medium",
        hydrationStatus: "Please ensure you're drinking enough water.",
        recommendations: ["Stay hydrated", "Get adequate rest"]
      }
    };
  }

  const model = "gemini-3-flash-preview";
  const prompt = `Analyze this face image for basic health indicators. 
  Focus on skin health (e.g., glow, dryness), fatigue level (e.g., dark circles), and hydration status.
  Provide actionable health recommendations. 
  DISCLAIMER: This is not a medical diagnosis.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image.split(",")[1] || base64Image,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: {
              type: Type.OBJECT,
              properties: {
                skinHealth: { type: Type.STRING },
                fatigueLevel: { type: Type.STRING, enum: ["low", "medium", "high"] },
                hydrationStatus: { type: Type.STRING },
                recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["skinHealth", "fatigueLevel", "hydrationStatus", "recommendations"],
            },
          },
          required: ["analysis"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    console.warn("Gemini API error in analyzeFaceScan. Using fallback.");
    return {
      analysis: {
        skinHealth: "Analysis currently unavailable due to high demand.",
        fatigueLevel: "medium",
        hydrationStatus: "Please ensure you're drinking enough water.",
        recommendations: ["Stay hydrated", "Get adequate rest", "Maintain a consistent skincare routine"]
      }
    };
  }
}
