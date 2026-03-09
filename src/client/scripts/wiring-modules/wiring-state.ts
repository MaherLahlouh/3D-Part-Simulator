// Wiring State Management - Core state arrays and initialization
//@ts-nocheck

import { disposeWireMesh, showUserMessage, syncWindowReference } from './wiring-utils';

// Keep track of terminal metadata and wire meshes
let wiringConnections = []; // { fromTerminalId, toTerminalId, wireColor, wireId, fromTerminalName, toTerminalName }
let wireLines = []; // actual mesh references for lines

// ENHANCEMENT #2: Multi-select for wires
let selectedWires = []; // Array of selected wire meshes

// Purpose: Initialize wiring system for 3D mode, sets up scene reference
// Called from: sceneSetup.js, index.html initialization
export function initializeWiring(scene) {
  if (!scene) return;
  // Note: window.scene is already set in scene-setup.ts, but this ensures it's set if called independently
  window.scene = scene;
  wiringConnections = wiringConnections || [];
  wireLines = wireLines || [];
  selectedWires = [];
  
  // ✅ Expose arrays to window for global access
  syncWindowReference('wiringConnections', wiringConnections);
  syncWindowReference('wireLines', wireLines);
  
  // Initialize wire count
  //updateWireCount();
  
  console.log("🔌 Wiring initialized with Terminal-Based connections + Undo/Redo + Multi-Select");
}

// NEW: Update wire count in UI
export function updateWireCount() {
  const wireCountEl = document.getElementById('wireCount');
  if (wireCountEl) {
    // ✅ Use the most reliable source - check both arrays
    const connectionsCount = (wiringConnections && Array.isArray(wiringConnections)) ? wiringConnections.length : 0;
    const linesCount = (wireLines && Array.isArray(wireLines)) ? wireLines.length : 0;
    
    // Use the maximum to ensure we don't miss any wires
    const finalCount = Math.max(connectionsCount, linesCount);
    
    wireCountEl.textContent = `Wires: ${finalCount}`;
    console.log(`📊 Wire count updated: ${finalCount} (connections: ${connectionsCount}, lines: ${linesCount})`);
  }
}

// Purpose: Get all wiring connections data for saving project
export function getWiringData() {
  return wiringConnections.map(conn => ({
    from: conn.fromTerminalId,
    to: conn.toTerminalId,
    fromName: conn.fromTerminalName,
    toName: conn.toTerminalName,
    color: conn.wireColor,
    thickness: conn.wireThickness || 0.05,
    wireId: conn.wireId
  }));
}

// Purpose: Clear all wires from the scene
export function clearAllWiring(saveStateToUndo, updateWireCount) {
  try {
    if (wiringConnections.length > 0) {
      saveStateToUndo('clear_all_wires', {
        count: wiringConnections.length
      }, wiringConnections);
    }
    
    selectedWires = [];
    syncWindowReference('selectedWires', selectedWires);
    
    wireLines.forEach(wire => {
      disposeWireMesh(wire);
    });
    wireLines.length = 0;
    wiringConnections.length = 0;
    
    // ✅ Ensure window references are updated after clearing
    if (window.wireLines) {
      window.wireLines.length = 0;
    }
    if (window.wiringConnections) {
      window.wiringConnections.length = 0;
    }

    const scene = window.scene;
    if (scene) {
      const snapshot = scene.meshes.slice();
      snapshot.forEach(m => {
        const name = typeof m.name === 'string' ? m.name : '';
        const looksLikeWire =
          (m.metadata && m.metadata.wireId) ||
          name.startsWith('wire_') ||
          (m.getClassName && m.getClassName() === 'LinesMesh');
        if (looksLikeWire) {
          disposeWireMesh(m);
        }
      });
    }

    console.log('✅ All wires cleared');
    showUserMessage('🗑️ All wires cleared', 'success', 2000);
    
    updateWireCount();
  } catch (err) {
    console.error('❌ Error clearing wires:', err);
  }
}

// Get wiring connections array (for other modules)
export function getWiringConnections() {
  return wiringConnections;
}

// Get wire lines array (for other modules)
export function getWireLines() {
  return wireLines;
}

// Set wiring connections array (for other modules)
export function setWiringConnections(connections) {
  wiringConnections = connections;
  syncWindowReference('wiringConnections', wiringConnections);
}

// Set wire lines array (for other modules)
export function setWireLines(lines) {
  wireLines = lines;
  syncWindowReference('wireLines', wireLines);
}

// Get selected wires array
export function getSelectedWires() {
  return selectedWires;
}

// Set selected wires array
export function setSelectedWires(wires) {
  selectedWires = wires;
  syncWindowReference('selectedWires', selectedWires);
}

// Get all state (for convenience)
export function getState() {
  return {
    wiringConnections,
    wireLines,
    selectedWires
  };
}
//--------------------------------------------------just for debugging-------------------------
window.getState = getState;

// Set all state (for convenience)
export function setState(state) {
  if (state.wiringConnections !== undefined) {
    wiringConnections = state.wiringConnections;
    syncWindowReference('wiringConnections', wiringConnections);
  }
  if (state.wireLines !== undefined) {
    wireLines = state.wireLines;
    syncWindowReference('wireLines', wireLines);
  }
  if (state.selectedWires !== undefined) {
    selectedWires = state.selectedWires;
    syncWindowReference('selectedWires', selectedWires);
  }
}


//-------------------------------------------------not used but maybe needed-----------------------------------------------------
// Restore wiring state (for undo/redo)
export function restoreWiringState(savedConnections, drawWireBetween, findTerminalMeshById, updateWireCount) {
  const scene = window.scene;
  if (!scene) return;
  
  wireLines.forEach(wire => {
    disposeWireMesh(wire);
  });
  wireLines.length = 0;
  wiringConnections.length = 0;
  selectedWires.length = 0;
  syncWindowReference('selectedWires', selectedWires);
  
  savedConnections.forEach(conn => {
    const fromTerminal = findTerminalMeshById(scene, conn.fromTerminalId);
    const toTerminal = findTerminalMeshById(scene, conn.toTerminalId);
    
    if (fromTerminal && toTerminal) {
      drawWireBetween(fromTerminal, toTerminal, {
        color: conn.wireColor,
        thickness: conn.wireThickness,
        skipUndo: true
      }, wiringConnections, wireLines, updateWireCount);
    }
  });
  
  syncWindowReference('wiringConnections', wiringConnections);
  syncWindowReference('wireLines', wireLines);
  
  console.log(`✅ Restored ${savedConnections.length} wire connections`);
  updateWireCount();
}



//-------------------------------------------------not used but maybe needed-----------------------------------------------------
// Purpose: Restore wiring connections from saved project data
export function restoreWiring(scene, wiringDataArray, drawWireBetween, findTerminalMeshById, updateWireCount) {
  if (!wiringDataArray || !Array.isArray(wiringDataArray)) return;
  if (!scene) return;

  wiringConnections = [];
  wireLines.forEach(m => { disposeWireMesh(m); });
  wireLines = [];
  selectedWires = [];
  syncWindowReference('selectedWires', selectedWires);

  wiringDataArray.forEach(conn => {
    const fromId = conn.from;
    const toId = conn.to;
    const color = conn.color || "#FF6600";
    const thickness = conn.thickness || 0.05;

    const fromTerminal = findTerminalMeshById(scene, fromId);
    const toTerminal = findTerminalMeshById(scene, toId);

    if (fromTerminal && toTerminal) {
      const line = drawWireBetween(fromTerminal, toTerminal, { color, thickness, skipUndo: true }, wiringConnections, wireLines, updateWireCount);
      if (line) {
        console.log(`✅ Restored wire: ${fromId} → ${toId}`);
      }
    } else {
      console.warn("Could not restore wire between:", fromId, "and", toId);
      wiringConnections.push({
        fromTerminalId: fromId,
        toTerminalId: toId,
        wireColor: color,
        wireThickness: thickness,
        wireId: conn.wireId || `${fromId}_to_${toId}`,
        fromTerminalName: conn.fromName,
        toTerminalName: conn.toName
      });
    }
  });

  syncWindowReference('wiringConnections', wiringConnections);
  syncWindowReference('wireLines', wireLines);
  
  setTimeout(() => {
    // Refresh wires after a short delay to ensure terminals are ready
    if (typeof window.refreshAllWires === 'function') {
      window.refreshAllWires();
    }
  }, 200);
  updateWireCount();
}
