// Terminal Helpers - Pure utility functions for terminal operations
//@ts-nocheck

/**
 * Get a stable identifier for a terminal mesh.
 * MODIFIED: Works with terminals instead of pins
 *
 * @param {BABYLON.AbstractMesh} terminalMesh
 * @returns {string|null}
 */
export function getTerminalId(terminalMesh) {
  console.log('Getting terminal ID for mesh:', terminalMesh);
  if (!terminalMesh) return null;
  
  // Check for terminal metadata
  // posibly pinId not exist
  if (terminalMesh.metadata) {
    return terminalMesh.metadata.terminalId || 
           terminalMesh.metadata.pinId || 
           terminalMesh.name;
  }
  
  return terminalMesh.name || null;
}

/**
 * Get pin/terminal name from mesh metadata (internal helper)
 */
function getPinOrTerminalNameFromMeta(mesh) {
  if (!mesh || !mesh.metadata) return null;
  return mesh.metadata.terminalName || 
         mesh.metadata.pinName || 
         null;
}

/**
 * Get a human-friendly terminal name for logging / UI.
 * MODIFIED: Works with terminals instead of pins
 *
 * @param {BABYLON.AbstractMesh} terminalMesh
 * @returns {string}
 */
export function getTerminalName(terminalMesh) {
  if (!terminalMesh) return "Unknown terminal";
  
  if (terminalMesh.metadata) {
    const name = getPinOrTerminalNameFromMeta(terminalMesh);
    if (name) return name;
    return terminalMesh.name || "Unnamed terminal";
  }
  
  return terminalMesh.name || getTerminalId(terminalMesh) || "Unnamed terminal";
}

/**
 * Get pin/terminal name from mesh metadata
 */
export function getPinOrTerminalName(mesh) {
  if (!mesh) return null;
  const name = getPinOrTerminalNameFromMeta(mesh);
  return name || mesh.name || null;
}


/**
 * Utility: find first mesh in the scene that matches a given terminal identifier.
 * MODIFIED: Finds terminals instead of pins
 *
 * @param {BABYLON.Scene} scene
 * @param {string} id
 * @returns {BABYLON.AbstractMesh|null}
 */
export function findTerminalMeshById(scene, id) {
  if (!scene || !id) return null;
  
  return scene.meshes.find(m => {
    // Check metadata first
    if (m.metadata) {
      if (m.metadata.terminalId === id || m.metadata.pinId === id) {
        return true;
      }
    }
    
    // Check name
    return m.name === id;
  }) || null;
}

// Purpose: Get world position of a terminal mesh considering parent transformations
// MODIFIED: Works with terminals instead of pins
export function getTerminalAbsolutePosition(terminalMesh) {
  //console.log('Getting absolute position for terminal mesh:', terminalMesh); 
  if (!terminalMesh) return new BABYLON.Vector3(0, 0, 0);
  
  // If terminal has specific offset metadata, use it
  if (terminalMesh.metadata && terminalMesh.metadata.terminalOffset) {
    const offset = terminalMesh.metadata.terminalOffset;
    const parent = terminalMesh.parent;
    if (parent) {
      const localOffset = new BABYLON.Vector3(offset.x, offset.y, offset.z);
      const worldMatrix = parent.getWorldMatrix();
      const worldOffset = BABYLON.Vector3.TransformCoordinates(localOffset, worldMatrix);
      return parent.getAbsolutePosition().add(worldOffset);
    }
  }
  
  // If terminal has local position relative to parent
  if (terminalMesh.parent && terminalMesh.position) {
    const parent = terminalMesh.parent;
    const localPos = terminalMesh.position.clone();
    const worldMatrix = parent.getWorldMatrix();
    return BABYLON.Vector3.TransformCoordinates(localPos, worldMatrix);
  }
  
  // Fallback to absolute position
  return terminalMesh.getAbsolutePosition();
}

// ✅ NEW: Get precise connection point at terminal center
// Purpose: Calculate the exact 3D position where a wire should connect to a terminal
// This ensures wires snap accurately to terminal centers across all component types
export function getTerminalConnectionPoint(terminalMesh) {
  if (!terminalMesh) return new BABYLON.Vector3(0, 0, 0);
  
  // Get the terminal's world position (center point)
  const terminalCenter = getTerminalAbsolutePosition(terminalMesh);
  
  // For sphere terminals, the center is the connection point
  // For other shapes, we might need to adjust based on geometry
  if (terminalMesh.geometry && terminalMesh.geometry.id) {
    // If it's a sphere, center is correct
    // For other shapes, we could add offset logic here
    return terminalCenter;
  }
  
  // Default: return center position
  return terminalCenter;
}

// Purpose: Find closest terminal on a component to a given world position
// MODIFIED: Finds terminals instead of pins
export function findClosestTerminalOnComponent(component, worldPosition, maxDistance = 3.0) {
  if (!component || !worldPosition) return null;
  
  let closestTerminal = null;
  let closestDistance = maxDistance;
  
  // Search through all child meshes for terminals
  const allMeshes = component.getChildMeshes();
  allMeshes.push(component); // Include the component itself
  
  for (const mesh of allMeshes) {
    // ✅ Enhanced terminal detection - check for all terminal types
    let isTerminal = false;
    
    // Check by name patterns
    const name = mesh.name.toLowerCase();
    if (name.includes('terminal') || 
        name.includes('connector') ||
        name.includes('contact')) {
      isTerminal = true;
    }
    
    // Check by metadata
    if (mesh.metadata) {
      // Standard terminal metadata
      if (mesh.metadata.isTerminal || mesh.metadata.terminalId) {
        isTerminal = true;
      }
      // Arduino pin metadata
      if (isArduinoTerminal(mesh)) {
        isTerminal = true;
      }
      // LED pin metadata
      if (mesh.metadata.isLEDPin || mesh.metadata.terminalName) {
        isTerminal = true;
      }
      // Breadboard terminal metadata
      if (mesh.metadata.isBreadboardTerminal || mesh.metadata.holeId) {
        isTerminal = true;
      }
    }
    
    if (isTerminal) {
      const terminalWorldPos = getTerminalAbsolutePosition(mesh);
      const distance = BABYLON.Vector3.Distance(worldPosition, terminalWorldPos);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestTerminal = mesh;
      }
    }
  }
  
  // If no terminal found, check if component has terminals in metadata
  if (!closestTerminal && component.metadata && component.metadata.terminals) {
    for (const terminal of component.metadata.terminals) {
      if (terminal && terminal.getAbsolutePosition) {
        const terminalWorldPos = terminal.getAbsolutePosition();
        const distance = BABYLON.Vector3.Distance(worldPosition, terminalWorldPos);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestTerminal = terminal;
        }
      }
    }
  }
  
  return closestTerminal;
}

// Purpose: Validate if two terminals can be connected
// MODIFIED: Works with terminals instead of pins
export function canConnectTerminals(fromTerminalObj, toTerminalObj, wiringConnections) {
  if (!fromTerminalObj || !toTerminalObj) return false;
  if (fromTerminalObj === toTerminalObj) return false; // same terminal
  
  // Check if terminals are on the same component (usually not allowed)
  if (fromTerminalObj.parent === toTerminalObj.parent) {
    console.warn('Cannot connect terminals on the same component');
    return false;
  }

  // Check duplicates in wiringConnections
  const fromId = getTerminalId(fromTerminalObj);
  const toId = getTerminalId(toTerminalObj);
  const existingConnection = wiringConnections.find(c => 
    (c.fromTerminalId === fromId && c.toTerminalId === toId) || 
    (c.fromTerminalId === toId && c.toTerminalId === fromId)
  );
  if (existingConnection) {
    console.warn('Terminals already connected');
    return false;
  }
  
  return true;
}

// Purpose: Highlight or unhighlight a terminal with visual feedback
// MODIFIED: Works with terminals instead of pins
export function highlightTerminal(terminal, highlight) {
  if (!terminal || !terminal.material) return;
  
  if (highlight) {
    // Yellow highlight for terminals
    terminal.material.emissiveColor = new BABYLON.Color3(1, 1, 0);
    terminal.renderOutline = true;
    terminal.outlineColor = new BABYLON.Color3(1, 1, 0);
    terminal.outlineWidth = 0.05;
    // Scale up selected terminal for better visibility
    terminal.scaling = new BABYLON.Vector3(1.1, 1.1, 1.1);
  } else {
    if (terminal.material.diffuseColor) {
      terminal.material.emissiveColor = terminal.material.diffuseColor.scale(0.02);
    }
    terminal.renderOutline = false;
    terminal.scaling = new BABYLON.Vector3(1, 1, 1);
  }
}

/**
 * Check if a mesh is an Arduino terminal/pin
 */
export function isArduinoTerminal(mesh) {
  if (!mesh || !mesh.metadata) return false;
  return mesh.metadata.isArduinoPin || 
         mesh.metadata.partType === 'arduino' ||
         (mesh.metadata.isTerminal && mesh.metadata.partType === 'arduino');
}

