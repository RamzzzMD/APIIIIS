const express = require('express');
const axios = require('axios');
const spotidown = require('../lib/spotify');

const router = express.Router();

// TikTok Downloader
router.get('/tiktok', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ status: false, message: "Parameter 'url' diperlukan!" });
    try {
        const response = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        if (response.data && response.data.code === 0) {
            const result = response.data.data;
            res.json({
                status: true, creator: "Ranzz",
                data: {
                    title: result.title || "Tidak ada judul",
                    author: result.author?.nickname || "Tidak diketahui",
                    cover: result.cover,
                    no_watermark: result.play,
                    watermark: result.wmplay,
                    audio: result.music
                }
            });
        } else {
            throw new Error(response.data?.msg || "Gagal mengambil data");
        }
    } catch (error) {
        res.status(500).json({ status: false, creator: "Ranzz", message: error.message });
    }
});

// Spotify Downloader
router.get('/spotify', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ status: false, message: "Parameter 'url' diperlukan!" });
    try {
        const result = await spotidown(url);
        res.json({ status: true, creator: "Ranzz", data: result });
    } catch (error) {
        res.status(500).json({ status: false, creator: "Ranzz", message: error.message });
    }
});

module.exports = router;
