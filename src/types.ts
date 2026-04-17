export interface UserProfile {
  weight: number; // kg
  height: number; // cm
  age: number;
  gender: 'male' | 'female';
  goal: 'lose' | 'gain' | 'maintain';
  dietPreference: 'veg' | 'non-veg' | 'vegan';
  targetWeight: number;
  timeframeWeeks: number;
  activityLevel: number; // 1.2 to 1.9
  customActivityTypes?: string[];
  healthConditions?: string[]; // e.g., 'diabetes', 'hypertension'
  deficiencies?: string[]; // e.g., 'Vitamin D', 'Iron'
}

export interface GroceryItem {
  name: string;
  category: string;
  reason: string;
  nutrients: string[];
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodItem {
  name: string;
  weight: number; // in grams
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodLog {
  id: string;
  timestamp: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUrl?: string;
  mealType: MealType;
  items?: FoodItem[];
}

export interface DailyStats {
  date: string;
  consumed: number;
  burned: number;
  target: number;
}

export interface WeightLog {
  id: string;
  timestamp: number;
  weight: number;
}

export interface WaterLog {
  id: string;
  timestamp: number;
  amount: number; // in ml
}

export interface ActivityLog {
  id: string;
  timestamp: number;
  type: string;
  calories: number;
  durationMinutes?: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  instructions: string[];
  prepTime: number; // minutes
  imageUrl?: string;
  tags: string[];
}

export interface DietPlan {
  id: string;
  goal: 'lose' | 'gain' | 'maintain';
  dailyCalorieTarget: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  suggestedMeals: {
    breakfast: string[];
    lunch: string[];
    dinner: string[];
    snacks: string[];
  };
  recommendations: string[];
}

export interface SleepLog {
  id: string;
  timestamp: number; // when they woke up
  durationHours: number;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  notes?: string;
}

export interface FaceScanResult {
  id: string;
  timestamp: number;
  imageUrl: string;
  analysis: {
    skinHealth: string;
    fatigueLevel: 'low' | 'medium' | 'high';
    hydrationStatus: string;
    recommendations: string[];
  };
}

export interface WorkoutSuggestion {
  title: string;
  description: string;
  duration: number; // minutes
  intensity: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
  estimatedBurn: number;
  type: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  achievedAt: number;
  type: 'weight' | 'streak' | 'activity';
  icon: string;
  achieved?: boolean;
}
