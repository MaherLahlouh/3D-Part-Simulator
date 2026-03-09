/**
 * Header Buttons Component
 * 
 * Centralized management of all header button actions.
 * This module extracts header button logic from the main files to improve
 * code organization, maintainability, and reusability.
 * 
 * @module header-buttons
 */

//@ts-nocheck

/**
 * Clear all components and wires from the scene
 * Exposed as window.eraseAll
 */
export function eraseAll() {
  if (!confirm('Are you sure you want to clear all components and wires?')) {
    return;
  }

  console.log('🗑️ Starting erase all...');

  // Stop collision system during erase
  if (window.collisionSystem) {
    try {
      window.collisionSystem.stop();
      window.collisionSystem.clear();
    } catch(e) {
      console.warn('Error stopping collision system:', e);
    }
  }
  
  // ✅ Clear all wires FIRST (before disposing components)
  if (typeof window.clearAllWiring === 'function') {
    try {
      window.clearAllWiring();
    } catch(e) {
      console.warn('Error clearing wiring:', e);
    }
  }

  // Clear house connections (NEW connection system)
  if (window.houseConnectionSystem && typeof window.houseConnectionSystem.clearAllConnections === 'function') {
    try {
      window.houseConnectionSystem.clearAllConnections();
    } catch(e) {
      console.warn('Error clearing new house connections:', e);
    }
  }
  // Fallback to old system
  if (window.houseGroupManager && typeof window.houseGroupManager.clearAllConnections === 'function') {
    try {
      window.houseGroupManager.clearAllConnections();
    } catch(e) {
      console.warn('Error clearing house connections:', e);
    }
  } else if (window.houseGroupManager) {
    // Fallback: clear connection groups if clearAllConnections doesn't exist
    try {
      if (window.houseGroupManager.connectionGroups) {
        window.houseGroupManager.connectionGroups.clear();
      }
      if (window.houseGroupManager.activeGroup) {
        window.houseGroupManager.activeGroup = null;
      }
    } catch(e) {
      console.warn('Error clearing house group manager:', e);
    }
  }

  // Clear all components
  if (window.allParts && Array.isArray(window.allParts)) {
    const partsToDispose = [...window.allParts];
    partsToDispose.forEach(part => {
      try {
        // Dispose child meshes
        const children = part.getChildMeshes();
        children.forEach(child => {
          try {
            if (child.material) child.material.dispose();
            if (child.actionManager) child.actionManager.dispose();
            child.dispose();
          } catch(e) {
            console.warn('Error disposing child mesh:', e);
          }
        });
        
        // Dispose component label if it exists
        const labelMesh = part.getChildMeshes().find(m => m.metadata && m.metadata.isComponentLabel);
        if (labelMesh) {
          labelMesh.dispose();
        }
        
        if (part.material) part.material.dispose();
        if (part.actionManager) part.actionManager.dispose();
        part.dispose(true, true);
      } catch(e) {
        console.warn('Error disposing part:', e);
      }
    });
    window.allParts.length = 0;
  }

  // Clear loaded parts
  if (window.loadedParts && Array.isArray(window.loadedParts)) {
    window.loadedParts.length = 0;
  }

  // Clear selection
  if (window.selected) {
    window.selected = null;
  }
  if (window.selectedComponents && Array.isArray(window.selectedComponents)) {
    window.selectedComponents.length = 0;
  }

  // Hide component properties panel
  if (typeof window.hideComponentProperties === 'function') {
    window.hideComponentProperties();
  }

  // Update UI
  if (typeof window.updateComponentCount === 'function') {
    window.updateComponentCount();
  }
  if (typeof window.updateSelectionIndicator === 'function') {
    window.updateSelectionIndicator();
  }

  // Restart collision system
  if (window.collisionSystem && typeof window.collisionSystem.start === 'function') {
    try {
      window.collisionSystem.start();
    } catch(e) {
      console.warn('Error restarting collision system:', e);
    }
  }

  console.log('✅ Erase all complete');
  if (typeof window.showMessage === 'function') {
    window.showMessage('✅ All components and wires cleared');
  }
}

/**
 * Delete the currently selected component OR wire
 * Exposed as window.deleteSelected
 */
export function deleteSelected() {
  // Check multiple possible selection sources
  let selected = window.selected;
  
  // If no selection, check if a wire is currently being hovered/selected
  if (!selected && window.hoveredWire) {
    selected = window.hoveredWire;
  }
  
  // Check if we have a wire in activeWire (from wiring system)
  if (!selected && window.activeWire) {
    selected = window.activeWire;
  }
  
  // Check selectedWire if it exists
  if (!selected && window.selectedWire) {
    selected = window.selectedWire;
  }

  if (!selected) {
    if (typeof window.showMessage === 'function') {
      window.showMessage("No item selected");
    }
    return;
  }

  // 🟢 CASE 1: Selected item is a WIRE
  if (selected.metadata?.isWire || selected.name?.includes('wire') || selected.name?.includes('Wire')) {
    const wireName = selected.name || 'Wire';
    if (!confirm(`Delete ${wireName}?`)) return;

    console.log('🔌 Deleting wire:', wireName);

    // Remove from wireLines array
    if (Array.isArray(window.wireLines)) {
      const wireIndex = window.wireLines.indexOf(selected);
      if (wireIndex > -1) {
        window.wireLines.splice(wireIndex, 1);
        console.log(`✅ Removed wire from wireLines array (index ${wireIndex})`);
      }
    }

    // Clear wire connection metadata before deletion
    const wireMeta = selected.metadata || {};
    const fromTerminal = wireMeta.fromTerminal;
    const toTerminal = wireMeta.toTerminal;

    // Remove wire reference from connected terminals
    if (fromTerminal && fromTerminal.metadata) {
      if (fromTerminal.metadata.connectedWires) {
        const idx = fromTerminal.metadata.connectedWires.indexOf(selected);
        if (idx > -1) fromTerminal.metadata.connectedWires.splice(idx, 1);
      }
      if (fromTerminal.metadata.isConnected && (!fromTerminal.metadata.connectedWires || fromTerminal.metadata.connectedWires.length === 0)) {
        fromTerminal.metadata.isConnected = false;
      }
    }
    if (toTerminal && toTerminal.metadata) {
      if (toTerminal.metadata.connectedWires) {
        const idx = toTerminal.metadata.connectedWires.indexOf(selected);
        if (idx > -1) toTerminal.metadata.connectedWires.splice(idx, 1);
      }
      if (toTerminal.metadata.isConnected && (!toTerminal.metadata.connectedWires || toTerminal.metadata.connectedWires.length === 0)) {
        toTerminal.metadata.isConnected = false;
      }
    }

    // Use dedicated wire deletion logic if available
    if (typeof window.deleteWire === 'function') {
      try {
        window.deleteWire(selected);
      } catch (e) {
        console.warn('Error in deleteWire function:', e);
        // Fallback: manual disposal
        try {
          if (selected.material) selected.material.dispose();
          if (selected.actionManager) selected.actionManager.dispose();
          selected.dispose();
        } catch (disposeError) {
          console.warn('Error disposing wire manually:', disposeError);
        }
      }
    } else {
      // Fallback: manual disposal
      try {
        if (selected.material) selected.material.dispose();
        if (selected.actionManager) selected.actionManager.dispose();
        selected.dispose();
      } catch (e) {
        console.warn('Error disposing wire:', e);
      }
    }

    // Update terminal connection states
    if (typeof window.updateTerminalConnectionStates === 'function') {
      setTimeout(() => window.updateTerminalConnectionStates(), 50);
    }

    // Clear ALL possible wire selection references
    window.selected = null;
    window.selectedWire = null;
    window.hoveredWire = null;
    if (window.activeWire === selected) {
      window.activeWire = null;
    }
    
    if (typeof window.hideComponentProperties === 'function') {
      window.hideComponentProperties();
    }
    if (typeof window.updateSelectionIndicator === 'function') {
      window.updateSelectionIndicator();
    }
    if (typeof window.showMessage === 'function') {
      window.showMessage(`✅ ${wireName} deleted`);
    }
    
    console.log('✅ Wire deletion complete');
    return;
  }

  // 🔴 CASE 2: Selected item is a COMPONENT
  const componentName = selected.metadata?.baseName || selected.metadata?.fileName || selected.name;
  if (!confirm(`Delete ${componentName}?`)) return;

  const allParts = window.allParts || [];
  const index = allParts.indexOf(selected);
  if (index === -1) {
    if (typeof window.showMessage === 'function') {
      window.showMessage("Selected item not found in component list");
    }
    return;
  }

  // Break house connections (NEW system)
  if (window.houseConnectionSystem && window.houseConnectionSystem.isConnected?.(selected)) {
    try {
      window.houseConnectionSystem.disconnectPart(selected);
    } catch (e) {
      console.warn('Error breaking house connection (new system):', e);
    }
  }
  // Fallback to old system
  else if (window.houseGroupManager?.isConnected) {
    try {
      window.houseGroupManager.breakConnection(selected);
    } catch (e) {
      console.warn('Error breaking house connection:', e);
    }
  }

  // Unregister from collision system
  if (window.collisionSystem?.unregisterPart) {
    try {
      window.collisionSystem.unregisterPart(selected);
    } catch (e) {
      console.warn('Error unregistering from collision system:', e);
    }
  }

  // Delete wires connected to this component
  if (window.scene) {
    const componentTerminals = selected.getChildMeshes(true).filter(m =>
      m.metadata && m.metadata.isTerminal
    );

    if (selected.metadata && selected.metadata.isTerminal) {
      componentTerminals.push(selected);
    }

    if (Array.isArray(window.wireLines)) {
      const wiresToDelete = [];
      const componentTerminalIds = componentTerminals.map(t => t.metadata?.terminalId).filter(Boolean);

      window.wireLines.forEach(wire => {
        const wireMeta = wire.metadata || {};
        const fromTerm = wireMeta.fromTerminal;
        const toTerm = wireMeta.toTerminal;
        const fromId = wireMeta.fromTerminalId;
        const toId = wireMeta.toTerminalId;

        const connectedByReference = (fromTerm && fromTerm.parent === selected) ||
                                     (toTerm && toTerm.parent === selected) ||
                                     componentTerminals.includes(fromTerm) ||
                                     componentTerminals.includes(toTerm);

        const connectedById = componentTerminalIds.includes(fromId) ||
                             componentTerminalIds.includes(toId);

        if (connectedByReference || connectedById) {
          wiresToDelete.push(wire);
        }
      });

      if (wiresToDelete.length > 0) {
        console.log(`🔌 Deleting ${wiresToDelete.length} wire(s) connected to ${componentName}`);
        wiresToDelete.forEach(wire => {
          if (typeof window.deleteWire === 'function') {
            window.deleteWire(wire);
          }
        });

        if (typeof window.updateTerminalConnectionStates === 'function') {
          setTimeout(() => window.updateTerminalConnectionStates(), 100);
        }
      }
    }
  }

  // Show deletion effect
  if (typeof window.showDeletionEffect === 'function') {
    window.showDeletionEffect(selected.position);
  }

  // Dispose child meshes
  const children = selected.getChildMeshes();
  children.forEach(child => {
    try {
      if (child.material) child.material.dispose();
      if (child.actionManager) child.actionManager.dispose();
      child.dispose();
    } catch (e) {
      console.warn('Error disposing child mesh:', e);
    }
  });

  // Remove from arrays
  allParts.splice(index, 1);
  if (window.loadedParts && Array.isArray(window.loadedParts)) {
    const loadedIndex = window.loadedParts.indexOf(selected);
    if (loadedIndex > -1) {
      window.loadedParts.splice(loadedIndex, 1);
    }
  }

  // Dispose the component
  try {
    const labelMesh = selected.getChildMeshes().find(m => m.metadata && m.metadata.isComponentLabel);
    if (labelMesh) {
      labelMesh.dispose();
    }
    if (selected.material) selected.material.dispose();
    if (selected.actionManager) selected.actionManager.dispose();
    selected.dispose(true, true);
  } catch (e) {
    console.warn('Error disposing component:', e);
  }

  // Clear selection & UI
  window.selected = null;
  if (typeof window.hideComponentProperties === 'function') {
    window.hideComponentProperties();
  }
  if (typeof window.updateComponentCount === 'function') {
    window.updateComponentCount();
  }
  if (typeof window.updateSelectionIndicator === 'function') {
    window.updateSelectionIndicator();
  }
  if (typeof window.showMessage === 'function') {
    window.showMessage(`✅ ${componentName} deleted`);
  }
}

/**
 * Disconnect the selected component from its parent
 * Exposed as window.disconnectSelected
 */
export function disconnectSelected() {
  if (!window.selected) {
    if (typeof window.showMessage === 'function') {
      window.showMessage("No component selected");
    }
    return;
  }

  const selected = window.selected;

  // Use new connection system if available
  if (window.houseConnectionSystem && window.houseConnectionSystem.isConnected(selected)) {
    window.houseConnectionSystem.disconnectPart(selected);
    if (typeof window.showMessage === 'function') {
      window.showMessage("House part disconnected from assembly");
    }
    if (typeof window.showDisconnectionEffect === 'function') {
      window.showDisconnectionEffect(selected.position);
    }
    return;
  }
  // Fallback to old system
  else if (window.houseGroupManager && window.houseGroupManager.isConnected(selected)) {
    window.houseGroupManager.breakConnection(selected);
    if (typeof window.showMessage === 'function') {
      window.showMessage("House part disconnected from assembly");
    }
    if (typeof window.showDisconnectionEffect === 'function') {
      window.showDisconnectionEffect(selected.position);
    }
    return;
  }

  if (selected.parent && selected.parent !== window.scene) {
    const worldPosition = selected.getAbsolutePosition().clone();
    selected.setParent(null);
    selected.position = worldPosition;
    
    if (typeof window.showMessage === 'function') {
      window.showMessage("Component disconnected");
    }
    if (typeof window.showDisconnectionEffect === 'function') {
      window.showDisconnectionEffect(selected.position);
    }
  } else {
    if (typeof window.showMessage === 'function') {
      window.showMessage("Component is not connected to anything");
    }
  }
}

/**
 * Disconnect all connected parts
 * Exposed as window.disconnectAll
 */
export function disconnectAll() {
  let disconnectedCount = 0;

  // Use new connection system if available
  if (window.houseConnectionSystem) {
    disconnectedCount = window.houseConnectionSystem.disconnectAll();
  }
  
  // Also handle old system if it exists
  if (window.houseGroupManager) {
    const allParts = window.allParts || [];
    allParts.forEach(part => {
      if (window.houseGroupManager.isConnected(part)) {
        window.houseGroupManager.breakConnection(part);
        disconnectedCount++;
      }
    });
  }

  if (typeof window.showMessage === 'function') {
    window.showMessage(`✅ Disconnected ${disconnectedCount} part(s)`);
  }
}

/**
 * Undo the last operation
 * Exposed as window.undo
 */
export function undo() {
  if (typeof window._undo === 'function') {
    window._undo();
  } else {
    console.warn('Undo function not available');
  }
}

/**
 * Redo the last undone operation
 * Exposed as window.redo
 */
export function redo() {
  if (typeof window._redo === 'function') {
    window._redo();
  } else {
    console.warn('Redo function not available');
  }
}

/**
 * Show export menu
 * Exposed as window.showExportMenu
 */
export function showExportMenu(button: HTMLElement) {
  if (typeof window._showExportMenu === 'function') {
    window._showExportMenu(button);
  } else {
    console.warn('Export menu function not available');
  }
}

/**
 * Show keyboard shortcuts modal
 * Exposed as window.showShortcutsModal
 */
export function showShortcutsModal() {
  const modal = document.getElementById('shortcutsModal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

/**
 * Open project manager
 * Exposed as window.openProjectManager
 */
export function openProjectManager() {
  const modal = document.getElementById('projectManagerModal');
  if (modal) {
    modal.style.display = 'flex';
    if (typeof window.loadProjects === 'function') {
      window.loadProjects();
    }
  }
}

/**
 * Initialize header buttons - expose all functions to window
 */
export function initializeHeaderButtons() {
  window.eraseAll = eraseAll;
  window.deleteSelected = deleteSelected;
  window.disconnectSelected = disconnectSelected;
  window.disconnectAll = disconnectAll;
  window.showExportMenu = showExportMenu;
  window.showShortcutsModal = showShortcutsModal;
  window.openProjectManager = openProjectManager;
  
  if (typeof window.undo !== 'function') {
    window.undo = undo;
  }
  if (typeof window.redo !== 'function') {
    window.redo = redo;
  }
  
  console.log('✅ Header buttons initialized');
}

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeHeaderButtons);
  } else {
    initializeHeaderButtons();
  }
}