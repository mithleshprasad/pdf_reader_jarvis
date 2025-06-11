// Required libraries (load from CDN or bundle)
// pdf-lib, pdf.js, jspdf, browser-image-compression, etc.

class DocumentConverter {
    constructor() {
        this.initUI();
        this.initEventListeners();
    }
    
    initUI() {
        // Initialize UI components
        this.fileInput = document.getElementById('file-input');
        this.convertBtn = document.getElementById('convert-btn');
        this.clearBtn = document.getElementById('clear-btn');
        this.previewArea = document.querySelector('.preview-area');
        this.downloadArea = document.querySelector('.download-area');
        
        // Tool selection
        this.toolButtons = document.querySelectorAll('[data-tool]');
        this.toolPanels = document.querySelectorAll('.tool-panel');
    }
    
    initEventListeners() {
        // File input handling
        this.fileInput.addEventListener('change', this.handleFileSelection.bind(this));
        
        // Drag and drop
        const dropZone = document.querySelector('.file-dropzone');
        dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
        dropZone.addEventListener('drop', this.handleDrop.bind(this));
        
        // Tool selection
        this.toolButtons.forEach(btn => {
            btn.addEventListener('click', this.switchTool.bind(this));
        });
        
        // Action buttons
        this.convertBtn.addEventListener('click', this.convertFiles.bind(this));
        this.clearBtn.addEventListener('click', this.clearSelection.bind(this));
    }
    
    handleFileSelection(e) {
        const files = Array.from(e.target.files);
        this.processSelectedFiles(files);
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
    }
    
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        const files = Array.from(e.dataTransfer.files);
        this.processSelectedFiles(files);
    }
    
    processSelectedFiles(files) {
        // Validate files
        if (!this.validateFiles(files)) return;
        
        // Display preview
        this.displayPreview(files);
    }
    
    validateFiles(files) {
        // Check file types based on selected tool
        const currentTool = document.querySelector('[data-tool].active').dataset.tool;
        const allowedTypes = this.getAllowedTypes(currentTool);
        
        for (const file of files) {
            if (!allowedTypes.includes(file.type)) {
                alert(`Invalid file type: ${file.name}. Allowed types: ${allowedTypes.join(', ')}`);
                return false;
            }
        }
        return true;
    }
    
    getAllowedTypes(tool) {
        const typeMap = {
            'image-to-pdf': ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'],
            'pdf-to-image': ['application/pdf'],
            'image-converter': ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff'],
            'pdf-tools': ['application/pdf']
        };
        return typeMap[tool] || [];
    }
    
    displayPreview(files) {
        this.previewArea.innerHTML = '';
        
        files.forEach(file => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            
            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                previewItem.appendChild(img);
            } else if (file.type === 'application/pdf') {
                // Use pdf.js to generate thumbnail
                this.generatePdfThumbnail(file).then(thumbnail => {
                    previewItem.appendChild(thumbnail);
                });
            }
            
            const fileName = document.createElement('p');
            fileName.textContent = file.name;
            previewItem.appendChild(fileName);
            
            this.previewArea.appendChild(previewItem);
        });
    }
    
    async generatePdfThumbnail(file) {
        // Implement using pdf.js
        // Return a canvas element with the first page preview
    }
    
    switchTool(e) {
        const tool = e.currentTarget.dataset.tool;
        
        // Update active button
        this.toolButtons.forEach(btn => btn.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        // Show corresponding panel
        this.toolPanels.forEach(panel => panel.classList.remove('active'));
        document.getElementById(`${tool}-interface`).classList.add('active');
        
        // Update file input accept attribute
        const allowedTypes = this.getAllowedTypes(tool).join(',');
        this.fileInput.setAttribute('accept', allowedTypes);
        
        // Clear previous selections
        this.clearSelection();
    }
    
    async convertFiles() {
        const files = Array.from(this.fileInput.files);
        if (files.length === 0) {
            alert('Please select files first');
            return;
        }
        
        const currentTool = document.querySelector('[data-tool].active').dataset.tool;
        
        try {
            this.showLoading(true);
            
            let result;
            switch(currentTool) {
                case 'image-to-pdf':
                    result = await this.convertImagesToPdf(files);
                    break;
                case 'pdf-to-image':
                    result = await this.convertPdfToImages(files[0]); // Assuming single PDF
                    break;
                case 'image-converter':
                    result = await this.convertImageFormats(files);
                    break;
                case 'pdf-tools':
                    // Handle PDF tools (merge, split, etc.)
                    break;
                default:
                    throw new Error('Invalid tool selected');
            }
            
            this.displayDownloadLinks(result);
        } catch (error) {
            console.error('Conversion error:', error);
            alert('An error occurred during conversion. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }
    
    async convertImagesToPdf(imageFiles) {
        // Use pdf-lib or jspdf to create PDF from images
        const { PDFDocument } = PDFLib;
        
        const pdfDoc = await PDFDocument.create();
        
        for (const imageFile of imageFiles) {
            const imageBytes = await this.readFileAsArrayBuffer(imageFile);
            let image;
            
            if (imageFile.type === 'image/jpeg') {
                image = await pdfDoc.embedJpg(imageBytes);
            } else if (imageFile.type === 'image/png') {
                image = await pdfDoc.embedPng(imageBytes);
            }
            
            const page = pdfDoc.addPage([image.width, image.height]);
            page.drawImage(image, {
                x: 0,
                y: 0,
                width: image.width,
                height: image.height,
            });
        }
        
        const pdfBytes = await pdfDoc.save();
        return new Blob([pdfBytes], { type: 'application/pdf' });
    }
    
    async convertPdfToImages(pdfFile) {
        // Use pdf.js to render each page as image
        const pdf = await pdfjsLib.getDocument(URL.createObjectURL(pdfFile)).promise;
        const images = [];
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
            
            const imageBlob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/jpeg', 0.95);
            });
            
            images.push({
                blob: imageBlob,
                pageNumber: i
            });
        }
        
        return images;
    }
    
    async convertImageFormats(imageFiles) {
        // Convert between different image formats
        const convertedImages = [];
        
        for (const imageFile of imageFiles) {
            const targetFormat = document.getElementById('target-format').value;
            const quality = document.getElementById('image-quality').value;
            
            const image = await createImageBitmap(imageFile);
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);
            
            let blob;
            if (targetFormat === 'jpg') {
                blob = await new Promise(resolve => {
                    canvas.toBlob(resolve, 'image/jpeg', quality);
                });
            } else if (targetFormat === 'png') {
                blob = await new Promise(resolve => {
                    canvas.toBlob(resolve, 'image/png');
                });
            }
            
            convertedImages.push(blob);
        }
        
        return convertedImages;
    }
    
    displayDownloadLinks(results) {
        this.downloadArea.innerHTML = '';
        
        if (Array.isArray(results)) {
            results.forEach((result, index) => {
                const link = this.createDownloadLink(result, `converted-${index + 1}`);
                this.downloadArea.appendChild(link);
            });
        } else {
            const link = this.createDownloadLink(results, 'converted');
            this.downloadArea.appendChild(link);
        }
    }
    
    createDownloadLink(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Determine file extension
        let extension;
        if (blob.type === 'application/pdf') {
            extension = 'pdf';
        } else if (blob.type === 'image/jpeg') {
            extension = 'jpg';
        } else if (blob.type === 'image/png') {
            extension = 'png';
        }
        
        a.download = `${fileName}.${extension}`;
        a.textContent = `Download ${a.download}`;
        a.className = 'btn btn-primary me-2';
        
        return a;
    }
    
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }
    
    showLoading(show) {
        if (show) {
            this.convertBtn.disabled = true;
            this.convertBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
        } else {
            this.convertBtn.disabled = false;
            this.convertBtn.textContent = 'Convert';
        }
    }
    
    clearSelection() {
        this.fileInput.value = '';
        this.previewArea.innerHTML = '';
        this.downloadArea.innerHTML = '';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DocumentConverter();
});