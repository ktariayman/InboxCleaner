import fs from "fs";
import path from "path";
import { google, gmail_v1 } from "googleapis";
import { SimpleMessage } from "../types";
import { FETCH_MAX_RESULTS, SCOPES } from "../constants/constants";

export function createOAuthClient() {
 const clientId = process.env.GOOGLE_CLIENT_ID;
 const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
 const redirectUri = process.env.GOOGLE_REDIRECT_URI;
 const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

 if (!clientId || !clientSecret || !redirectUri) {
  throw new Error("Missing Google OAuth env vars (GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI)");
 }

 const client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

 if (refreshToken) {
  client.setCredentials({ refresh_token: refreshToken });
 }

 return client;
}

export function getAuthUrlForSetup() {
 const client = createOAuthClient();
 const url = client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  prompt: "consent",
 });
 return url;
}

export async function authorize() {
 const client = createOAuthClient();
 return client;
}




export async function fetchMessages(gmail: gmail_v1.Gmail, query: string): Promise<SimpleMessage[]> {
 const ids: string[] = [];
 let pageToken: string | undefined = undefined;

 do {
  const response: gmail_v1.Schema$ListMessagesResponse = (await gmail.users.messages.list({
   userId: "me",
   q: query,
   maxResults: FETCH_MAX_RESULTS,
   pageToken,
  })).data;

  const messages = response.messages || [];
  ids.push(...messages.map((m: gmail_v1.Schema$Message) => m.id!));
  pageToken = response.nextPageToken ?? undefined;
 } while (pageToken);

 if (!ids.length) return [];

 const results: SimpleMessage[] = [];
 for (const id of ids) {
  const response = await gmail.users.messages.get({
   userId: "me",
   id,
   format: "metadata",
   metadataHeaders: ["From", "To", "Subject", "Date"],
  });

  const msg = response.data;
  const headers = msg.payload?.headers || [];
  const getHeader = (name: string) =>
   headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value;

  results.push({
   id: msg.id!,
   threadId: msg.threadId!,
   snippet: msg.snippet || "",
   internalDate: msg.internalDate || undefined,
   from: getHeader("From") || undefined,
   to: getHeader("To") || undefined,
   subject: getHeader("Subject") || undefined,
   date: getHeader("Date") || undefined,
  });
 }

 return results;
}

export function ensureBackupDir(): string {
 const dir = path.join(__dirname, "backups");
 if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
 }
 return dir;
}

export function saveBackupToFile(messages: SimpleMessage[], label: string): string {
 const dir = ensureBackupDir();
 const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
 const filePath = path.join(dir, `${label}-${timestamp}.json`);
 fs.writeFileSync(filePath, JSON.stringify({ count: messages.length, messages }, null, 2));
 return filePath;
}