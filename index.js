require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const port = process.env.PORT || 3000;
const app = express();

// Enable JSON parsing in Express
app.use(express.json());

// CORS configuration: Restrict to specific domains (important for production)
app.use(cors({
    origin: 'https://intelli-chat-two.vercel.app' // Allow only this domain in production
}));

// Rate Limiting to prevent abuse
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 100 // Limit each IP to 100 requests per window
});
app.use(limiter);

// Serve static files from the 'client' directory
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'))
})

// Main POST route
app.post('/', async (req, res) => {
    const prompt = req.body.prompt;

    // Validate that the prompt is provided
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }
    
    const url = `https://www.google.com/search?q=${encodeURIComponent(prompt)}`;
    
    try {
        // Perform the Google search request
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
            }
        });

        // Load the HTML into Cheerio
        const $ = cheerio.load(data);

        // Ensure there is data in the response
        if (!$('div.BNeawe').length) {
            return res.status(404).json({ error: 'No data found in the response' });
        }

        // Extracting data from Google search results (first 4 items)
        let vectorData = [];
        $('div.BNeawe').slice(0, 4).each((index, element) => {
            vectorData.push($(element).text());
        });

        // Find the longest data in the vectorData array
        const longestData = vectorData.reduce((current, val) => current.length > val.length ? current : val, '');

        // If no data is found in the vector
        if (vectorData.length === 0) {
            return res.status(404).json({ error: 'No results found' });
        }

        // Send the extracted data as a response
        res.json({ longestData, vectorData });

    } catch (error) {
        console.error('Error:', error.message);
        // Send a user-friendly error message in case of failure
        res.status(500).json({ error: 'Failed to retrieve data from Google Search. Please try again later.' });
    }
});

// Start the Express server
app.listen(port, () => {
   
});
