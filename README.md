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

## 🎓 Code Review for Beginners

### Project Structure Explained
```
Magnet-Link-To-Direct-Link-Web-App/
├── api/                  # Backend API code
│   └── index.js         # Main API logic
├── public/              # Frontend files
│   ├── index.html       # Main webpage
│   └── app.js          # Frontend JavaScript
└── src/
    └── server.js       # Development server
```

### Key Components Explained

#### 1. Frontend (`public/index.html` & `app.js`)
- **index.html**: Contains the user interface
  ```html
  <!-- Main input form -->
  <div class="input-group">
      <input type="text" id="magnetLink" placeholder="Paste your magnet link here">
      <button onclick="startDownload()">Convert</button>
  </div>

  <!-- Status display area -->
  <div id="status"></div>
  ```

- **app.js**: Handles user interactions
  ```javascript
  // When user clicks "Convert"
  function startDownload() {
      const magnetLink = document.getElementById('magnetLink').value;
      // Send magnet link to server
      fetch('/api/download', {
          method: 'POST',
          body: JSON.stringify({ magnet: magnetLink })
      });
  }

  // Check download progress every second
  setInterval(() => {
      checkStatus();
  }, 1000);
  ```

#### 2. Backend (`api/index.js`)
- **Main Components**:
  ```javascript
  // 1. Setup WebTorrent client
  const client = new WebTorrent({
      uploadLimit: ENABLE_UPLOAD ? -1 : 1024,  // Control upload speed
      maxConns: PEER_LIMIT                     // Control connections
  });

  // 2. Handle new download requests
  handler.post('/api/download', (req, res) => {
      const { magnet } = req.body;             // Get magnet link
      const downloadId = createUniqueId();      // Generate ID
      const torrent = client.add(magnet);      // Start download
      // Send response to user
  });

  // 3. Check download status
  handler.get('/api/status/:downloadId', (req, res) => {
      const torrent = downloads.get(req.params.downloadId);
      // Send progress info
  });
  ```

### Important Concepts for Beginners

1. **Environment Variables** (`.env`)
   ```env
   ENABLE_UPLOAD=true    # Control if uploading is allowed
   MAX_DOWNLOADS=10      # Maximum simultaneous downloads
   PEER_LIMIT=50        # Maximum peer connections
   ```
   - These control how the app behaves
   - Can be changed without modifying code

2. **API Endpoints**
   - `/api/download`: Start a new download
   - `/api/status`: Check download progress
   - `/api/downloads`: List all downloads

3. **WebTorrent Basics**
   ```javascript
   // Create a torrent
   const torrent = client.add(magnet);

   // Monitor progress
   torrent.on('download', (bytes) => {
       console.log('Progress:', torrent.progress);
   });

   // When download completes
   torrent.on('done', () => {
       console.log('Download complete!');
   });
   ```

### Common Customizations

1. **Change Download Location**
   ```env
   DOWNLOAD_PATH=./downloads  # Change where files are saved
   ```

2. **Adjust Upload Settings**
   ```env
   ENABLE_UPLOAD=false  # Disable uploading
   ```

3. **Control Connections**
   ```env
   PEER_LIMIT=30  # Reduce for slower connections
   ```

### Tips for Beginners
1. Start by understanding `public/app.js` - it's the simplest part
2. Look at `api/index.js` to see how downloads work
3. Use the environment variables to experiment with settings
4. Check the logs to understand what's happening
5. Use the example magnet links for testing

Need help? Check the troubleshooting section or open an issue!

## 📁 Project Structure
```bash
Magnet-Link-To-Direct-Link-Web-App/
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
> ⚠️ **Important Warning**: Vercel deployment is only suitable for demo/testing purposes! 
> Vercel has strict limitations on execution time and file operations that make it unsuitable for production use of WebTorrent applications. 
> For actual production use, please use a VPS or Docker deployment instead.

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to the cloud
vercel

# Follow the prompts...
```

### 2. VPS (The Pro Way)
```bash
# 1. First, install Node.js and npm on your VPS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Clone the repository
git clone https://github.com/sh13y/Magnet-Link-To-Direct-Link-Web-App
cd Magnet-Link-To-Direct-Link-Web-App

# 3. Install dependencies
npm install

# 4. Install PM2 globally
npm i -g pm2

# 5. Start the app with PM2
pm2 start server.js --name magnet-converter --node-args="--experimental-modules"

# Or alternatively, create an ecosystem file
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'magnet-converter',
    script: 'server.js',
    node_args: '--experimental-modules',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# Then start using the ecosystem file
pm2 start ecosystem.config.cjs

# Other useful PM2 commands:
pm2 logs magnet-converter    # View logs
pm2 status                   # Check status
pm2 restart magnet-converter # Restart app
pm2 stop magnet-converter    # Stop app
pm2 delete magnet-converter  # Remove app from PM2

# 6. Setup PM2 to start on system boot
pm2 startup
pm2 save

# 7. Optional: Setup basic firewall
sudo ufw allow 22           # SSH port
sudo ufw allow 3000         # App port
sudo ufw enable
```

> 💡 **Pro Tips for VPS:**
> - Use `screen` or `tmux` for persistent terminal sessions
> - Set up SSL with Nginx or Certbot for HTTPS
> - Keep your system updated: `sudo apt update && sudo apt upgrade`
> - Monitor disk space: `df -h`
> - Check system resources: `htop`

### 3. Docker (The Cool Way)
```bash
# 1. Create a Dockerfile if not exists
cat > Dockerfile << 'EOF'
FROM node:18-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
EOF

# 2. Build the image
docker build -t magnet-converter .

# 3. Run for testing
docker run -p 3000:3000 magnet-converter

# 4. Run in production
docker run -d \
  --name magnet-converter \
  -p 3000:3000 \
  -v $(pwd)/downloads:/app/downloads \
  --restart unless-stopped \
  magnet-converter

# 5. View logs
docker logs -f magnet-converter

# Other useful commands:
docker ps                    # List running containers
docker stop magnet-converter # Stop the container
docker start magnet-converter # Start the container
docker rm magnet-converter   # Remove the container
```

> 💡 **Docker Pro Tips:**
> - Use `docker-compose` for easier management
> - Set up container monitoring with Portainer
> - Use Docker volumes for persistent storage
> - Remember to clean up old containers and images

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

# WebTorrent Settings
ENABLE_UPLOAD=true     # Enable/disable uploading (true/false)
MAX_DOWNLOADS=10       # Maximum concurrent downloads
CLEANUP_TIMEOUT=3600   # Time before deleting completed downloads (seconds)
MIN_PERCENTAGE=0       # Minimum download percentage to show
MAX_PERCENTAGE=100     # Maximum download percentage to show
PEER_LIMIT=50         # Maximum peer connections
DOWNLOAD_PATH="./downloads"  # Path to save downloaded files
```

> 💡 **Pro Tip:** Create a `.env` file in your project root with these settings:
```bash
# Create .env file
cat > .env << 'EOF'
PORT=3000
NODE_ENV=production
ENABLE_UPLOAD=true
MAX_DOWNLOADS=10
CLEANUP_TIMEOUT=3600
MIN_PERCENTAGE=0
MAX_PERCENTAGE=100
PEER_LIMIT=50
DOWNLOAD_PATH="./downloads"
EOF
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

### Controlling Uploads and Downloads

#### Upload Control
- Set `ENABLE_UPLOAD=false` in `.env` to disable uploading (client becomes download-only)
- Set `ENABLE_UPLOAD=true` to allow uploading (default P2P behavior)

#### Download Progress
The app now properly handles download percentages:
- Prevents negative percentages
- Caps maximum percentage at 100%
- Shows accurate progress even with multiple files

Example progress display:
```javascript
{
    "Downloading": "45.6%",    // Normal progress
    "Starting": "0%",          // Initial state
    "Complete": "100%"         // Finished download
}
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
Made in Ceylon 🇱🇰 with ❤️ by sh13y and probably too much back pain 🦴 
(Send help... and a better chair! 🪑)
