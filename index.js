require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const port = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(cors({
    origin: '*' // Consider restricting in production
}));

app.post('/', async (req, res) => {
    const prompt = req.body.prompt;
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    const url = `https://www.google.com/search?q=${encodeURIComponent(prompt)}`;
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
            }
        });

        const $ = cheerio.load(data);
        const vectorData = [];

        // Collect up to 10 text elements
        $('div.BNeawe').each((index, element) => {
            vectorData.push($(element).text());
            if (vectorData.length >= 10) return false; // Break loop after collecting 10 elements
        });

        const longestData = vectorData.reduce((current, val) => current.length > val.length ? current : val, '');

        // If there's relevant data, process it further
       // if (longestData) {
            // Assuming you'd like to send `longestData` to an external summarization API
        //    const sendToModel = await axios.post('http://127.0.0.1:5000/summarize', {
          //      text: longestData
          //  });
        //    return res.json({ summary: sendToModel.data.summary });
      //  }

        res.json({ longestData });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
