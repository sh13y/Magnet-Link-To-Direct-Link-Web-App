# 🧙‍♂️ Magnet to Direct - WebTorrent Converter

> Turn your magnet links into direct downloads, because sharing shouldn't require a degree in computer science! 

## 🎭 What's This Magic?
Ever tried sharing a torrent and got the response "What's a magnet link?" 🤔
This app is your savior - it converts those cryptic magnet links into normal, friendly download links!

## ✨ Features That Make You Go "Wow!"
- 🚀 Real-time download progress (with fancy progress bars!)
- 🌓 Dark mode (for your 3 AM downloading sessions)
- 📱 Works on phones (yes, even on that old iPhone!)
- 🎨 Beautiful UI (because we're not savages)
- 🔄 Individual file downloads (why wait for everything?)
- 📊 Live stats (speed, time, size - we've got all the numbers!)

## 📁 Project Structure
```bash
webtorrent-webrtc-app/
├── api/
│   └── index.js           # API endpoints & WebTorrent logic
├── public/
│   ├── index.html         # Frontend UI with styles
│   └── app.js            # Frontend JavaScript
├── server.js             # Development server
├── package.json          # Dependencies & scripts
├── vercel.json           # Vercel deployment config
└── .gitignore           # Git ignore rules
```

## 🏃‍♂️ Quick Start (Ready, Set, Go!)

```bash
# Clone this beauty
git clone https://github.com/sh13y/Magnet-Link-To-Direct-Link-Web-App

# Jump into the folder
cd Magnet-Link-To-Direct-Link-Web-App

# Install the goodies
npm install

# Fire it up!
npm run dev
```

## 🎮 How to Use (It's Super Easy!)

### Basic Usage
1. Copy your magnet link
2. Paste it in the box
3. Click "Convert"
4. Watch the magic happen
5. Download your files

### Example Magnet Links for Testing
```bash
# Ubuntu 22.04 (Small)
magnet:?xt=urn:btih:3b245504cf5f11bbdbe1201cea6a6bf45aee1bc0

# Big Buck Bunny (Medium)
magnet:?xt=urn:btih:dd8255ecdc7ca55fb0bbf81323d87062db1f6d1c

# Blender Demo Files (Large)
magnet:?xt=urn:btih:a9a8257fbc7726a891e94f04500fb7c51df25e69
```

## 🚀 Deployment Options

### 1. Vercel (The Easy Way)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to the cloud
vercel

# Follow the prompts...
```

### 2. VPS (The Pro Way)
```bash
# Install PM2
npm i -g pm2

# Start the app
npm run start

# Or with PM2
pm2 start server.js --name magnet-converter

# Monitor logs
pm2 logs magnet-converter
```

### 3. Docker (The Cool Way)
```bash
# Build the image
docker build -t magnet-converter .

# Run the container
docker run -p 3000:3000 magnet-converter

# With persistent storage
docker run -p 3000:3000 -v /your/path:/app/downloads magnet-converter
```

## 🐛 Troubleshooting (When Things Go South)

### Common Issues & Solutions

#### "It's not working!" 
- Is your internet alive? (`ping 8.8.8.8`)
- Did you try turning it off and on again? (`npm run dev`)
- Check the logs (`pm2 logs` or `docker logs`)

#### "It's downloading slowly!"
```javascript
// Typical download speeds:
{
    "Good": "> 1 MB/s",
    "Okay": "500 KB/s - 1 MB/s",
    "Bad": "< 500 KB/s",
    "Solution": "More seeders needed!"
}
```

### Error Codes
```bash
ERROR 1: "Invalid magnet link" 
  → Check your magnet link format

ERROR 2: "No peers found"
  → Wait for peers or try another magnet

ERROR 3: "Download failed"
  → Check network/firewall settings
```

## 💻 Development

### Environment Variables
```env
# Required
PORT=3000              # Server port
NODE_ENV=development   # Environment (development/production)

# Optional
CLEANUP_TIMEOUT=3600   # Time before deleting completed downloads (seconds)
MAX_DOWNLOADS=10       # Maximum concurrent downloads
```

### Available Scripts
```bash
# Development
npm run dev      # Start development server with hot reload

# Production
npm start        # Start production server
npm run build    # Build for production

# Maintenance
npm run clean    # Clean temporary files
npm run logs     # Show PM2 logs
```

## 🤝 Want to Help?
- Found a bug? Open an issue with reproduction steps!
- Want to add something cool? PRs are welcome!
- Know how to make it faster? We're all ears!

## ⭐ Show Some Love
If this tool saved you from explaining torrents to your non-tech friends,
consider starring the repo. It's free and makes me happy! 😊

## 🎉 Special Thanks
- Coffee (the real MVP)
- Stack Overflow (my second home)
- The rubber duck on my desk (best debugger ever)
- You (for reading this far! 🎉)

## 📝 License
MIT License - Go wild, just don't blame us if your downloads include cat videos instead of Linux ISOs!

Remember: With great power comes great download responsibility! 🦸‍♂️

---
Made with ❤️ and probably too much caffeine ☕
```