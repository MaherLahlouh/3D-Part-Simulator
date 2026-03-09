// Wire Drawing & Management - Bezier curves and wire creation
//@ts-nocheck

import { getTerminalId, getTerminalName, getTerminalConnectionPoint, canConnectTerminals, getPinOrTerminalName, findTerminalMeshById } from './terminal-helpers';
import { validateConnection, showValidationMessages } from './circuit-validation';
import { saveStateToUndo } from './wiring-undo-redo';
import { WIRE_PROPERTIES } from './wire-properties';
import { syncWindowReference, removeFromArray, removeConnectionById, disposeWireMesh, showUserMessage, updateAllWireCounts } from './wiring-utils';

/**
 * Initialize Arduino pin state based on pin type
 */
function initializeArduinoPinState(mesh, terminalId) {
  if (!mesh.metadata?.isArduinoPin || !window.pinStateManager) {
    return;
  }

  const pinName = getPinOrTerminalName(mesh);
  const pinState = window.pinStateManager.getPinState(terminalId);

  const pinConfig = {
    '5V': { voltage: 5, digitalState: 'HIGH' },
    '3.3V': { voltage: 3.3, digitalState: 'HIGH' },
    'GND': { voltage: 0, digitalState: 'LOW' }
  };

  if (pinConfig[pinName]) {
    pinState.voltage = pinConfig[pinName].voltage;
    pinState.digitalState = pinConfig[pinName].digitalState;
    window.pinStateManager.updatePinState(terminalId, pinState);
  }
}


// ===========================
// CORE WIRE FUNCTIONS
// ===========================

// Purpose: Generate Bezier curve points for smooth 3D wire visualization
export function generateCurvePoints(startPos, endPos, options = {}) {
  const dir = endPos.subtract(startPos);
  const distance = dir.length();
  const dirNorm = dir.normalize();

  // Adaptive curve offset based on distance and angle
  const offsetMag = Math.min(2 + distance * 0.3, 8);
  
  // Create more natural control points
  const up = new BABYLON.Vector3(0, 1, 0);
  let perp = BABYLON.Vector3.Cross(dirNorm, up);
  if (perp.lengthSquared() < 0.001) {
    perp = BABYLON.Vector3.Cross(dirNorm, new BABYLON.Vector3(1, 0, 0));
  }
  perp = perp.normalize();

  // Control points for smoother curves
  const midPoint = startPos.add(endPos).scale(0.5);
  const control1 = startPos.add(dir.scale(0.3)).add(perp.scale(offsetMag * 0.7));
  const control2 = endPos.subtract(dir.scale(0.3)).add(perp.scale(-offsetMag * 0.7));

  // Generate curve points
  const curvePoints = [];
  const steps = options.steps || 36;
  
  for (let t = 0; t <= 1; t += 1 / steps) {
    // Cubic Bezier
    const mt = 1 - t;
    const p = startPos.scale(mt * mt * mt)
            .add(control1.scale(3 * mt * mt * t))
            .add(control2.scale(3 * mt * t * t))
            .add(endPos.scale(t * t * t));
    curvePoints.push(p);
  }

  return curvePoints;
}

// Purpose: Draw a 3D wire between two terminal meshes using Bezier curves
// Works with terminals instead of pins, includes circuit validation
export function drawWireBetween(fromMesh, toMesh, options, wiringConnections, wireLines, updateWireCount) {
  try {
    // Validate BABYLON is available
    if (typeof BABYLON === 'undefined') {
      console.error('drawWireBetween: BABYLON is not defined');
      showUserMessage('BABYLON library not loaded', 'error', 3000);
      return null;
    }
    
    if (!fromMesh || !toMesh || fromMesh === toMesh) {
      console.warn('drawWireBetween: Invalid meshes provided', { fromMesh, toMesh });
      return null;
    }
    
    const scene = window.scene;
    if (!scene) {
      console.warn('drawWireBetween: Scene not available');
      showUserMessage('Scene not initialized', 'error', 2000);
      return null;
    }

    // Ensure options is an object
    options = options || {};
    
    // Validate required parameters
    if (!Array.isArray(wiringConnections)) {
      console.error('drawWireBetween: wiringConnections is not an array', wiringConnections);
      return null;
    }
    if (!Array.isArray(wireLines)) {
      console.error('drawWireBetween: wireLines is not an array', wireLines);
      return null;
    }
    if (typeof updateWireCount !== 'function') {
      console.warn('drawWireBetween: updateWireCount is not a function');
      updateWireCount = () => {};
    }

    const fromId = getTerminalId(fromMesh);
    const toId = getTerminalId(toMesh);
    const fromName = getTerminalName(fromMesh);
    const toName = getTerminalName(toMesh);

    if (!fromId || !toId) {
      console.warn(`drawWireBetween: Missing terminal IDs - fromId: ${fromId}, toId: ${toId}`);
      return null;
    }

    if (!canConnectTerminals(fromMesh, toMesh, wiringConnections)) {
      showUserMessage("Terminals cannot be connected (already connected or invalid).", 'warning');
      return null;
    }

    // CIRCUIT VALIDATION - Check safety before creating wire
    if (!options.skipValidation) {
      const validation = validateConnection(fromMesh, toMesh, wiringConnections);
      const shouldProceed = showValidationMessages(validation);

      if (!shouldProceed) {
        console.log('❌ Wire creation cancelled due to validation');
        return null;
      }
    }

    // Get precise terminal connection points
    const startPos = getTerminalConnectionPoint(fromMesh);
    const endPos = getTerminalConnectionPoint(toMesh);
    
    // Validate connection points
    if (!startPos || !endPos) {
      console.error('drawWireBetween: Invalid connection points', { startPos, endPos, fromMesh, toMesh });
      showUserMessage('Failed to get terminal connection points', 'error', 2000);
      return null;
    }

    console.log(`🔌 Drawing wire from ${fromName} to ${toName}`);

    // Generate smooth curve points
    let curvePoints;
    try {
      curvePoints = generateCurvePoints(startPos, endPos, options);
      if (!curvePoints || !Array.isArray(curvePoints) || curvePoints.length === 0) {
        throw new Error('Invalid curve points generated');
      }
    } catch (curveError) {
      console.error('drawWireBetween: Failed to generate curve points', curveError);
      showUserMessage('Failed to generate wire path', 'error', 2000);
      return null;
    }

    // Get wire properties
    const wireColorHex = options.color || WIRE_PROPERTIES?.currentColor || '#FF6600';
    const wireThickness = options.thickness || WIRE_PROPERTIES?.currentThickness || 0.05;
    
    // Validate color
    let color;
    try {
      color = BABYLON.Color3.FromHexString(wireColorHex);
      if (!color) {
        throw new Error('Invalid color');
      }
    } catch (colorError) {
      console.warn('drawWireBetween: Invalid color, using default', colorError);
      color = new BABYLON.Color3(1, 0.4, 0); // Default orange
    }

    // Create wire mesh
    const lineName = `wire_${fromId}_to_${toId}_${Date.now()}`;
    let line;

    try {
      // Validate curve points before creating mesh
      if (!curvePoints || curvePoints.length < 2) {
        throw new Error('Insufficient curve points for wire creation');
      }
      
      // Try to create tube mesh first
      try {
        line = BABYLON.MeshBuilder.CreateTube(lineName, {
          path: curvePoints,
          radius: Math.max(0.01, wireThickness), // Ensure minimum radius
          tessellation: 12,
          updatable: true
        }, scene);

        if (!line) {
          throw new Error('CreateTube returned null');
        }

        const wireMaterial = new BABYLON.StandardMaterial(`${lineName}_mat`, scene);
        wireMaterial.diffuseColor = color;
        wireMaterial.emissiveColor = color.scale(0.3);
        wireMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        line.material = wireMaterial;
      } catch (tubeError) {
        console.warn('Failed to create tube wire, falling back to lines:', tubeError);
        // Fallback to lines
        try {
          line = BABYLON.MeshBuilder.CreateLines(lineName, {
            points: curvePoints,
            updatable: true
          }, scene);
          if (!line) {
            throw new Error('CreateLines returned null');
          }
          line.color = color;
        } catch (lineError) {
          console.error('Both tube and line creation failed:', lineError);
          throw new Error('Failed to create wire mesh: ' + lineError.message);
        }
      }
    } catch (meshError) {
      console.error('drawWireBetween: Failed to create wire mesh', meshError);
      showUserMessage('Failed to create wire mesh: ' + (meshError.message || 'Unknown error'), 'error', 3000);
      return null;
    }
    
    // Validate line was created
    if (!line) {
      console.error('drawWireBetween: Wire mesh is null after creation');
      showUserMessage('Failed to create wire mesh', 'error', 2000);
      return null;
    }

    // Make wire pickable ONLY for deletion (right-click), not for wiring mode
    line.isPickable = true;

    // Add metadata to identify this as a wire (not a terminal)
    const wireId = `${fromId}_to_${toId}_${Date.now()}`;
    line.metadata = {
      isWire: true,
      wireId,
      fromTerminalId: fromId,
      toTerminalId: toId,
      fromTerminalName: fromName,
      toTerminalName: toName,
      fromTerminal: fromMesh,
      toTerminal: toMesh,
      wireColor: wireColorHex,
      wireThickness: wireThickness
    };

    // Set up action manager for wire deletion
    try {
      line.actionManager = new BABYLON.ActionManager(scene);
      line.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnRightPickTrigger,
        () => {
          const confirmMessage = `Delete wire connection?\n\nFrom: ${fromName}\nTo: ${toName}`;
          if (confirm(confirmMessage)) {
            deleteWire(line, wiringConnections, wireLines, updateWireCount);
          }
        }
      ));
    } catch (actionError) {
      console.warn('Failed to create action manager for wire, continuing anyway:', actionError);
      // Don't fail wire creation if action manager fails
    }

    // Save to arrays (wrapped in try-catch to catch any array errors)
    try {
      wiringConnections.push({
        fromTerminalId: fromId,
        toTerminalId: toId,
        wireColor: wireColorHex,
        wireThickness: wireThickness,
        wireId,
        fromTerminalName: fromName,
        toTerminalName: toName
      });
      wireLines.push(line);
      
      // Sync window references
      syncWindowReference('wiringConnections', wiringConnections);
      syncWindowReference('wireLines', wireLines);
    } catch (arrayError) {
      console.error('Failed to save wire to arrays:', arrayError);
      // Clean up the created mesh if we can't save it
      try {
        disposeWireMesh(line);
      } catch (disposeError) {
        console.warn('Failed to dispose wire mesh:', disposeError);
      }
      throw arrayError; // Re-throw to be caught by outer catch
    }

    // Connect terminals in pin state manager
    try {
      if (window.pinStateManager) {
        window.pinStateManager.connectTerminals(fromId, toId);
        
        // Initialize Arduino pin states if applicable
        initializeArduinoPinState(fromMesh, fromId);
        initializeArduinoPinState(toMesh, toId);
      }
    } catch (pinError) {
      console.warn('Failed to connect terminals in pin state manager:', pinError);
      // Don't fail wire creation if pin state manager fails
    }

    // Save undo state (wrapped in try-catch to prevent wire creation failure)
    if (!options.skipUndo) {
      try {
        saveStateToUndo('create_wire', {
          wireId: wireId,
          fromTerminalId: fromId,
          toTerminalId: toId,
          fromTerminalName: fromName,
          toTerminalName: toName,
          wireColor: wireColorHex,
          wireThickness: wireThickness
        }, wiringConnections);
      } catch (undoError) {
        // Don't let undo errors prevent wire creation
        console.warn('Failed to save undo state, but wire was created:', undoError);
      }
    }
    
    // Update wire count (wrapped in try-catch to prevent failure)
    try {
      updateAllWireCounts(updateWireCount);
    } catch (countError) {
      console.warn('Failed to update wire count:', countError);
      // Don't fail wire creation if count update fails
    }

    return line;
  } catch (error) {
    console.error('❌ Error in drawWireBetween:', error);
    console.error('Error details:', {
      fromMesh: fromMesh ? getTerminalName(fromMesh) : 'null',
      toMesh: toMesh ? getTerminalName(toMesh) : 'null',
      fromId: fromMesh ? getTerminalId(fromMesh) : 'null',
      toId: toMesh ? getTerminalId(toMesh) : 'null',
      error: error.message,
      stack: error.stack,
      wiringConnections: wiringConnections ? wiringConnections.length : 'null',
      wireLines: wireLines ? wireLines.length : 'null'
    });
    
    const errorMessage = error.message || 'Unknown error';
    showUserMessage(`Failed to create wire: ${errorMessage}`, 'error', 3000);
    return null;
  }
}

// Purpose: Delete a wire mesh and remove it from connections array
export function deleteWire(wireMesh, wiringConnections, wireLines, updateWireCount) {
  const wireId = wireMesh.metadata?.wireId;
  if (!wireId) {
    console.warn('Wire has no wireId in metadata');
    return;
  }
  
  // Get wire info for messaging
  const fromName = wireMesh.metadata?.fromTerminalName || 'Unknown';
  const toName = wireMesh.metadata?.toTerminalName || 'Unknown';
  
  // Save state before deletion
  saveStateToUndo('delete_wire', {
    wireId: wireId,
    fromTerminalId: wireMesh.metadata.fromTerminalId,
    toTerminalId: wireMesh.metadata.toTerminalId,
    fromTerminalName: fromName,
    toTerminalName: toName,
    wireColor: wireMesh.metadata.wireColor,
    wireThickness: wireMesh.metadata.wireThickness
  }, wiringConnections);
  
  console.log(`🗑️ Deleting wire: ${wireId} (${fromName} → ${toName})`);
  
  // Remove from connections array and sync
  removeConnectionById(wiringConnections, wireId, 'wiringConnections');
  
  // Remove from wire lines array and sync
  removeFromArray(wireLines, wireMesh, 'wireLines');
  
  // Remove from selected wires if selected
  if (window.selectedWires) {
    removeFromArray(window.selectedWires, wireMesh, 'selectedWires');
  }
  
  // Dispose mesh and all its resources
  disposeWireMesh(wireMesh);
  
  // Show success message
  showUserMessage(`🗑️ Deleted wire: ${fromName} → ${toName}`, 'success', 2000);
  
  // Update wire count
  updateAllWireCounts(updateWireCount);
}

// Purpose: Refresh all wire positions when components move
export function refreshAllWires(wireLines) {
  const scene = window.scene;
  if (!scene) return;

  wireLines.forEach((line) => {
    try {
      const meta = line.metadata || {};

      let fromTerminal = meta.fromTerminal;
      let toTerminal = meta.toTerminal;

      if (!fromTerminal || !toTerminal) {
        const fromId = meta.fromTerminalId;
        const toId = meta.toTerminalId;
        if (!fromId || !toId) return;

        fromTerminal = findTerminalMeshById(scene, fromId);
        toTerminal = findTerminalMeshById(scene, toId);

        if (fromTerminal && toTerminal) {
          meta.fromTerminal = fromTerminal;
          meta.toTerminal = toTerminal;
        }
      }

      if (!fromTerminal || !toTerminal) return;

      // Use connection point helper for accurate wire snapping
      const startPos = getTerminalConnectionPoint(fromTerminal);
      const endPos = getTerminalConnectionPoint(toTerminal);

      const newPoints = generateCurvePoints(startPos, endPos);

      const wireThickness = meta.wireThickness || 0.05;

      try {
        BABYLON.MeshBuilder.CreateTube(line.name, {
          path: newPoints,
          radius: wireThickness,
          tessellation: 12,
          instance: line
        }, scene);
      } catch (err) {
        BABYLON.MeshBuilder.CreateLines(line.name, { points: newPoints, instance: line });
      }
    } catch (err) {
      console.warn('Failed to refresh wire:', err);
    }
  });
}