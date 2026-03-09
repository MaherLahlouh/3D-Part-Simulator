/**
 * Keyboard Shortcuts Handler
 * 
 * Centralized management of all keyboard shortcuts for the application.
 * This module extracts keyboard shortcut logic from drag-logic.ts to improve
 * code organization and maintainability.
 * 
 * @module keyboard-shortcuts
 */

//@ts-nocheck

/**
 * Initialize keyboard shortcuts
 * Sets up event listeners for all keyboard shortcuts
 */
export function initializeKeyboardShortcuts() {
  window.addEventListener("keydown", handleKeyDown);
  console.log('✅ Keyboard shortcuts initialized');
}

/**
 * Handle keydown events
 * Processes all keyboard shortcuts
 */
function handleKeyDown(e: KeyboardEvent) {
  // Debug: Log all key presses (only for 'c' to avoid spam)
  if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey) {
    console.log("🔑 Key 'C' detected in keyboard handler");
  }
  
  // ✅ CRITICAL: Ignore if typing in input fields, textareas, or Monaco editor
  const target = e.target as HTMLElement;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
    if (e.key.toLowerCase() === 'c') {
      console.log("⚠️ 'C' key ignored - in input/textarea");
    }
    return;
  }
  
  // ✅ CRITICAL: Check if typing in Monaco Editor - MUST check before any key handling
  // This is the MOST IMPORTANT check to allow all keyboard input in the editor
  // Only block if the Monaco editor actually has focus (strict check)
  let isMonacoFocused = false;
  if (window.monacoEditor && typeof window.monacoEditor.hasTextFocus === 'function') {
    try {
      isMonacoFocused = window.monacoEditor.hasTextFocus();
    } catch (e) {
      // Ignore errors
    }
  }
  
  const activeElement = document.activeElement;
  const isMonacoActive = activeElement && (
    activeElement.closest && (
      activeElement.closest('#arduinoCodeContainer') ||
      activeElement.closest('.monaco-editor') ||
      activeElement.closest('[data-monaco-editor]')
    )
  );
  
  // Only block if Monaco editor actually has focus
  if (isMonacoFocused || isMonacoActive) {
    if (e.key.toLowerCase() === 'c') {
      console.log("⚠️ 'C' key ignored - Monaco editor has focus");
    }
    return; // Allow ALL typing in Monaco editor
  }

  // Skip if wiring mode is active (but allow 'C' for connections)
  if (window.wiringMode && e.key.toLowerCase() !== 'escape' && e.key.toLowerCase() !== 'c') {
    if (e.key.toLowerCase() === 'c') {
      console.log("🔍 Wiring mode active but allowing 'C'");
    }
    return;
  }

  const keyLower = e.key.toLowerCase();
  if (keyLower === 'c') {
    console.log("🔍 Reached switch statement for 'C' key");
  }

  switch(keyLower) {
    case "m":
      // ✅ Toggle multi-select mode
      e.preventDefault();
      e.stopPropagation();
      handleMultiSelectToggle();
      break;
      
    case "c":
      console.log("✅ Switch case 'c' matched!");
      if (e.ctrlKey || e.metaKey) {
        console.log("⚠️ Ctrl/Cmd+C detected - allowing copy");
        return; // Allow copy
      }
      e.preventDefault();
      e.stopPropagation();
      handleConnectParts();
      break;
      
    case "delete":
    case "backspace":
      e.preventDefault();
      e.stopPropagation();
      handleDelete();
      break;
      
    case "escape":
      handleEscape();
      break;
      
    // Toggle collision system debug
    case "b":
      if (e.ctrlKey && window.collisionSystem) {
        e.preventDefault();
        window.collisionSystem.debugShowBounds();
        showMessage("🎯 Showing collision bounds for 3 seconds");
      }
      break;
      
    // Toggle collision system
    case "k":
      if (e.ctrlKey && window.collisionSystem) {
        e.preventDefault();
        const enabled = window.collisionSystem.toggle();
        showMessage(`🎯 Collision system ${enabled ? 'enabled' : 'disabled'}`);
      }
      break;
      
    // ✅ Rotate selected components (multi-select)
    case "q":
    case "e":
      if (window.multiSelectMode && window.selectedComponents && window.selectedComponents.length > 0) {
        e.preventDefault();
        const angle = (e.key.toLowerCase() === 'q' ? -1 : 1) * Math.PI / 12; // 15 degrees
        if (typeof window.rotateSelectedComponents === 'function') {
          window.rotateSelectedComponents('y', angle);
          showMessage(`🔄 Rotated ${window.selectedComponents.length} component(s)`);
        }
      }
      break;
      
    case "a":
    case "d":
      if (window.multiSelectMode && window.selectedComponents && window.selectedComponents.length > 0 && e.shiftKey) {
        e.preventDefault();
        const angle = (e.key.toLowerCase() === 'a' ? -1 : 1) * Math.PI / 12; // 15 degrees
        if (typeof window.rotateSelectedComponents === 'function') {
          window.rotateSelectedComponents('x', angle);
          showMessage(`🔄 Rotated ${window.selectedComponents.length} component(s)`);
        }
      }
      break;
      
    case "z":
    case "x":
      if (window.multiSelectMode && window.selectedComponents && window.selectedComponents.length > 0 && e.shiftKey) {
        e.preventDefault();
        const angle = (e.key.toLowerCase() === 'z' ? -1 : 1) * Math.PI / 12; // 15 degrees
        if (typeof window.rotateSelectedComponents === 'function') {
          window.rotateSelectedComponents('z', angle);
          showMessage(`🔄 Rotated ${window.selectedComponents.length} component(s)`);
        }
      }
      break;
  }
}

/**
 * Handle multi-select mode toggle
 */
function handleMultiSelectToggle() {
  const multiSelectMode = !window.multiSelectMode;
  window.multiSelectMode = multiSelectMode;
  
  if (multiSelectMode) {
    showMessage("✅ Multi-Select Mode Activated - Click components to add/remove from selection");
    // Show visual indicator
    const indicator = document.createElement('div');
    indicator.className = 'multi-select-mode';
    indicator.textContent = 'Multi-Select Mode Active';
    document.body.appendChild(indicator);
    setTimeout(() => indicator.remove(), 2000);
  } else {
    showMessage("Multi-Select Mode Deactivated");
  }
  
  if (typeof window.updateSelectionIndicator === 'function') {
    window.updateSelectionIndicator();
  }
}

/**
 * Handle connect parts (C key)
 */
function handleConnectParts() {
  console.log("🔑 'C' key pressed - attempting to connect parts");
  // Use new connection system if available
  if (typeof window.connectHouseParts === 'function') {
    console.log("✅ Calling window.connectHouseParts()");
    try {
      window.connectHouseParts();
    } catch (error) {
      console.error("❌ Error in connectHouseParts:", error);
    }
  } else if (typeof window.manualConnectSelected === 'function') {
    // Fallback to old system
    console.log("⚠️ Using fallback manualConnectSelected()");
    window.manualConnectSelected();
  } else {
    console.warn("❌ No connection function available!");
    showMessage("⚠️ Connection system not available");
  }
}

/**
 * Handle delete (Delete/Backspace key)
 */
function handleDelete() {
  // Check if wires are selected first
  if (window.selectedWires && window.selectedWires.length > 0) {
    // Delete selected wires
    if (typeof window.deleteSelectedWires === 'function') {
      window.deleteSelectedWires();
    }
    return;
  }
  
  // Delete all selected components in multi-select mode
  if (window.multiSelectMode && window.selectedComponents && window.selectedComponents.length > 0) {
    const toDelete = [...window.selectedComponents];
    toDelete.forEach(comp => {
      window.selected = comp;
      if (typeof window.deleteSelected === 'function') {
        window.deleteSelected();
      }
    });
    window.selectedComponents = [];
    window.multiSelectMode = false;
    if (typeof window.updateSelectionIndicator === 'function') {
      window.updateSelectionIndicator();
    }
  } else {
    if (typeof window.deleteSelected === 'function') {
      window.deleteSelected();
    }
  }
}

/**
 * Handle escape key
 */
function handleEscape() {
  // Exit multi-select mode
  if (window.multiSelectMode) {
    window.multiSelectMode = false;
    window.selectedComponents = [];
    if (typeof window.clearSelectionHighlight === 'function') {
      window.clearSelectionHighlight();
    }
    if (typeof window.updateSelectionIndicator === 'function') {
      window.updateSelectionIndicator();
    }
    showMessage("Multi-Select Mode Exited");
    return;
  }
  
  window.selected = null;
  window.selectedComponents = [];
  if (typeof window.clearSelectionHighlight === 'function') {
    window.clearSelectionHighlight();
  }
  if (typeof window.updateSelectionIndicator === 'function') {
    window.updateSelectionIndicator();
  }
  
  // ✅ Hide component properties panel
  if (typeof window.hideComponentProperties === 'function') {
    window.hideComponentProperties();
  }
  
  // Clear snap preview
  if (window.collisionSystem && typeof window.collisionSystem.clearSnapPreview === 'function') {
    window.collisionSystem.clearSnapPreview();
  }
  
  // Also exit wiring mode if active
  if (window.wiringMode && typeof window.setWiringMode === 'function') {
    window.setWiringMode(false);
  }
}

/**
 * Show message to user
 */
function showMessage(text: string) {
  console.log(text);
  
  const indicator = document.getElementById("selectionIndicator");
  if (indicator) {
    indicator.textContent = text;
    indicator.style.background = "rgba(255, 193, 7, 0.95)";
    indicator.style.color = "black";
    
    setTimeout(() => {
      if (typeof window.updateSelectionIndicator === 'function') {
        window.updateSelectionIndicator();
      }
    }, 2000);
  }
}

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeKeyboardShortcuts);
  } else {
    initializeKeyboardShortcuts();
  }
}
