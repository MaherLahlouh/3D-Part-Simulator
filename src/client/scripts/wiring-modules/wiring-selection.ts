// Wire Selection & Multi-Select System
//@ts-nocheck

import { getSelectedWires, setSelectedWires } from './wiring-state';
import { showUserMessage, disposeWireMesh, removeFromArray, removeConnectionById, syncWindowReference } from './wiring-utils';


//-----------------------------------------------------------redundant code----------------------------------------



// ENHANCEMENT #2: Select wire (with multi-select support)
export function selectWire(wireMesh, addToSelection = false, clearWireHighlight, updateWireSelectionUI) {
  if (!wireMesh || !wireMesh.metadata || !wireMesh.metadata.wireId) {
    console.warn('Invalid wire mesh for selection');
    return;
  }
  
  let selectedWires = getSelectedWires();
  
  // If not adding to selection, clear previous selections
  if (!addToSelection) {
    selectedWires.forEach(wire => clearWireHighlight(wire));
    setSelectedWires([]);
    selectedWires = [];
  }
  
  // Check if wire is already selected
  const index = selectedWires.indexOf(wireMesh);
  
  if (index > -1) {
    // Deselect wire
    selectedWires.splice(index, 1);
    setSelectedWires(selectedWires);
    clearWireHighlight(wireMesh);
    console.log(`🔘 Deselected wire: ${wireMesh.metadata.wireId}`);
  } else {
    // Select wire
    selectedWires.push(wireMesh);
    setSelectedWires(selectedWires);
    highlightWire(wireMesh);
    console.log(`✅ Selected wire: ${wireMesh.metadata.wireId}`);
  }
  
  // Update UI
  updateWireSelectionUI();
  
  // Store in window for access from other modules
  syncWindowReference('selectedWires', getSelectedWires());
}

//-----------------------------------------------------------redundant code (need check)----------------------------------------

// ENHANCEMENT #2: Highlight selected wire
function highlightWire(wireMesh) {
  console.log('Highlighting wire mesh:', wireMesh);
  if (!wireMesh) return;
  
  try {
    console.log('Highlighting wire:', wireMesh.metadata?.wireId);
    if (wireMesh.material) {
      // Store original colors
      if (!wireMesh._originalDiffuseColor) {
        wireMesh._originalDiffuseColor = wireMesh.material.diffuseColor.clone();
      }
      if (!wireMesh._originalEmissiveColor) {
        wireMesh._originalEmissiveColor = wireMesh.material.emissiveColor.clone();
      }
      
      // Apply highlight - bright cyan
      wireMesh.material.diffuseColor = new BABYLON.Color3(0, 1, 0);
      wireMesh.material.emissiveColor = new BABYLON.Color3(0, 0.8, 0.8);
    } else if (wireMesh.color) {
      // For line meshes
      if (!wireMesh._originalColor) {
        wireMesh._originalColor = wireMesh.color.clone();
      }
      wireMesh.color = new BABYLON.Color3(0, 1, 1);
    }
  } catch (error) {
    console.warn('Error highlighting wire:', error);
  }
}

// ENHANCEMENT #2: Clear wire highlight
export function clearWireHighlight(wireMesh) {
  if (!wireMesh) return;
  
  try {
    if (wireMesh.material) {
      // Restore original colors
      if (wireMesh._originalDiffuseColor) {
        wireMesh.material.diffuseColor = wireMesh._originalDiffuseColor.clone();
      }
      if (wireMesh._originalEmissiveColor) {
        wireMesh.material.emissiveColor = wireMesh._originalEmissiveColor.clone();
      }
    } else if (wireMesh.color && wireMesh._originalColor) {
      wireMesh.color = wireMesh._originalColor.clone();
    }
  } catch (error) {
    console.warn('Error clearing wire highlight:', error);
  }
}

// ENHANCEMENT #2: Update wire selection UI
export function updateWireSelectionUI() {
  const selectedWires = getSelectedWires();
  const count = selectedWires.length;
  
  if (count === 0) {
    // No wires selected - don't show message for deselection
  } else if (count === 1) {
    const wire = selectedWires[0];
    const fromName = wire.metadata.fromTerminalName || 'Unknown';
    const toName = wire.metadata.toTerminalName || 'Unknown';
    showUserMessage(`📌 Selected wire: ${fromName} → ${toName}`, 'info');
  } else {
    showUserMessage(`📌 Selected ${count} wires`, 'info');
  }
}

// ENHANCEMENT #2: Delete selected wires (batch operation)
export function deleteSelectedWires(wireLines, getState, deleteWireSilent, saveStateToUndo, wiringConnections, updateWireCount) {
  const selectedWires = getSelectedWires();
  
  if (selectedWires.length === 0) {
    showUserMessage('No wires selected', 'warning', 2000);
    return;
  }
  
  // Save state before deletion
  saveStateToUndo('delete_multiple_wires', {
    count: selectedWires.length,
    wireIds: selectedWires.map(w => w.metadata.wireId)
  }, wiringConnections);
  
  const count = selectedWires.length;
  
  // Delete all selected wires
  selectedWires.forEach(wire => {
    deleteWireSilent(wire, wiringConnections, wireLines);
  });
  
  setSelectedWires([]);
  
  showUserMessage(`🗑️ Deleted ${count} wire(s)`, 'success', 2000);
  
  console.log(`🗑️ Deleted ${count} selected wires`);
  
  // Update wire count
  updateWireCount();
}

//-------------------------------------------redundant code------------------------------------
// ENHANCEMENT #2: Delete wire without UI feedback (for batch operations)
export function deleteWireSilent(wireMesh, wiringConnections, wireLines) {
  const wireId = wireMesh.metadata?.wireId;
  if (!wireId) return;
  
  // Remove from connections array and sync (using utility function)
  removeConnectionById(wiringConnections, wireId, 'wiringConnections');
  
  // Remove from wire lines array and sync (using utility function)
  removeFromArray(wireLines, wireMesh, 'wireLines');
  
  // Remove from selected wires if selected
  if (window.selectedWires) {
    removeFromArray(window.selectedWires, wireMesh, 'selectedWires');
  }
  
  // Dispose mesh
  disposeWireMesh(wireMesh);
}

// ENHANCEMENT #2: Clear all wire selections
export function clearWireSelection(clearWireHighlight) {
  const selectedWires = getSelectedWires();
  selectedWires.forEach(wire => clearWireHighlight(wire));
  setSelectedWires([]);
}
