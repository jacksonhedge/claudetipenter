import React, { useState, useEffect } from 'react';
import EpsonIntegration from './EpsonIntegration';
import { generateTestReceipt } from '../services/epsonPrinterService';

const App = () => {
  const [processedReceipts, setProcessedReceipts] = useState([]);
  
  // Generate some test receipts on component mount
  useEffect(() => {
    // Generate 10 test receipts
    const testReceipts = Array.from({ length: 10 }, (_, index) => {
      const receipt = generateTestReceipt();
      
      // Modify the receipt to make each one unique
      receipt.check_number = `T${100000 + index}`;
      
      // Add some variety to customer names
      const customerNames = [
        'John Smith',
        'Jane Doe',
        'Robert Johnson',
        'Emily Davis',
        'Michael Wilson',
        'Sarah Brown',
        'David Miller',
        'Lisa Garcia',
        'Thomas Anderson',
        'Jennifer Martinez'
      ];
      
      receipt.customer_name = customerNames[index];
      
      // Vary the amounts
      const baseAmount = 15 + Math.floor(Math.random() * 50);
      receipt.amount = baseAmount.toFixed(2);
      
      const tipAmount = Math.floor(baseAmount * (0.15 + Math.random() * 0.10));
      receipt.tip = tipAmount.toFixed(2);
      
      receipt.total = (baseAmount + tipAmount).toFixed(2);
      
      // Vary payment types
      const paymentTypes = ['Credit Card', 'Cash', 'Debit Card', 'Mobile Payment'];
      receipt.payment_type = paymentTypes[Math.floor(Math.random() * paymentTypes.length)];
      
      // Some receipts are signed, some are not
      receipt.signed = Math.random() > 0.3;
      
      return receipt;
    });
    
    setProcessedReceipts(testReceipts);
  }, []);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Epson Printer Integration</h1>
        <p className="text-gray-600 mt-2">
          Connect to Epson printers, print receipts, and manage print jobs
        </p>
      </header>
      
      <main>
        <EpsonIntegration processedReceipts={processedReceipts} />
      </main>
      
      <footer className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
        <p>Epson Printer Integration Demo &copy; 2025</p>
        <p className="mt-1">
          This demo showcases integration with Epson printers using the ePOS SDK.
        </p>
      </footer>
    </div>
  );
};

export default App;
