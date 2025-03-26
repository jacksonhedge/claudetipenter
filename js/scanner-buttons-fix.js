/**
 * Scanner Buttons Fix 
 * Makes the buttons in the Organized Images tab work properly in scanner.html
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('📌 Initializing scanner buttons fix...');
    
    // Find all the buttons in the Organized Images tab
    const gridViewBtn = document.getElementById('gridViewBtn');
    const slideshowViewBtn = document.getElementById('slideshowViewBtn');
    const exportSlideshowBtn = document.getElementById('exportSlideshowBtn');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    
    // Set up Grid View button
    if (gridViewBtn) {
        console.log('Adding event listener to Grid View button');
        gridViewBtn.addEventListener('click', function() {
            console.log('Grid View button clicked');
            // Set active state
            gridViewBtn.classList.add('active');
            if (slideshowViewBtn) slideshowViewBtn.classList.remove('active');
            
            // Show grid, hide slideshow
            const organizedGrid = document.getElementById('organizedGrid');
            const slideshowModal = document.getElementById('slideshowModal');
            
            if (organizedGrid) organizedGrid.style.display = 'grid';
            if (slideshowModal) slideshowModal.style.display = 'none';
        });
    }
    
    // Set up Slideshow View button
    if (slideshowViewBtn) {
        console.log('Adding event listener to Slideshow View button');
        slideshowViewBtn.addEventListener('click', function() {
            console.log('Slideshow View button clicked');
            // Set active state
            slideshowViewBtn.classList.add('active');
            if (gridViewBtn) gridViewBtn.classList.remove('active');
            
            // Get the images to display in the slideshow
            const images = window.processedImages || window.lastProcessedResults || [];
            
            if (images.length === 0) {
                console.error('No images available to display in slideshow');
                alert('No processed images available to display.');
                return;
            }
            
            // Open the slideshow
            openSlideshow(images);
        });
    }
    
    // Set up Export Slideshow button
    if (exportSlideshowBtn) {
        console.log('Adding event listener to Export Slideshow button');
        exportSlideshowBtn.addEventListener('click', function() {
            console.log('Export Slideshow button clicked');
            
            // Get the images to export
            const images = window.processedImages || window.lastProcessedResults || [];
            
            if (images.length === 0) {
                console.error('No images available to export');
                alert('No processed images available to export.');
                return;
            }
            
            // Open export options modal
            const exportOptionsModal = document.getElementById('exportOptionsModal');
            if (exportOptionsModal) {
                exportOptionsModal.style.display = 'block';
                
                // Store the source for the export
                window.exportSource = 'slideshow';
                window.exportImages = images;
            }
        });
    }
    
    // Set up Export PDF button
    if (exportPdfBtn) {
        console.log('Adding event listener to Export PDF button');
        exportPdfBtn.addEventListener('click', function() {
            console.log('Export PDF button clicked');
            
            // Get the images to export
            const images = window.processedImages || window.lastProcessedResults || [];
            
            if (images.length === 0) {
                console.error('No images available to export to PDF');
                alert('No processed images available to export to PDF.');
                return;
            }
            
            // Generate PDF
            generatePdf(images);
        });
    }
    
    // Set up close button for export options modal
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            const exportOptionsModal = document.getElementById('exportOptionsModal');
            if (exportOptionsModal) {
                exportOptionsModal.style.display = 'none';
            }
        });
    }
    
    // Set up export options in the modal
    const exportEmailBtn = document.getElementById('exportEmailBtn');
    const exportTextBtn = document.getElementById('exportTextBtn');
    const exportFileBtn = document.getElementById('exportFileBtn');
    
    if (exportEmailBtn) {
        exportEmailBtn.addEventListener('click', function() {
            const emailInputContainer = document.getElementById('emailInputContainer');
            if (emailInputContainer) {
                const isVisible = emailInputContainer.style.display === 'flex';
                emailInputContainer.style.display = isVisible ? 'none' : 'flex';
                
                // Hide text input container
                const textInputContainer = document.getElementById('textInputContainer');
                if (textInputContainer) {
                    textInputContainer.style.display = 'none';
                }
            }
        });
    }
    
    if (exportTextBtn) {
        exportTextBtn.addEventListener('click', function() {
            const textInputContainer = document.getElementById('textInputContainer');
            if (textInputContainer) {
                const isVisible = textInputContainer.style.display === 'flex';
                textInputContainer.style.display = isVisible ? 'none' : 'flex';
                
                // Hide email input container
                const emailInputContainer = document.getElementById('emailInputContainer');
                if (emailInputContainer) {
                    emailInputContainer.style.display = 'none';
                }
            }
        });
    }
    
    if (exportFileBtn) {
        exportFileBtn.addEventListener('click', function() {
            const images = window.exportImages || window.processedImages || window.lastProcessedResults || [];
            
            if (images.length === 0) {
                alert('No images available to export to PDF.');
                return;
            }
            
            // Generate PDF
            generatePdf(images);
            
            // Close the modal
            const exportOptionsModal = document.getElementById('exportOptionsModal');
            if (exportOptionsModal) {
                exportOptionsModal.style.display = 'none';
            }
        });
    }
    
    // Function to open the slideshow
    function openSlideshow(images, startIndex = 0) {
        const slideshowModal = document.getElementById('slideshowModal');
        const slideshowImageContainer = document.getElementById('slideshowImageContainer');
        const prevSlideBtn = document.getElementById('prevSlideBtn');
        const nextSlideBtn = document.getElementById('nextSlideBtn');
        const slideCounter = document.getElementById('slideCounter');
        const closeBtn = slideshowModal.querySelector('.slideshow-close');
        
        if (!slideshowModal || !slideshowImageContainer) {
            console.error('Slideshow elements not found');
            return;
        }
        
        // Enhance the close button appearance to make it more visible
        if (closeBtn) {
            closeBtn.style.fontSize = '28px';
            closeBtn.style.fontWeight = 'bold';
            closeBtn.style.color = '#fff';
            closeBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            closeBtn.style.padding = '5px 12px';
            closeBtn.style.borderRadius = '50%';
            closeBtn.style.position = 'absolute';
            closeBtn.style.top = '20px';
            closeBtn.style.right = '20px';
            closeBtn.style.zIndex = '1000';
            closeBtn.style.cursor = 'pointer';
            closeBtn.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.5)';
            closeBtn.style.transition = 'all 0.3s ease';
            
            // Add hover effect
            closeBtn.addEventListener('mouseover', () => {
                closeBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                closeBtn.style.transform = 'scale(1.1)';
            });
            
            closeBtn.addEventListener('mouseout', () => {
                closeBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                closeBtn.style.transform = 'scale(1)';
            });
        }
        
        let currentIndex = startIndex;
        
        // Function to display the current slide
        function displayCurrentSlide() {
            const currentImage = images[currentIndex];
            slideshowImageContainer.innerHTML = '';
            
            // Create slideshow content container
            const contentContainer = document.createElement('div');
            contentContainer.className = 'slideshow-content';
            contentContainer.style.display = 'flex';
            contentContainer.style.flexDirection = 'column';
            contentContainer.style.alignItems = 'center';
            contentContainer.style.padding = '20px';
            
            // Add customer name
            const customerName = document.createElement('h2');
            customerName.textContent = currentImage.customer_name || 'N/A';
            customerName.style.margin = '0 0 20px 0';
            customerName.style.color = '#333';
            contentContainer.appendChild(customerName);
            
            // Create image container
            const imgContainer = document.createElement('div');
            imgContainer.style.width = '100%';
            imgContainer.style.maxWidth = '600px';
            imgContainer.style.marginBottom = '20px';
            
            // Add receipt image
            const img = document.createElement('img');
            img.src = currentImage.image_url;
            img.alt = 'Receipt Image';
            img.style.width = '100%';
            img.style.borderRadius = '8px';
            img.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
            imgContainer.appendChild(img);
            contentContainer.appendChild(imgContainer);
            
            // Add receipt details
            const detailsContainer = document.createElement('div');
            detailsContainer.style.background = '#f8f9fa';
            detailsContainer.style.padding = '15px';
            detailsContainer.style.borderRadius = '8px';
            detailsContainer.style.width = '100%';
            detailsContainer.style.maxWidth = '600px';
            
            // Format details in a table
            const detailsTable = document.createElement('table');
            detailsTable.style.width = '100%';
            detailsTable.style.borderCollapse = 'collapse';
            
            // Add rows for each detail
            const details = [
                { label: 'Date', value: currentImage.date },
                { label: 'Time', value: currentImage.time },
                { label: 'Check #', value: currentImage.check_number },
                { label: 'Amount', value: currentImage.amount },
                { label: 'Tip', value: currentImage.tip },
                { label: 'Total', value: currentImage.total },
                { label: 'Payment Type', value: currentImage.payment_type },
                { label: 'Signed', value: currentImage.signed }
            ];
            
            details.forEach(detail => {
                const row = document.createElement('tr');
                
                const labelCell = document.createElement('td');
                labelCell.textContent = detail.label;
                labelCell.style.padding = '8px';
                labelCell.style.border = '1px solid #ddd';
                labelCell.style.fontWeight = 'bold';
                labelCell.style.width = '40%';
                
                const valueCell = document.createElement('td');
                valueCell.textContent = detail.value || 'N/A';
                valueCell.style.padding = '8px';
                valueCell.style.border = '1px solid #ddd';
                
                row.appendChild(labelCell);
                row.appendChild(valueCell);
                detailsTable.appendChild(row);
            });
            
            detailsContainer.appendChild(detailsTable);
            contentContainer.appendChild(detailsContainer);
            
            // Add to slideshow container
            slideshowImageContainer.appendChild(contentContainer);
            
            // Update counter
            if (slideCounter) {
                slideCounter.textContent = `${currentIndex + 1} of ${images.length}`;
            }
            
            // Update button states
            if (prevSlideBtn) {
                prevSlideBtn.disabled = currentIndex === 0;
            }
            if (nextSlideBtn) {
                nextSlideBtn.disabled = currentIndex === images.length - 1;
            }
        }
        
        // Show the modal and display the first slide
        slideshowModal.style.display = 'block';
        displayCurrentSlide();
        
        // Set up navigation buttons
        if (prevSlideBtn) {
            prevSlideBtn.onclick = function() {
                if (currentIndex > 0) {
                    currentIndex--;
                    displayCurrentSlide();
                }
            };
        }
        
        if (nextSlideBtn) {
            nextSlideBtn.onclick = function() {
                if (currentIndex < images.length - 1) {
                    currentIndex++;
                    displayCurrentSlide();
                }
            };
        }
        
        // Set up close button click handler
        if (closeBtn) {
            closeBtn.onclick = function() {
                slideshowModal.style.display = 'none';
            };
        }
        
        // Close when clicking outside the content
        slideshowModal.onclick = function(event) {
            if (event.target === slideshowModal) {
                slideshowModal.style.display = 'none';
            }
        };
        
        // Set up keyboard navigation
        document.addEventListener('keydown', function(event) {
            if (slideshowModal.style.display === 'block') {
                if (event.key === 'ArrowLeft' && currentIndex > 0) {
                    currentIndex--;
                    displayCurrentSlide();
                } else if (event.key === 'ArrowRight' && currentIndex < images.length - 1) {
                    currentIndex++;
                    displayCurrentSlide();
                } else if (event.key === 'Escape') {
                    slideshowModal.style.display = 'none';
                }
            }
        });
    }
    
    // Function to generate PDF from images
    function generatePdf(images) {
        console.log('Generating PDF for', images.length, 'images');
        
        // Alert for now - in a real implementation, this would use a PDF library
        alert(`PDF generation started for ${images.length} images. This feature is in development.`);
        
        // Simulate PDF generation
        setTimeout(function() {
            alert('PDF generation complete! In a production version, the PDF would now download.');
        }, 1500);
    }
    
    console.log('✅ Scanner buttons fix initialized');
});
