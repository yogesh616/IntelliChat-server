require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path');

const port = process.env.PORT || 3000;
const app = express();

// Enable JSON parsing in Express
app.use(express.json());

// CORS configuration: Adjust origin for production
app.use(cors({
    origin: '*' // Replace '*' with a specific domain for production security
}));

// Serve static files (e.g., index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Helper function for scraping data from a URL with error handling
const scrapeWebsite = async (url) => {
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
            }
        });
        return cheerio.load(data); // Load HTML into Cheerio
    } catch (error) {
        console.error(`Error scraping ${url}:`, error.message);
        return null; // Return null to handle this later in the code
    }
};

// Main POST route
app.post('/', async (req, res) => {
    const prompt = req.body.prompt;

    // Validate that the prompt is provided
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    // URLs for Google, Yahoo, and Bing
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(prompt)}`;
    const yahooUrl = `https://in.search.yahoo.com/search?p=${encodeURIComponent(prompt)}`;
    const bingUrl = `https://www.bing.com/search?q=${encodeURIComponent(prompt)}`;

    try {
        // Scrape Google, Yahoo, and Bing in parallel
        const [googleData, yahooData, bingData] = await Promise.all([
            scrapeWebsite(googleUrl),
            scrapeWebsite(yahooUrl),
            scrapeWebsite(bingUrl)
        ]);

        // Google results extraction
        let googleResults = [];
        let audioURL; // Default to null in case no audio is found
        if (googleData) {
            googleData('div.BNeawe').slice(0, 4).each((index, element) => {
                googleResults.push(googleData(element).text());
            });

            // Extracting audio URL
            const results = googleData('div.egMi0');
            const resultLinks = results.find('a').attr('href');
            if (resultLinks) {
                const URLParams = new URLSearchParams(resultLinks);
                const mainURL = URLParams.get('url');
                if (mainURL) {
                    try {
                        const response = await axios.get(mainURL, {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
                            }
                        });
                        const $data = cheerio.load(response.data);
                        audioURL = encodeURI($data('audio source').attr('src')) || null;
                    } catch (err) {
                        console.error('Error fetching audio URL:', err.message);
                    }
                }
            }
        } else {
            console.warn('No data retrieved from Google');
        }

        // Find the longest result from Google results
        let longestData = googleResults.reduce((longest, current) => {
            return current.length > longest.length ? current : longest;
        }, "");

        // Yahoo results extraction
        let yahooSummary = {};
        if (yahooData) {
            yahooSummary.href = yahooData('a.thmb').attr('href') || null;
            yahooSummary.src = yahooData('img.s-img').attr('src') || null;
        } else {
            console.warn('No data retrieved from Yahoo');
        }

        // Bing results extraction
        let bingResults = '';
        if (bingData) {
            bingResults = bingData('.l_ecrd_txt_pln').text() || '';
        } else {
            console.warn('No data retrieved from Bing');
        }

        // Consolidate the results
        const consolidatedResults = {
            longestData,
            yahooSummary,
            bingResults,
            audioURL
        };

        // Send the consolidated data as a response
        res.json(consolidatedResults);

    } catch (error) {
        console.error('Error in main POST handler:', error.message);
        // Send a user-friendly error message in case of failure
        res.status(500).json({ error: 'Failed to retrieve data from one or more sources. Please try again later.' });
    }
});

// Start the Express server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
