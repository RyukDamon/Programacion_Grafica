class DocumentScanner {
    constructor() {
        this.pageManager = new PageManager(this);
        this.imageProcessor = new ImageProcessor();
        this.uiManager = new UIManager(this);
        this.exportManager = new ExportManager(this);
        this.initializeEventListeners();

        // Initial UI state
        this.uiManager.showEmptyState();
    }

    initializeEventListeners() {
        // Botón hamburguesa mobile
        document.getElementById('mobileMenuBtn').addEventListener('click', () => {
            this.uiManager.toggleMobileSidebar();
        });

        document.getElementById('addPageBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files);
        });

        document.getElementById('autoDetectBtn').addEventListener('click', () => {
            this.imageProcessor.autoDetectCorners(this.pageManager.getCurrentPage());
        });

        document.getElementById('processBtn').addEventListener('click', () => {
            this.processCurrentPage();
        });

        document.getElementById('savePageBtn').addEventListener('click', () => {
            this.saveCurrentPage();
        });

        document.getElementById('backToEditBtn').addEventListener('click', () => {
            this.uiManager.showEditor();
        });

        document.getElementById('rotateLeftBtn').addEventListener('click', () => {
            this.imageProcessor.rotateResult(-90);
        });

        document.getElementById('rotateRightBtn').addEventListener('click', () => {
            this.imageProcessor.rotateResult(90);
        });

        document.getElementById('downloadSingleBtn').addEventListener('click', () => {
            this.downloadSingleImage();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.imageProcessor.applyFilter(btn.dataset.filter);
            });
        });

        // Export buttons
        document.getElementById('exportPdfBtn').addEventListener('click', () => {
            this.exportManager.exportToPDF();
        });

        document.getElementById('exportImagesBtn').addEventListener('click', () => {
            this.exportManager.exportToZIP();
        });
    }

    handleFileSelect(files) {
        for (const file of files) {
            if (file.type.match('image.*')) {
                this.pageManager.addPage(file);
            }
        }
    }

    processCurrentPage() {
        const page = this.pageManager.getCurrentPage();
        if (!page) return;

        this.imageProcessor.processDocument(page);
        this.uiManager.showResult();
    }

    saveCurrentPage() {
        const page = this.pageManager.getCurrentPage();
        if (!page) return;

        this.imageProcessor.saveProcessedImage(page);
        this.pageManager.updatePageThumbnail(page);
        this.uiManager.showEditor();
        this.uiManager.updateExportSection();
    }

    downloadSingleImage() {
        const canvas = document.getElementById('resultCanvas');
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `documento-escaneado-${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }
}
