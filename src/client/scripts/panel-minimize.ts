// Panel Minimize/Maximize Functionality
// Handles minimizing and maximizing of View Controls and Component Properties panels
//@ts-nocheck
interface PanelState {
  isMinimized: boolean;
  originalHeight: string;
  originalMaxHeight: string;
  originalMinHeight: string;
  originalPadding: string;
}

const panelStates: Record<string, PanelState> = {};

/**
 * Toggle minimize/maximize state of a panel
 */
window.toggleMinimizePanel = function(panelId: string, contentId: string) {
  const panel = document.getElementById(panelId);
  const content = document.getElementById(contentId);
  
  if (!panel || !content) {
    console.warn(`Panel or content not found: ${panelId} / ${contentId}`);
    return;
  }

  // Initialize state if not exists
  if (!panelStates[panelId]) {
    const computedStyle = window.getComputedStyle(panel);
    panelStates[panelId] = {
      isMinimized: false,
      originalHeight: computedStyle.height,
      originalMaxHeight: computedStyle.maxHeight,
      originalMinHeight: computedStyle.minHeight,
      originalPadding: computedStyle.padding
    };
  }

  const state = panelStates[panelId];
  const minimizeBtn = panel.querySelector('.minimize-btn') as HTMLElement;

  if (state.isMinimized) {
    // Maximize: Restore original size
    panel.style.height = state.originalHeight;
    panel.style.maxHeight = state.originalMaxHeight;
    panel.style.minHeight = state.originalMinHeight;
    panel.style.padding = state.originalPadding;
    content.style.display = '';
    
    if (minimizeBtn) {
      minimizeBtn.textContent = '▼';
      minimizeBtn.title = 'Minimize';
    }
    
    state.isMinimized = false;
  } else {
    // Minimize: Collapse to header only
    panel.style.height = 'auto';
    panel.style.maxHeight = 'none';
    panel.style.minHeight = 'auto';
    panel.style.padding = '12px 18px';
    content.style.display = 'none';
    
    if (minimizeBtn) {
      minimizeBtn.textContent = '▲';
      minimizeBtn.title = 'Maximize';
    }
    
    state.isMinimized = true;
  }
};

console.log('✅ Panel minimize functionality loaded');

