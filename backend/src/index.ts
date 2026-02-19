import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());
const port = Number(process.env.PORT) || 5050;

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
