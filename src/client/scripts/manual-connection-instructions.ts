// @ts-nocheck

/**
 * Initializes the Manual Connection Button logic
 * Call this from main.ts inside DOMContentLoaded
 */
export function setupManualConnectionUI() {
    const manualBtn = document.getElementById('manualConnectionHeaderBtn');
    
    if (!manualBtn) {
        console.warn("⚠️ Manual Connection button (#manualConnectionHeaderBtn) not found.");
        return;
    }

    // --- 1. Click Handler ---
    manualBtn.addEventListener('click', () => {
        if (typeof window.toggleManualConnectionPanel === 'function') {
            window.toggleManualConnectionPanel();
        } else {
            console.error("❌ toggleManualConnectionPanel is not defined. Ensure manual-connection-ui logic is loaded.");
            alert("Manual Connection panel is still loading. Please try again in a second.");
        }
    });

    // --- 2. Hover Effects (Modern Logic) ---
    const applyHoverStyle = (isHovering) => {
        // Don't override styles if the button is currently 'active'
        if (manualBtn.classList.contains('active')) return;

        if (isHovering) {
            manualBtn.style.background = 'linear-gradient(135deg, #45a049 0%, #4CAF50 100%)';
            manualBtn.style.transform = 'translateY(-2px)';
            manualBtn.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.4)';
        } else {
            manualBtn.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
            manualBtn.style.transform = 'translateY(0)';
            manualBtn.style.boxShadow = '0 2px 8px rgba(76, 175, 80, 0.3)';
        }
    };

    manualBtn.addEventListener('mouseenter', () => applyHoverStyle(true));
    manualBtn.addEventListener('mouseleave', () => applyHoverStyle(false));

    console.log("✅ Manual Connection button handler initialized");
}