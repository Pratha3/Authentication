/**
 * Baileys WhatsApp Client — completely free, no subscription needed.
 *
 * How it works:
 *   - Connects to WhatsApp using the WhatsApp Web multi-device protocol
 *   - On first start: prints a QR code in the terminal → scan with any WhatsApp account
 *   - Session is saved to disk → no need to scan again on restart
 *   - Can send messages to ANY WhatsApp number for free
 *
 * Setup:
 *   1. Start the server: npm start
 *   2. Open terminal → scan the QR code shown with your WhatsApp
 *   3. Done — messages will be sent automatically on registration
 *
 * .env: WHATSAPP_PROVIDER=baileys  (no other vars needed)
 */

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  proto,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import qrcode from "qrcode-terminal";
import path from "path";
import P from "pino";

const AUTH_DIR = path.join(process.cwd(), ".whatsapp-session");

type WASocket = ReturnType<typeof makeWASocket>;

let client: WASocket | null = null;
let isReady = false;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

const logger = P({ level: "silent" }); // suppress Baileys internal logs

// ── Connect / reconnect ───────────────────────────────────────────────────────
export async function initWhatsAppClient(): Promise<void> {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      logger,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      browser: ["EventSphere", "Chrome", "1.0.0"],
      syncFullHistory: false,
      generateHighQualityLinkPreview: false,
    });

    client = sock;

    // ── Auth events ──────────────────────────────────────────────────────────
    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        console.log("\n");
        console.log("════════════════════════════════════════════════════════");
        console.log("  📱  EventSphere — Scan with WhatsApp to connect");
        console.log("════════════════════════════════════════════════════════");
        qrcode.generate(qr, { small: true });
        console.log("  Open WhatsApp → 3-dot menu → Linked Devices → Link a Device");
        console.log("════════════════════════════════════════════════════════\n");
      }

      if (connection === "open") {
        isReady = true;
        console.log("✅ [WhatsApp] Connected — ready to send messages");
      }

      if (connection === "close") {
        isReady = false;
        client = null;
        const code = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = code !== DisconnectReason.loggedOut;

        if (shouldReconnect) {
          console.log(`[WhatsApp] Disconnected (code ${code}) — reconnecting in 5s…`);
          if (reconnectTimer) clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(initWhatsAppClient, 5000);
        } else {
          console.log("[WhatsApp] Logged out — delete .whatsapp-session/ and restart to re-scan");
        }
      }
    });
  } catch (err: any) {
    console.error("[WhatsApp] Init error:", err.message);
    // Retry after 10s
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(initWhatsAppClient, 10000);
  }
}

// ── Send a message ────────────────────────────────────────────────────────────
export async function sendWhatsAppMessage(
  to: string,
  text: string
): Promise<boolean> {
  if (!isReady || !client) {
    console.warn("[WhatsApp] Client not ready — message not sent");
    return false;
  }

  // Normalise number to JID format (remove +, add @s.whatsapp.net)
  const jid = to.replace(/^\+/, "").replace(/\D/g, "") + "@s.whatsapp.net";

  try {
    await client.sendMessage(jid, { text });
    console.log(`[WhatsApp] ✅ Sent to ${to}`);
    return true;
  } catch (err: any) {
    console.error(`[WhatsApp] Send error (${to}):`, err.message);
    return false;
  }
}

export function isWhatsAppReady(): boolean {
  return isReady;
}
