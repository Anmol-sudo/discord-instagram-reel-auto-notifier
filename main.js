import fetch from "node-fetch";
import pkg from "pg";
import "dotenv/config";
import express from "express";

const { Client } = pkg;

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;
const DATABASE_URL = process.env.DATABASE_URL;
const INTERVAL = process.env.INTERVAL;

// ✅ PostgreSQL Setup
const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

// Ensure table exists
await client.query(`
  CREATE TABLE IF NOT EXISTS last_post (
    id SERIAL PRIMARY KEY,
    post_id TEXT UNIQUE
  );
`);

async function getLatestPost() {
  const url = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${ACCESS_TOKEN}`;
  const res = await fetch(url);
  const json = await res.json();
  return json.data ? json.data[0] : null;
}

async function getLastPostId() {
  const res = await client.query(
    "SELECT post_id FROM last_post ORDER BY id DESC LIMIT 1"
  );
  return res.rows[0]?.post_id || null;
}

async function setLastPostId(id) {
  await client.query(
    `INSERT INTO last_post (post_id) VALUES ($1)
     ON CONFLICT (post_id) DO NOTHING`,
    [id]
  );
}

async function sendToDiscord(post) {
  // Helper: format "time ago"
  const timeAgo = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
    const intervals = [
      { label: "year", seconds: 31536000 },
      { label: "month", seconds: 2592000 },
      { label: "week", seconds: 604800 },
      { label: "day", seconds: 86400 },
      { label: "hour", seconds: 3600 },
      { label: "minute", seconds: 60 },
      { label: "second", seconds: 1 },
    ];
    for (const i of intervals) {
      const count = Math.floor(seconds / i.seconds);
      if (count >= 1) return `${count} ${i.label}${count > 1 ? "s" : ""} ago`;
    }
    return "just now";
  };

  // 📝 Truncate caption for better readability
  const caption =
    post.caption && post.caption.length > 200
      ? post.caption.substring(0, 197) + "..."
      : post.caption || "(No caption)";

  // 🎨 Embed layout (optimized for portrait reels)
  const embed = {
    title: "🎬 New Instagram Reel!",
    description: caption,
    url: post.permalink,
    color: 0xe1306c, // Instagram pink
    fields: [
      {
        name: "⠀", // invisible space for cleaner spacing
        value: `[📲 **View on Instagram**](${post.permalink})`,
        inline: false,
      },
    ],
    image: {
      // Prefer the media_url for portrait clarity (Discord auto-scales it)
      url: post.media_url || post.thumbnail_url || null,
    },
    footer: {
      text: `📸 Posted ${timeAgo(post.timestamp)} | ${new Date(
        post.timestamp
      ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      icon_url:
        "https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png",
    },
    timestamp: new Date().toISOString(),
  };

  const payload = {
    content: "🚨 **New Instagram Reel just dropped!** 🔥",
    username: "Instagram Alerts",
    avatar_url:
      "https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png",
    embeds: [embed],
  };

  try {
    const response = await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ Discord webhook failed:", response.status, text);
    } else {
      console.log("✅ Sent embed to Discord!");
    }
  } catch (error) {
    console.error("⚠️ Error sending embed:", error);
  }
}

let isProcessing = false;

async function main() {
  if (isProcessing) {
    console.log("⏳ Still processing, skipping this interval...");
    return;
  }
  isProcessing = true;

  try {
    const latest = await getLatestPost();
    if (!latest) return console.log("No post found.");

    const lastId = await getLastPostId();

    if (latest.id !== lastId) {
      console.log("📢 New post detected:", latest.permalink);
      await sendToDiscord(latest);
      await setLastPostId(latest.id);
    } else {
      console.log("No new post yet.");
    }
  } catch (err) {
    console.error("⚠️ Error:", err);
  } finally {
    setTimeout(() => (isProcessing = false), 5000);
  }
}

// Run every INTERVAL minutes (randomized small delay)
const randomDelay = Math.floor(Math.random() * 30) + 10; // 10–40 sec offset
setInterval(main, (INTERVAL * 60 + randomDelay) * 1000);
main();

// ✅ Web server (for Render uptime)
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) =>
  res.send("✅ Discord-Instagram notifier is running!")
);
app.listen(PORT, () => console.log(`🌐 Web server running on port ${PORT}`));
