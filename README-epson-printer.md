# Epson Printer Integration

This project demonstrates how to integrate with Epson printers using the Epson ePOS SDK. It provides functionality for connecting to printers, printing receipts, and managing print jobs.

## Overview

The implementation includes two versions:

1. **Vanilla JavaScript Version**: Uses custom components built with vanilla JavaScript for integration with Epson printers.
2. **React Version**: Uses React components for a more modern UI approach.

Both versions provide the same core functionality:

- Connect to Epson printers
- Print individual receipts
- Print batches of receipts
- Monitor printer status
- Save and manage printer connections

## File Structure

```
├── js/
│   ├── components/                 # Vanilla JS components
│   │   ├── epsonPrinterConnect.js  # Printer connection component
│   │   ├── receiptTemplate.js      # Receipt preview and printing
│   │   └── bulkPrintComponent.js   # Batch printing component
│   ├── react-components/           # React components
│   │   ├── App.jsx                 # Main React app
│   │   ├── EpsonIntegration.jsx    # Main integration component
│   │   ├── EpsonPrinterConnect.jsx # Printer connection component
│   │   ├── ReceiptTemplate.jsx     # Receipt preview and printing
│   │   └── BulkPrintComponent.jsx  # Batch printing component
│   ├── services/
│   │   └── epsonPrinterService.js  # Core printer service
│   └── mock-epson-sdk.js           # Mock implementation of Epson ePOS SDK
├── epson-scanner.html              # Vanilla JS implementation
└── react-app.html                  # React implementation
```

## Vanilla JavaScript Implementation

The vanilla JavaScript implementation is available in `epson-scanner.html`. It uses custom components built with vanilla JavaScript to provide a user interface for interacting with Epson printers.

### Components

1. **EpsonPrinterConnect**: Handles printer connection and status display.
2. **ReceiptTemplate**: Displays a receipt preview and provides printing functionality.
3. **BulkPrintComponent**: Allows users to select and print multiple receipts in a batch.

### Usage

Open `epson-scanner.html` in a web browser and navigate to the "Printer" tab to access the printer functionality.

## React Implementation

The React implementation is available in `react-app.html`. It uses React components to provide a more modern user interface for interacting with Epson printers.

### Components

1. **EpsonIntegration**: Main component that integrates all printer functionality.
2. **EpsonPrinterConnect**: Handles printer connection and status display.
3. **ReceiptTemplate**: Displays a receipt preview and provides printing functionality.
4. **BulkPrintComponent**: Allows users to select and print multiple receipts in a batch.

### Usage

Open `react-app.html` in a web browser to access the React implementation.

## Epson Printer Service

The core functionality for interacting with Epson printers is provided by the `epsonPrinterService.js` file. This service provides the following functions:

- `initializeEpsonSDK()`: Initialize the Epson ePOS SDK.
- `connectToPrinter(ipAddress, port)`: Connect to an Epson printer.
- `disconnectPrinter(connection)`: Disconnect from an Epson printer.
- `printReceipt(connection, receiptData)`: Print a receipt.
- `printBatchReceipts(connection, receipts)`: Print multiple receipts.
- `formatReceiptForPrinter(receiptData)`: Format receipt data for printing.
- `getPrinterStatus(connection)`: Get the status of a printer.
- `generateTestReceipt()`: Generate a test receipt for demonstration purposes.

## Mock Epson SDK

For development and testing purposes, a mock implementation of the Epson ePOS SDK is provided in `mock-epson-sdk.js`. This mock implementation simulates the behavior of the actual SDK without requiring a physical printer.

## Implementation Notes

### Printer Connection

The printer connection functionality allows users to:

1. Enter the IP address and port of an Epson printer.
2. Connect to the printer.
3. Save the printer connection for future use.
4. View the status of the connected printer.
5. Disconnect from the printer.

### Receipt Printing

The receipt printing functionality allows users to:

1. Preview a receipt before printing.
2. Print a single receipt.
3. Select multiple receipts for batch printing.
4. View the status of print jobs.

### Printer Status

The printer status functionality allows users to:

1. View the online status of the printer.
2. Check the paper status.
3. Check the cover status.
4. Check the drawer status.

## Production Considerations

For a production environment, consider the following:

1. Use a bundler like Webpack or Parcel to bundle the JavaScript code.
2. Implement proper error handling and retry mechanisms for printer connections.
3. Add authentication and authorization for printer access.
4. Implement logging for printer operations.
5. Add support for printer-specific features like barcode printing, logo printing, etc.
6. Implement a more robust printer discovery mechanism.
7. Add support for multiple printer types and models.
8. Implement a more robust printer status monitoring system.
9. Add support for printer configuration and settings.
10. Implement a more robust error recovery mechanism.

## Dependencies

- **Vanilla JavaScript Version**:
  - Bootstrap 5.3.0
  - jQuery 3.6.0
  - Tailwind CSS 2.2.19

- **React Version**:
  - React 17
  - ReactDOM 17
  - Babel (for JSX)
  - Lucide React (for icons)
  - Tailwind CSS 2.2.19

## License

This project is licensed under the MIT License.
