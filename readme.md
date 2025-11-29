
# 🎥 Discord Instagram Reel Auto-Notifier

A simple Node.js bot that automatically posts your latest **Instagram Reels** to a **Discord channel** — complete with captions, thumbnails, and an @everyone alert!  
Hosted **100% free** using [Render.com](https://render.com) 💜  

---

## ✨ Features

✅ Automatically checks your Instagram account for new reels  
✅ Posts them in your chosen Discord channel  
✅ Beautiful embed with caption, thumbnail, and timestamp  
✅ Pings `@everyone` (or a specific role)  
✅ Runs 24/7 on **Render Free Tier**  
✅ Easy setup with `.env` configuration  

---

## 🛠️ Tech Stack

- **Node.js** (JavaScript runtime)
- **Instagram Graph API**
- **Discord Webhooks**
- **Render** for hosting
- **dotenv** for secret management

---

## 🚀 Setup Guide

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/discord-insta-bot.git
cd discord-insta-bot
````

---

### 2️⃣ Install Dependencies

```bash
npm install
```

---

### 3️⃣ Create a `.env` File

Create a new file named `.env` in the project root and add your tokens:

```env
ACCESS_TOKEN=your_instagram_access_token
DISCORD_WEBHOOK=your_discord_webhook_url
```

> ⚠️ **Do not** share this file or push it to GitHub — keep your tokens private.

---

### 4️⃣ Run Locally

```bash
npm start
```

If configured correctly, you’ll see:

```
📢 New post detected: https://www.instagram.com/reel/XXXXXXXXX/
✅ Sent embed to Discord!
```

---

## 🌐 Deploy on Render (Free Hosting)

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/discord-insta-bot.git
git push -u origin main
```

### Step 2: Create a New Web Service

1. Go to [Render.com](https://render.com)
2. Click **New + → Web Service**
3. Connect your GitHub repository
4. Choose these settings:

| Option        | Value         |
| ------------- | ------------- |
| Build Command | `npm install` |
| Start Command | `npm start`   |
| Environment   | Node          |
| Instance Type | Free          |

5. Under **Environment Variables**, add:

   * `ACCESS_TOKEN` → your Instagram Graph API access token
   * `DISCORD_WEBHOOK` → your Discord webhook URL

6. Click **Create Web Service** 🚀

---

## 💡 Pro Tips

* ⏱️ Change the check interval in the code:

  ```js
  setInterval(main, 10 * 60 * 1000); // every 10 minutes
  ```
* 🔔 Replace `@everyone` with a role mention if you prefer:

  ```js
  content: "<@&ROLE_ID> 🚨 **New Instagram Reel!** 🔥",
  allowed_mentions: { roles: ["ROLE_ID"] },
  ```
* 🎨 Customize embed colors and footers to your liking.

---

## 🧠 How It Works

1. The bot uses the **Instagram Graph API** to fetch your recent media:

   ```
   https://graph.instagram.com/me/media?fields=id,caption,media_url,thumbnail_url,permalink,timestamp
   ```
2. It compares the latest post with the last stored ID.
3. If new, it sends a **Discord embed message** with the Reel’s caption, image, and link.
4. Runs continuously via **Render Web Service** with a lightweight Express server to stay alive.

---

## 🧰 Folder Structure

```
📦 discord-insta-bot
 ┣ 📜 instagram-discord.js
 ┣ 📜 package.json
 ┣ 📜 .env               # (private)
 ┗ 📜 lastPost.json      # Auto-created to store last reel ID
```

---

## ❤️ Credits

Developed with 💖 by [Anmol](https://github.com/Anmol-Sudo)
Inspired by the power of **Discord webhooks** and **Instagram Graph API**.

---

## 📜 License

MIT License © 2025
Free to use, modify, and share with credit.
