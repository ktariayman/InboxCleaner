import express, { Request, Response } from "express";
import { google } from "googleapis";
import dotenv from "dotenv";
import { authorize, createOAuthClient, fetchMessages, getAuthUrlForSetup, saveBackupToFile } from "./utils/utils";

dotenv.config();

const PORT = process.env.PORT || 3005;
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


  app.get("/api/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }

      const messages = await fetchMessages(gmail, query);
      res.json({ query, count: messages.length, messages });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || "Search failed" });
    }
  });

  app.post("/api/backup", async (req: Request, res: Response) => {
    try {
      const { emails } = req.body;
      if (!emails || !Array.isArray(emails)) {
        return res.status(400).json({ error: "Invalid request body" });
      }

      const filePath = saveBackupToFile(emails, "selected-emails");
      res.json({ count: emails.length, backupFile: filePath });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || "Backup failed" });
    }
  });

  app.post("/api/delete", async (req: Request, res: Response) => {
    try {
      const { emailIds } = req.body;
      if (!emailIds || !Array.isArray(emailIds)) {
        return res.status(400).json({ error: "Invalid request body" });
      }

      let deleted = 0;
      for (const id of emailIds) {
        try {
          await gmail.users.messages.trash({ userId: "me", id });
          deleted++;
        } catch (err) {
          console.error(`Failed to delete email ${id}:`, err);
        }
      }

      res.json({ deleted, total: emailIds.length });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || "Delete failed" });
    }
  });


  app.get("/auth/url", (_req: Request, res: Response) => {
    try {
      const url = getAuthUrlForSetup();
      res.json({ authUrl: url });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Error generating auth URL" });
    }
  });

  app.get("/auth/google/callback", async (req: Request, res: Response) => {
    try {
      const code = req.query.code as string;
      if (!code) {
        return res.status(400).send("Missing authorization code");
      }

      const client = createOAuthClient();
      const { tokens } = await client.getToken(code);

      res.send(`
     <html>
       <head><title>Authorization Successful</title></head>
       <body style="font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto;">
         <h1 style="color: #4CAF50;">✅ Authorization Successful!</h1>
         <p>Copy this refresh token and add it to your <code>.env</code> file:</p>
         <pre style="background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto;">GMAIL_REFRESH_TOKEN=${tokens.refresh_token}</pre>
         <p><strong>Then restart your server with:</strong></p>
         <pre style="background: #f4f4f4; padding: 15px; border-radius: 5px;">npm run dev</pre>
       </body>
     </html>
   `);
    } catch (err: any) {
      console.error("OAuth callback error:", err);
      res.status(500).json({ error: err.message || "OAuth error" });
    }
  });

  app.get("/emails/unfortunately", async (_req: Request, res: Response) => {
    try {
      const query = "unfortunately";
      const messages = await fetchMessages(gmail, query);
      res.json({ query, count: messages.length, messages });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || "Unknown error" });
    }
  });



  app.post("/backup/unfortunately", async (_req: Request, res: Response) => {
    try {
      const query = "unfortunately";
      const messages = await fetchMessages(gmail, query);
      const filePath = saveBackupToFile(messages, "unfortunately");
      res.json({
        query,
        count: messages.length,
        backupFile: filePath,
      });
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
