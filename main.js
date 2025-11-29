import fetch from "node-fetch";
import fs from "fs";
import "dotenv/config";

const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // From Graph API
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK; // From Discord

const DATA_FILE = "./lastPost.json"; // Stores last post ID between runs

async function getLatestPost() {
  const url = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${ACCESS_TOKEN}`;
  const res = await fetch(url);
  const json = await res.json();
  return json.data ? json.data[0] : null;
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

  // Truncate caption
  const caption =
    post.caption && post.caption.length > 200
      ? post.caption.substring(0, 197) + "..."
      : post.caption || "(No caption)";

  // Create embed
  const embed = {
    title: "🎥 New Instagram Reel!",
    description: caption,
    url: post.permalink,
    color: 0xe1306c, // Instagram pink
    image: {
      url: post.thumbnail_url || post.media_url || null,
    },
    footer: {
      text: `📸 Posted ${timeAgo(post.timestamp)} on Instagram`,
      icon_url:
        "https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png",
    },
    timestamp: new Date().toISOString(),
  };

  // Add a "View Reel" button using components
  const payload = {
    content: "🚨 **New Instagram Reel just dropped!** 🔥",
    username: "Instagram Alerts",
    avatar_url:
      "https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png",
    embeds: [embed],
    components: [
      {
        type: 1, // Action Row
        components: [
          {
            type: 2, // Button
            label: "🎬 View Reel",
            style: 5, // Link style
            url: post.permalink,
          },
        ],
      },
    ]
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
      console.log("✅ Sent beautiful embed to Discord!");
    }
  } catch (error) {
    console.error("⚠️ Error sending embed:", error);
  }
}


async function main() {
  const latest = await getLatestPost();
  if (!latest) return console.log("No post found.");

  // Read last saved post
  let lastId = null;
  if (fs.existsSync(DATA_FILE)) {
    lastId = JSON.parse(fs.readFileSync(DATA_FILE, "utf8")).id;
  }

  // Compare post IDs
  if (latest.id !== lastId) {
    console.log("📢 New post detected:", latest.permalink);
    await sendToDiscord(latest);
    fs.writeFileSync(DATA_FILE, JSON.stringify({ id: latest.id }, null, 2));
  } else {
    console.log("No new post yet.");
  }
}

// Run every 10 minutes
setInterval(main, 10 * 60 * 1000);
main();
