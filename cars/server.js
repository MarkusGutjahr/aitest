const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(bodyParser.json({ limit: '200mb' }));
// Middleware to enable CORS
app.use(cors());

// Save population data endpoint
app.post('/save', (req, res) => {
    const population = req.body;

    // Write population data to a JSON file
    fs.writeFile('population.json', JSON.stringify(population), (err) => {
        if (err) {
            console.error('Error saving population data:', err);
            res.status(500).json({ error: 'Failed to save population data' });
        } else {
            console.log('Population data saved successfully');
            res.json({ message: 'Population data saved successfully' });
        }
    });
});

// Load population data endpoint
app.get('/load', (req, res) => {
    // Read population data from the JSON file
    fs.readFile('population.json', (err, data) => {
        if (err) {
            console.error('Error loading population data:', err);
            res.status(500).json({ error: 'Failed to load population data' });
        } else {
            const population = JSON.parse(data);
            console.log('Population data loaded successfully');
            res.json(population);
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
