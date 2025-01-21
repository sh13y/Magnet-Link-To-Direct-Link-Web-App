let activeDownloadId = null;
let statusCheckInterval = null;

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
        document.getElementById('status').innerHTML = 'Download started...';
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

function updateStatusDisplay(data) {
    let statusHtml = '';
    
    if (data.status === 'downloading') {
        const timeRemaining = Math.floor(data.timeRemaining / 1000);
        const downloadedBytes = formatBytes(data.downloaded);
        const uploadedBytes = formatBytes(data.uploaded);
        const progress = parseFloat(data.progress).toFixed(2);
        
        statusHtml = `
            <div class="status-card">
                <h3>Download Progress</h3>
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
            </div>
        `;
    } else if (data.status === 'completed') {
        clearInterval(statusCheckInterval);
        statusHtml = `
            <div class="status-card">
                <h3>Download Completed!</h3>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 100%"></div>
                </div>
                <div class="files-list">
                    <h4>Available Files:</h4>
                    ${data.files.map(file => `
                        <div class="file-item">
                            <span>${file.name}</span>
                            <a href="${file.downloadUrl}" class="download-link">
                                <i class="fas fa-download"></i> Download
                                (${formatBytes(file.size)})
                            </a>
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
