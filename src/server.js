import express from 'express';
import WebTorrent from 'webtorrent';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const client = new WebTorrent();
const downloads = new Map();

// In-memory storage for Vercel's serverless environment
const downloadPaths = new Map();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Modified to work with Vercel's serverless functions
const api = express.Router();

api.post('/api/download', (req, res) => {
    try {
        const { magnet } = req.body;
        const downloadId = crypto.randomBytes(16).toString('hex');
        
        const torrent = client.add(magnet, { 
            path: `/tmp/${downloadId}` // Use temporary storage
        });
        
        downloads.set(downloadId, torrent);
        downloadPaths.set(downloadId, `/tmp/${downloadId}`);
        
        torrent.on('error', (err) => {
            console.error(`Torrent error for ${downloadId}:`, err);
        });

        res.json({ downloadId });
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Failed to start download' });
    }
});

api.get('/api/status/:downloadId', (req, res) => {
    try {
        const torrent = downloads.get(req.params.downloadId);
        if (!torrent) {
            return res.status(404).json({ error: 'Download not found' });
        }

        if (torrent.done) {
            const files = torrent.files.map(file => ({
                name: file.name,
                size: file.length,
                downloadUrl: `/api/download/${req.params.downloadId}/${encodeURIComponent(file.name)}`
            }));
            
            res.json({
                status: 'completed',
                files
            });
        } else {
            res.json({
                status: 'downloading',
                progress: (torrent.progress * 100),
                downloadSpeed: (torrent.downloadSpeed / (1024 * 1024)).toFixed(2),
                uploaded: torrent.uploaded,
                downloaded: torrent.downloaded,
                peers: torrent.numPeers,
                timeRemaining: torrent.timeRemaining
            });
        }
    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({ error: 'Failed to get status' });
    }
});

api.get('/api/download/:downloadId/:filename', (req, res) => {
    try {
        const torrent = downloads.get(req.params.downloadId);
        if (!torrent) {
            return res.status(404).json({ error: 'Download not found' });
        }

        const file = torrent.files.find(f => f.name === decodeURIComponent(req.params.filename));
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
        file.createReadStream().pipe(res);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Failed to download file' });
    }
});

api.delete('/api/download/:downloadId', (req, res) => {
    try {
        const torrent = downloads.get(req.params.downloadId);
        if (!torrent) {
            return res.status(404).json({ error: 'Download not found' });
        }

        torrent.destroy();
        downloads.delete(req.params.downloadId);
        downloadPaths.delete(req.params.downloadId);
        res.json({ message: 'Download cancelled' });
    } catch (error) {
        console.error('Cancel error:', error);
        res.status(500).json({ error: 'Failed to cancel download' });
    }
});

// Export the Express API
export default api;

// Only start the server in development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.use(api);
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
