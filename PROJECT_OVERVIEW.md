# Vitality Project Overview

## 1. What this project is

Vitality is an AI-assisted health and nutrition web application.
It combines food logging, calorie tracking, activity tracking, weight monitoring, sleep logs, face-based wellness insights, and personalized diet/workout suggestions in one product.

The app is built as a full-stack TypeScript project:
- Frontend: React + Vite + Tailwind-style utility classes + motion/recharts UI
- Backend: Express server in TypeScript
- AI Layer: Google Gemini via @google/genai
- Optional Health Data Integration: Google Fit OAuth + APIs

## 2. What problem it is trying to solve

Most people struggle with consistent health tracking because it is:
- Time-consuming (manual calorie entry, planning meals, tracking activities)
- Fragmented (nutrition in one app, activity in another, notes somewhere else)
- Hard to personalize (generic plans ignore goal, deficiency, condition, and behavior)

Vitality addresses this by offering:
- Fast logging with image-based food analysis
- Personalized calorie targets from body metrics + activity level
- AI-generated plans/suggestions adjusted to profile context
- A single dashboard for intake, burn, progress, and wellness signals

## 3. Core product goals

- Reduce tracking friction so users can log more consistently
- Turn raw health data into actionable next steps
- Personalize guidance based on goals and profile constraints
- Keep a unified daily view of energy in vs energy out

## 4. Main features

### Onboarding and profile modeling
Users enter:
- Weight, height, age, gender
- Goal: lose/gain/maintain
- Diet preference: veg/non-veg/vegan
- Target weight and timeline
- Activity level multiplier (1.2 to 1.9)
- Optional health conditions and deficiencies

### Daily calorie target engine
Daily goal is derived from:
- BMR (Harris-Benedict style formula in utils)
- TDEE = BMR * activity level
- Goal adjustment:
  - lose: -500 kcal
  - gain: +500 kcal
  - maintain: 0

### Dashboard tracking
The home dashboard shows:
- Calories consumed today
- Calories burned today
- Remaining calories
- Dynamic target (base goal + active burn)
- Weight entry and logs
- Water and activity logs

### AI food scan
Users can scan food images and get:
- Meal-level calories/macros
- Itemized food estimates with gram weights
- Micronutrient details (when available)
- Contribution against daily goal
- Exercise-equivalent burn estimate (walking/running/cycling)

### AI recommendations
AI services generate:
- Workout suggestions from profile + recent activities
- Grocery list tailored to goals/diet/conditions/deficiencies
- Diet plans with macro targets and meal ideas
- Recipe suggestions
- Face scan wellness feedback (non-diagnostic)

### Google Fit integration (optional)
Through OAuth and backend endpoints, the app can sync:
- Latest weight data
- Daily activity calories

### Additional tracking views
- Progress analytics
- Sleep tracking
- Energy history
- Grocery planning
- Profile settings and reset

## 5. How it works (technical flow)

## 5.1 Frontend flow
1. App bootstraps in main.tsx and renders App.
2. App initializes state from localStorage (profile/logs/notifications).
3. If no profile exists, onboarding is shown.
4. Once profile exists, bottom-nav views route between dashboard, progress, diet, sleep, scan, groceries, history, and profile.
5. User actions (add logs, edit entries, sync activities) update React state.
6. State changes are persisted back to localStorage.

## 5.2 Data model
Strongly typed entities include:
- UserProfile
- FoodLog, FoodItem, ActivityLog, WeightLog, WaterLog
- SleepLog, FaceScanResult
- DietPlan, Recipe, GroceryItem, WorkoutSuggestion

## 5.3 AI service flow
1. UI feature requests analysis/generation from geminiService.
2. Service sends prompt + optional structured image input to Gemini model gemini-3-flash-preview.
3. Responses are constrained by JSON schemas for predictable structure.
4. If API key is missing or requests fail/quota is hit, safe fallback data is returned.

This fallback-first pattern keeps core UI features usable even without live AI responses.

## 5.4 Backend flow
Server responsibilities include:
- Running Vite middleware in development
- Serving built frontend in production
- Session-based auth endpoints (signup/login/me/logout)
- User data sync endpoint (/api/user/sync)
- Google Fit OAuth URL generation + callback token exchange
- Google Fit weight/activity fetch endpoints

Simple file persistence is used:
- db.json stores users and serialized log/profile data

## 6. Current architecture notes

- The frontend currently runs primarily as a localStorage-driven client app.
- Auth and server sync endpoints exist on the backend and can support account-based persistence.
- Google Fit integration is backend-mediated and consumed by the HealthConnect UI.

In short: the codebase supports both rich client behavior and server-side capabilities, with local-first UX currently central in the app state flow.

## 7. Environment and setup requirements

Required for basic run:
- Node.js
- npm install dependencies
- Start server via the dev command (or direct tsx invocation)

Required for AI features:
- GEMINI_API_KEY

Required for Google Fit integration:
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- APP_URL
- SESSION_SECRET (recommended)
- OAuth callback: APP_URL/auth/callback

## 8. Why this project is valuable

Vitality is not just a calorie logger. It aims to be a practical daily health copilot by combining:
- Quantitative tracking (calories, weight, sleep, activity)
- Qualitative AI assistance (plans, suggestions, image analysis)
- Personalized context (goal, diet, conditions, deficiencies)

That combination helps users move from passive data collection to concrete, day-to-day decisions.

## 9. Limitations and cautions

- Face scan output is guidance only and not a medical diagnosis.
- AI estimations (food weight/macros/calories) are approximate.
- File-based persistence (db.json) is suitable for development/small usage, not production scale.
- Privacy/security hardening is still needed for production deployment.

## 10. Suggested next evolution

- Migrate storage to a production database
- Wire frontend state fully to authenticated backend sync
- Add role-based and privacy controls
- Add automated tests for AI fallback behavior and critical tracking flows
- Add stronger observability and error telemetry

---
This document summarizes what Vitality is, what it solves, and how it works from product intent through implementation details.
