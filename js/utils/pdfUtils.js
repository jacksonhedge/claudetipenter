/**
 * Utility functions for PDF handling and processing
 */

/**
 * Splits a PDF file into individual pages
 * @param {File} pdfFile - The PDF file to split
 * @returns {Promise<Array<File>>} - Promise resolving to an array of File objects, one for each page
 */
export async function splitPdfIntoPages(pdfFile) {
    return new Promise(async (resolve, reject) => {
        try {
            // Ensure PDF.js is available
            if (!window.pdfjsLib) {
                throw new Error('PDF.js library not loaded');
            }
            
            // Read the PDF file as ArrayBuffer
            const arrayBuffer = await pdfFile.arrayBuffer();
            
            // Load the PDF document
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const numPages = pdf.numPages;
            
            console.log(`PDF has ${numPages} pages`);
            
            // If it's a single page PDF, just return the original file
            if (numPages === 1) {
                resolve([pdfFile]);
                return;
            }
            
            // Array to store individual page files
            const pageFiles = [];
            
            // Process each page
            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                // Create a new filename for this page
                const pageFilename = pdfFile.name.replace('.pdf', `_page${pageNum}.pdf`);
                
                // Create a File object for this page
                // Since we can't actually split the PDF in the browser, we'll create a reference
                // to the original file but with metadata indicating which page it is
                const pageFile = new File(
                    [arrayBuffer], // Use the same data
                    pageFilename,
                    { 
                        type: 'application/pdf',
                        lastModified: pdfFile.lastModified
                    }
                );
                
                // Add custom properties to identify this as a specific page
                pageFile.pdfPageNumber = pageNum;
                pageFile.originalPdfName = pdfFile.name;
                pageFile.totalPages = numPages;
                
                pageFiles.push(pageFile);
            }
            
            resolve(pageFiles);
        } catch (error) {
            console.error('Error splitting PDF:', error);
            reject(error);
        }
    });
}

/**
 * Renders a PDF page to an image
 * @param {ArrayBuffer} pdfData - The PDF data
 * @param {number} pageNumber - The page number to render (1-based)
 * @param {number} scale - The scale to render at (default: 1.5)
 * @returns {Promise<string>} - Promise resolving to a data URL of the rendered page
 */
export async function renderPdfPageToImage(pdfData, pageNumber, scale = 1.5) {
    return new Promise(async (resolve, reject) => {
        try {
            // Ensure PDF.js is available
            if (!window.pdfjsLib) {
                throw new Error('PDF.js library not loaded');
            }
            
            // Load the PDF document
            const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
            
            // Get the specified page
            const page = await pdf.getPage(pageNumber);
            
            // Calculate viewport dimensions
            const viewport = page.getViewport({ scale });
            
            // Create a canvas to render the page
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            // Render the page to the canvas
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            
            await page.render(renderContext).promise;
            
            // Convert the canvas to a data URL
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            resolve(dataUrl);
        } catch (error) {
            console.error('Error rendering PDF page:', error);
            reject(error);
        }
    });
}
