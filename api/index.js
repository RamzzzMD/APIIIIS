const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Memuat Rute Kategori
app.use('/api/downloader', require('./routes/downloader'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/search', require('./routes/search'));

// Penanganan Route Tidak Ditemukan
app.use((req, res) => {
    res.status(404).json({ status: false, message: "Endpoint tidak ditemukan." });
});

// Wajib untuk Vercel Serverless
module.exports = app;
