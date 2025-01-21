let activeDownloadId = null;
let statusCheckInterval = null;
let retryCount = 0;
const MAX_RETRIES = 3;

let speedChart;
const speedData = {
    labels: [],
    datasets: [{
        label: 'Download Speed (MB/s)',
        data: [],
        borderColor: '#4361ee',
        tension: 0.4
    }]
};

function startDownload() {
    const magnetLink = document.getElementById('magnetLink').value.trim();
    if (!magnetLink) {
        alert('Please enter a magnet link');
        return;
    }

    fetch('/api/download', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ magnet: magnetLink })
    })
    .then(response => response.json())
    .then(data => {
        activeDownloadId = data.downloadId;
        document.getElementById('status').innerHTML = `Starting download: ${data.name}...`;
        document.getElementById('cancelButton').style.display = 'inline-block';
        if (statusCheckInterval) clearInterval(statusCheckInterval);
        statusCheckInterval = setInterval(checkStatus, 1000);
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('status').innerHTML = 'Error starting download';
    });
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function checkStatus() {
    if (!activeDownloadId) return;

    fetch(`/api/status/${activeDownloadId}`)
        .then(response => response.json())
        .then(data => updateStatusDisplay(data))
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('status').innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    Error checking status
                </div>
            `;
        });
}

function formatTime(seconds) {
    if (seconds === Infinity) return 'Calculating...';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    let timeString = '';
    if (hours > 0) timeString += `${hours}h `;
    if (minutes > 0) timeString += `${minutes}m `;
    timeString += `${remainingSeconds}s`;

    return timeString;
}

function getFileIcon(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const icons = {
        mp4: 'fa-file-video',
        mkv: 'fa-file-video',
        mp3: 'fa-file-audio',
        pdf: 'fa-file-pdf',
        zip: 'fa-file-archive',
        rar: 'fa-file-archive',
        // Add more as needed
        default: 'fa-file'
    };
    return `fas ${icons[ext] || icons.default}`;
}

function updateStatusDisplay(data) {
    let statusHtml = '';
    
    if (data.status === 'downloading') {
        const timeRemaining = Math.floor(data.timeRemaining / 1000);
        const downloadedBytes = formatBytes(data.downloaded);
        const uploadedBytes = formatBytes(data.uploaded);
        const progress = parseFloat(data.progress).toFixed(2);
        
        statusHtml = `
            <div class="status-card">
                <h3>${data.name || 'Downloading...'}</h3>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <div style="text-align: center; margin-bottom: 10px;">
                    ${progress}% Complete
                </div>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-label">Download Speed</div>
                        <div class="stat-value">${data.downloadSpeed} MB/s</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Time Remaining</div>
                        <div class="stat-value">${formatTime(timeRemaining)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Connected Peers</div>
                        <div class="stat-value">${data.peers}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Downloaded</div>
                        <div class="stat-value">${downloadedBytes}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Uploaded</div>
                        <div class="stat-value">${uploadedBytes}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Share Ratio</div>
                        <div class="stat-value">${(data.uploaded / (data.downloaded || 1)).toFixed(2)}</div>
                    </div>
                </div>

                <div class="files-list">
                    <h4>Files:</h4>
                    ${data.files.map(file => `
                        <div class="file-item">
                            <div class="file-info">
                                <span class="file-name">
                                    <i class="${getFileIcon(file.name)}"></i>
                                    ${file.name}
                                </span>
                                <div class="file-progress">
                                    <div class="progress-bar small">
                                        <div class="progress-fill" style="width: ${file.progress}%"></div>
                                    </div>
                                    <span class="progress-text">${file.progress.toFixed(1)}%</span>
                                </div>
                            </div>
                            <div class="file-actions">
                                <span class="file-size">${formatBytes(file.size)}</span>
                                ${file.completed ? `
                                    <a href="${file.downloadUrl}" class="download-link">
                                        <i class="fas fa-download"></i> Download
                                    </a>
                                    <button onclick="copyToClipboard('${file.downloadUrl}')" class="copy-btn">
                                        <i class="fas fa-copy"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } else if (data.status === 'completed') {
        clearInterval(statusCheckInterval);
        statusHtml = `
            <div class="status-card">
                <h3>${data.name} - Completed!</h3>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 100%"></div>
                </div>
                <div class="files-list">
                    <h4>Available Files:</h4>
                    ${data.files.map(file => `
                        <div class="file-item">
                            <div class="file-info">
                                <span class="file-name">
                                    <i class="${getFileIcon(file.name)}"></i>
                                    ${file.name}
                                </span>
                                <span class="file-size">${formatBytes(file.size)}</span>
                            </div>
                            <a href="${file.downloadUrl}" class="download-link">
                                <i class="fas fa-download"></i> Download
                            </a>
                            <button onclick="copyToClipboard('${file.downloadUrl}')" class="copy-btn">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } else if (data.status === 'error') {
        clearInterval(statusCheckInterval);
        statusHtml = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                Error: ${data.message}
            </div>
        `;
    }

    document.getElementById('status').innerHTML = statusHtml;
}

function cancelDownload() {
    if (!activeDownloadId) return;
    
    fetch(`/api/download/${activeDownloadId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('status').innerHTML = 'Download cancelled';
        document.getElementById('cancelButton').style.display = 'none';
        clearInterval(statusCheckInterval);
        activeDownloadId = null;
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Show success message
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = 'Copied!';
        document.body.appendChild(tooltip);
        setTimeout(() => tooltip.remove(), 2000);
    });
}

function updateSpeedChart(speed) {
    const now = new Date();
    speedData.labels.push(now.toLocaleTimeString());
    speedData.datasets[0].data.push(speed);
    
    // Keep last 20 points
    if (speedData.labels.length > 20) {
        speedData.labels.shift();
        speedData.datasets[0].data.shift();
    }
    
    speedChart.update();
}

function startDownloadWithRetry() {
    startDownload().catch(error => {
        if (retryCount < MAX_RETRIES) {
            retryCount++;
            console.log(`Retry attempt ${retryCount}`);
            setTimeout(startDownloadWithRetry, 1000 * retryCount);
        } else {
            showError('Failed to start download after multiple attempts');
        }
    });
}
