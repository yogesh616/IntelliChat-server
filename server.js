require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const port =  5000;
const app = express();

app.use(express.json());
app.use(cors({
    origin: '*' // Allow all origins for now, consider restricting in production
}));

app.post('/', async (req, res) => {
    const prompt = req.body.prompt;
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }
    
    const url = `https://en.m.wikipedia.org/wiki/${encodeURIComponent(prompt)}`;
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
            }
        });

        const $ = cheerio.load(data);
        const allData = $('section.mf-section-0');
        const pTag = allData.find('p');
       // const result = $('div.BNeawe').first().text();
        // let vectorData = [];

      /*  $('div.BNeawe').each((index, element) => {
            vectorData.push($(element).text());
            if (vectorData.length >= 10) {
                return false; // break the loop
            }
        });
        */

       // console.log(result); // Prints the first result
        // console.log(allData);
        console.log(pTag.text());

      //  res.json({ result, vectorData });
      res.json({ pTag: pTag.text() });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send('Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
