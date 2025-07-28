const express = require('express');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.post('/api/download', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL missing' });

  try {
    const form = new FormData();
    form.append('url', url);
    form.append('format', 'mp4');

    const response = await axios.post('https://ttdownloader.com/req/', form, {
      headers: {
        ...form.getHeaders(),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    res.send(response.data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Failed to fetch video data' });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
