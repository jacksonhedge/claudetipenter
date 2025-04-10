// server-privacy-subdomain.js - Updated server file with subdomain handling
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { processImage } = require('./intsig-service');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/original';
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// SUBDOMAIN HANDLING - Check for privacy subdomain before other routes
app.use((req, res, next) => {
  // Check if the request is for the privacy subdomain
  const host = req.hostname;
  if (host === 'privacy.tipenters.com') {
    // Serve the privacy policy page
    return res.sendFile(path.join(__dirname, 'privacy/index.html'));
  }
  // Continue to next middleware if not the privacy subdomain
  next();
});

// API endpoint for detecting borders and enhancing images
app.post('/api/enhance-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const options = {
      enhanceMode: req.body.enhanceMode || 'auto',
      maxSize: parseInt(req.body.maxSize || '1600'),
      appKey: process.env.INTSIG_APP_KEY,
      subAppKey: process.env.INTSIG_SUB_APP_KEY || ''
    };

    const result = await processImage(req.file.path, options);
    
    return res.json({
      originalImage: `/uploads/original/${path.basename(req.file.path)}`,
      enhancedImage: `/uploads/enhanced/${path.basename(result.enhancedImagePath)}`,
      borderPoints: result.borderPoints
    });
  } catch (error) {
    console.error('Image processing error:', error);
    return res.status(500).json({ 
      error: 'Image processing failed', 
      details: error.message 
    });
  }
});

// Serve the privacy policy from the /privacy path on the main domain
app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'privacy/index.html'));
});

// Serve static files from the current directory
app.use(express.static(__dirname));

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Privacy policy available at: http://privacy.tipenters.com (when DNS is configured)`);
  console.log(`Privacy policy also available at: http://localhost:${PORT}/privacy`);
});
