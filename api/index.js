import express from 'express';
import WebTorrent from 'webtorrent';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const handler = express();
const client = new WebTorrent();
const downloads = new Map();

const CLEANUP_TIMEOUT = parseInt(process.env.CLEANUP_TIMEOUT) || 3600;
const MAX_DOWNLOADS = parseInt(process.env.MAX_DOWNLOADS) || 10;
const DOWNLOAD_PATH = process.env.DOWNLOAD_PATH || '/tmp/downloads';
const ENABLE_UPLOAD = process.env.ENABLE_UPLOAD === 'true';
const MIN_PERCENTAGE = parseFloat(process.env.MIN_PERCENTAGE || 0);
const MAX_PERCENTAGE = parseFloat(process.env.MAX_PERCENTAGE || 100);

// Important: Add these middleware before routes
handler.use(express.json());
handler.use(express.urlencoded({ extended: true }));

handler.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

handler.post('/api/download', (req, res) => {
    try {
        if (downloads.size >= MAX_DOWNLOADS) {
            return res.status(429).json({ error: 'Maximum concurrent downloads reached' });
        }

        console.log('Received request body:', req.body);
        const { magnet } = req.body;
        
        if (!magnet) {
            return res.status(400).json({ error: 'Magnet link is required' });
        }

        const downloadId = crypto.randomBytes(16).toString('hex');
        
        const torrent = client.add(magnet, { 
            path: `${DOWNLOAD_PATH}/${downloadId}`,
            uploadLimit: ENABLE_UPLOAD ? 0 : 1  // Limit upload to 1 byte/s if uploads disabled
        });
        
        downloads.set(downloadId, torrent);
        
        torrent.on('error', (err) => {
            console.error(`Torrent error for ${downloadId}:`, err);
        });

        // Add cleanup timeout
        torrent.on('done', () => {
            setTimeout(() => {
                torrent.destroy();
                downloads.delete(downloadId);
            }, CLEANUP_TIMEOUT * 1000);
        });

        res.json({ 
            downloadId,
            name: torrent.name || 'Unnamed Torrent'
        });
    } catch (error) {
        console.error('Detailed error:', error);
        res.status(500).json({ error: 'Failed to start download' });
    }
});

handler.get('/api/status/:downloadId', (req, res) => {
    try {
        const torrent = downloads.get(req.params.downloadId);
        if (!torrent) {
            return res.status(404).json({ error: 'Download not found' });
        }

        const files = torrent.files.map(file => ({
            name: file.name,
            size: file.length,
            progress: file.progress * 100,
            completed: file.progress === 1,
            downloadUrl: file.progress === 1 ? `/api/download/${req.params.downloadId}/${encodeURIComponent(file.name)}` : null
        }));

        if (torrent.done) {
            res.json({
                status: 'completed',
                name: torrent.name,
                files
            });
        } else {
            res.json({
                status: 'downloading',
                name: torrent.name,
                files,
                progress: normalizePercentage(torrent.progress),
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

handler.get('/api/download/:downloadId/:filename', (req, res) => {
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

handler.delete('/api/download/:downloadId', (req, res) => {
    try {
        const torrent = downloads.get(req.params.downloadId);
        if (!torrent) {
            return res.status(404).json({ error: 'Download not found' });
        }

        torrent.destroy();
        downloads.delete(req.params.downloadId);
        res.json({ message: 'Download cancelled' });
    } catch (error) {
        console.error('Cancel error:', error);
        res.status(500).json({ error: 'Failed to cancel download' });
    }
});

function normalizePercentage(progress) {
    const percentage = progress * 100;
    return Math.min(Math.max(percentage, MIN_PERCENTAGE), MAX_PERCENTAGE);
}

export default handler; 