require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./Routes/routes');

const port = process.env.PORT || 3000;
const app = express();

// Enable JSON parsing in Express
app.use(express.json());

// CORS configuration: Adjust origin for production
app.use(cors({
    origin: '*', // Replace '*' with a specific domain for production security
}));

// Use routes
app.use('/', routes);

// Start the Express server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
