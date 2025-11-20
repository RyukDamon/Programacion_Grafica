class PageManager {
    constructor(scanner) {
        this.scanner = scanner;
        this.pages = [];
        this.currentPageIndex = -1;
    }

    addPage(file) {
        const page = {
            id: Date.now() + Math.random(),
            file: file,
            originalImage: null,
            processedImage: null,
            originalProcessedImage: null,
            points: [],
            filter: 'none',
            status: 'original'
        };

        this.pages.push(page);
        this.loadImageFromFile(page, file).then(() => {
            this.scanner.uiManager.renderPageList();
            this.selectPage(this.pages.length - 1);
            this.scanner.uiManager.updateSidebarVisibility();
        });
    }

    async loadImageFromFile(page, file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    page.originalImage = img;
                    page.points = this.generateDefaultPoints(img.width, img.height);

                    // Auto-detect borders after a short delay
                    setTimeout(() => {
                        if (this.scanner && this.scanner.imageProcessor) {
                            this.scanner.imageProcessor.autoDetectCorners(page);
                        }
                    }, 100);

                    resolve();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    generateDefaultPoints(width, height) {
        const inset = 0.05;
        return [
            { x: width * inset, y: height * inset },
            { x: width * 0.5, y: height * inset },
            { x: width * (1 - inset), y: height * inset },
            { x: width * inset, y: height * 0.5 },
            { x: width * 0.5, y: height * 0.5 },
            { x: width * (1 - inset), y: height * 0.5 },
            { x: width * inset, y: height * (1 - inset) },
            { x: width * 0.5, y: height * (1 - inset) },
            { x: width * (1 - inset), y: height * (1 - inset) }
        ];
    }

    selectPage(index) {
        if (index >= 0 && index < this.pages.length) {
            this.currentPageIndex = index;
            this.scanner.imageProcessor.loadPage(this.pages[index]);
            this.scanner.uiManager.showEditor();
            this.scanner.uiManager.updatePageSelection();
            this.scanner.uiManager.updatePageCounter();
        }
    }

    getCurrentPage() {
        return this.pages[this.currentPageIndex] || null;
    }

    deletePage(index) {
        if (index >= 0 && index < this.pages.length) {
            this.pages.splice(index, 1);
            if (this.currentPageIndex >= index) {
                this.currentPageIndex = Math.max(-1, this.currentPageIndex - 1);
            }
            this.scanner.uiManager.renderPageList();

            if (this.pages.length === 0) {
                this.scanner.uiManager.showEmptyState();
            } else if (this.currentPageIndex >= 0) {
                this.selectPage(Math.min(this.currentPageIndex, this.pages.length - 1));
            }

            this.scanner.uiManager.updateSidebarVisibility();
        }
    }

    movePage(fromIndex, toIndex) {
        if (fromIndex >= 0 && fromIndex < this.pages.length &&
            toIndex >= 0 && toIndex < this.pages.length) {
            const page = this.pages.splice(fromIndex, 1)[0];
            this.pages.splice(toIndex, 0, page);

            if (this.currentPageIndex === fromIndex) {
                this.currentPageIndex = toIndex;
            }

            this.scanner.uiManager.renderPageList();
        }
    }

    updatePageThumbnail(page) {
        if (page.processedImage) {
            page.status = 'processed';
            this.scanner.uiManager.renderPageList();
        }
    }

    getProcessedPages() {
        return this.pages.filter(page => page.processedImage && page.status === 'processed');
    }
}
