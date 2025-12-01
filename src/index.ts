import express, { Request, Response } from "express";
import { google } from "googleapis";
import dotenv from "dotenv";
import { authorize, fetchMessages } from "./utils/utils";

dotenv.config();

const PORT = process.env.PORT || 3000;
async function main() {
  const auth = await authorize();
  const gmail = google.gmail({ version: "v1", auth });

  const app = express();
  app.use(express.json());

  app.get("/emails/unfortunately/last-24h", async (_req: Request, res: Response) => {
    try {
      const query = "unfortunately newer_than:24h";
      const messages = await fetchMessages(gmail, query);
      res.json({ query, count: messages.length, messages });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || "Unknown error" });
    }
  });



  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
