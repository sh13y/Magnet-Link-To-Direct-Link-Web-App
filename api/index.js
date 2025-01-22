import express from 'express';
import WebTorrent from 'webtorrent';
import crypto from 'crypto';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Initialize all environment variables first
const CLEANUP_TIMEOUT = parseInt(process.env.CLEANUP_TIMEOUT) || 3600;
const MAX_DOWNLOADS = parseInt(process.env.MAX_DOWNLOADS) || 10;
const DOWNLOAD_PATH = process.env.DOWNLOAD_PATH || path.join(process.cwd(), 'downloads');
const ENABLE_UPLOAD = process.env.ENABLE_UPLOAD === 'true';
const MIN_PERCENTAGE = parseFloat(process.env.MIN_PERCENTAGE || 0);
const MAX_PERCENTAGE = parseFloat(process.env.MAX_PERCENTAGE || 100);
const PEER_LIMIT = parseInt(process.env.PEER_LIMIT) || 100;

// Then initialize express and WebTorrent with the config
const handler = express();
const client = new WebTorrent({
    uploadLimit: ENABLE_UPLOAD ? -1 : 1024,  // 1KB/s when disabled, unlimited when enabled
    maxConns: PEER_LIMIT,
    downloadLimit: -1  // No download limit
});
const downloads = new Map();

// Create download directory if it doesn't exist
try {
    if (!fs.existsSync(DOWNLOAD_PATH)) {
        fs.mkdirSync(DOWNLOAD_PATH, { recursive: true });
        console.log(`Created download directory: ${DOWNLOAD_PATH}`);
    }
} catch (error) {
    console.error(`Failed to create download directory: ${error.message}`);
}

// Important: Add these middleware before routes
handler.use(express.json());
handler.use(express.urlencoded({ extended: true }));

handler.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Add this helper function at the top
function getTorrentByInfoHash(infoHash) {
    for (const torrent of client.torrents) {
        if (torrent.infoHash === infoHash) {
            return torrent;
        }
    }
    return null;
}

// Update the download handler
handler.post('/api/download', (req, res) => {
    try {
        console.log('Received request body:', req.body);
        const { magnet } = req.body;
        
        if (!magnet) {
            return res.status(400).json({ error: 'Magnet link is required' });
        }

        // Extract infoHash from magnet link
        const infoHash = magnet.match(/btih:([a-fA-F0-9]+)/i)?.[1]?.toLowerCase();
        if (!infoHash) {
            return res.status(400).json({ error: 'Invalid magnet link' });
        }

        // Check if torrent already exists
        const existingTorrent = getTorrentByInfoHash(infoHash);
        if (existingTorrent) {
            // Find existing downloadId
            let existingDownloadId;
            for (const [id, torrent] of downloads.entries()) {
                if (torrent.infoHash === infoHash) {
                    existingDownloadId = id;
                    break;
                }
            }

            if (existingDownloadId) {
                console.log(`Returning existing download ID: ${existingDownloadId}`);
                const files = existingTorrent.files.map(file => ({
                    name: file.name,
                    size: file.length,
                    progress: file.progress * 100,
                    completed: file.progress === 1,
                    downloadUrl: file.progress === 1 ? `/api/download/${existingDownloadId}/${encodeURIComponent(file.name)}` : null
                }));

                return res.json({
                    downloadId: existingDownloadId,
                    name: existingTorrent.name,
                    files,
                    status: 'downloading',
                    progress: normalizePercentage(existingTorrent.progress),
                    downloadSpeed: (existingTorrent.downloadSpeed / (1024 * 1024)).toFixed(2),
                    uploaded: ENABLE_UPLOAD ? existingTorrent.uploaded : 0,
                    downloaded: existingTorrent.downloaded,
                    peers: existingTorrent.numPeers,
                    timeRemaining: existingTorrent.timeRemaining
                });
            }
        }

        if (downloads.size >= MAX_DOWNLOADS) {
            return res.status(429).json({ error: 'Maximum concurrent downloads reached' });
        }

        const downloadId = crypto.randomBytes(16).toString('hex');
        const downloadPath = path.join(DOWNLOAD_PATH, downloadId);

        // Create specific download directory
        fs.mkdirSync(downloadPath, { recursive: true });
        
        const torrent = existingTorrent || client.add(magnet, { 
            path: downloadPath,
            private: !ENABLE_UPLOAD,
            maxWebConns: ENABLE_UPLOAD ? PEER_LIMIT : 10,
            announce: [
                "wss://tracker.openwebtorrent.com",
                "wss://tracker.btorrent.xyz"
            ]
        });
        
        downloads.set(downloadId, torrent);

        // Wait for torrent metadata before sending response
        torrent.on('metadata', () => {
            console.log('Got metadata, torrent name:', torrent.name);
        });
        
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

        const files = torrent.files?.map(file => ({
            name: file.name,
            size: file.length,
            progress: 0,
            completed: false,
            downloadUrl: null
        })) || [];

        res.json({
            downloadId,
            name: torrent.name || 'Initializing...',
            status: 'downloading',
            files,
            progress: 0,
            downloadSpeed: '0.00',
            uploaded: 0,
            downloaded: 0,
            peers: 0,
            timeRemaining: 0
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

// Add a new endpoint to list all available downloads
handler.get('/api/downloads', (req, res) => {
    try {
        const availableDownloads = [];
        for (const [downloadId, torrent] of downloads) {
            availableDownloads.push({
                downloadId,
                name: torrent.name,
                progress: normalizePercentage(torrent.progress),
                files: torrent.files.map(file => ({
                    name: file.name,
                    size: file.length,
                    progress: file.progress * 100,
                    completed: file.progress === 1,
                    downloadUrl: file.progress === 1 ? 
                        `/api/download/${downloadId}/${encodeURIComponent(file.name)}` : null
                }))
            });
        }
        res.json(availableDownloads);
    } catch (error) {
        console.error('Error listing downloads:', error);
        res.status(500).json({ error: 'Failed to list downloads' });
    }
});

function normalizePercentage(progress) {
    const percentage = progress * 100;
    return Math.min(Math.max(percentage, MIN_PERCENTAGE), MAX_PERCENTAGE);
}

export default handler; 