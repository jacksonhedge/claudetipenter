/**
 * Epson Printer & Scanner API Routes
 * Express routes for handling Epson printer and scanner communication
 */

const express = require('express');
const router = express.Router();

// Middleware for handling printer/scanner-related errors
const epsonErrorHandler = (err, req, res, next) => {
  console.error('Epson API Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Unknown Epson device error'
  });
};

/**
 * GET /api/printers
 * List available printers
 */
router.get('/printers', async (req, res, next) => {
  try {
    // This would typically use a printer discovery library or service
    // For this example, we'll return a mock response
    
    // Simulate delay for network discovery
    await new Promise(resolve => setTimeout(resolve, 800));
    
    res.json({
      success: true,
      printers: [
        {
          id: 'printer_1',
          name: 'Epson TM-T88VI',
          type: 'Thermal',
          ipAddress: '192.168.1.100',
          port: '8008',
          status: 'online',
          lastConnected: new Date().toISOString()
        },
        {
          id: 'printer_2',
          name: 'Epson TM-m30',
          type: 'Thermal',
          ipAddress: '192.168.1.101',
          port: '8008',
          status: 'offline',
          lastConnected: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
        }
      ]
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/printers/:printerId/status
 * Get printer status
 */
router.get('/printers/:printerId/status', async (req, res, next) => {
  try {
    const { printerId } = req.params;
    
    // Simulate delay for getting printer status
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Randomly simulate offline printer for testing
    if (Math.random() < 0.1) {
      return res.json({
        success: false,
        error: 'Printer is offline',
        status: {
          online: false,
          errors: ['Printer is offline or not responding']
        }
      });
    }
    
    // Randomly simulate paper issues for testing
    const paperLevel = Math.random();
    const paperStatus = paperLevel < 0.2 ? 'empty' : paperLevel < 0.4 ? 'low' : 'ok';
    
    res.json({
      success: true,
      printerId,
      status: {
        online: true,
        paper: paperStatus,
        cover: Math.random() < 0.05 ? 'open' : 'closed',
        drawer: Math.random() < 0.1 ? 'open' : 'closed', 
        errors: paperStatus === 'empty' ? ['Out of paper'] : []
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/printers/connect
 * Connect to a printer
 */
router.post('/printers/connect', async (req, res, next) => {
  try {
    const { ipAddress, port } = req.body;
    
    if (!ipAddress) {
      return res.status(400).json({
        success: false,
        error: 'IP address is required'
      });
    }
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 90% success rate for testing
    if (Math.random() > 0.1) {
      res.json({
        success: true,
        connection: {
          id: `printer_${Date.now()}`,
          ipAddress,
          port: port || '8008',
          deviceId: `local_printer_${ipAddress.replace(/\./g, '_')}`,
          name: `Epson Printer (${ipAddress})`,
          type: 'Thermal',
          connected: true,
          connectedAt: new Date().toISOString()
        },
        message: `Successfully connected to printer at ${ipAddress}:${port || '8008'}`
      });
    } else {
      res.status(500).json({
        success: false,
        error: `Failed to connect to printer at ${ipAddress}:${port || '8008'}`
      });
    }
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/printers/disconnect
 * Disconnect from a printer
 */
router.post('/printers/disconnect', async (req, res, next) => {
  try {
    const { connectionId } = req.body;
    
    if (!connectionId) {
      return res.status(400).json({
        success: false,
        error: 'Connection ID is required'
      });
    }
    
    // Simulate disconnection delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    res.json({
      success: true,
      message: `Successfully disconnected from printer ${connectionId}`
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/print/receipt
 * Print a single receipt
 */
router.post('/print/receipt', async (req, res, next) => {
  try {
    const { connection, receipt } = req.body;
    
    if (!connection) {
      return res.status(400).json({
        success: false,
        error: 'Printer connection is required'
      });
    }
    
    if (!receipt) {
      return res.status(400).json({
        success: false,
        error: 'Receipt data is required'
      });
    }
    
    // Simulate printing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 95% success rate for testing
    if (Math.random() > 0.05) {
      res.json({
        success: true,
        jobId: `job_${Date.now()}`,
        message: 'Receipt sent to printer successfully',
        printedAt: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error printing receipt: Printer communication error'
      });
    }
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/print/batch
 * Print multiple receipts
 */
router.post('/print/batch', async (req, res, next) => {
  try {
    const { connection, receipts } = req.body;
    
    if (!connection) {
      return res.status(400).json({
        success: false,
        error: 'Printer connection is required'
      });
    }
    
    if (!receipts || !Array.isArray(receipts) || receipts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid receipts array is required'
      });
    }
    
    console.log(`Printing batch of ${receipts.length} receipts`);
    
    // Process each receipt
    const results = [];
    
    for (let i = 0; i < receipts.length; i++) {
      try {
        // Simulate individual print job (300-800ms per receipt)
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
        
        // 95% success rate for each receipt
        if (Math.random() > 0.05) {
          results.push({
            index: i,
            receipt: receipts[i],
            success: true,
            jobId: `job_${Date.now()}_${i}`,
            printedAt: new Date().toISOString()
          });
        } else {
          results.push({
            index: i,
            receipt: receipts[i],
            success: false,
            error: 'Error printing receipt: Communication error'
          });
        }
      } catch (error) {
        results.push({
          index: i,
          receipt: receipts[i],
          success: false,
          error: error.message || 'Unknown error'
        });
      }
    }
    
    res.json({
      success: true,
      totalReceipts: receipts.length,
      successfulPrints: results.filter(r => r.success).length,
      failedPrints: results.filter(r => !r.success).length,
      completedAt: new Date().toISOString(),
      results
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/print/test
 * Print a test page
 */
router.post('/print/test', async (req, res, next) => {
  try {
    const { connection } = req.body;
    
    if (!connection) {
      return res.status(400).json({
        success: false,
        error: 'Printer connection is required'
      });
    }
    
    // Simulate test print delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    res.json({
      success: true,
      message: 'Test page sent to printer successfully',
      printedAt: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/printers/settings
 * Update printer settings
 */
router.post('/printers/settings', async (req, res, next) => {
  try {
    const { 
      connection,
      paperWidth, 
      cutType, 
      printLogo, 
      printBarcode,
      printQRCode,
      doubleHeightTotal,
      soundOnPrint,
      headerText,
      footerText,
      additionalNotes,
      includePrintTimestamp,
      cashDrawerSettings,
      printerLanguage,
      printDensity,
      printSpeed
    } = req.body;
    
    if (!connection) {
      return res.status(400).json({
        success: false,
        error: 'Printer connection is required'
      });
    }
    
    // Simulate settings update delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    res.json({
      success: true,
      message: 'Printer settings updated successfully',
      settings: {
        paperWidth: paperWidth || '80mm',
        cutType: cutType || 'partial',
        printLogo: printLogo !== undefined ? printLogo : true,
        printBarcode: printBarcode || false,
        printQRCode: printQRCode || false,
        doubleHeightTotal: doubleHeightTotal !== undefined ? doubleHeightTotal : true,
        soundOnPrint: soundOnPrint !== undefined ? soundOnPrint : true,
        headerText: headerText || 'Thank you for your business!',
        footerText: footerText || 'Please come again!',
        additionalNotes: additionalNotes || '',
        includePrintTimestamp: includePrintTimestamp !== undefined ? includePrintTimestamp : true,
        cashDrawerSettings: cashDrawerSettings || 'after',
        printerLanguage: printerLanguage || 'esc',
        printDensity: printDensity || 3,
        printSpeed: printSpeed || 'medium',
        updatedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/printers/logo
 * Upload logo to printer
 */
router.post('/printers/logo', async (req, res, next) => {
  try {
    const { connection, logoData } = req.body;
    
    if (!connection) {
      return res.status(400).json({
        success: false,
        error: 'Printer connection is required'
      });
    }
    
    if (!logoData) {
      return res.status(400).json({
        success: false,
        error: 'Logo data is required'
      });
    }
    
    // Simulate logo upload delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    res.json({
      success: true,
      message: 'Logo uploaded to printer successfully',
      uploadedAt: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/epson/scan/destinations
 * Get available scan destinations
 */
router.get('/epson/scan/destinations', async (req, res, next) => {
  try {
    // Simulate delay for network discovery
    await new Promise(resolve => setTimeout(resolve, 800));
    
    res.json({
      success: true,
      destinations: [
        {
          id: 'scanner_1',
          name: 'Epson Scanner (Main)',
          type: 'Flatbed',
          status: 'online'
        },
        {
          id: 'scanner_2',
          name: 'Epson Scanner (ADF)',
          type: 'ADF',
          status: 'online'
        }
      ]
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/epson/scan/jobs
 * Start a scan job
 */
router.post('/epson/scan/jobs', async (req, res, next) => {
  try {
    const { destination_id, resolution, color_mode, file_format } = req.body;
    
    if (!destination_id) {
      return res.status(400).json({
        success: false,
        error: 'Destination ID is required'
      });
    }
    
    // Simulate scan job start delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate a unique job ID
    const jobId = `scan_job_${Date.now()}`;
    
    res.json({
      success: true,
      job_id: jobId,
      status: 'pending',
      message: 'Scan job started successfully',
      settings: {
        destination_id,
        resolution: resolution || '300',
        color_mode: color_mode || 'color',
        file_format: file_format || 'pdf'
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/epson/scan/jobs/:jobId
 * Get scan job status
 */
router.get('/epson/scan/jobs/:jobId', async (req, res, next) => {
  try {
    const { jobId } = req.params;
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // For demo purposes, always return completed status with sample images
    res.json({
      success: true,
      job_id: jobId,
      status: 'completed',
      completed_at: new Date().toISOString(),
      images: [
        {
          id: `img_${Date.now()}_1`,
          format: 'pdf',
          size: 1024 * 1024 * 2, // 2MB
          url: '/api/epson/scan/images/sample1.pdf'
        },
        {
          id: `img_${Date.now()}_2`,
          format: 'jpeg',
          size: 1024 * 1024, // 1MB
          url: '/api/epson/scan/images/sample2.jpeg'
        }
      ]
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/epson/scan/images/:imageId
 * Get a scanned image
 */
router.get('/epson/scan/images/:imageId', async (req, res, next) => {
  try {
    const { imageId } = req.params;
    
    // In a real implementation, this would retrieve the actual image
    // For demo purposes, we'll just return a success message
    res.json({
      success: true,
      image_id: imageId,
      message: 'This endpoint would normally return the binary image data'
    });
  } catch (err) {
    next(err);
  }
});

// Use the error handler middleware
router.use(epsonErrorHandler);

module.exports = router;
