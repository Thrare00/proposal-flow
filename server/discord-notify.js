import { readFileSync, existsSync } from 'node:fs';
import https from 'node:https';

const CHANNEL_ID = '1522611618222047453'; // #proposal-updates
const CONFIG = '/home/morpheus/.openclaw/openclaw.json';

let cachedToken;
function getToken() {
  if (cachedToken !== undefined) return cachedToken;
  try {
    if (!existsSync(CONFIG)) { cachedToken = ''; return cachedToken; }
    const cfg = JSON.parse(readFileSync(CONFIG, 'utf8'));
    cachedToken = cfg?.channels?.discord?.accounts?.default?.token || '';
  } catch { cachedToken = ''; }
  return cachedToken;
}

// Fire-and-forget Discord post to #proposal-updates. No-op off-server (no
// config/token, e.g. local dev). Never throws, never blocks the request.
export function notifyProposalUpdate(message) {
  try {
    const token = getToken();
    if (!token || !message) return;
    const body = JSON.stringify({ content: String(message).slice(0, 1900) });
    const req = https.request({
      hostname: 'discord.com',
      path: `/api/v10/channels/${CHANNEL_ID}/messages`,
      method: 'POST',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'DiscordBot (https://github.com/Thrare00/proposal-flow, 1.0)',
      },
      timeout: 10000,
    }, (res) => { res.resume(); });
    req.on('error', () => {});
    req.on('timeout', () => req.destroy());
    req.write(body);
    req.end();
  } catch { /* ignore */ }
}
