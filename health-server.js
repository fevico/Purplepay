// Simple health check server
const express = require('express');
const app = express();
const PORT = 9878;

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Health check server is running'
  });
});

app.listen(PORT, () => {
  console.log(`Health check server running on http://localhost:${PORT}`);
});
