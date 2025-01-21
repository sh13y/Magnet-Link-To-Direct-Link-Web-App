import express from 'express';
import api from './api/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Add middleware before routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static('public'));

// Use the API routes
app.use(api);

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
}); 