class ExportManager {
    constructor(scanner) {
        this.scanner = scanner;
    }

    exportToPDF() {
        const processedPages = this.scanner.pageManager.getProcessedPages();
        if (processedPages.length === 0) {
            alert('No hay páginas procesadas para exportar');
            return;
        }

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        let isFirstPage = true;

        processedPages.forEach(page => {
            if (!isFirstPage) {
                pdf.addPage();
            }
            isFirstPage = false;

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = page.processedImage.width;
            canvas.height = page.processedImage.height;
            ctx.drawImage(page.processedImage, 0, 0);

            const imgData = canvas.toDataURL('image/jpeg', 0.95);

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgAspectRatio = canvas.width / canvas.height;
            const pageAspectRatio = pageWidth / pageHeight;

            let imgWidth, imgHeight;
            if (imgAspectRatio > pageAspectRatio) {
                imgWidth = pageWidth;
                imgHeight = pageWidth / imgAspectRatio;
            } else {
                imgHeight = pageHeight;
                imgWidth = pageHeight * imgAspectRatio;
            }

            const x = (pageWidth - imgWidth) / 2;
            const y = (pageHeight - imgHeight) / 2;

            pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);
        });

        pdf.save('documento-escaneado.pdf');
    }

    exportToZIP() {
        const processedPages = this.scanner.pageManager.getProcessedPages();
        if (processedPages.length === 0) {
            alert('No hay páginas procesadas para exportar');
            return;
        }

        const zip = new JSZip();
        const folder = zip.folder('documentos-escaneados');

        let promises = [];

        processedPages.forEach((page, index) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = page.processedImage.width;
            canvas.height = page.processedImage.height;
            ctx.drawImage(page.processedImage, 0, 0);

            const promise = new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    const fileName = `pagina-${String(index + 1).padStart(2, '0')}.png`;
                    folder.file(fileName, blob);
                    resolve();
                });
            });
            promises.push(promise);
        });

        Promise.all(promises).then(() => {
            zip.generateAsync({ type: 'blob' }).then((content) => {
                const url = URL.createObjectURL(content);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'documentos-escaneados.zip';
                a.click();
                URL.revokeObjectURL(url);
            });
        });
    }
}
