
import { google, gmail_v1 } from "googleapis";
import { SimpleMessage } from "../types";
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
   maxResults: 1000,
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
