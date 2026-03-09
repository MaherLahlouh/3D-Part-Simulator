// Enhanced wiring controls with precise TERMINAL-to-TERMINAL connections (no pin dots)
//@ts-nocheck

// Import shared terminal detection utility
import { isTerminalMesh as sharedIsTerminalMesh } from './arduino-config';

// ✅ Priority 2: Defensive check for drawWireBetween at module load
if (typeof window.drawWireBetween !== 'function') {
  console.warn('⚠️ window.drawWireBetween not available yet - wiring-controls.ts loaded before wiring-logic.ts');
  console.warn('   This may cause wiring to fail. Ensure wiring-logic.ts loads first.');
}

let wiringModeActive = false;
let selectedTerminal = null;
let hoveredTerminal = null;
let pointerObserver = null;

// Note: WIRE_PROPERTIES, setWireColor, and setWireThickness are defined in wiring-logic.ts
// These functions are accessed via window.setWireColor and window.setWireThickness

// ENHANCEMENT #17: Wire Path Preview
let previewWire = null;
let previewWireMaterial = null;

// Purpose: Check if wiring mode is currently active
// ✅ Priority 4: Single source of truth for wiring mode state
export function isWiringMode() {
  return wiringModeActive;
}

//--------------------------------------------------not used---------------------------------------------------
//----------------------window.WIRING_MODE is undefined and maybe some logic depends on it---------------------
//--------------------------------------------------need fixes---------------------------------------------------
// ✅ Priority 4: Getter function to ensure consistent state checking
export function getWiringModeState() {
  return {
    active: wiringModeActive,
    windowWiringMode: window.wiringMode,
    windowWIRING_MODE: window.WIRING_MODE,
    sceneReady: !!window.scene,
    drawWireReady: typeof window.drawWireBetween === 'function'
  };
}

// Purpose: Enable or disable wiring mode, updates UI and cursor
export function setWiringMode(enabled) {
  // ✅ Priority 3: Validate scene exists before enabling wiring mode
  if (enabled && !window.scene) {
    console.error('❌ Cannot enable wiring mode - scene not ready');
    if (typeof showMessage === 'function') {
      showMessage('Scene not ready. Please wait...');
    }
    return;
  }
  
  // ✅ Priority 2: Check if drawWireBetween is available
  if (enabled && typeof window.drawWireBetween !== 'function') {
    console.error('❌ drawWireBetween not loaded - wiring will not work');
    if (typeof showMessage === 'function') {
      showMessage('❌ Wiring system not initialized. Please refresh the page.');
    }
    return;
  }
  
  // posibly window.WIRING_MODE is un used and undefined
  wiringModeActive = enabled;
  window.wiringMode = enabled; // ✅ Sync with global wiring mode
  window.WIRING_MODE = enabled; // ✅ Also set WIRING_MODE for compatibility
  selectedTerminal = null;
  hoveredTerminal = null;

  // Update UI state
  const wiringBtn = document.getElementById('startWiringBtn');
  if (wiringBtn) {
    wiringBtn.classList.toggle('active', enabled);
    wiringBtn.textContent = enabled ? '🛑 Stop Wiring' : '🔌 Start Wiring';
  }

  // Show/hide wire properties panel
  const wirePropertiesPanel = document.getElementById('wirePropertiesPanel');
  if (wirePropertiesPanel) {
    wirePropertiesPanel.style.display = enabled ? 'block' : 'none';
  }

  // Update cursor style
  const canvas = document.getElementById('renderCanvas');
  if (canvas) {
    canvas.style.cursor = enabled ? 'crosshair' : 'default';
  }

  if (enabled) {
    setupWiringInteractions();
  } else {
    cleanupWiringInteractions();
  }

  console.log(`🔌 Wiring mode (TERMINAL-BASED): ${enabled ? 'ON' : 'OFF'}`);
}

//---------------------------------------------------not used----------------------------------------------------
// Purpose: Get currently selected terminal for wiring
export function getSelectedTerminal() {
  return selectedTerminal;
}

// Purpose: Set selected terminal and highlight it visually
export function setSelectedTerminal(terminal) {
  // Clear previous selection highlight
  if (selectedTerminal && typeof window.highlightTerminal === 'function') {
    window.highlightTerminal(selectedTerminal, false);
  }
  
  selectedTerminal = terminal;
  
  // Highlight new selection
  if (selectedTerminal && typeof window.highlightTerminal === 'function') {
    window.highlightTerminal(selectedTerminal, true);
  }
}

//--------------------------------------------possibly need rename-------------------------------------------------

// Purpose: Handle mouse move during wiring mode, updates hover highlights
// ENHANCEMENT #17: Added wire path preview
function handlePointerMove(pointerInfo) {
  if (!wiringModeActive || !window.scene) return;

  //need to assign scene once then use the varaible always
  const scene = window.scene;
  const ray = scene.createPickingRay(
    pointerInfo.event.offsetX,
    pointerInfo.event.offsetY,
    null,
    scene.activeCamera
  );
  
  const hit = scene.pickWithRay(ray);
  let targetTerminal = null;
  let worldPosition = null;
  
  if (hit && hit.hit && hit.pickedMesh) {
    const pickedMesh = hit.pickedMesh;
    //need to use sharedIsTerminalMesh always and rename it with clear name
    // Direct terminal selection
    if ((sharedIsTerminalMesh && sharedIsTerminalMesh(pickedMesh)) || (window.isTerminalMesh && window.isTerminalMesh(pickedMesh))) {
      targetTerminal = pickedMesh;
      worldPosition = window.getTerminalAbsolutePosition ? 
        window.getTerminalAbsolutePosition(pickedMesh) : 
        pickedMesh.getAbsolutePosition();
    } else {
      // Check if we picked a component, find closest terminal
      if (window.findClosestTerminalOnComponent && hit.pickedPoint) {
        targetTerminal = window.findClosestTerminalOnComponent(pickedMesh, hit.pickedPoint, 2.0);
        if (targetTerminal) {
          worldPosition = window.getTerminalAbsolutePosition ? 
            window.getTerminalAbsolutePosition(targetTerminal) : 
            targetTerminal.getAbsolutePosition();
        }
      }
      if (!worldPosition && hit.pickedPoint) {
        worldPosition = hit.pickedPoint;
      }
    }
  } else if (hit && hit.pickedPoint) {
    worldPosition = hit.pickedPoint;
  }
  
  // ENHANCEMENT #17: Update wire path preview if terminal is selected
  if (selectedTerminal && worldPosition) {
    updateWirePreview(selectedTerminal, worldPosition);
  } else {
    clearWirePreview();
  }
  
  // Update hover state
  if (hoveredTerminal !== targetTerminal) {
    // Remove old hover highlight
    if (hoveredTerminal && hoveredTerminal !== selectedTerminal && typeof window.highlightTerminal === 'function') {
      window.highlightTerminal(hoveredTerminal, false);
    }
    
    hoveredTerminal = targetTerminal;
    
    // Add new hover highlight
    if (hoveredTerminal && hoveredTerminal !== selectedTerminal && typeof window.highlightTerminal === 'function') {
      if (selectedTerminal) {
        // Green hover when a terminal is already selected
        hoveredTerminal.material.emissiveColor = new BABYLON.Color3(0.3, 1, 0.3);
        hoveredTerminal.renderOutline = true;
        hoveredTerminal.outlineColor = new BABYLON.Color3(0, 1, 0);
        hoveredTerminal.outlineWidth = 0.06;
        hoveredTerminal.scaling = new BABYLON.Vector3(1.3, 1.3, 1.3);
      } else {
        // Yellow hover when no terminal is selected
        hoveredTerminal.material.emissiveColor = new BABYLON.Color3(1, 1, 0.2);
        hoveredTerminal.renderOutline = true;
        hoveredTerminal.outlineColor = new BABYLON.Color3(1, 1, 0);
        hoveredTerminal.outlineWidth = 0.05;
        hoveredTerminal.scaling = new BABYLON.Vector3(1.3, 1.3, 1.3);
      }
    }
  }
  
  // Update cursor
  const canvas = document.getElementById('renderCanvas');
  if (canvas) {
    if (targetTerminal) {
      canvas.style.cursor = selectedTerminal ? 'crosshair' : 'pointer';
    } else {
      canvas.style.cursor = 'crosshair';
    }
  }
}



//----------------------------------------------------need some fixes---------------------------------------------------
/**
 * ENHANCEMENT #17: Update wire path preview
 */
function updateWirePreview(fromTerminal, toPosition) {
  if (!fromTerminal || !toPosition || !window.scene) return;
  
  const scene = window.scene;
  
  const startPos = window.getTerminalAbsolutePosition ? 
    window.getTerminalAbsolutePosition(fromTerminal) : 
    fromTerminal.getAbsolutePosition();
  
  const userColor = window.WIRE_PROPERTIES?.currentColor;
  const wireColorHex = userColor || '#FF6600';
  const color = BABYLON.Color3.FromHexString(wireColorHex);
  
  const userThickness = window.WIRE_PROPERTIES?.currentThickness || 0.02;
  const previewRadius = userThickness * 1.2;
  
  const curvePoints = window.generateCurvePoints ? 
    window.generateCurvePoints(startPos, toPosition, { steps: 32 }) : 
    [startPos, toPosition];
  
  if (!previewWire) {
    try {
      previewWire = BABYLON.MeshBuilder.CreateTube('wirePreview', {
        path: curvePoints,
        radius: previewRadius,
        tessellation: 8,
        updatable: true
      }, scene);
      
      previewWireMaterial = new BABYLON.StandardMaterial('previewWireMat', scene);
      previewWireMaterial.diffuseColor = color;
      previewWireMaterial.emissiveColor = color.scale(0.5);
      previewWireMaterial.alpha = 0.6;
      previewWire.material = previewWireMaterial;
      previewWire.renderingGroupId = 1;
      previewWire.isPickable = false;
    } catch (error) {
      previewWire = BABYLON.MeshBuilder.CreateLines('wirePreview', {
        points: curvePoints,
        updatable: true
      }, scene);
      previewWire.color = color;
      previewWire.alpha = 0.6;
    }
  } else {
    try {
      BABYLON.MeshBuilder.CreateTube('wirePreview', {
        path: curvePoints,
        radius: previewRadius,
        tessellation: 8,
        instance: previewWire
      }, scene);
      
      if (previewWireMaterial) {
        previewWireMaterial.diffuseColor = color;
        previewWireMaterial.emissiveColor = color.scale(0.5);
      }
    } catch (error) {
      BABYLON.MeshBuilder.CreateLines('wirePreview', {
        points: curvePoints,
        instance: previewWire
      }, scene);
      previewWire.color = color;
    }
  }
}

/**
 * ENHANCEMENT #17: Clear wire path preview
 */
function clearWirePreview() {
  if (previewWire) {
    try {
      previewWire.dispose();
    } catch (e) {}
    previewWire = null;
    previewWireMaterial = null;
  }
}

// need to rewrite with better logic
// Purpose: Handle mouse click during wiring mode, selects terminals and creates wires
function handlePointerClick(pointerInfo) {
  // ✅ Priority 5: Comprehensive debug logging
  console.log('🎯 Wiring click detected', {
    wiringMode: wiringModeActive,
    windowWiringMode: window.wiringMode,
    windowWIRING_MODE: window.WIRING_MODE,
    sceneExists: !!window.scene,
    drawWireExists: typeof window.drawWireBetween,
    isTerminalMeshExists: typeof isTerminalMesh === 'function'
  });
  
  if (!wiringModeActive || !window.scene) {
    console.warn('⚠️ Wiring click ignored:', {
      wiringModeActive,
      sceneExists: !!window.scene
    });
    return;
  }
  
  clearWirePreview();
  

  //need to assign scene once then use the varaible always and also apply this on other window variables in all code
  const scene = window.scene;
  const ray = scene.createPickingRay(
    pointerInfo.event.offsetX,
    pointerInfo.event.offsetY,
    null,
    scene.activeCamera
  );

  // Use multiPickWithRay to get ALL meshes along the ray (in case we clicked on a wire)
  const hits = scene.multiPickWithRay(ray);
  hits.sort((a, b) => a.distance - b.distance);
  console.log('🔍 Pointer click hits:', hits.map(h => ({ distance: h.distance, name: h.pickedMesh ? h.pickedMesh.name : 'null' })));
  let clickedTerminal = null;
  let pickedMesh = null;

  // Find the first non-wire mesh when in wiring mode, otherwise use first hit
  if (hits && hits.length > 0) {
    if (window.WIRING_MODE) {
      // In wiring mode, skip over wire meshes to find terminals beneath
      for (let i = 0; i < hits.length; i++) {
        const mesh = hits[i].pickedMesh;
        if (mesh && (!mesh.metadata || (!mesh.metadata.wireId && !mesh.metadata.isWire))) {
          //console.log('🎯 Wiring mode pick - selected mesh:', mesh.name);
          pickedMesh = mesh;
          break;
        }
      }
    } else {
      // Not in wiring mode, use first hit
      pickedMesh = hits[0].pickedMesh;
    }
  }

  if (pickedMesh) {
    // ✅ Priority 5: Debug logging for picked mesh
    console.log('📦 Picked mesh:', {
      name: pickedMesh.name,
      isTerminal: (sharedIsTerminalMesh && sharedIsTerminalMesh(pickedMesh)) || (window.isTerminalMesh && window.isTerminalMesh(pickedMesh)),
      metadata: pickedMesh.metadata,
      hasParent: !!pickedMesh.parent,
      parentName: pickedMesh.parent?.name
    });
    

    //need to link with all system like delete wire select wire etc(not to stay like this as a separate thing)
    // ENHANCEMENT #15: Multi-select wires with Ctrl+Click
    if (pickedMesh.metadata && pickedMesh.metadata.wireId && pointerInfo.event.button === 0) {
      if (pointerInfo.event.ctrlKey || pointerInfo.event.metaKey) {
        if (typeof window.selectWire === 'function') {
          const isSelected = window.selectedWires && window.selectedWires.indexOf(pickedMesh) > -1;
          window.selectWire(pickedMesh, !isSelected);
        }
        return;
      }
    }
    
    // WIRE DELETION - Right-click on wire to delete
    if (pickedMesh.metadata && pickedMesh.metadata.wireId && pointerInfo.event.button === 2) {
      const fromName = pickedMesh.metadata.fromTerminalName || 'Unknown';
      const toName = pickedMesh.metadata.toTerminalName || 'Unknown';
      const confirmMessage = `Delete wire connection?\n\nFrom: ${fromName}\nTo: ${toName}`;
      if (confirm(confirmMessage)) {
        if (typeof window.deleteWire === 'function') {
          window.deleteWire(pickedMesh);
        }
      }
      return;
    }
    
    //---------------------------------------------------------------not used--------------------------------------------------------------
    // WIRE SELECTION - Left-click on wire to select for deletion/properties
    // BUT NOT during wiring mode (we want to click through wires to terminals)
    if (pickedMesh.metadata && (pickedMesh.metadata.wireId || pickedMesh.metadata.isWire) && pointerInfo.event.button === 0) {
      // Skip wire selection if we're in wiring mode - let user click through to terminals
      if (window.WIRING_MODE) {
        console.log('🔌 Ignoring wire click - wiring mode active, looking for terminals beneath');
        // Don't return - continue to terminal detection below
      } else {
        // Not in wiring mode - allow wire selection for properties/deletion
        window.selectedWire = pickedMesh;
        const fromName = pickedMesh.metadata.fromTerminalName || 'Unknown';
        const toName = pickedMesh.metadata.toTerminalName || 'Unknown';

        // Show wire properties panel
        const wirePropsPanel = document.getElementById('wirePropertiesPanel');
        if (wirePropsPanel) {
          wirePropsPanel.style.display = 'block';
        }

        // Update UI with selected wire's current properties
        updateWirePropertiesUI(pickedMesh);

        // Highlight selected wire
        if (typeof window.selectWire === 'function') {
          window.selectWire(pickedMesh, false);
        }

        if (typeof window.showMessage === 'function') {
          window.showMessage(`Wire selected: ${fromName} → ${toName}. Change color/thickness below, then click Apply.`);
        }
        return;
      }
    }
    
    // Direct terminal selection
    if ((sharedIsTerminalMesh && sharedIsTerminalMesh(pickedMesh)) || (window.isTerminalMesh && window.isTerminalMesh(pickedMesh))) {
      clickedTerminal = pickedMesh;
    } else {
      // Check if we clicked a component, find closest terminal
      // Get pickedPoint from the hit that corresponds to pickedMesh
      //need rewrite this part with better logic
      let pickedPoint = null;
      if (hits && hits.length > 0) {
        for (let i = 0; i < hits.length; i++) {
          if (hits[i].pickedMesh === pickedMesh) {
            pickedPoint = hits[i].pickedPoint;
            break;
          }
        }
      }

      if (window.findClosestTerminalOnComponent && pickedPoint) {
        clickedTerminal = window.findClosestTerminalOnComponent(pickedMesh, pickedPoint, 30.0); // Increased max distance
      }
      
      // Also try to find terminals by searching child meshes directly
      if (!clickedTerminal && pickedMesh.getChildMeshes) {
        const childMeshes = pickedMesh.getChildMeshes();
        for (const child of childMeshes) {
          if ((sharedIsTerminalMesh && sharedIsTerminalMesh(child)) || (window.isTerminalMesh && window.isTerminalMesh(child))) {
            const terminalPos = window.getTerminalAbsolutePosition ? 
              window.getTerminalAbsolutePosition(child) : 
              child.getAbsolutePosition();
            const distance = pickedPoint ? BABYLON.Vector3.Distance(pickedPoint, terminalPos) : 0;
            if (distance < 3.0) {
              clickedTerminal = child;
              break;
            }
          }
        }
      }
    }
  }



  //posibly unused and (window.isArduinoBoard , window.showPinSelector) are undefined
  //terminal and pin system need rework with clear logic - both exist here togather -
  //---------------------------------------------------------------need fixes--------------------------------------------------------------
  // ENHANCEMENT: Check if clicked on Arduino board - show pin selector
  if (!clickedTerminal && pickedMesh) {

    // Check if clicked component is Arduino board
    if (window.isArduinoBoard && window.isArduinoBoard(pickedMesh)) {
      console.log('🎯 Arduino board clicked - showing pin selector');

      // Show pin selector for Arduino
      if (window.showPinSelector) {
        window.showPinSelector(pickedMesh, (pinName, arduino) => {
          // User selected a pin
          console.log(`📌 Pin selected: ${pinName}`);

          // Create virtual terminal for the selected pin
          const pinTerminal = {
            name: `${arduino.name}_${pinName}`,
            metadata: {
              terminalName: pinName,
              terminalId: `${arduino.uniqueId || arduino.name}_${pinName}`,
              pinName: pinName,
              arduinoBoard: arduino,
              isArduinoPin: true,
              partType: 'arduino'
            },
            parent: arduino,
            position: arduino.position.clone(),
            getAbsolutePosition: () => arduino.getAbsolutePosition()
          };

          // If first selection, store pin terminal
          if (!selectedTerminal) {
            setSelectedTerminal(pinTerminal);
            showMessage(`📌 Selected Arduino ${pinName}. Click another component to connect.`);
          } else {
            // Second selection - connect to previously selected terminal
            const wire = window.drawWireBetween(selectedTerminal, pinTerminal);
            if (wire) {
              const fromName = selectedTerminal.metadata?.terminalName || selectedTerminal.name;
              showMessage(`✅ Connected: ${fromName} → ${pinName}`);

              // Mark pin as connected
              if (window.setPinConnection) {
                window.setPinConnection(
                  arduino.uniqueId || arduino.name,
                  pinName,
                  true,
                  wire.metadata?.wireId
                );
              }
            }
            setSelectedTerminal(null);
            clearWirePreview();
          }
        });
      }
      return;
    }
  }

  if (!clickedTerminal) {
    // Clear selection if clicked empty space
    console.log('⚠️ No terminal found at click position');
    setSelectedTerminal(null);
    return;
  }
  
  console.log(`🎯 Clicked terminal: ${clickedTerminal.name}`, {
    terminalName: clickedTerminal.metadata?.terminalName || clickedTerminal.metadata?.pinName,
    terminalId: clickedTerminal.metadata?.terminalId,
    isTerminal: (sharedIsTerminalMesh && sharedIsTerminalMesh(clickedTerminal)) || (window.isTerminalMesh && window.isTerminalMesh(clickedTerminal)),
    metadata: clickedTerminal.metadata
  });

  if (!selectedTerminal) {
    // First terminal selection
    setSelectedTerminal(clickedTerminal);
    const terminalName = clickedTerminal.metadata?.terminalName || clickedTerminal.name;
    showMessage(`📌 Selected: ${terminalName}. Click another terminal to connect.`);
  } else if (selectedTerminal === clickedTerminal) {
    // Clicked same terminal - deselect
    setSelectedTerminal(null);
    showMessage("Selection cleared.");
  } else {

    //not used and (window.isArduinoBoard , window.showPinSelector) are undefined
    // ENHANCEMENT: Check if connecting to Arduino - show pin selector
    if (window.isArduinoBoard && window.isArduinoBoard(clickedTerminal)) {
      console.log('🎯 Arduino terminal clicked - showing pin selector');

      if (window.showPinSelector) {
        const arduinoParent = clickedTerminal.parent || clickedTerminal;
        window.showPinSelector(arduinoParent, (pinName, arduino) => {
          // Create virtual terminal for the selected pin
          const pinTerminal = {
            name: `${arduino.name}_${pinName}`,
            metadata: {
              terminalName: pinName,
              terminalId: `${arduino.uniqueId || arduino.name}_${pinName}`,
              pinName: pinName,
              arduinoBoard: arduino,
              isArduinoPin: true,
              partType: 'arduino'
            },
            parent: arduino,
            position: arduino.position.clone(),
            getAbsolutePosition: () => arduino.getAbsolutePosition()
          };

          const wire = window.drawWireBetween(selectedTerminal, pinTerminal);
          if (wire) {
            const fromName = selectedTerminal.metadata?.terminalName || selectedTerminal.name;
            showMessage(`✅ Connected: ${fromName} → ${pinName}`);

            // Mark pin as connected
            if (window.setPinConnection) {
              window.setPinConnection(
                arduino.uniqueId || arduino.name,
                pinName,
                true,
                wire.metadata?.wireId
              );
            }
          }
        });
      }

      setSelectedTerminal(null);
      clearWirePreview();
      return;
    }

    // Second terminal - attempt connection
    if (typeof window.drawWireBetween === 'function') {
      const fromName = selectedTerminal.metadata?.terminalName || selectedTerminal.metadata?.pinName || selectedTerminal.name;
      const toName = clickedTerminal.metadata?.terminalName || clickedTerminal.metadata?.pinName || clickedTerminal.name;

      console.log(`🔌 Attempting to create wire(hi!): ${fromName} → ${toName}`, {
        fromTerminal: selectedTerminal,
        toTerminal: clickedTerminal,
        fromMetadata: selectedTerminal.metadata,
        toMetadata: clickedTerminal.metadata
      });

      const wire = window.drawWireBetween(selectedTerminal, clickedTerminal);
      if (wire) {
        showMessage(`✅ Connected: ${fromName} → ${toName}`);
        console.log(`✅ Wire created successfully: ${fromName} → ${toName}`, {
          wire: wire,
          wireMetadata: wire.metadata,
          wireId: wire.metadata?.wireId
        });
        
        // ✅ Force update wire count after wire creation
        if (typeof window.updateWireCount === 'function') {
          window.updateWireCount();
        }

        //posibly not used and window.trackPinConnection is undefined
        // ENHANCEMENT: Track pin connection for LED visualization
        if (typeof window.trackPinConnection === 'function') {
          const fromComponent = selectedTerminal.parent || selectedTerminal;
          const toComponent = clickedTerminal.parent || clickedTerminal;
          const fromPin = selectedTerminal.metadata?.pinName || selectedTerminal.metadata?.terminalName || fromName;
          const toPin = clickedTerminal.metadata?.pinName || clickedTerminal.metadata?.terminalName || toName;
          window.trackPinConnection(fromComponent, fromPin, toComponent, toPin);
        }

        //need to define why this function used
        if (window.refreshAllWires) {
          setTimeout(window.refreshAllWires, 50);
        }

        //need to define why this function used - maybe not used -
        // Visual feedback
        if (typeof window.highlightTerminal === 'function') {
          window.highlightTerminal(selectedTerminal, true);
          window.highlightTerminal(clickedTerminal, true);
          setTimeout(() => {
            window.highlightTerminal(selectedTerminal, false);
            window.highlightTerminal(clickedTerminal, false);
          }, 500);
        }
      } 
      else {
        console.error(`❌ Failed to create wire: ${fromName} → ${toName}`, {
          fromTerminal: selectedTerminal,
          toTerminal: clickedTerminal,
          drawWireBetweenExists: typeof window.drawWireBetween === 'function',
          canConnect: typeof window.canConnectTerminals === 'function' ? window.canConnectTerminals(selectedTerminal, clickedTerminal) : 'unknown'
        });
        showMessage(`❌ Cannot connect ${fromName} to ${toName}.`);
        }
    } else {
      console.error('❌ window.drawWireBetween function not available!', {
        drawWireBetweenType: typeof window.drawWireBetween,
        wiringConnections: window.wiringConnections?.length || 0
      });
      showMessage('❌ Wiring system error: drawWireBetween function not found');
    }
    
    setSelectedTerminal(null);
    clearWirePreview();
  }
}

// Purpose: Setup mouse pointer observers for wiring mode interactions
function setupWiringInteractions() {
  if (!window.scene) return;

  //need to assign scene once then use the varaible always
  const scene = window.scene;
  
  cleanupWiringInteractions();
  
  //need to check and understand why pointerObserver is used 
  pointerObserver = scene.onPointerObservable.add((pointerInfo) => {
    switch (pointerInfo.type) {
      case BABYLON.PointerEventTypes.POINTERMOVE:
        handlePointerMove(pointerInfo);
        break;
      case BABYLON.PointerEventTypes.POINTERDOWN:
        if (pointerInfo.event.button === 0) {
          handlePointerClick(pointerInfo);
        }
        break;
    }
  });
  
  console.log("🎮 Terminal-based wiring interactions setup complete");
}

// Purpose: Remove pointer observers and cleanup wiring mode
function cleanupWiringInteractions() {
  if (pointerObserver && window.scene) {
    window.scene.onPointerObservable.remove(pointerObserver);
    pointerObserver = null;
  }
  
  if (hoveredTerminal && hoveredTerminal !== selectedTerminal && typeof window.highlightTerminal === 'function') {
    window.highlightTerminal(hoveredTerminal, false);
  }
  hoveredTerminal = null;
  
  clearWirePreview();
  
  const canvas = document.getElementById('renderCanvas');
  if (canvas) {
    canvas.style.cursor = 'default';
  }
}

//need check
// Purpose: Display status messages to user during wiring operations
function showMessage(message) {
  console.log(`💬 ${message}`);
  
  //statusEl may be undefined
  const statusEl = document.getElementById('wiringStatus') || document.getElementById('statusMessage');
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.style.display = 'block';
    
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 3000);
  } else {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      background: rgba(0,0,0,0.8); color: white; padding: 10px 20px;
      border-radius: 5px; z-index: 10000; font-size: 14px;
    `;
    overlay.textContent = message;
    document.body.appendChild(overlay);
    
    setTimeout(() => {
      document.body.removeChild(overlay);
    }, 3000);
  }
}

//need check and debug the logic espesially where it is used
//this function related to wire properties panel
// Purpose: Set wire color from preset button(not accurate)
function setPresetColor(colorHex) {
  const wireColorPicker = document.getElementById('wireColorPicker');
  const wireColorPreview = document.getElementById('wireColorPreview');
  const wireThicknessPreview = document.getElementById('wireThicknessPreview');
  const wireThicknessSlider = document.getElementById('wireThicknessSlider');

  if (wireColorPicker) {
    wireColorPicker.value = colorHex;
    // Trigger input event to apply to selected wire
    wireColorPicker.dispatchEvent(new Event('input'));
  }
  if (wireColorPreview) {
    wireColorPreview.style.background = colorHex;
  }
  if (wireThicknessPreview) {
    wireThicknessPreview.style.background = colorHex;
  }
  
  if (typeof window.setWireColor === 'function') {
    window.setWireColor(colorHex);
    console.log(`🎨 Preset color selected: ${colorHex}`);
  } else {
    console.warn('⚠️ setWireColor function not available yet, retrying...');
    setTimeout(() => {
      if (typeof window.setWireColor === 'function') {
        window.setWireColor(colorHex);
      }
    }, 100);
  }
  
  //how there is auto apply while there is a button for apply
  // ✅ Auto-apply to selected wire if one is selected
  if (window.selectedWire && wireThicknessSlider) {
    const thickness = parseFloat(wireThicknessSlider.value);
    if (typeof window.updateWireProperties === 'function') {
      window.updateWireProperties(window.selectedWire, colorHex, thickness);
      // Refresh wire to show changes
      if (typeof window.refreshAllWires === 'function') {
        //warning posible double timeout 
        setTimeout(() => window.refreshAllWires(), 50);
      }
      console.log(`✅ Applied preset color ${colorHex} to selected wire`);
    }
  }
}

window.setPresetColor = setPresetColor;


//need logic check 
// Initialize wiring controls when DOM is ready(not sure about that it will loaded after DOM is ready or there is another logic)
// ✅ Priority 3: Robust event listener initialization
function initWiringControls() {
  const wiringBtn = document.getElementById('startWiringBtn');
  if (!wiringBtn) {
    console.warn('⚠️ Wiring button not found, retrying...');
    setTimeout(initWiringControls, 100);
    return;
  }
  
  // Remove any existing listeners to prevent duplicates
  const newBtn = wiringBtn.cloneNode(true);
  wiringBtn.parentNode.replaceChild(newBtn, wiringBtn);
  
  newBtn.addEventListener('click', () => {
    console.log('🔌 Wiring button clicked');
    setWiringMode(!wiringModeActive);
  });
  
  console.log('✅ Wiring button event listener attached');
  

  //need to rewrite the logic
  // ✅ Priority 2: Verify drawWireBetween is available (with retry logic)
  function checkDrawWireBetween() {
    if (typeof window.drawWireBetween !== 'function') {
      console.warn('⚠️ drawWireBetween not loaded yet - wiring-logic.ts may still be loading');
      // Retry after a short delay if still not available
      setTimeout(() => {
        if (typeof window.drawWireBetween !== 'function') {
          console.error('❌ drawWireBetween not loaded - wiring will not work');
          console.error('   Make sure wiring-logic.ts is loaded before wiring-controls.ts');
        } else {
          console.log('✅ drawWireBetween function now available');
        }
      }, 100);
    } else {
      console.log('✅ drawWireBetween function available');
    }
  }
  
  checkDrawWireBetween();
}

// Try immediately and on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWiringControls);
} else {
  initWiringControls();
}


//need check 
//need fix (local variable is used as global variable)
// ✅ Priority 3: Add keyboard shortcuts (only once)
if (!window._wiringKeyboardShortcutsAttached) {
  window._wiringKeyboardShortcutsAttached = true;
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'w' || e.key === 'W') {
      if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        setWiringMode(!wiringModeActive);
      }
    } 
    else if (e.key === 'Escape' && wiringModeActive) {
      setSelectedTerminal(null);
      if (typeof window.clearWireSelection === 'function') {
        window.clearWireSelection();
      }
      showMessage("Selection cleared.");
    }
    //
    else if ((e.key === 'Delete' || e.key === 'Backspace') && window.selectedWire) {
      e.preventDefault();
      const wire = window.selectedWire;
      const fromName = wire.metadata?.fromTerminalName || 'Unknown';
      const toName = wire.metadata?.toTerminalName || 'Unknown';
      const confirmMessage = `Delete wire connection?\n\nFrom: ${fromName}\nTo: ${toName}`;

      if (confirm(confirmMessage)) {
        if (typeof window.deleteWire === 'function') {
          window.deleteWire(wire);
          window.selectedWire = null;
        }
      }
    }
    else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      //need fix and make names correct in all else if (INPUT & TEXTAREA are not exist)
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (typeof window.undoWireOperation === 'function') {
          window.undoWireOperation();
        }
      }
    }
    //condition need check
    else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (typeof window.redoWireOperation === 'function') {
          window.redoWireOperation();
        }
      }
    }
    //window.selectedWires need to define where it is used and always it is empty so the code does not enter in this condition
    //the function used here to delete the sellected wires also need to check  
    //this used for multi select delete but it doesnt work
    else if ((e.key === 'Delete' || e.key === 'Backspace') && window.selectedWires && window.selectedWires.length > 0) {
      console.log('🗑️ Delete key the 2nd pressed - deleting selected wires');
      e.preventDefault();
      if (typeof window.deleteSelectedWires === 'function') {
        if (confirm(`Delete ${window.selectedWires.length} selected wire(s)?`)) {
          window.deleteSelectedWires();
        }
      }
    }
    else if ((e.ctrlKey || e.metaKey) && e.key === 'a' && wiringModeActive) {
      e.preventDefault();
      if (typeof window.selectAllWires === 'function') {
        window.selectAllWires();
      }
    }
  });


  //need check
  // Wire Properties Panel Integration
  const wireColorPicker = document.getElementById('wireColorPicker');
  const wireColorPreview = document.getElementById('wireColorPreview');
  const wireThicknessSlider = document.getElementById('wireThicknessSlider');
  const wireThicknessValue = document.getElementById('wireThicknessValue');
  const wireThicknessPreview = document.getElementById('wireThicknessPreview');
  const applyWirePropsBtn = document.getElementById('applyWirePropsBtn');

  // ✅ Initialize preset color buttons with their colors
  const presetButtons = document.querySelectorAll('.wire-color-preset');
  presetButtons.forEach(button => {
    const color = button.getAttribute('data-color');
    if (color) {
      button.style.background = color;
    }
  });

  // ✅ Initialize color preview on page load
  if (wireColorPicker && wireColorPreview) {
    const initialColor = wireColorPicker.value || '#FF6600';
    wireColorPreview.style.background = initialColor;
    if (wireThicknessPreview) {
      wireThicknessPreview.style.background = initialColor;
    }
  }

  // Debounce timer for auto-applying wire properties
  let wireUpdateTimer = null;

  if (wireColorPicker) {
    wireColorPicker.addEventListener('input', (e) => {
      const color = e.target.value;
      if (wireColorPreview) {
        wireColorPreview.style.background = color;
      }
      if (wireThicknessPreview) {
        wireThicknessPreview.style.background = color;
      }
      
      // Update wire properties for new wires
      if (typeof window.setWireColor === 'function') {
        window.setWireColor(color);
      }
      
      // ✅ Auto-apply to selected wire if one is selected (with debounce)
      if (window.selectedWire && wireThicknessSlider) {
        clearTimeout(wireUpdateTimer);
        wireUpdateTimer = setTimeout(() => {
          const thickness = parseFloat(wireThicknessSlider.value);
          if (typeof window.updateWireProperties === 'function') {
            window.updateWireProperties(window.selectedWire, color, thickness);
            // Refresh wire to show changes
            if (typeof window.refreshAllWires === 'function') {
              setTimeout(() => window.refreshAllWires(), 50);
            }
          }
        }, 100); // 100ms debounce
      }
    });
  }

  if (wireThicknessSlider) {
    wireThicknessSlider.addEventListener('input', (e) => {
      const thickness = parseFloat(e.target.value);
      if (wireThicknessValue) {
        wireThicknessValue.textContent = thickness.toFixed(2);
      }
      if (wireThicknessPreview) {
        wireThicknessPreview.style.height = (thickness * 60) + 'px';
      }
      
      // Update wire properties for new wires
      if (typeof window.setWireThickness === 'function') {
        window.setWireThickness(thickness);
      }
      
      // ✅ Auto-apply to selected wire if one is selected (with debounce)
      if (window.selectedWire && wireColorPicker) {
        clearTimeout(wireUpdateTimer);
        wireUpdateTimer = setTimeout(() => {
          const color = wireColorPicker.value;
          if (typeof window.updateWireProperties === 'function') {
            window.updateWireProperties(window.selectedWire, color, thickness);
            // Refresh wire to show changes
            if (typeof window.refreshAllWires === 'function') {
              setTimeout(() => window.refreshAllWires(), 50);
            }
          }
        }, 100); // 100ms debounce
      }
    });
  }

  if (applyWirePropsBtn) {
    applyWirePropsBtn.addEventListener('click', () => {
      if (window.selectedWire && wireColorPicker && wireThicknessSlider) {
        const color = wireColorPicker.value;
        const thickness = parseFloat(wireThicknessSlider.value);

        if (typeof window.updateWireProperties === 'function') {
          const success = window.updateWireProperties(window.selectedWire, color, thickness);
          if (success) {
            showMessage(`✅ Wire properties updated!`);
            // Refresh wire to show new properties
            if (typeof window.refreshAllWires === 'function') {
              setTimeout(() => window.refreshAllWires(), 100);
            }
          } else {
            showMessage(`❌ Failed to update wire properties`);
          }
        } else {
          showMessage(`❌ Wire update function not available`);
        }
      } else {
        showMessage(`⚠️ Please select a wire first`);
      }
    });
  }

  console.log("🎛️ Terminal-based wiring controls initialized");
}

/**
 * Update wire properties UI with selected wire's current values
 */
function updateWirePropertiesUI(wireMesh) {
  if (!wireMesh || !wireMesh.metadata) return;

  const wireColorPicker = document.getElementById('wireColorPicker');
  const wireColorPreview = document.getElementById('wireColorPreview');
  const wireThicknessSlider = document.getElementById('wireThicknessSlider');
  const wireThicknessValue = document.getElementById('wireThicknessValue');
  const wireThicknessPreview = document.getElementById('wireThicknessPreview');
  const applyWirePropsBtn = document.getElementById('applyWirePropsBtn');

  // Get current wire properties
  const currentColor = wireMesh.metadata.wireColor || '#FF6600';
  const currentThickness = wireMesh.metadata.wireThickness || 0.05;

  // Update color picker
  if (wireColorPicker) {
    wireColorPicker.value = currentColor;
  }
  if (wireColorPreview) {
    wireColorPreview.style.background = currentColor;
  }
  if (wireThicknessPreview) {
    wireThicknessPreview.style.background = currentColor;
  }

  // Update thickness slider
  if (wireThicknessSlider) {
    wireThicknessSlider.value = currentThickness.toString();
  }
  if (wireThicknessValue) {
    wireThicknessValue.textContent = currentThickness.toFixed(2);
  }
  if (wireThicknessPreview) {
    wireThicknessPreview.style.height = (currentThickness * 60) + 'px';
  }

  // Show apply button
  if (applyWirePropsBtn) {
    applyWirePropsBtn.style.display = 'block';
    applyWirePropsBtn.textContent = 'Apply to Selected Wire';
  }
}

// Make function available globally
window.updateWirePropertiesUI = updateWirePropertiesUI;

// Make functions available globally
window.setWiringMode = setWiringMode;
window.isWiringMode = isWiringMode;
window.getSelectedTerminal = getSelectedTerminal;
window.setSelectedTerminal = setSelectedTerminal;
window.showMessage = showMessage;

// Backward compatibility aliases for code that uses pin terminology
window.getSelectedPin = getSelectedTerminal;
window.setSelectedPin = setSelectedTerminal;

// Export for ES6 modules
export { showMessage };

console.log("✅ Terminal-based wiring controls loaded");
