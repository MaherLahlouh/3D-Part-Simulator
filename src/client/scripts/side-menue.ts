// @ts-nocheck

// Note: toggleMenu, openCodeEditor, closeCodeEditor, and toggleCodeEditor are defined in monaco.ts
// These functions are accessed via window.toggleMenu, window.openCodeEditor, etc.

let scriptsLoaded = false;
let simulatorReady = false;
let initialCameraPosition = null;
let initialCameraTarget = null;

window.addEventListener('load', function () {
    // Purpose: Update component count on page load
    // Called from: Window load event
    // Used in: Initializing component count display
    if (typeof updateComponentCount === 'function') {
        updateComponentCount();
    }
    
    // ENHANCEMENT: Initialize wire count on page load
    // Purpose: Display initial wire count (0) when page loads
    // Called from: Window load event
    // Used in: Initializing wire count display in status bar
    if (typeof window.updateWireCount === 'function') {
        window.updateWireCount();
    }
    
    // Note: Project loading logic is handled in monaco.ts window.addEventListener('load')
});