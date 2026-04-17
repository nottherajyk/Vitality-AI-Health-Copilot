# Vitality: AI Health & Nutrition App

Vitality is a comprehensive health tracking application that uses AI to simplify nutrition logging and goal management.

## Features

- **AI Food Scanner**: Take a picture of your meal, and Gemini will identify the food, estimate calories, macros, and tell you how much exercise is needed to burn it off.
- **Personalized Goals**: Calculate your BMR and TDEE based on your body metrics and activity level.
- **Daily Dashboard**: Track your calorie consumption against your daily target with beautiful visualizations.
- **Google Fit Integration**: Connect your health data to sync weight and activity.

## Setup

1. **Gemini API Key**: Ensure your Gemini API key is set in the AI Studio secrets.
2. **Google OAuth**: To use Google Fit integration, you'll need to set up a Google Cloud project and provide:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - Set the callback URL to: `${APP_URL}/auth/callback`

## Tech Stack

- **Frontend**: React, Tailwind CSS, Recharts, Motion.
- **Backend**: Express (Full-stack mode).
- **AI**: Google Gemini 3 Flash.
