const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all origins
app.use(cors());

// Proxy middleware
const proxy = createProxyMiddleware({
  target: 'http://gamelist-env.eba-tku47f7i.us-east-1.elasticbeanstalk.com',
  changeOrigin: true,
  logLevel: 'debug'
});

// Route all /api requests to the backend
app.use('/api', proxy);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'proxy healthy' });
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
