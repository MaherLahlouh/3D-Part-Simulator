// @ts-nocheck

// Import centralized terminal type definitions
import { TERMINAL_TYPES } from './arduino-config';

// Prevent content script conflicts by checking environment
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  console.log('⚠️ Chrome extension environment detected - limiting functionality');
} else {
  console.log('✅ Clean browser environment detected');
}

// Note: showToast is defined in event-handeler.ts
// This function is accessed via window.showToast

// Enhanced wiring validation with comprehensive electrical rules
// Purpose: Validate wiring connection between two terminals (electrical safety rules)
// Called from: handleWiringClickEnhanced() before creating connection
window.validateWiringConnection = function(fromTerminalMeta, toTerminalMeta) {
  if (!fromTerminalMeta || !toTerminalMeta) {
    console.warn('validateWiringConnection: Missing terminal metadata');
    return false;
  }

  // Self-connection check
  if (fromTerminalMeta.terminalId === toTerminalMeta.terminalId) {
    console.warn('validateWiringConnection: Cannot connect terminal to itself');
    return false;
  }

  // ENHANCEMENT: Pin-specific validation for Arduino boards
  const fromIsArduinoPin = fromTerminalMeta.isArduinoPin;
  const toIsArduinoPin = toTerminalMeta.isArduinoPin;

  if (fromIsArduinoPin || toIsArduinoPin) {
    // Get the Arduino pin and component type
    const arduinoPin = fromIsArduinoPin ? fromTerminalMeta.pinName : toTerminalMeta.pinName;
    const componentPin = fromIsArduinoPin ? toTerminalMeta : fromTerminalMeta;
    const componentType = componentPin.partType || 'unknown';

    // Use the advanced pin validation if available
    if (window.validatePinConnection && fromIsArduinoPin) {
      const arduino = fromTerminalMeta.arduinoBoard;
      const validation = window.validatePinConnection(arduino, arduinoPin, componentType);

      if (!validation.valid) {
        console.warn(`validateWiringConnection: ${validation.reason}`);
        if (typeof window.showToast === 'function') {
          window.showToast(`⚠️ ${validation.reason}`, 'warning', 3000);
        }
        return false;
      }

      // Show warnings but allow connection
      if (validation.warning) {
        console.warn(`validateWiringConnection: ${validation.warning}`);
        if (typeof window.showToast === 'function') {
          window.showToast(`⚠️ ${validation.warning}`, 'warning', 4000);
        }
      }
    } else if (window.validatePinConnection && toIsArduinoPin) {
      const arduino = toTerminalMeta.arduinoBoard;
      const validation = window.validatePinConnection(arduino, arduinoPin, componentType);

      if (!validation.valid) {
        console.warn(`validateWiringConnection: ${validation.reason}`);
        if (typeof window.showToast === 'function') {
          window.showToast(`⚠️ ${validation.reason}`, 'warning', 3000);
        }
        return false;
      }

      if (validation.warning) {
        console.warn(`validateWiringConnection: ${validation.warning}`);
        if (typeof window.showToast === 'function') {
          window.showToast(`⚠️ ${validation.warning}`, 'warning', 4000);
        }
      }
    }
  }

  // ✅ Enhanced electrical safety rules - using centralized terminal types
  const powerTerminals = TERMINAL_TYPES.power;
  const groundTerminals = TERMINAL_TYPES.ground;
  const analogTerminals = TERMINAL_TYPES.analog;
  const digitalTerminals = TERMINAL_TYPES.digital;

  const fromName = (fromTerminalMeta.terminalName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const toName = (toTerminalMeta.terminalName || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const fromIsPower = powerTerminals.some(p => fromName.includes(p));
  const toIsPower = powerTerminals.some(p => toName.includes(p));
  const fromIsGround = groundTerminals.some(p => fromName.includes(p));
  const toIsGround = groundTerminals.some(p => toName.includes(p));

  // Prevent power-to-ground short circuits
  if ((fromIsPower && toIsGround) || (fromIsGround && toIsPower)) {
    console.warn('validateWiringConnection: Power-to-Ground connection blocked (short circuit risk)');
    if (typeof window.showToast === 'function') {
      window.showToast('⚠️ Cannot connect Power to Ground (short circuit!)', 'error', 3000);
    }
    return false;
  }

  // Prevent power-to-power connections (could cause conflicts)
  if (fromIsPower && toIsPower && !fromIsArduinoPin && !toIsArduinoPin) {
    console.warn('validateWiringConnection: Power-to-Power connection blocked');
    if (typeof window.showToast === 'function') {
      window.showToast('⚠️ Cannot connect Power pins together', 'warning', 3000);
    }
    return false;
  }

  // Check for existing connections
  const connections = window.connections || [];
  const existingConnection = connections.find(c =>
    (c.from === fromTerminalMeta.terminalId && c.to === toTerminalMeta.terminalId) ||
    (c.from === toTerminalMeta.terminalId && c.to === fromTerminalMeta.terminalId)
  );

  if (existingConnection) {
    console.warn('validateWiringConnection: Connection already exists');
    if (typeof window.showToast === 'function') {
      window.showToast('⚠️ Connection already exists', 'warning', 2000);
    }
    return false;
  }

  // Check if terminals are already connected to other terminals (single connection rule)
  const fromAlreadyConnected = connections.some(c => c.from === fromTerminalMeta.terminalId || c.to === fromTerminalMeta.terminalId);
  const toAlreadyConnected = connections.some(c => c.from === toTerminalMeta.terminalId || c.to === toTerminalMeta.terminalId);

  // Allow multiple connections for power and ground terminals
  if (!fromIsPower && !fromIsGround && fromAlreadyConnected && !fromIsArduinoPin) {
    console.warn('validateWiringConnection: From terminal already connected');
    if (typeof window.showToast === 'function') {
      window.showToast('⚠️ Terminal already has a connection', 'warning', 2000);
    }
    return false;
  }

  if (!toIsPower && !toIsGround && toAlreadyConnected && !toIsArduinoPin) {
    console.warn('validateWiringConnection: To terminal already connected');
    if (typeof window.showToast === 'function') {
      window.showToast('⚠️ Terminal already has a connection', 'warning', 2000);
    }
    return false;
  }

  console.log(`validateWiringConnection: Valid connection ${fromTerminalMeta.terminalName} → ${toTerminalMeta.terminalName}`);
  return true;
};

// Enhanced wiring click handler - NOW USES TERMINALS DIRECTLY
// Purpose: Enhanced wiring click handler for terminal blocks (no pins needed)
// Called from: Terminal click events in wiring mode
window.handleWiringClickEnhanced = function(mesh) {
  if (!window.wiringMode) {
    console.log('handleWiringClickEnhanced: Wiring mode not active');
    return;
  }
  
  if (!mesh) {
    console.warn('handleWiringClickEnhanced: No mesh provided');
    return;
  }

  // Enhanced terminal metadata extraction
  const meta = mesh.metadata || {};
  const parent = mesh.getParent && mesh.getParent();
  const parentMeta = parent?._metadata || parent?.metadata || {};

  // Check if this is a terminal block or has terminal metadata
  const isTerminal = meta.isTerminal || meta.terminalName || 
                     mesh.name.toLowerCase().includes('terminal') ||
                     mesh.name.toLowerCase().includes('connector');

  if (!isTerminal) {
    console.log('handleWiringClickEnhanced: Mesh is not a terminal, ignoring');
    if (typeof window.showToast === 'function') {
      window.showToast('Please click on terminal blocks to wire', 'warning', 2000);
    }
    return;
  }

  const terminalMeta = {
    partType: meta.partType || parentMeta.partType || meta.type || parentMeta.type || 'unknown',
    terminalName: meta.terminalName || meta.pinName || mesh.name || 'unknown',
    terminalId: meta.terminalId || meta.pinId || `${mesh.name}_${mesh.uniqueId || Date.now()}`,
    mesh: mesh
  };

  console.log('handleWiringClickEnhanced: Terminal clicked:', terminalMeta);

  if (!window._wiringPending) {
    // Start new connection
    window._wiringPending = { mesh, terminalMeta };
    if (typeof window.showToast === 'function') {
      window.showToast(`Start terminal selected: ${terminalMeta.terminalName}`, 'info', 2000);
    }
    
    // Visual feedback
    if (typeof window.highlightTerminal === 'function') {
      window.highlightTerminal(mesh, true);
    }
    
    console.log('handleWiringClickEnhanced: Waiting for second terminal...');
    return;
  }

  // Complete connection
  const start = window._wiringPending;
  
  // Remove highlight from start terminal
  if (typeof window.highlightTerminal === 'function') {
    window.highlightTerminal(start.mesh, false);
  }

  const valid = validateWiringConnection(start.terminalMeta, terminalMeta);
  if (!valid) {
    if (typeof window.showToast === 'function') {
      window.showToast('Invalid connection: blocked by validation rules', 'error', 3000);
    }
    window._wiringPending = null;
    return;
  }

  // Create connection
  window.connections = window.connections || [];
  const connection = {
    id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    from: start.terminalMeta.terminalId,
    to: terminalMeta.terminalId,
    fromName: start.terminalMeta.terminalName,
    toName: terminalMeta.terminalName,
    fromPart: start.terminalMeta.partType,
    toPart: terminalMeta.partType,
    timestamp: new Date().toISOString()
  };

  window.connections.push(connection);

  // Draw wire using existing helper if available
  if (typeof window.drawWireBetween === 'function') {
    try {
      window.drawWireBetween(start.mesh, mesh);
      console.log('handleWiringClickEnhanced: Wire drawn successfully');
    } catch (error) {
      console.error('handleWiringClickEnhanced: Error drawing wire:', error);
      if (typeof window.showToast === 'function') {
        window.showToast('Wire drawn but visualization failed', 'warning', 2000);
      }
    }
  } else {
    console.warn('handleWiringClickEnhanced: window.drawWireBetween function not available');
  }

  if (typeof window.showToast === 'function') {
    window.showToast(`Wired ${start.terminalMeta.terminalName} → ${terminalMeta.terminalName}`, 'success', 3000);
  }
  console.log('handleWiringClickEnhanced: Connection completed:', connection);
  
  window._wiringPending = null;
};

// Main wiring click handler
window.handleWiringClick = window.handleWiringClickEnhanced;

// ✅ REMOVED: getWiringData() and restoreWiring() - Now using implementations from wiring-logic.ts
// These functions are exported from wiring-logic.ts and exposed to window
// Use window.getWiringData and window.restoreWiring from wiring-logic.ts instead

// REMOVED: createPinsForNewPart function (no longer needed)
// REMOVED: createSinglePin function (no longer needed)
// REMOVED: restorePinsFromData function (no longer needed)
// REMOVED: initializePinsForComponent function (no longer needed)
// REMOVED: getPinDataForSave function (no longer needed)

// ✅ REMOVED: highlightTerminal() - Now using the implementation from wiring-logic.ts
// Use window.highlightTerminal from wiring-logic.ts instead (exported function)
// This is kept as a compatibility wrapper only if wiring-logic.ts hasn't loaded it yet
if (!window.highlightTerminal) {
  // Fallback implementation if wiring-logic.ts not loaded
  window.highlightTerminal = function(terminalMesh, highlight) {
    try {
      if (!terminalMesh || !terminalMesh.material) return;
      
      if (highlight) {
        // Store original color if not already stored
        if (!terminalMesh._originalEmissiveColor) {
          terminalMesh._originalEmissiveColor = terminalMesh.material.emissiveColor ? 
            terminalMesh.material.emissiveColor.clone() : 
            new BABYLON.Color3(0, 0, 0);
        }
        
        // Apply highlight
        terminalMesh.material.emissiveColor = new BABYLON.Color3(1, 1, 0); // Yellow highlight
        
        // Store original scaling
        if (!terminalMesh._originalScaling) {
          terminalMesh._originalScaling = terminalMesh.scaling.clone();
        }
        
        // Slightly enlarge
        const scale = 1.15;
        terminalMesh.scaling = terminalMesh._originalScaling.scale(scale);
      } else {
        // Restore original color
        if (terminalMesh._originalEmissiveColor) {
          terminalMesh.material.emissiveColor = terminalMesh._originalEmissiveColor.clone();
          delete terminalMesh._originalEmissiveColor;
        }
        
        // Restore original scaling
        if (terminalMesh._originalScaling) {
          terminalMesh.scaling = terminalMesh._originalScaling.clone();
          delete terminalMesh._originalScaling;
        }
      }
    } catch (error) {
      console.error('highlightTerminal: Error:', error);
    }
  };
}

// Backward compatibility alias
if (!window.highlightPin) {
  window.highlightPin = window.highlightTerminal;
}

// Enhanced drag behavior shim
window.addDragBehaviorWithOrthoSupport = window.addDragBehaviorWithOrthoSupport || function(container, visualMesh) {
  try {
    if (typeof window.addDragBehavior === 'function') {
      return window.addDragBehavior(container, visualMesh);
    }
    
    // Fallback: Enhanced PointerDragBehavior
    const dragBehavior = new BABYLON.PointerDragBehavior({ 
      dragPlaneNormal: new BABYLON.Vector3(0, 1, 0) 
    });
    
    // Enhanced drag with constraints
    dragBehavior.onDragStartObservable.add(() => {
      console.log(`Drag started for ${container.name}`);
    });
    
    dragBehavior.onDragObservable.add(() => {
      // Keep components above ground
      if (container.position.y < 0.1) {
        container.position.y = 0.1;
      }
    });
    
    dragBehavior.onDragEndObservable.add(() => {
      console.log(`Drag ended for ${container.name}`);
      
      // Refresh wires if available
      if (typeof window.refreshAllWires === 'function') {
        window.refreshAllWires();
      }
    });
    
    container.addBehavior(dragBehavior);
    return dragBehavior;
    
  } catch (error) {
    console.error('addDragBehaviorWithOrthoSupport: Error:', error);
  }
};

// Enhanced Parts DSL & Plugin API
window.partsDSL = window.partsDSL || {
  registry: {},
  
  register(partName, descriptor) {
    try {
      this.registry[partName] = {
        ...descriptor,
        registered: new Date().toISOString()
      };
      console.log(`PartsDSL: Registered ${partName}`);
      if (typeof window.showToast === 'function') {
        window.showToast(`Part registered: ${partName}`, 'info', 1500);
      }
    } catch (error) {
      console.error(`PartsDSL: Error registering ${partName}:`, error);
    }
  },
  
  get(partName) {
    return this.registry[partName] || null;
  },
  
  list() {
    return Object.keys(this.registry);
  },
  
  remove(partName) {
    if (this.registry[partName]) {
      delete this.registry[partName];
      console.log(`PartsDSL: Removed ${partName}`);
      return true;
    }
    return false;
  }
};

window.pluginAPI = window.pluginAPI || {
  plugins: {},
  
  registerPlugin(name, impl) {
    try {
      this.plugins[name] = {
        implementation: impl,
        registered: new Date().toISOString()
      };
      this[name] = impl;
      console.log(`PluginAPI: Registered plugin ${name}`);
      if (typeof window.showToast === 'function') {
        window.showToast(`Plugin loaded: ${name}`, 'success', 1500);
      }
    } catch (error) {
      console.error(`PluginAPI: Error registering plugin ${name}:`, error);
    }
  },
  
  getPlugin(name) {
    return this.plugins[name]?.implementation || null;
  },
  
  listPlugins() {
    return Object.keys(this.plugins);
  }
};

// Enhanced error handling for host validation issues
function suppressHostValidationErrors() {
  const originalError = console.error.bind(console);
  console.error = function(...args) {
    const message = args.join(' ');
    
    // Filter out known host validation errors
    if (message.includes('Host validation failed') ||
        message.includes('Host is not supported') ||
        message.includes('Host is not valid') ||
        message.includes('Host is not in insights whitelist') ||
        message.includes('Could not establish connection. Receiving end does not exist')) {
      return;
    }
    
    originalError(...args);
  };
}

// Enhanced initialization
// Purpose: Initialize all enhancement features (toasts, wiring, terminals)
// Called from: DOMContentLoaded event, on page load
function initializeEnhancements() {
  try {
    // Suppress validation errors
    suppressHostValidationErrors();
    
    // Initialize global wiring state
    window.connections = window.connections || [];
    window.wiringMode = window.wiringMode || false;
    window._wiringPending = null;
    
    // Set up global event listeners
    document.addEventListener('keydown', (event) => {
      // Escape to cancel wiring
      if (event.key === 'Escape' && window._wiringPending) {
        if (typeof window.highlightTerminal === 'function') {
          window.highlightTerminal(window._wiringPending.mesh, false);
        }
        window._wiringPending = null;
        if (typeof window.showToast === 'function') {
          window.showToast('Wiring cancelled', 'info', 1000);
        }
      }
    });
    
    // Clean up any orphaned toast containers on page load
    const existingToastContainer = document.getElementById('taa_toast_container');
    if (existingToastContainer) {
      existingToastContainer.remove();
    }
    
    console.log('enhancements.js loaded: terminal-based wiring, validation, toasts, DSL');
    if (typeof window.showToast === 'function') {
      window.showToast('TAA Simulator Enhanced - Terminal Wiring Mode', 'success', 2000);
    }
    
  } catch (error) {
    console.error('initializeEnhancements: Error:', error);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeEnhancements);
} else {
  initializeEnhancements();
}

// Debug functions
window.debugEnhancements = function() {
  console.log('=== ENHANCEMENTS DEBUG ===');
  console.log('Connections:', window.connections?.length || 0);
  console.log('Wiring Mode:', window.wiringMode);
  console.log('Pending Connection:', !!window._wiringPending);
  console.log('Parts DSL Registry:', Object.keys(window.partsDSL?.registry || {}));
  console.log('Plugin API:', Object.keys(window.pluginAPI?.plugins || {}));
  console.log('Functions Available:');
  console.log('  - validateWiringConnection:', typeof window.validateWiringConnection);
  console.log('  - handleWiringClick:', typeof window.handleWiringClick);
  console.log('  - highlightTerminal:', typeof window.highlightTerminal);
  console.log('  - restoreWiring:', typeof window.restoreWiring);
  console.log('  - showToast:', typeof window.showToast);
  console.log('========================');
};

// Export enhanced validation status
window.enhancementsStatus = {
  loaded: true,
  version: '3.0.0',
  features: [
    'Terminal-Based Wiring (No Pins)',
    'Enhanced Wiring Validation',
    'Toast Notification System',
    'Parts DSL Registry',
    'Plugin API',
    'Error Suppression'
  ],
  loadTime: new Date().toISOString()
};

// Enhanced connection visual effects
window.showMagneticPullEffect = function(movingPart, targetPart) {
    if (!window.scene || !movingPart || !targetPart) return;
    
    try {
        const start = movingPart.position.clone();
        const end = targetPart.position.clone();
        
        const line = BABYLON.MeshBuilder.CreateLines("magneticLine", {
            points: [start, end],
            updatable: true
        }, window.scene);
        
        line.color = new BABYLON.Color3(0, 1, 1);
        line.alpha = 0.5;
        
        let alpha = 0.5;
        const interval = setInterval(() => {
            alpha = alpha > 0 ? alpha - 0.05 : 0.5;
            line.alpha = alpha;
        }, 50);
        
        setTimeout(() => {
            clearInterval(interval);
            line.dispose();
        }, 1000);
    } catch (error) {
        console.warn("Error showing magnetic pull effect:", error);
    }
};

window.showConnectionStrength = function(position, strength) {
    if (!window.scene) return;
    
    try {
        const color = strength > 0.8 ? 
            new BABYLON.Color3(0, 1, 0) :
            strength > 0.5 ? 
            new BABYLON.Color3(1, 1, 0) :
            new BABYLON.Color3(1, 0.5, 0);
        
        const disc = BABYLON.MeshBuilder.CreateDisc("strengthIndicator", {
            radius: 0.5,
            tessellation: 16
        }, window.scene);
        
        disc.position = position.clone();
        disc.position.y += 0.1;
        disc.rotation.x = Math.PI / 2;
        
        const material = new BABYLON.StandardMaterial("strengthMat", window.scene);
        material.emissiveColor = color;
        material.alpha = 0.7;
        disc.material = material;
        
        BABYLON.Animation.CreateAndStartAnimation(
            "fadeStrength",
            material,
            "alpha",
            30,
            30,
            0.7,
            0,
            0
        );
        
        setTimeout(() => {
            disc.dispose();
        }, 1000);
    } catch (error) {
        console.warn("Error showing connection strength:", error);
    }
};

window.highlightAssembly = function(parts) {
    if (!window.scene || !Array.isArray(parts) || parts.length === 0) return;
    
    console.log(`🎨 Highlighting assembly with ${parts.length} parts`);
    
    parts.forEach(part => {
        try {
            const meshes = part.getChildMeshes ? part.getChildMeshes() : [];
            meshes.forEach(mesh => {
                if (mesh && mesh.material) {
                    if (!mesh._assemblyOriginalColor) {
                        mesh._assemblyOriginalColor = mesh.material.emissiveColor ? 
                            mesh.material.emissiveColor.clone() : 
                            new BABYLON.Color3(0, 0, 0);
                    }
                    
                    mesh.material.emissiveColor = new BABYLON.Color3(0.3, 0.8, 0.3);
                }
            });
        } catch (error) {
            console.warn("Error highlighting assembly part:", error);
        }
    });
    
    setTimeout(() => {
        window.clearAssemblyHighlight(parts);
    }, 2000);
};

window.clearAssemblyHighlight = function(parts) {
    if (!Array.isArray(parts)) return;
    
    parts.forEach(part => {
        try {
            const meshes = part.getChildMeshes ? part.getChildMeshes() : [];
            meshes.forEach(mesh => {
                if (mesh && mesh.material && mesh._assemblyOriginalColor) {
                    mesh.material.emissiveColor = mesh._assemblyOriginalColor.clone();
                    delete mesh._assemblyOriginalColor;
                }
            });
        } catch (error) {
            console.warn("Error clearing assembly highlight:", error);
        }
    });
};

window.smoothSnapToPosition = function(part, targetPosition, duration = 300) {
    if (!part || !targetPosition) return;
    
    const startPos = part.position.clone();
    const endPos = targetPosition.clone();
    const startTime = Date.now();
    
    const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const eased = 1 - Math.pow(1 - progress, 3);
        
        part.position.x = startPos.x + (endPos.x - startPos.x) * eased;
        part.position.y = startPos.y + (endPos.y - startPos.y) * eased;
        part.position.z = startPos.z + (endPos.z - startPos.z) * eased;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            console.log("✅ Smooth snap animation completed");
        }
    };
    
    animate();
};

console.log("✅ Enhanced terminal-based wiring system loaded");
