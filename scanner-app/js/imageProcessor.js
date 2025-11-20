class ImageProcessor {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resultCanvas = document.getElementById('resultCanvas');
        this.resultCtx = this.resultCanvas.getContext('2d');
        this.magnifier = document.getElementById('magnifier');
        this.magnifierCanvas = document.getElementById('magnifierCanvas');
        this.magnifierCtx = this.magnifierCanvas.getContext('2d');

        this.currentPage = null;
        this.draggingPoint = null;
        this.scale = 1;
        this.currentFilter = 'none';
        this.magnifierZoom = 3;
        this.magnifierSize = 150;

        this.initializeCanvasEvents();
    }

    initializeCanvasEvents() {
        // Placeholder - the dynamic dots handle mouse/touch events
    }

    loadPage(page) {
        this.currentPage = page;
        if (page && page.originalImage) {
            this.initializeCanvas(page.originalImage);
            this.drawImage();
        }
    }

    initializeCanvas(img) {
        const canvasWrapper = document.getElementById('canvasWrapper');
        const maxWidth = canvasWrapper.clientWidth || 800;
        const maxHeight = 600;
        this.scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);

        this.canvas.width = img.width * this.scale;
        this.canvas.height = img.height * this.scale;
    }

    drawImage() {
        if (!this.currentPage || !this.currentPage.originalImage) return;

        const img = this.currentPage.originalImage;
        const points = this.currentPage.points;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);

        if (points.length === 9) {
            this.drawGridOverlay(points);
            this.updatePointDots();
        }
    }

    drawGridOverlay(points) {
        // Fill polygon area
        this.ctx.fillStyle = 'rgba(33, 128, 141, 0.1)';
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x * this.scale, points[0].y * this.scale);
        this.ctx.lineTo(points[2].x * this.scale, points[2].y * this.scale);
        this.ctx.lineTo(points[8].x * this.scale, points[8].y * this.scale);
        this.ctx.lineTo(points[6].x * this.scale, points[6].y * this.scale);
        this.ctx.closePath();
        this.ctx.fill();

        // Draw grid lines
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeStyle = 'rgba(33, 128, 141, 0.6)';
        this.ctx.lineWidth = 1;

        // Horizontal lines
        for (let row = 0; row < 3; row++) {
            this.ctx.beginPath();
            for (let col = 0; col < 3; col++) {
                const idx = row * 3 + col;
                if (col === 0) {
                    this.ctx.moveTo(points[idx].x * this.scale, points[idx].y * this.scale);
                } else {
                    this.ctx.lineTo(points[idx].x * this.scale, points[idx].y * this.scale);
                }
            }
            this.ctx.stroke();
        }

        // Vertical lines
        for (let col = 0; col < 3; col++) {
            this.ctx.beginPath();
            for (let row = 0; row < 3; row++) {
                const idx = row * 3 + col;
                if (row === 0) {
                    this.ctx.moveTo(points[idx].x * this.scale, points[idx].y * this.scale);
                } else {
                    this.ctx.lineTo(points[idx].x * this.scale, points[idx].y * this.scale);
                }
            }
            this.ctx.stroke();
        }

        this.ctx.setLineDash([]);

        // Draw outer border
        this.ctx.strokeStyle = '#21808d';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x * this.scale, points[0].y * this.scale);
        this.ctx.lineTo(points[2].x * this.scale, points[2].y * this.scale);
        this.ctx.lineTo(points[8].x * this.scale, points[8].y * this.scale);
        this.ctx.lineTo(points[6].x * this.scale, points[6].y * this.scale);
        this.ctx.closePath();
        this.ctx.stroke();
    }

    updatePointDots() {
        document.querySelectorAll('.corner-dot, .center-dot').forEach(el => el.remove());

        if (!this.currentPage) return;

        this.currentPage.points.forEach((point, index) => {
            const dot = document.createElement('div');
            const isCorner = index === 0 || index === 2 || index === 6 || index === 8;
            dot.className = isCorner ? 'corner-dot' : 'center-dot';
            dot.style.left = (point.x * this.scale) + 'px';
            dot.style.top = (point.y * this.scale) + 'px';
            dot.dataset.index = index;
            document.getElementById('canvasWrapper').appendChild(dot);

            dot.addEventListener('mousedown', (e) => this.startDrag(e, index));
            dot.addEventListener('touchstart', (e) => this.startDrag(e, index));
        });
    }

    startDrag(e, pointIndex) {
        e.preventDefault();
        this.draggingPoint = pointIndex;

        const handleMove = (e) => this.drag(e);
        const handleEnd = () => this.endDrag(handleMove, handleEnd);

        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
        document.addEventListener('touchmove', handleMove);
        document.addEventListener('touchend', handleEnd);
    }

    drag(e) {
        if (this.draggingPoint === null || !this.currentPage) return;

        const rect = this.canvas.getBoundingClientRect();
        let x, y;

        if (e.type && e.type.startsWith('touch')) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }

        x = Math.max(0, Math.min(x, this.canvas.width));
        y = Math.max(0, Math.min(y, this.canvas.height));

        this.currentPage.points[this.draggingPoint].x = x / this.scale;
        this.currentPage.points[this.draggingPoint].y = y / this.scale;

        this.showMagnifier(e, x, y);
        this.drawImage();
    }

    showMagnifier(e, canvasX, canvasY) {
        let pageX, pageY;

        if (e.type && e.type.startsWith('touch')) {
            pageX = e.touches[0].pageX;
            pageY = e.touches[0].pageY;
        } else {
            pageX = e.pageX;
            pageY = e.pageY;
        }

        this.magnifier.style.left = (pageX - this.magnifierSize / 2) + 'px';
        this.magnifier.style.top = (pageY - this.magnifierSize / 2 - 80) + 'px';
        this.magnifier.style.display = 'block';

        this.magnifierCanvas.width = this.magnifierSize * this.magnifierZoom;
        this.magnifierCanvas.height = this.magnifierSize * this.magnifierZoom;

        const sourceX = (canvasX / this.scale) - (this.magnifierSize / this.magnifierZoom / 2);
        const sourceY = (canvasY / this.scale) - (this.magnifierSize / this.magnifierZoom / 2);
        const sourceSize = this.magnifierSize / this.magnifierZoom;

        this.magnifierCtx.drawImage(
            this.currentPage.originalImage,
            sourceX, sourceY, sourceSize, sourceSize,
            0, 0, this.magnifierSize * this.magnifierZoom, this.magnifierSize * this.magnifierZoom
        );
    }

    endDrag(handleMove, handleEnd) {
        this.draggingPoint = null;
        this.magnifier.style.display = 'none';
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('touchend', handleEnd);
    }

    autoDetectCorners(page) {
        if (!page || !page.originalImage) return;

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = page.originalImage.width;
        tempCanvas.height = page.originalImage.height;
        tempCtx.drawImage(page.originalImage, 0, 0);

        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const detected = this.detectDocumentEdges(imageData);

        if (detected.length === 4) {
            const [tl, tr, br, bl] = detected;
            page.points = [
                tl,
                { x: (tl.x + tr.x) / 2, y: (tl.y + tr.y) / 2 },
                tr,
                { x: (tl.x + bl.x) / 2, y: (tl.y + bl.y) / 2 },
                { x: (tl.x + tr.x + bl.x + br.x) / 4, y: (tl.y + tr.y + bl.y + br.y) / 4 },
                { x: (tr.x + br.x) / 2, y: (tr.y + br.y) / 2 },
                bl,
                { x: (bl.x + br.x) / 2, y: (bl.y + br.y) / 2 },
                br
            ];
        } else {
            const w = page.originalImage.width;
            const h = page.originalImage.height;
            const inset = 0.05;
            page.points = [
                { x: w * inset, y: h * inset },
                { x: w * 0.5, y: h * inset },
                { x: w * (1 - inset), y: h * inset },
                { x: w * inset, y: h * 0.5 },
                { x: w * 0.5, y: h * 0.5 },
                { x: w * (1 - inset), y: h * 0.5 },
                { x: w * inset, y: h * (1 - inset) },
                { x: w * 0.5, y: h * (1 - inset) },
                { x: w * (1 - inset), y: h * (1 - inset) }
            ];
        }

        this.drawImage();
    }

    detectDocumentEdges(imageData) {
        const width = imageData.width;
        const height = imageData.height;

        const blurred = this.gaussianBlur(imageData);
        const edges = this.sobelEdgeDetection(blurred);
        const corners = this.findLargestRectangle(edges, width, height);

        return corners;
    }

    gaussianBlur(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        const output = new Uint8ClampedArray(data.length);

        const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
        const kernelSum = 16;

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let r = 0, g = 0, b = 0;

                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = ((y + ky) * width + (x + kx)) * 4;
                        const k = kernel[(ky + 1) * 3 + (kx + 1)];
                        r += data[idx] * k;
                        g += data[idx + 1] * k;
                        b += data[idx + 2] * k;
                    }
                }

                const outIdx = (y * width + x) * 4;
                output[outIdx] = r / kernelSum;
                output[outIdx + 1] = g / kernelSum;
                output[outIdx + 2] = b / kernelSum;
                output[outIdx + 3] = 255;
            }
        }

        return { data: output, width, height };
    }

    sobelEdgeDetection(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        const output = new Uint8ClampedArray(width * height);

        const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
        const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let gx = 0, gy = 0;

                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = ((y + ky) * width + (x + kx)) * 4;
                        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                        const k = (ky + 1) * 3 + (kx + 1);
                        gx += gray * sobelX[k];
                        gy += gray * sobelY[k];
                    }
                }

                const magnitude = Math.sqrt(gx * gx + gy * gy);
                output[y * width + x] = magnitude > 50 ? 255 : 0;
            }
        }

        return { data: output, width, height };
    }

    findLargestRectangle(edges, width, height) {
        const data = edges.data;
        const step = 10;
        let maxArea = 0;
        let bestCorners = [];

        const points = [];
        for (let y = 0; y < height; y += step) {
            for (let x = 0; x < width; x += step) {
                if (data[y * width + x] > 128) {
                    points.push({ x, y });
                }
            }
        }

        if (points.length < 100) return [];

        points.sort((a, b) => {
            const distA = a.x + a.y;
            const distB = b.x + b.y;
            return distA - distB;
        });
        const tl = points[0];

        points.sort((a, b) => {
            const distA = (width - a.x) + a.y;
            const distB = (width - b.x) + b.y;
            return distA - distB;
        });
        const tr = points[0];

        points.sort((a, b) => {
            const distA = (width - a.x) + (height - a.y);
            const distB = (width - b.x) + (height - b.y);
            return distA - distB;
        });
        const br = points[0];

        points.sort((a, b) => {
            const distA = a.x + (height - a.y);
            const distB = b.x + (height - b.y);
            return distA - distB;
        });
        const bl = points[0];

        return [tl, tr, br, bl];
    }

    processDocument(page) {
        if (!page || !page.originalImage || page.points.length !== 9) return;

        const img = page.originalImage;
        const points = page.points;

        const tl = points[0], tr = points[2], bl = points[6], br = points[8];

        const topWidth = Math.sqrt((tr.x - tl.x) ** 2 + (tr.y - tl.y) ** 2);
        const bottomWidth = Math.sqrt((br.x - bl.x) ** 2 + (br.y - bl.y) ** 2);
        const leftHeight = Math.sqrt((bl.x - tl.x) ** 2 + (bl.y - tl.y) ** 2);
        const rightHeight = Math.sqrt((br.x - tr.x) ** 2 + (br.y - tr.y) ** 2);

        const outputWidth = Math.max(topWidth, bottomWidth);
        const outputHeight = Math.max(leftHeight, rightHeight);

        this.resultCanvas.width = outputWidth;
        this.resultCanvas.height = outputHeight;

        this.applyPerspectiveTransform(img, points, outputWidth, outputHeight);

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = this.resultCanvas.width;
        tempCanvas.height = this.resultCanvas.height;
        tempCtx.drawImage(this.resultCanvas, 0, 0);

        tempCanvas.toBlob((blob) => {
            const imgOriginal = new Image();
            imgOriginal.onload = () => {
                page.originalProcessedImage = imgOriginal;
            };
            imgOriginal.src = URL.createObjectURL(blob);
        });

        page.filter = 'none';
        this.currentFilter = 'none';

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === 'none');
        });
    }

    applyPerspectiveTransform(img, points, outputWidth, outputHeight) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        tempCtx.drawImage(img, 0, 0);

        const srcData = tempCtx.getImageData(0, 0, img.width, img.height);
        const destData = this.resultCtx.createImageData(Math.round(outputWidth), Math.round(outputHeight));

        const tl = points[0];
        const tr = points[2];
        const br = points[8];
        const bl = points[6];

        const outW = Math.round(outputWidth);
        const outH = Math.round(outputHeight);

        for (let y = 0; y < outH; y++) {
            for (let x = 0; x < outW; x++) {
                const u = x / (outW - 1);
                const v = y / (outH - 1);

                const srcX = (1 - u) * (1 - v) * tl.x +
                           u * (1 - v) * tr.x +
                           u * v * br.x +
                           (1 - u) * v * bl.x;

                const srcY = (1 - u) * (1 - v) * tl.y +
                           u * (1 - v) * tr.y +
                           u * v * br.y +
                           (1 - u) * v * bl.y;

                const destIdx = (y * outW + x) * 4;

                if (srcX >= 0 && srcX < img.width - 1 && srcY >= 0 && srcY < img.height - 1) {
                    const x0 = Math.floor(srcX);
                    const y0 = Math.floor(srcY);
                    const x1 = Math.min(x0 + 1, img.width - 1);
                    const y1 = Math.min(y0 + 1, img.height - 1);
                    const dx = srcX - x0;
                    const dy = srcY - y0;

                    const srcIdx00 = (y0 * img.width + x0) * 4;
                    const srcIdx10 = (y0 * img.width + x1) * 4;
                    const srcIdx01 = (y1 * img.width + x0) * 4;
                    const srcIdx11 = (y1 * img.width + x1) * 4;

                    for (let c = 0; c < 3; c++) {
                        destData.data[destIdx + c] = Math.round(
                            (1 - dx) * (1 - dy) * srcData.data[srcIdx00 + c] +
                            dx * (1 - dy) * srcData.data[srcIdx10 + c] +
                            (1 - dx) * dy * srcData.data[srcIdx01 + c] +
                            dx * dy * srcData.data[srcIdx11 + c]
                        );
                    }
                    destData.data[destIdx + 3] = 255;
                } else {
                    destData.data[destIdx] = 255;
                    destData.data[destIdx + 1] = 255;
                    destData.data[destIdx + 2] = 255;
                    destData.data[destIdx + 3] = 255;
                }
            }
        }

        this.resultCtx.putImageData(destData, 0, 0);
    }

    applyFilter(filterType) {
        if (!this.currentPage) return;

        this.currentFilter = filterType;
        this.currentPage.filter = filterType;

        const baseImage = this.currentPage.originalProcessedImage || this.currentPage.processedImage;
        if (baseImage) {
            this.resultCanvas.width = baseImage.width;
            this.resultCanvas.height = baseImage.height;
            this.resultCtx.drawImage(baseImage, 0, 0);
        }

        if (filterType === 'none') return;

        const imageData = this.resultCtx.getImageData(0, 0, this.resultCanvas.width, this.resultCanvas.height);
        const processedData = this.resultCtx.createImageData(imageData.width, imageData.height);

        for (let i = 0; i < imageData.data.length; i += 4) {
            let r = imageData.data[i];
            let g = imageData.data[i + 1];
            let b = imageData.data[i + 2];

            switch (filterType) {
                case 'bw':
                    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                    const bw = gray > 128 ? 255 : 0;
                    r = g = b = bw;
                    break;

                case 'grayscale':
                    const gs = 0.299 * r + 0.587 * g + 0.114 * b;
                    r = g = b = gs;
                    break;

                case 'enhanced':
                    const contrast = 1.4;
                    const brightness = 10;
                    const factor = (259 * (contrast * 100 + 255)) / (255 * (259 - contrast * 100));
                    r = Math.min(255, Math.max(0, factor * (r - 128) + 128 + brightness));
                    g = Math.min(255, Math.max(0, factor * (g - 128) + 128 + brightness));
                    b = Math.min(255, Math.max(0, factor * (b - 128) + 128 + brightness));
                    break;

                case 'lighten':
                    r = Math.min(255, r * 1.2 + 20);
                    g = Math.min(255, g * 1.2 + 20);
                    b = Math.min(255, b * 1.2 + 20);
                    break;
            }

            processedData.data[i] = r;
            processedData.data[i + 1] = g;
            processedData.data[i + 2] = b;
            processedData.data[i + 3] = imageData.data[i + 3];
        }

        this.resultCtx.putImageData(processedData, 0, 0);
    }

    rotateResult(degrees) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        tempCanvas.width = this.resultCanvas.height;
        tempCanvas.height = this.resultCanvas.width;

        tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
        tempCtx.rotate((degrees * Math.PI) / 180);
        tempCtx.drawImage(this.resultCanvas, -this.resultCanvas.width / 2, -this.resultCanvas.height / 2);

        this.resultCanvas.width = tempCanvas.width;
        this.resultCanvas.height = tempCanvas.height;
        this.resultCtx.clearRect(0, 0, this.resultCanvas.width, this.resultCanvas.height);
        this.resultCtx.drawImage(tempCanvas, 0, 0);

        this.applyFilter(this.currentFilter);
    }

    saveProcessedImage(page) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = this.resultCanvas.width;
        tempCanvas.height = this.resultCanvas.height;
        tempCtx.drawImage(this.resultCanvas, 0, 0);

        const originalProcessedCanvas = document.createElement('canvas');
        const originalProcessedCtx = originalProcessedCanvas.getContext('2d');
        originalProcessedCanvas.width = this.resultCanvas.width;
        originalProcessedCanvas.height = this.resultCanvas.height;

        if (this.currentFilter !== 'none' && page.processedImage) {
            originalProcessedCtx.drawImage(page.processedImage, 0, 0);
        } else {
            originalProcessedCtx.drawImage(this.resultCanvas, 0, 0);
        }

        tempCanvas.toBlob((blob) => {
            const img = new Image();
            img.onload = () => {
                page.processedImage = img;
                page.filter = this.currentFilter;
                page.status = 'processed';
            };
            img.src = URL.createObjectURL(blob);
        });

        if (this.currentFilter === 'none') {
            originalProcessedCanvas.toBlob((blob) => {
                const imgOriginal = new Image();
                imgOriginal.onload = () => {
                    page.originalProcessedImage = imgOriginal;
                };
                imgOriginal.src = URL.createObjectURL(blob);
            });
        }
    }
}
