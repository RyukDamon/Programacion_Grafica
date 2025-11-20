class UIManager {
    constructor(scanner) {
        this.scanner = scanner;
    }

    showEmptyState() {
        document.getElementById('emptyState').style.display = 'block';
        document.getElementById('editorSection').style.display = 'none';
        document.getElementById('resultSection').style.display = 'none';
        document.getElementById('exportSection').style.display = 'none';
    }

    showEditor() {
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('editorSection').style.display = 'block';
        document.getElementById('resultSection').style.display = 'none';

        const page = this.scanner.pageManager.getCurrentPage();
        if (page) {
            document.getElementById('editorTitle').textContent = 
                `Ajustando página ${this.scanner.pageManager.currentPageIndex + 1}`;
        }
    }

    showResult() {
        document.getElementById('editorSection').style.display = 'none';
        document.getElementById('resultSection').style.display = 'block';

        const page = this.scanner.pageManager.getCurrentPage();
        if (page) {
            document.getElementById('resultTitle').textContent = 
                `Página ${this.scanner.pageManager.currentPageIndex + 1} procesada`;
        }
    }

    renderPageList() {
        const pageList = document.getElementById('pageList');
        pageList.innerHTML = '';

        this.scanner.pageManager.pages.forEach((page, index) => {
            const pageItem = this.createPageItem(page, index);
            pageList.appendChild(pageItem);
        });

        this.updatePageCounter();
        this.updateExportSection();
        this.updateSidebarVisibility();
    }

    createPageItem(page, index) {
        const pageItem = document.createElement('div');
        pageItem.className = `page-item ${index === this.scanner.pageManager.currentPageIndex ? 'active' : ''}`;
        pageItem.draggable = true;

        const thumbnail = document.createElement('div');
        thumbnail.className = 'page-thumbnail';

        if (page.processedImage) {
            const img = document.createElement('img');
            img.src = page.processedImage.src;
            thumbnail.appendChild(img);
        } else if (page.originalImage) {
            const img = document.createElement('img');
            img.src = page.originalImage.src;
            thumbnail.appendChild(img);
        }

        const pageInfo = document.createElement('div');
        pageInfo.className = 'page-info';
        pageInfo.innerHTML = `
            <span class="page-number">Página ${index + 1}</span>
            <span class="page-status ${page.status}">${page.status === 'processed' ? 'Procesada' : 'Original'}</span>
        `;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-page';
        deleteBtn.innerHTML = '×';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            this.scanner.pageManager.deletePage(index);
        };

        pageItem.appendChild(thumbnail);
        pageItem.appendChild(pageInfo);
        pageItem.appendChild(deleteBtn);

        // Event listeners
        pageItem.onclick = () => {
            this.scanner.pageManager.selectPage(index);
            this.closeMobileSidebar();
        };

        // Drag and drop
        pageItem.ondragstart = (e) => {
            e.dataTransfer.setData('text/plain', index.toString());
            pageItem.classList.add('dragging');
        };

        pageItem.ondragend = () => {
            pageItem.classList.remove('dragging');
        };

        pageItem.ondragover = (e) => {
            e.preventDefault();
            pageItem.classList.add('drag-over');
        };

        pageItem.ondragleave = () => {
            pageItem.classList.remove('drag-over');
        };

        pageItem.ondrop = (e) => {
            e.preventDefault();
            pageItem.classList.remove('drag-over');

            const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
            if (draggedIndex !== index) {
                this.scanner.pageManager.movePage(draggedIndex, index);
            }
        };

        return pageItem;
    }

    updatePageSelection() {
        document.querySelectorAll('.page-item').forEach((item, index) => {
            item.classList.toggle('active', index === this.scanner.pageManager.currentPageIndex);
        });
    }

    updatePageCounter() {
        const counter = document.getElementById('pageCounter');
        const pageCount = this.scanner.pageManager.pages.length;

        if (pageCount === 0) {
            counter.textContent = 'Sin páginas';
        } else {
            const current = this.scanner.pageManager.currentPageIndex + 1;
            counter.textContent = `Página ${current} de ${pageCount}`;
        }
    }

    updateExportSection() {
        const processedCount = this.scanner.pageManager.getProcessedPages().length;
        const exportSection = document.getElementById('exportSection');

        if (processedCount > 0) {
            exportSection.style.display = 'block';
        } else {
            exportSection.style.display = 'none';
        }
    }

    updateSidebarVisibility() {
        const sidebar = document.getElementById('sidebar');
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const pageCount = this.scanner.pageManager.pages.length;

        if (pageCount === 0) {
            sidebar.classList.remove('visible', 'mobile-open');
            mobileMenuBtn.style.display = 'none';
        } else {
            sidebar.classList.add('visible');
            mobileMenuBtn.style.display = 'flex';
        }
    }

    toggleMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('mobile-open');
    }

    closeMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.remove('mobile-open');
    }
}
