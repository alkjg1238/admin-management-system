const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Initialize database tables
async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id SERIAL PRIMARY KEY,
                discord_id VARCHAR(255),
                name VARCHAR(255) NOT NULL,
                rank VARCHAR(100) DEFAULT 'Junior',
                notes TEXT,
                last_promotion DATE,
                status VARCHAR(50) DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS vacations (
                id SERIAL PRIMARY KEY,
                admin_id INTEGER REFERENCES admins(id),
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                reason TEXT,
                status VARCHAR(50) DEFAULT 'Pending',
                approved_by INTEGER REFERENCES admins(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        console.log('Database initialized successfully');
    } catch (err) {
        console.error('Database initialization error:', err);
    }
}

// Routes

// Get all admins
app.get('/api/admins', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM admins ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add new admin
app.post('/api/admins', async (req, res) => {
    const { discord_id, name, rank, notes, last_promotion } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO admins (discord_id, name, rank, notes, last_promotion) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [discord_id, name, rank, notes, last_promotion]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update admin
app.put('/api/admins/:id', async (req, res) => {
    const { id } = req.params;
    const { name, rank, notes, last_promotion, status } = req.body;
    try {
        const result = await pool.query(
            'UPDATE admins SET name = $1, rank = $2, notes = $3, last_promotion = $4, status = $5 WHERE id = $6 RETURNING *',
            [name, rank, notes, last_promotion, status, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete admin
app.delete('/api/admins/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM admins WHERE id = $1', [id]);
        res.json({ message: 'Admin deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all vacations
app.get('/api/vacations', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT v.*, a.name as admin_name, a.discord_id 
            FROM vacations v 
            JOIN admins a ON v.admin_id = a.id 
            ORDER BY v.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Request vacation
app.post('/api/vacations', async (req, res) => {
    const { admin_id, start_date, end_date, reason } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO vacations (admin_id, start_date, end_date, reason) VALUES ($1, $2, $3, $4) RETURNING *',
            [admin_id, start_date, end_date, reason]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Approve/Reject vacation
app.put('/api/vacations/:id', async (req, res) => {
    const { id } = req.params;
    const { status, approved_by } = req.body;
    try {
        const result = await pool.query(
            'UPDATE vacations SET status = $1, approved_by = $2 WHERE id = $3 RETURNING *',
            [status, approved_by, id]
        );
        
        // Send Discord notification (placeholder)
        const vacation = result.rows[0];
        console.log(`Vacation ${status} for admin ID: ${vacation.admin_id}`);
        
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    initDB();
});
