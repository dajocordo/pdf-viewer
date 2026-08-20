pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let scale = 1;

const canvas = document.getElementById('pdfCanvas');
const ctx = canvas.getContext('2d');
const placeholder = document.getElementById('placeholder');

function renderPage(num) {
    pageRendering = true;

    pdfDoc.getPage(num).then(page => {
        const viewport = page.getViewport({ scale: scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };

        const renderTask = page.render(renderContext);

        renderTask.promise.then(() => {
            pageRendering = false;
            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        });
    });

    document.getElementById('pageNum').textContent = num;
}

function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

function onPrevPage() {
    if (pageNum <= 1) return;
    pageNum--;
    queueRenderPage(pageNum);
    updateButtons();
}

function onNextPage() {
    if (pageNum >= pdfDoc.numPages) return;
    pageNum++;
    queueRenderPage(pageNum);
    updateButtons();
}

function updateButtons() {
    document.getElementById('prevPage').disabled = pageNum <= 1;
    document.getElementById('nextPage').disabled = pageNum >= pdfDoc.numPages;
}

function updateZoom() {
    scale = parseFloat(document.getElementById('zoom').value);
    queueRenderPage(pageNum);
}

document.getElementById('prevPage').addEventListener('click', onPrevPage);
document.getElementById('nextPage').addEventListener('click', onNextPage);
document.getElementById('zoom').addEventListener('change', updateZoom);

document.getElementById('zoomIn').addEventListener('click', () => {
    const zoomSelect = document.getElementById('zoom');
    const currentIndex = zoomSelect.selectedIndex;
    if (currentIndex < zoomSelect.options.length - 1) {
        zoomSelect.selectedIndex = currentIndex + 1;
        updateZoom();
    }
});

document.getElementById('zoomOut').addEventListener('click', () => {
    const zoomSelect = document.getElementById('zoom');
    const currentIndex = zoomSelect.selectedIndex;
    if (currentIndex > 0) {
        zoomSelect.selectedIndex = currentIndex - 1;
        updateZoom();
    }
});

document.getElementById('fileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
        const fileReader = new FileReader();

        fileReader.onload = function () {
            const typedarray = new Uint8Array(this.result);

            pdfjsLib.getDocument(typedarray).promise.then(pdf => {
                pdfDoc = pdf;
                document.getElementById('pageCount').textContent = pdf.numPages;

                pageNum = 1;
                renderPage(pageNum);

                placeholder.style.display = 'none';
                canvas.style.display = 'block';

                document.getElementById('prevPage').disabled = false;
                document.getElementById('nextPage').disabled = false;
                document.getElementById('zoom').disabled = false;
                document.getElementById('zoomIn').disabled = false;
                document.getElementById('zoomOut').disabled = false;

                updateButtons();
            });
        };

        fileReader.readAsArrayBuffer(file);
    }
});