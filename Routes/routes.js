const express = require('express');
const path = require('path');
const { scrapeWebsite, scrapeData } = require('../utility/utils');

const router = express.Router();

// Serve static files (e.g., index.html)
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Main POST route
router.post('/', async (req, res) => {
    const prompt = req.body.prompt;

    // Validate that the prompt is provided
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        const data = await scrapeData(prompt);
        res.json(data);
    } catch (error) {
        console.error('Error in main POST handler:', error.message);
        // Send a user-friendly error message in case of failure
        res.status(500).json({
            error: 'Failed to retrieve data from one or more sources. Please try again later.',
        });
    }
});

module.exports = router;
