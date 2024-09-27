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
    origin: '*' // Allow only this domain in production
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

// Helper function for scraping data from a URL
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
        return null;
    }
};

// Main POST route
app.post('/', async (req, res) => {
    const prompt = req.body.prompt;

    // Validate that the prompt is provided
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    // URLs for Google, Wikipedia, and Reddit
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(prompt)}`;
    const yahooUrl = `https://in.search.yahoo.com/search;_ylt=AwrPpjUJzO5mGQQA2ta7HAx.;_ylc=X1MDMjExNDcyMzAwMwRfcgMyBGZyA3NmcARmcjIDc2ItdG9wBGdwcmlkA3paVThlZ3dpUzguYlFaS20yVm1TZUEEbl9yc2x0AzAEbl9zdWdnAzkEb3JpZ2luA2luLnNlYXJjaC55YWhvby5jb20EcG9zAzAEcHFzdHIDBHBxc3RybAMwBHFzdHJsAzE1BHF1ZXJ5A3doYXQlMjBpcyUyMGNoYXRncHQEdF9zdG1wAzE3MjY5MjU4NTA-?p=${encodeURIComponent(prompt)}&fr=sfp&fr2=sb-top`
   
    const bingUrl = `https://www.bing.com/search?q=${encodeURIComponent(prompt)}`;

    try {
        // Scrape Google, Wikipedia, and Reddit
        const [googleData, yahooData, bingData] = await Promise.all([
            scrapeWebsite(googleUrl),
            scrapeWebsite(yahooUrl),
            scrapeWebsite(bingUrl)
        ]);

        // Extract data from Google search results
        let googleResults = [];
        let audioURL;
        if (googleData) {
            googleData('div.BNeawe').slice(0, 4).each((index, element) => {
                googleResults.push(googleData(element).text());
            });
            // Finding audio file url

            const results = googleData('div.egMi0 ');
            const resultLinks = results.find('a').attr('href')
            const URL =  new URLSearchParams(resultLinks)
            
            const mainURL = URL.get('url')
            if (mainURL) {
                const response = await axios.get(mainURL, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
                }
            });
            const $data = cheerio.load(response.data);
            const extractedData = $data('audio source').attr('src');
            if (extractedData) {
                audioURL = encodeURI(extractedData)
            }

          //  console.log('extractedData', audioURL); // Prints the first result
        }
        }
        let longestData = googleResults.reduce((longest, current) => {
            return current.length > longest.length ? current : longest;
        }, "");

        // Extract summary from Wikipedia
        let yahooSummary = [];
        if (yahooData) {
           // yahooSummary = yahooData('div#right div').text(); // Get the first 
         //  yahooSummary.push(yahooData('div.fc-falcon p').text());

           const linkHref = yahooData('a.thmb').attr('href');
           const imgSrc = yahooData('img.s-img').attr('src');
            yahooSummary = { href: linkHref, src: imgSrc };
           
           
        }

        // Extract top 4 Reddit posts
        
        let bingResults = '';
if (bingData) {
    const bingResults = bingData('.l_ecrd_txt_pln').text();

    
}


        // Consolidate the results
        const consolidatedResults = {
            longestData,
            yahooSummary,
            bingResults, audioURL
        };

        // Send the consolidated data as a response
        res.json(consolidatedResults);

    } catch (error) {
        console.error('Error:', error.message);
        // Send a user-friendly error message in case of failure
        res.status(500).json({ error: 'Failed to retrieve data from one or more sources. Please try again later.' });
    }
});

// Start the Express server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
