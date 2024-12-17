const axios = require('axios');
const cheerio = require('cheerio');
const  fs = require('fs');
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





async function scrapeData(prompt) {
     // URLs for Google, Yahoo, and Bing
     const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(prompt)}`;
     const yahooUrl = `https://in.search.yahoo.com/search?p=${encodeURIComponent(prompt)}`;
     const bingUrl = `https://www.bing.com/search?q=${encodeURIComponent(prompt)}&shm=cr&form=DEEPSH&shajax=1`;
 
     try {
         // Scrape Google, Yahoo, and Bing in parallel
         const [googleData, yahooData, bingData] = await Promise.all([
             scrapeWebsite(googleUrl),
             scrapeWebsite(yahooUrl),
             scrapeWebsite(bingUrl),
         ]);
 
         // Google results extraction
         let googleResults = [];
         // creating html file for testing purposes
        


         let audioURL; // Default to null in case no audio is found
         if (googleData) {
             googleData('div.BNeawe')
                 .slice(0, 4)
                 .each((index, element) => {
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
                         const response = await scrapeWebsite(mainURL);
                         if (response) {
                             audioURL = encodeURI(response('audio source').attr('src')) || null;
                         }
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
         }, '');
 
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
             audioURL,
         };
 
         return consolidatedResults;
}
catch (err) {
    console.error('Error:', err.message);
    return null; // Handle this error appropriately in your application, such as logging it or notifying the user.
 
}
}
module.exports = {
    scrapeWebsite, scrapeData
};