const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const port = 3000;

const db = new sqlite3.Database('./highscore.db');

app.use(express.static('public'));
app.use(express.json());

// Create the table if it doesn't exist
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS highscore (score INTEGER)");
});

// Serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get the leaderboard
app.get('/leaderboard', (req, res) => {
    db.all('SELECT * FROM highscore ORDER BY score DESC LIMIT 10', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ leaderboard: rows });
    });
});

// Get the current highscore
app.get('/highscore', (req, res) => {
    db.get('SELECT score FROM highscore ORDER BY score DESC LIMIT 1', (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ highscore: row ? row.score : 0 });
    });
});

// Update highscore
app.post('/highscore', (req, res) => {
    const { highscore } = req.body;
    db.run('INSERT INTO highscore (score) VALUES (?)', [highscore], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
