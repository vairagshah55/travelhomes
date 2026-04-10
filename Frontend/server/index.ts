import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/demo", handleDemo);

  // Dev-only mock onboarding routes to avoid hanging in local
  app.post('/api/onboarding/activity', (req, res) => {
    const body = req.body || {};
    // Accept either imageData or photos arrays from UI
    const photos = Array.isArray(body.photos) ? body.photos : (body.imageData ? [body.imageData] : []);
    const idPhotos = Array.isArray(body.idPhotos) ? body.idPhotos : [];
    if (!photos.length) {
      // Still succeed in dev to unblock the flow
      console.warn('[Mock:onboarding/activity] No photos provided');
    }
    res.status(201).json({ success: true, id: `${Date.now()}`, data: { receivedPhotos: photos.length, receivedIdPhotos: idPhotos.length } });
  });

  return app;
}
