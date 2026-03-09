// Wiring Undo/Redo System
//@ts-nocheck

import { restoreWiringState as restoreWiringStateFromState } from './wiring-state';
import { showUserMessage, syncWindowReference, disposeWireMesh } from './wiring-utils';

const MAX_UNDO_HISTORY = 50; // Maximum undo history items

// ENHANCEMENT #1: Save current state to undo stack
export function saveStateToUndo(operationType, data, wiringConnections) {
  try {
    const undoStack = getUndoStack();
    const redoStack = getRedoStack();
    
    // Validate wiringConnections
    if (!wiringConnections || !Array.isArray(wiringConnections)) {
      console.warn('saveStateToUndo: wiringConnections is not a valid array', wiringConnections);
      return; // Don't crash, just skip saving
    }
    
    // Safely clone connections (handle circular references)
    let clonedConnections;
    try {
      clonedConnections = JSON.parse(JSON.stringify(wiringConnections));
    } catch (cloneError) {
      console.warn('saveStateToUndo: Failed to clone connections, using shallow copy', cloneError);
      // Fallback to shallow copy
      clonedConnections = wiringConnections.map(conn => ({ ...conn }));
    }
    
    const state = {
      type: operationType,
      timestamp: Date.now(),
      connections: clonedConnections,
      data: data || {}
    };
    
    undoStack.push(state);
    
    // Limit undo stack size
    if (undoStack.length > MAX_UNDO_HISTORY) {
      undoStack.shift();
    }
    
    // Clear redo stack when new action is performed
    redoStack.length = 0;
    
    console.log(`💾 Saved state: ${operationType}`, state);
  } catch (error) {
    // Don't let undo/redo errors crash wire creation
    console.error('❌ Error saving undo state:', error);
    console.error('Operation type:', operationType);
    console.error('Error details:', error.message, error.stack);
  }
}

// Helper: Delete a specific wire by wireId
function deleteWireById(wireId, wiringConnections, wireLines, updateWireCount) {
  const scene = window.scene;
  if (!scene) return false;
  
  // Find wire mesh by ID
  const wireMesh = wireLines.find(wire => wire.metadata?.wireId === wireId);
  if (!wireMesh) {
    console.warn(`Wire not found for undo: ${wireId}`);
    return false;
  }
  
  // Remove from connections array
  const connIndex = wiringConnections.findIndex(conn => conn.wireId === wireId);
  if (connIndex > -1) {
    wiringConnections.splice(connIndex, 1);
  }
  
  // Remove from wire lines array
  const wireIndex = wireLines.indexOf(wireMesh);
  if (wireIndex > -1) {
    wireLines.splice(wireIndex, 1);
  }
  
  // Remove from selected wires if selected
  if (window.selectedWires) {
    const selIndex = window.selectedWires.indexOf(wireMesh);
    if (selIndex > -1) {
      window.selectedWires.splice(selIndex, 1);
    }
  }
  
  // Dispose mesh
  disposeWireMesh(wireMesh);
  
  // Disconnect terminals in pin state manager
  if (window.pinStateManager && wireMesh.metadata) {
    try {
      window.pinStateManager.disconnectTerminals(
        wireMesh.metadata.fromTerminalId,
        wireMesh.metadata.toTerminalId
      );
    } catch (err) {
      console.warn('Failed to disconnect terminals:', err);
    }
  }
  
  // Sync window references
  syncWindowReference('wiringConnections', wiringConnections);
  syncWindowReference('wireLines', wireLines);
  
  updateWireCount();
  return true;
}

// Helper: Recreate a specific wire from connection data
function recreateWireFromConnection(conn, wiringConnections, wireLines, drawWireBetween, findTerminalMeshById, updateWireCount) {
  const scene = window.scene;
  if (!scene) return false;
  
  const fromTerminal = findTerminalMeshById(scene, conn.fromTerminalId);
  const toTerminal = findTerminalMeshById(scene, conn.toTerminalId);
  
  if (!fromTerminal || !toTerminal) {
    console.warn(`Terminals not found for wire recreation: ${conn.fromTerminalId} → ${conn.toTerminalId}`);
    return false;
  }
  
  // Create wire with saved properties
  const wire = drawWireBetween(fromTerminal, toTerminal, {
    color: conn.wireColor,
    thickness: conn.wireThickness,
    skipUndo: true, // Don't save undo state for redo operations
    skipValidation: true // Skip validation for undo/redo
  }, wiringConnections, wireLines, updateWireCount);
  
  return wire !== null;
}

// ENHANCEMENT #1: Undo last wiring operation (one wire at a time)
export function undoWireOperation(wiringConnections, wireLines, drawWireBetween, findTerminalMeshById, updateWireCount) {
  const undoStack = getUndoStack();
  const redoStack = getRedoStack();
  
  if (undoStack.length === 0) {
    showUserMessage('Nothing to undo', 'info', 2000);
    console.log('⚠️ No operations to undo');
    return;
  }
  
  // Get last operation from undo stack
  const lastOperation = undoStack.pop();
  
  // Save current state to redo stack BEFORE undoing
  const currentState = {
    type: 'current',
    timestamp: Date.now(),
    connections: JSON.parse(JSON.stringify(wiringConnections)),
    data: {}
  };
  redoStack.push(currentState);
  
  let success = false;
  let operationName = '';
  
  // Handle different operation types individually
  if (lastOperation.type === 'create_wire') {
    // Undo wire creation: delete the wire that was created
    const wireId = lastOperation.data?.wireId;
    if (wireId) {
      success = deleteWireById(wireId, wiringConnections, wireLines, updateWireCount);
      operationName = 'Wire Created';
      console.log(`⏪ Undo: Removed wire ${wireId}`);
    }
  } else if (lastOperation.type === 'delete_wire') {
    // Undo wire deletion: recreate the wire that was deleted
    const wireData = lastOperation.data;
    if (wireData && wireData.wireId) {
      // Find the connection data from the previous state (before deletion)
      const prevState = undoStack.length > 0 ? undoStack[undoStack.length - 1] : null;
      let connData = null;
      
      if (prevState && prevState.connections) {
        connData = prevState.connections.find(c => c.wireId === wireData.wireId);
      }
      
      // If not found in previous state, use the data from the operation
      if (!connData && wireData) {
        connData = {
          wireId: wireData.wireId,
          fromTerminalId: wireData.fromTerminalId,
          toTerminalId: wireData.toTerminalId,
          wireColor: wireData.wireColor,
          wireThickness: wireData.wireThickness,
          fromTerminalName: wireData.fromTerminalName,
          toTerminalName: wireData.toTerminalName
        };
      }
      
      if (connData) {
        success = recreateWireFromConnection(connData, wiringConnections, wireLines, drawWireBetween, findTerminalMeshById, updateWireCount);
        operationName = 'Wire Deleted';
        console.log(`⏪ Undo: Restored wire ${wireData.wireId}`);
      }
    }
  } else if (lastOperation.type === 'delete_multiple_wires' || lastOperation.type === 'clear_all_wires') {
    // For bulk operations, restore the entire previous state
    const prevState = undoStack.length > 0 ? undoStack[undoStack.length - 1] : null;
    if (prevState && prevState.connections) {
      restoreWiringStateFromState(prevState.connections, drawWireBetween, findTerminalMeshById, updateWireCount);
      if (window.wiringConnections) {
        window.wiringConnections.length = 0;
        window.wiringConnections.push(...prevState.connections);
      }
      success = true;
      operationName = lastOperation.type === 'clear_all_wires' ? 'All Wires Cleared' : 'Wires Deleted';
    }
  } else {
    // Fallback: restore previous state
    const prevState = undoStack.length > 0 ? undoStack[undoStack.length - 1] : null;
    if (prevState && prevState.connections) {
      restoreWiringStateFromState(prevState.connections, drawWireBetween, findTerminalMeshById, updateWireCount);
      if (window.wiringConnections) {
        window.wiringConnections.length = 0;
        window.wiringConnections.push(...prevState.connections);
      }
      success = true;
      operationName = getOperationDisplayName(lastOperation.type);
    }
  }
  
  // Clear wire selection after undo
  if (window.selectedWires) {
    window.selectedWires.length = 0;
  }
  
  if (success) {
    if (!operationName) {
      operationName = getOperationDisplayName(lastOperation.type);
    }
    showUserMessage(`⏪ Undid: ${operationName}`, 'info', 2000);
  } else {
    showUserMessage('Failed to undo operation', 'error', 2000);
    console.error('Failed to undo operation:', lastOperation);
  }
  
  // Update wire count
  updateWireCount();
}

// ENHANCEMENT #1: Redo last undone operation (one wire at a time)
export function redoWireOperation(wiringConnections, wireLines, drawWireBetween, findTerminalMeshById, updateWireCount) {
  const undoStack = getUndoStack();
  const redoStack = getRedoStack();
  
  if (redoStack.length === 0) {
    showUserMessage('Nothing to redo', 'info', 2000);
    console.log('⚠️ No operations to redo');
    return;
  }
  
  // Get state to redo
  const stateToRedo = redoStack.pop();
  
  // Save current state to undo stack before redo
  const currentState = {
    type: 'current_before_redo',
    timestamp: Date.now(),
    connections: JSON.parse(JSON.stringify(wiringConnections)),
    data: {}
  };
  undoStack.push(currentState);
  
  let success = false;
  let operationName = '';
  
  // Determine what operation to redo by comparing states
  const currentWireIds = new Set(wiringConnections.map(c => c.wireId));
  const redoWireIds = new Set(stateToRedo.connections.map(c => c.wireId));
  
  // Find wires that need to be added (in redo but not in current)
  const wiresToAdd = stateToRedo.connections.filter(c => !currentWireIds.has(c.wireId));
  // Find wires that need to be removed (in current but not in redo)
  const wiresToRemove = wiringConnections.filter(c => !redoWireIds.has(c.wireId));
  
  // If only one wire difference, handle individually
  if (wiresToAdd.length === 1 && wiresToRemove.length === 0) {
    // Redo wire creation
    const conn = wiresToAdd[0];
    success = recreateWireFromConnection(conn, wiringConnections, wireLines, drawWireBetween, findTerminalMeshById, updateWireCount);
    operationName = 'Wire Created';
    console.log(`⏩ Redo: Recreated wire ${conn.wireId}`);
  } else if (wiresToRemove.length === 1 && wiresToAdd.length === 0) {
    // Redo wire deletion
    const wireId = wiresToRemove[0].wireId;
    success = deleteWireById(wireId, wiringConnections, wireLines, updateWireCount);
    operationName = 'Wire Deleted';
    console.log(`⏩ Redo: Removed wire ${wireId}`);
  } else {
    // Multiple wires changed, restore full state
    restoreWiringStateFromState(stateToRedo.connections, drawWireBetween, findTerminalMeshById, updateWireCount);
    if (window.wiringConnections) {
      window.wiringConnections.length = 0;
      window.wiringConnections.push(...stateToRedo.connections);
    }
    success = true;
    operationName = getOperationDisplayName(stateToRedo.type);
    console.log(`⏩ Redo: Restored ${stateToRedo.connections.length} wire(s)`);
  }
  
  // Clear wire selection after redo
  if (window.selectedWires) {
    window.selectedWires.length = 0;
  }
  
  if (success) {
    if (!operationName) {
      operationName = getOperationDisplayName(stateToRedo.type);
    }
    showUserMessage(`⏩ Redid: ${operationName}`, 'info', 2000);
  } else {
    showUserMessage('Failed to redo operation', 'error', 2000);
    console.error('Failed to redo operation:', stateToRedo);
  }
  
  // Update wire count
  updateWireCount();
}

// Note: restoreWiringState is now imported from wiring-state.ts to avoid duplication

// Get or create undo stack
function getUndoStack() {
  if (!window._wiringUndoStack) {
    window._wiringUndoStack = [];
  }
  return window._wiringUndoStack;
}

// Get or create redo stack
function getRedoStack() {
  if (!window._wiringRedoStack) {
    window._wiringRedoStack = [];
  }
  return window._wiringRedoStack;
}

// Get user-friendly operation name for display
function getOperationDisplayName(operationType) {
  const names = {
    'create_wire': 'Wire Created',
    'delete_wire': 'Wire Deleted',
    'delete_multiple_wires': 'Wires Deleted',
    'clear_all_wires': 'All Wires Cleared',
    'current': 'Operation',
    'current_before_redo': 'Operation'
  };
  return names[operationType] || operationType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
