const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const CSV_FILE_PATH = path.join(__dirname, '/lib/merged_symbols.csv');
const SYMBOL_COLUMN = 'Symbol';
const NAME_COLUMN = 'Security Name';
const MAX_SUGGESTIONS = 10;

let suggestionsCache = [];

// --- Middleware ---
app.use(express.json()); // Add this line to parse JSON request bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// --- Function to load and parse CSV data ---
function loadSuggestions() {
    // ... (keep existing loadSuggestions function as is) ...
    console.log(`Loading suggestions from ${CSV_FILE_PATH}...`);
    const data = [];
    fs.createReadStream(CSV_FILE_PATH)
        .pipe(csv())
        .on('data', (row) => {
            if (row[SYMBOL_COLUMN] && row[SYMBOL_COLUMN].trim() &&
                row[NAME_COLUMN] && row[NAME_COLUMN].trim()) {
                data.push({
                    symbol: row[SYMBOL_COLUMN].trim(),
                    name: row[NAME_COLUMN].trim()
                });
            }
        })
        .on('end', () => {
            suggestionsCache = data;
            console.log(`Successfully loaded ${suggestionsCache.length} suggestions into cache.`);
        })
        .on('error', (error) => {
            console.error('Error loading CSV file:', error);
            suggestionsCache = [];
        });
}

// --- API Endpoint for Suggestions ---
app.get('/suggestions', (req, res) => {
    // ... (keep existing /suggestions endpoint with prioritization/sorting as is) ...
    const query = (req.query.q || '').trim();
    const lowerQuery = query.toLowerCase();

    if (!query) {
        return res.json([]);
    }
    if (suggestionsCache.length === 0) {
        console.warn('Suggestions cache is empty. Returning no suggestions.');
        return res.json([]);
    }

    const filteredSuggestions = suggestionsCache.filter(item => {
        const lowerSymbol = item.symbol.toLowerCase();
        const lowerName = item.name.toLowerCase();
        return lowerSymbol.startsWith(lowerQuery) || lowerName.includes(lowerQuery);
    });

    filteredSuggestions.sort((a, b) => {
        const aLowerSymbol = a.symbol.toLowerCase();
        const bLowerSymbol = b.symbol.toLowerCase();
        const aIsSymbolMatch = aLowerSymbol.startsWith(lowerQuery);
        const bIsSymbolMatch = bLowerSymbol.startsWith(lowerQuery);

        if (aIsSymbolMatch && !bIsSymbolMatch) return -1;
        if (!aIsSymbolMatch && bIsSymbolMatch) return 1;
        return a.symbol.localeCompare(b.symbol);
    });

    const finalSuggestions = filteredSuggestions.slice(0, MAX_SUGGESTIONS);
    res.json(finalSuggestions);
});

// --- NEW: API Endpoint to receive selected stock ---
app.post('/select-stock', (req, res) => {
    const selectedStock = req.body; // Expecting { symbol: '...', name: '...' }

    if (!selectedStock || !selectedStock.symbol || !selectedStock.name) {
        console.warn('Received invalid selection data:', selectedStock);
        return res.status(400).json({ message: 'Invalid selection data provided.' });
    }

    // --- Placeholder for backend action ---
    // In a real application, you would do something with this data,
    // like:
    // - Add it to a user's watchlist
    // - Fetch detailed quote data for this symbol
    // - Store it in a database
    console.log('Stock selected on backend:', selectedStock);
    // --- End Placeholder ---

    // Send a success response back to the client
    res.json({
        message: `Selection received for ${selectedStock.symbol}`,
        data: selectedStock // Echo back the received data
    });
});


// --- Initial Load and Start Server ---
loadSuggestions();

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});