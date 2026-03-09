//@ts-nocheck

let ui = null;

export function initializePartLoaderUI() {
    if (ui) return; 
    ui = {
        overlay:      document.getElementById("loadingOverlay"),
        text:         document.getElementById("loadingText"),
        progressFill: document.getElementById("loadingProgressFill"),
        percentage:   document.getElementById("loadingPercentage"),
        progressBar:  document.getElementById("loadingProgressBar")
    };
}

export function showPartLoadingOverlay(message = 'Loading...', progress = 0) {
    if (!ui) initializePartLoaderUI(); 

    if (ui.overlay)      ui.overlay.style.display = "flex";
    if (ui.text)         ui.text.textContent = message;
    if (ui.progressBar)  ui.progressBar.style.display = "block";
    
    updatePartLoadingProgress(progress);
}

export function updatePartLoadingProgress(progress, message = null) {
    if (!ui) return;

    const percentString = Math.round(progress) + "%";

    if (ui.progressFill) ui.progressFill.style.width = percentString;
    if (ui.percentage) {
        ui.percentage.style.display = "block";
        ui.percentage.textContent = percentString;
    }
    if (message && ui.text) ui.text.textContent = message;
}

export function hidePartLoadingOverlay() {
    if (!ui) return;
    ui.overlay?.style.setProperty('display', 'none');
    ui.progressBar?.style.setProperty('display', 'none');
    ui.percentage?.style.setProperty('display', 'none');
}