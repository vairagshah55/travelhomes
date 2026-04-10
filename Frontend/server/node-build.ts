import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());

// Serve static files from the spa directory
// The build output is in dist/server, so ../spa points to dist/spa
const clientBuildPath = path.join(__dirname, "../spa");
app.use(express.static(clientBuildPath));

// Handle all other routes by serving index.html for SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
