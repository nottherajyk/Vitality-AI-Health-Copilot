import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { google } from "googleapis";
import session from "express-session";
import bcrypt from "bcryptjs";

dotenv.config();

const dbPath = path.join(process.cwd(), "db.json");
let dbData: { users: any[] } = { users: [] };

if (fs.existsSync(dbPath)) {
  try {
    dbData = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
  } catch (e) {
    console.error("Error loading db.json:", e);
  }
}

const saveDb = () => {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
  } catch (e) {
    console.error("Error saving db.json:", e);
  }
};

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.APP_URL}/auth/callback`
);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "vitality-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      },
    })
  );

  // Auth Middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!(req.session as any).userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };

  // Auth Endpoints
  app.post("/api/auth/signup", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    if (dbData.users.find(u => u.email === email)) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    const newUser = {
      id: userId,
      email,
      password: hashedPassword,
      profile: null,
      food_logs: null,
      weight_logs: null,
      water_logs: null,
      activity_logs: null
    };

    dbData.users.push(newUser);
    saveDb();

    (req.session as any).userId = userId;
    res.json({ userId, email });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = dbData.users.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    (req.session as any).userId = user.id;
    res.json({
      userId: user.id,
      email: user.email,
      profile: user.profile ? JSON.parse(user.profile) : null,
      foodLogs: user.food_logs ? JSON.parse(user.food_logs) : [],
      weightLogs: user.weight_logs ? JSON.parse(user.weight_logs) : [],
      waterLogs: user.water_logs ? JSON.parse(user.water_logs) : [],
      activityLogs: user.activity_logs ? JSON.parse(user.activity_logs) : [],
    });
  });

  app.get("/api/auth/me", (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const user = dbData.users.find(u => u.id === userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    res.json({
      userId: user.id,
      email: user.email,
      profile: user.profile ? JSON.parse(user.profile) : null,
      foodLogs: user.food_logs ? JSON.parse(user.food_logs) : [],
      weightLogs: user.weight_logs ? JSON.parse(user.weight_logs) : [],
      waterLogs: user.water_logs ? JSON.parse(user.water_logs) : [],
      activityLogs: user.activity_logs ? JSON.parse(user.activity_logs) : [],
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: "Logout failed" });
      res.json({ success: true });
    });
  });

  // Data Sync Endpoints
  app.post("/api/user/sync", requireAuth, (req, res) => {
    const userId = (req.session as any).userId;
    const { profile, foodLogs, weightLogs, waterLogs, activityLogs } = req.body;
    
    const userIndex = dbData.users.findIndex(u => u.id === userId);
    if (userIndex === -1) return res.status(404).json({ error: "User not found" });

    dbData.users[userIndex] = {
      ...dbData.users[userIndex],
      profile: JSON.stringify(profile),
      food_logs: JSON.stringify(foodLogs),
      weight_logs: JSON.stringify(weightLogs),
      water_logs: JSON.stringify(waterLogs),
      activity_logs: JSON.stringify(activityLogs)
    };

    saveDb();
    res.json({ success: true });
  });

  // Google Fit OAuth Endpoints
  app.get("/api/auth/google-fit/url", (req, res) => {
    const scope = [
      "https://www.googleapis.com/auth/fitness.activity.read",
      "https://www.googleapis.com/auth/fitness.body.read"
    ];
    
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scope,
      prompt: "consent",
    });
    res.json({ url: authUrl });
  });

  app.get("/auth/callback", async (req, res) => {
    const { code } = req.query;
    try {
      const { tokens } = await oauth2Client.getToken(code as string);
      oauth2Client.setCredentials(tokens);
      
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Error exchanging code for tokens:", error);
      res.status(500).send("Authentication failed");
    }
  });

  app.get("/api/auth/google-fit/status", (req, res) => {
    const isConnected = !!oauth2Client.credentials.access_token;
    res.json({ connected: isConnected });
  });

  app.get("/api/google-fit/weight", async (req, res) => {
    try {
      const fitness = google.fitness({ version: "v1", auth: oauth2Client });
      
      const response = await fitness.users.dataSources.datasets.get({
        userId: "me",
        dataSourceId: "derived:com.google.weight:com.google.android.gms:merge_weight",
        datasetId: "0-" + Date.now() * 1000000,
      });

      const points = response.data.point || [];
      if (points.length > 0) {
        const latestPoint = points[points.length - 1];
        const weight = latestPoint.value?.[0]?.fpVal;
        const timestamp = parseInt(latestPoint.startTimeNanos || "0") / 1000000;
        
        res.json({ weight, timestamp });
      } else {
        res.status(404).json({ error: "No weight data found" });
      }
    } catch (error) {
      console.error("Error fetching weight from Google Fit:", error);
      res.status(500).json({ error: "Failed to fetch weight data" });
    }
  });

  app.get("/api/google-fit/activity", async (req, res) => {
    try {
      const fitness = google.fitness({ version: "v1", auth: oauth2Client });
      
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const startTimeMillis = startOfDay.getTime();
      const endTimeMillis = Date.now();

      const response: any = await fitness.users.dataset.aggregate({
        userId: "me",
        requestBody: {
          aggregateBy: [
            {
              dataTypeName: "com.google.calories.expended"
            }
          ],
          bucketByTime: { durationMillis: (endTimeMillis - startTimeMillis).toString() },
          startTimeMillis: startTimeMillis.toString(),
          endTimeMillis: endTimeMillis.toString()
        }
      });

      const buckets = response.data.bucket || [];
      let totalCalories = 0;
      
      buckets.forEach(bucket => {
        bucket.dataset?.forEach(dataset => {
          dataset.point?.forEach(point => {
            totalCalories += point.value?.[0]?.fpVal || 0;
          });
        });
      });

      res.json({ calories: Math.round(totalCalories) });
    } catch (error) {
      console.error("Error fetching activity from Google Fit:", error);
      res.status(500).json({ error: "Failed to fetch activity data" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
