// @ts-nocheck
// Import header buttons module
import { eraseAll as headerEraseAll, deleteSelected as headerDeleteSelected, 
         disconnectSelected as headerDisconnectSelected, disconnectAll as headerDisconnectAll,
         initializeHeaderButtons } from './header-buttons';

const BABYLON = window.BABYLON;
const scene = window.scene;

// Enhanced dragLogic.js with COLLISION DETECTION, PHYSICS & AUTO-SNAP
const allParts = [];
const undoStack = [];
const redoStack = [];
let selected = null;
let selectedComponents = []; // Multi-select array
let multiSelectMode = false; // Multi-select mode flag
let currentDragPlaneNormal = new BABYLON.Vector3(0, 1, 0);
let lastComponentOperationTime = 0; // Track timestamp of last component operation

// Collision system reference
let collisionSystem = null;

// Listen for camera view changes
window.addEventListener('cameraViewChanged', (event) => {
  const { view, dragPlaneNormal } = event.detail;
  currentDragPlaneNormal = dragPlaneNormal;
  console.log(`📷 Drag plane updated for ${view} view:`, dragPlaneNormal);
  updateAllDragBehaviors();
});

window.onCameraViewChanged = function(detail) {
  const { view, dragPlaneNormal } = detail;
  currentDragPlaneNormal = dragPlaneNormal;
  console.log(`📷 Drag plane updated for ${view} view:`, dragPlaneNormal);
  updateAllDragBehaviors();
};

// Initialize collision system when scene is ready
function initializeCollisionSystem() {
  if (!scene) {
    setTimeout(initializeCollisionSystem, 100);
    return;
  }
  
  if (!collisionSystem) {
    collisionSystem = new window.CollisionSystem(scene);
    window.collisionSystem = collisionSystem;
    
    // Register existing parts
    allParts.forEach(part => {
      collisionSystem.registerPart(part);
    });
    
    // Start collision detection
    collisionSystem.start();
    
    console.log("✅ Collision system initialized with drag logic");
  }
}

// Wait for collision system to load
setTimeout(initializeCollisionSystem, 500);

// ✅ ENHANCED: Drag Behavior with COLLISION DETECTION & AUTO-SNAP
function addDragBehavior(container, visualMesh) {
  // Store timestamp on component for undo/redo comparison
  if (!container._addTimestamp) {
    container._addTimestamp = Date.now();
  }
  allParts.push(container);
  // Track timestamp when component is added
  lastComponentOperationTime = container._addTimestamp;
  
  // Register with collision system
  if (collisionSystem) {
    collisionSystem.registerPart(container);
  }

  const dragBehavior = new BABYLON.PointerDragBehavior({
    dragPlaneNormal: currentDragPlaneNormal.clone()
  });

  dragBehavior.useObjectOrientationForDragging = false;
  dragBehavior.validateDrag = (targetPosition) => true;
  
  container._dragBehavior = dragBehavior;
  
  // Drag state tracking
  let dragStartPosition = null;
  let lastValidPosition = null;
  let snapCandidate = null;
  
  // ON DRAG START
  dragBehavior.onDragStartObservable.add(() => {
    console.log("🔄 Drag started for:", container.name);
    
    // Store starting position
    dragStartPosition = container.position.clone();
    lastValidPosition = container.position.clone();
    
    // ✅ Multi-select: Store positions of all selected components
    if (multiSelectMode && selectedComponents.length > 1) {
      container._multiSelectStartPositions = selectedComponents.map(comp => ({
        component: comp,
        position: comp.position.clone(),
        rotation: comp.rotation.clone()
      }));
    }
    
    // Start group dragging if connected (NEW connection system)
    if (window.houseConnectionSystem) {
      window.houseConnectionSystem.startDragging(container);
    }
    // Fallback to old system
    else if (window.houseGroupManager) {
      window.houseGroupManager.startDraggingGroup(container);
    }
    
    // Auto-select the dragged object (unless in multi-select mode)
    if (!multiSelectMode && selected !== container) {
      clearSelectionHighlight();
      selected = container;
      selectedComponents = [container];
      window.selected = selected;
      window.selectedComponents = selectedComponents;
      highlightSelection(selected);
      updateSelectionIndicator();
      
      // ✅ Show component properties panel
      if (typeof window.showComponentProperties === 'function') {
        window.showComponentProperties(container);
      }
    }
    
    // Visual feedback - blue glow
    if (visualMesh && visualMesh.material) {
      visualMesh.material.emissiveColor = new BABYLON.Color3(0.2, 0.4, 1.0);
    }
  });

  // DURING DRAG - Collision detection & snap preview
  dragBehavior.onDragObservable.add(() => {
    // ✅ Multi-select: Move all selected components together
    if (multiSelectMode && selectedComponents.length > 1 && container._multiSelectStartPositions) {
      const deltaPosition = container.position.subtract(dragStartPosition);
      
      selectedComponents.forEach(comp => {
        if (comp !== container && comp._multiSelectStartPositions) {
          const startData = container._multiSelectStartPositions.find(d => d.component === comp);
          if (startData) {
            comp.position = startData.position.add(deltaPosition);
          }
        }
      });
    }
    
    // Update group positions if part of a group (NEW connection system)
    if (window.houseConnectionSystem) {
      window.houseConnectionSystem.updateDrag(container);
    }
    // Fallback to old system
    else if (window.houseGroupManager) {
      window.houseGroupManager.updateGroupPositions(container, null);
    }
    
      // ✅ SNAP PREVIEW DISABLED - No green lines or visual overlays
      // Parts can be positioned freely without any visual feedback
      // if (collisionSystem && collisionSystem.isEnabled) {
      //   snapCandidate = collisionSystem.checkSnapOpportunities(container);
      //   
      //   if (snapCandidate) {
      //     collisionSystem.showSnapPreview(container, snapCandidate);
      //     collisionSystem.applyMagneticPull(container, snapCandidate);
      //     showSnapFeedback(container, snapCandidate);
      //   } else {
      //     collisionSystem.clearSnapPreview();
      //   }
      // }
    
    // Store last valid position
    lastValidPosition = container.position.clone();
    
    // Update wires if in wiring mode
    if (window.refreshAllWires && typeof window.refreshAllWires === 'function') {
      window.refreshAllWires();
    }
  });

  // ON DRAG END
  dragBehavior.onDragEndObservable.add(() => {
    console.log("✅ Drag ended for:", container.name);
    
    // End group dragging if connected (NEW connection system)
    if (window.houseConnectionSystem) {
      window.houseConnectionSystem.endDragging();
    }
    // Fallback to old system
    else if (window.houseGroupManager && window.houseGroupManager.endDraggingGroup) {
      window.houseGroupManager.endDraggingGroup();
    }
    
    // ✅ NEW: Execute snap if we have a candidate
    if (snapCandidate && collisionSystem) {
      // Get snap position - prefer terminal-based snapping
      let snapPosition: BABYLON.Vector3;
      if (snapCandidate.terminalMatch && snapCandidate.terminalMatch.snapPosition) {
        snapPosition = snapCandidate.terminalMatch.snapPosition;
      } else if (snapCandidate.surfaceMatch && snapCandidate.surfaceMatch.snapPosition) {
        snapPosition = snapCandidate.surfaceMatch.snapPosition;
      } else {
        snapPosition = null;
      }
      
      if (snapPosition) {
        const containerWorldPos = container.getAbsolutePosition();
        const snapDistance = BABYLON.Vector3.Distance(containerWorldPos, snapPosition);
        
        // Auto-snap if close enough
        if (snapDistance < collisionSystem.settings.snapDistance * 0.5) {
          console.log("🧲 Executing auto-snap!", snapCandidate.terminalMatch ? "(terminal-based)" : "(surface-based)");
          collisionSystem.executeSnap(container, snapCandidate);
          showSnapSuccessEffect(container.getAbsolutePosition());
        }
      }
      
      collisionSystem.clearSnapPreview();
      snapCandidate = null;
    }
    
    // Optional: Snap to grid (0.5 unit grid)
    if (window.snapToGrid && !snapCandidate) {
      container.position.x = Math.round(container.position.x * 2) / 2;
      container.position.y = Math.round(container.position.y * 2) / 2;
      container.position.z = Math.round(container.position.z * 2) / 2;
    }
    
    // ✅ Collision detection disabled - parts can overlap freely
    // Final collision check removed to allow free placement
    
    // Reset visual feedback
    if (visualMesh && visualMesh.material) {
      visualMesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
    }
    
    // End group dragging (NEW connection system)
    if (window.houseConnectionSystem) {
      window.houseConnectionSystem.endDragging();
    }
    // Fallback to old system
    else if (window.houseGroupManager) {
      window.houseGroupManager.endDraggingGroup();
    }
    
    // Log final position
    console.log(`📍 Part placed at: (${container.position.x.toFixed(2)}, ${container.position.y.toFixed(2)}, ${container.position.z.toFixed(2)})`);
    
    // Clear drag state
    dragStartPosition = null;
    lastValidPosition = null;
  });

  container.addBehavior(dragBehavior);
  container.isPickable = true;

  container.getChildMeshes().forEach(mesh => {
    mesh.isPickable = true;
  });
  
  console.log(`🎯 Added drag behavior with collision detection to ${container.name}`);
}

// Show visual feedback for snap candidate
function showSnapFeedback(part, snapInfo) {
  if (!part) return;
  
  const meshes = part.getChildMeshes ? part.getChildMeshes() : [];
  meshes.forEach(mesh => {
    if (mesh.material && !mesh._snapFeedbackActive) {
      mesh._snapFeedbackActive = true;
      mesh._originalEmissive = mesh.material.emissiveColor ? 
        mesh.material.emissiveColor.clone() : 
        new BABYLON.Color3(0, 0, 0);
      
      // Pulsing green glow
      const intensity = 0.3 + Math.sin(Date.now() / 200) * 0.2;
      mesh.material.emissiveColor = new BABYLON.Color3(0, intensity, 0);
    }
  });
  
  // Reset after drag ends
  setTimeout(() => {
    meshes.forEach(mesh => {
      if (mesh._snapFeedbackActive && mesh.material) {
        mesh.material.emissiveColor = mesh._originalEmissive || new BABYLON.Color3(0, 0, 0);
        mesh._snapFeedbackActive = false;
      }
    });
  }, 100);
}

// Show success effect when snap completes
function showSnapSuccessEffect(position) {
  if (!scene) return;
  
  try {
    // Create expanding ring
    const ring = BABYLON.MeshBuilder.CreateTorus("snapSuccess", {
      diameter: 1,
      thickness: 0.1,
      tessellation: 32
    }, scene);
    
    ring.position = position.clone();
    ring.position.y += 0.5;
    ring.rotation.x = Math.PI / 2;
    
    const material = new BABYLON.StandardMaterial("snapSuccessMat", scene);
    material.emissiveColor = new BABYLON.Color3(0, 1, 0.5);
    material.alpha = 0.8;
    ring.material = material;
    ring.isPickable = false;
    
    // Animate
    BABYLON.Animation.CreateAndStartAnimation(
      "expand",
      ring,
      "scaling",
      30,
      20,
      new BABYLON.Vector3(1, 1, 1),
      new BABYLON.Vector3(3, 3, 3),
      0
    );
    
    BABYLON.Animation.CreateAndStartAnimation(
      "fadeOut",
      material,
      "alpha",
      30,
      20,
      0.8,
      0,
      0
    );
    
    setTimeout(() => ring.dispose(), 700);
    
    // Also show toast
    if (window.showToast) {
      window.showToast("✅ Parts connected!", "success", 1500);
    }
  } catch (error) {
    console.warn("Error showing snap success effect:", error);
  }
}

// Update all drag behaviors for camera changes
function updateAllDragBehaviors() {
  console.log(`🔄 Updating ${allParts.length} drag behaviors for new camera view`);
  
  allParts.forEach(container => {
    if (container._dragBehavior) {
      container.removeBehavior(container._dragBehavior);
      
      const newDragBehavior = new BABYLON.PointerDragBehavior({
        dragPlaneNormal: currentDragPlaneNormal.clone()
      });
      
      newDragBehavior.useObjectOrientationForDragging = false;
      newDragBehavior.validateDrag = (targetPosition) => true;
      
      let snapCandidate = null;
      
      // Re-attach event handlers
      newDragBehavior.onDragStartObservable.add(() => {
        console.log("🔄 Drag started for:", container.name);
        
        if (window.houseGroupManager) {
          window.houseGroupManager.startDraggingGroup(container);
        }
        
        if (selected !== container) {
          clearSelectionHighlight();
          selected = container;
          window.selected = selected;
          highlightSelection(selected);
          updateSelectionIndicator();
        
        // ✅ Show component properties panel
        if (typeof window.showComponentProperties === 'function') {
          window.showComponentProperties(selected);
        }
        }
        
        const visualMesh = container.getChildMeshes()[0];
        if (visualMesh && visualMesh.material) {
          visualMesh.material.emissiveColor = new BABYLON.Color3(0.2, 0.4, 1.0);
        }
      });

      newDragBehavior.onDragObservable.add(() => {
        if (window.houseGroupManager) {
          window.houseGroupManager.updateGroupPositions(container, null);
        }
        
        // ✅ Collision detection disabled - parts can overlap freely
        // ✅ Check for snap opportunities (snapping still works)
        if (collisionSystem && collisionSystem.isEnabled) {
          snapCandidate = collisionSystem.checkSnapOpportunities(container);
          if (snapCandidate) {
            collisionSystem.showSnapPreview(container, snapCandidate);
            collisionSystem.applyMagneticPull(container, snapCandidate);
          } else {
            collisionSystem.clearSnapPreview();
          }
        }
        
        if (window.refreshAllWires && typeof window.refreshAllWires === 'function') {
          window.refreshAllWires();
        }
      });

      newDragBehavior.onDragEndObservable.add(() => {
        console.log("✅ Drag ended for:", container.name);
        
        // Execute snap
        if (snapCandidate && collisionSystem) {
          // Get snap position - prefer terminal-based snapping
          let snapPosition: BABYLON.Vector3;
          if (snapCandidate.terminalMatch && snapCandidate.terminalMatch.snapPosition) {
            snapPosition = snapCandidate.terminalMatch.snapPosition;
          } else if (snapCandidate.surfaceMatch && snapCandidate.surfaceMatch.snapPosition) {
            snapPosition = snapCandidate.surfaceMatch.snapPosition;
          } else {
            snapPosition = null;
          }
          
          if (snapPosition) {
            const containerWorldPos = container.getAbsolutePosition();
            const snapDistance = BABYLON.Vector3.Distance(containerWorldPos, snapPosition);
            
            if (snapDistance < collisionSystem.settings.snapDistance * 0.5) {
              console.log("🧲 Executing auto-snap!", snapCandidate.terminalMatch ? "(terminal-based)" : "(surface-based)");
              collisionSystem.executeSnap(container, snapCandidate);
              showSnapSuccessEffect(container.getAbsolutePosition());
            }
          }
          
          collisionSystem.clearSnapPreview();
          snapCandidate = null;
        }
        
        if (window.snapToGrid && !snapCandidate) {
          container.position.x = Math.round(container.position.x * 2) / 2;
          container.position.y = Math.round(container.position.y * 2) / 2;
          container.position.z = Math.round(container.position.z * 2) / 2;
        }
        
        // ✅ Collision detection disabled - parts can overlap freely
        // if (collisionSystem) {
        //   collisionSystem.updatePartBounds(container);
        //   collisionSystem.detectAndResolveCollisions();
        // }
        
        const visualMesh = container.getChildMeshes()[0];
        if (visualMesh && visualMesh.material) {
          visualMesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
        }
        
        if (window.houseGroupManager) {
          window.houseGroupManager.endDraggingGroup();
        }
        
        console.log(`📍 Part placed at: (${container.position.x.toFixed(2)}, ${container.position.y.toFixed(2)}, ${container.position.z.toFixed(2)})`);
      });
      
      container.addBehavior(newDragBehavior);
      container._dragBehavior = newDragBehavior;
    }
  });
  
  console.log(`✅ Updated ${allParts.length} drag behaviors`);
}

// 🏠 MANUAL CONNECTION - User triggers with 'C' key
window.manualConnectSelected = function() {
  if (!selected) {
    showMessage("⚠️ No part selected! Select a part first, then press 'C' to connect.");
    return;
  }
  
  if (!selected.metadata || !selected.metadata.baseName || !selected.metadata.baseName.startsWith('part_')) {
    showMessage("⚠️ Selected item is not a house part");
    return;
  }
  
  console.log(`🔗 Attempting manual connection for: ${selected.metadata.baseName}`);
  
  let nearestPart = null;
  let nearestDistance = Infinity;
  const MAX_CONNECT_DISTANCE = 10.0;
  
  window.allParts.forEach(part => {
    if (part === selected) return;
    if (!part.metadata || !part.metadata.baseName || !part.metadata.baseName.startsWith('part_')) return;
    
    const distance = BABYLON.Vector3.Distance(selected.position, part.position);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestPart = part;
    }
  });
  
  if (!nearestPart) {
    showMessage("❌ No nearby house parts found to connect to");
    return;
  }
  
  if (nearestDistance > MAX_CONNECT_DISTANCE) {
    showMessage(`❌ Nearest part is too far away (${nearestDistance.toFixed(1)} units). Move closer and try again.`);
    return;
  }
  
  if (window.houseGroupManager && window.houseGroupManager.isConnected(selected)) {
    const connInfo = window.houseGroupManager.getConnectionInfo(selected);
    if (connInfo.hasParent) {
      showMessage(`⚠️ Already connected to ${connInfo.parentId}. Press 'X' to disconnect first.`);
      return;
    }
  }
  
  if (window.houseGroupManager) {
    const success = window.houseGroupManager.createConnection(selected, nearestPart, null);
    
    if (success) {
      showMessage(`✅ Connected ${selected.metadata.baseName} to ${nearestPart.metadata.baseName}`);
      // ✅ GREEN CONNECTION EFFECT REMOVED - No visual feedback
      // showConnectionEffect(selected.position);
      
      if (selected.getChildMeshes) {
        selected.getChildMeshes().forEach(mesh => {
          if (mesh.material) {
            const originalColor = mesh.material.emissiveColor ? mesh.material.emissiveColor.clone() : new BABYLON.Color3(0, 0, 0);
            mesh.material.emissiveColor = new BABYLON.Color3(0, 1, 0);
            
            setTimeout(() => {
              mesh.material.emissiveColor = originalColor;
            }, 500);
          }
        });
      }
    } else {
      showMessage("❌ Connection failed");
    }
  } else {
    showMessage("❌ House group manager not available");
  }
};

// 🏠 ENHANCED: Erase All
// Note: Header button functions (eraseAll, deleteSelected, disconnectSelected, disconnectAll)
// are now in header-buttons.ts module. They are imported and exposed at the bottom of this file.
// Undo/redo remain here due to dependencies on local variables (undoStack, redoStack, allParts, etc.)


window.eraseAll = function() {
  if (!confirm('Are you sure you want to clear all components and wires?')) {
    return;
  }

  console.log('🗑️ Starting erase all...');

  // Stop collision system during erase
  if (collisionSystem) {
    try {
    collisionSystem.stop();
    collisionSystem.clear();
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
      console.warn('Error clearing house connection groups:', e);
    }
  }

  // ✅ Dispose all parts and their children properly
  const partsToDispose = [];
 
  // Collect all parts from allParts array
  if (window.allParts && Array.isArray(window.allParts)) {
    window.allParts.forEach(part => {
      if (part && part !== window.simulatorGround) {
        partsToDispose.push(part);
      }
    });
  }
 
  // Also check loadedParts
  if (window.loadedParts && Array.isArray(window.loadedParts)) {
    window.loadedParts.forEach(part => {
      if (part && part !== window.simulatorGround && !partsToDispose.includes(part)) {
        partsToDispose.push(part);
      }
    });
  }

  // ✅ Dispose each part with all its children, materials, and labels
  partsToDispose.forEach(part => {
    try {
      // Dispose all child meshes (including terminals and labels)
      const children = part.getChildMeshes(true); // Get all descendants
      children.forEach(child => {
        try {
          // Dispose GUI labels if they exist
          if (child.metadata && child.metadata.label) {
            try {
              if (child.metadata.labelTexture && child.metadata.labelTexture.removeControl) {
                child.metadata.labelTexture.removeControl(child.metadata.label);
              }
              if (child.metadata.label.dispose) {
                child.metadata.label.dispose();
              }
            } catch(e) {
              console.warn('Error disposing label:', e);
            }
          }
         
          // Dispose materials
          if (child.material) {
            try {
              child.material.dispose();
            } catch(e) {}
          }
         
          // Dispose action managers
          if (child.actionManager) {
            try {
              child.actionManager.dispose();
            } catch(e) {}
          }
         
          // Dispose the mesh
          child.dispose(true, true);
        } catch(e) {
          console.warn('Error disposing child:', e);
        }
      });
     
      // Dispose drag behavior if exists
      if (part._dragBehavior) {
        try {
          part._dragBehavior.detach();
        } catch(e) {}
      }
     
      // Dispose part materials
      if (part.material) {
        try {
          part.material.dispose();
        } catch(e) {}
      }
     
      // Dispose part action manager
      if (part.actionManager) {
        try {
          part.actionManager.dispose();
        } catch(e) {}
      }
     
      // Finally dispose the part itself
      part.dispose(true, true);
    } catch (error) {
      console.error('❌ Error disposing component:', error);
      }
    });

  // ✅ Clear arrays - ensure both are synchronized
  if (window.allParts) {
    window.allParts.length = 0;
  }
  if (window.loadedParts) {
    window.loadedParts.length = 0;
  }
  if (window.componentRegistry) {
    window.componentRegistry.clear();
  }
  // Also clear local allParts array
  if (allParts && Array.isArray(allParts)) {
    allParts.length = 0;
  }

  // ✅ Clear all remaining meshes except ground, cameras, and lights
  if (scene) {
    const meshes = scene.meshes.slice();
    for (let i = meshes.length - 1; i >= 0; i--) {
      const mesh = meshes[i];
      if (!mesh) continue;
     
      const name = typeof mesh.name === 'string' ? mesh.name : '';
     
      // Preserve essential scene elements
      if (mesh === window.simulatorGround ||
          name === 'ground' ||
          name.includes('camera') ||
          name.includes('light') ||
          name.includes('__root__') ||
          mesh instanceof BABYLON.Camera ||
          mesh instanceof BABYLON.Light) {
        continue;
      }
     
      // Skip if already disposed
      if (!mesh.getScene) {
        continue;
      }
     
      try {
        // Dispose GUI labels
        if (mesh.metadata && mesh.metadata.label) {
          try {
            if (mesh.metadata.labelTexture && mesh.metadata.labelTexture.removeControl) {
              mesh.metadata.labelTexture.removeControl(mesh.metadata.label);
            }
            if (mesh.metadata.label.dispose) {
              mesh.metadata.label.dispose();
            }
          } catch(e) {}
        }
       
        // Dispose materials
        if (mesh.material) {
          try {
            mesh.material.dispose();
          } catch(e) {}
        }
       
        // Dispose action managers
        if (mesh.actionManager) {
          try {
            mesh.actionManager.dispose();
          } catch(e) {}
        }
       
        // ✅ Dispose component labels
        const childMeshes = mesh.getChildMeshes();
        childMeshes.forEach(child => {
          if (child.metadata && child.metadata.isComponentLabel) {
            try {
              child.dispose();
            } catch(e) {
              console.warn('Error disposing component label:', e);
            }
          }
        });
       
        // Dispose the mesh
        mesh.dispose(true, true);
      } catch (error) {
        console.warn('Error disposing mesh:', name, error);
      }
    }
  }

  // ✅ Clear selection
  selected = null;
  selectedComponents = [];
  window.selected = null;
  window.selectedComponents = [];
  multiSelectMode = false;
  window.multiSelectMode = false;
 
  // ✅ Hide component properties panel
  if (typeof window.hideComponentProperties === 'function') {
    window.hideComponentProperties();
  }
  clearSelectionHighlight();

  // Restart collision system
  if (collisionSystem) {
    try {
    collisionSystem.start();
    } catch(e) {
      console.warn('Error restarting collision system:', e);
    }
  }

  // ✅ Update UI - ensure count is synchronized
  // Force update component count immediately
  updateComponentCount();
  // Also call global updateComponentCount if it exists
  if (typeof window.updateComponentCount === 'function') {
    window.updateComponentCount();
  }
  if (typeof updateSelectionIndicator === 'function') {
    updateSelectionIndicator();
  }
 
  // Show success message
  if (typeof showMessage === 'function') {
    showMessage('✅ All components and wires cleared');
  }
 
  console.log('✅ All components erased successfully');
};



// Undo/Redo System
function undo() {
  // Get timestamps of most recent operations
  let wireUndoTime = 0;
  let componentUndoTime = 0;
  
  // Check wire undo stack for most recent operation
  if (window._wiringUndoStack && window._wiringUndoStack.length > 0) {
    const lastWireOp = window._wiringUndoStack[window._wiringUndoStack.length - 1];
    wireUndoTime = lastWireOp.timestamp || 0;
  }
  
  // Find the most recently added component (highest timestamp)
  if (allParts.length > 0) {
    let mostRecentComponent = null;
    let mostRecentTime = 0;
    for (let i = 0; i < allParts.length; i++) {
      const comp = allParts[i];
      const compTime = comp._addTimestamp || 0;
      if (compTime > mostRecentTime) {
        mostRecentTime = compTime;
        mostRecentComponent = comp;
      }
    }
    componentUndoTime = mostRecentTime;
  }
  
  // Determine which operation is more recent
  const hasWireOps = wireUndoTime > 0 && typeof window.undoWireOperation === 'function';
  const hasComponentOps = allParts.length > 0 && componentUndoTime > 0;
  
  if (!hasWireOps && !hasComponentOps) {
    // No operations to undo
    return;
  }
  
  // Undo the most recent operation (wire or component)
  if (hasWireOps && (!hasComponentOps || wireUndoTime >= componentUndoTime)) {
    // Wire operation is more recent or component has no operations
    window.undoWireOperation();
  } else if (hasComponentOps) {
    // Component operation is more recent or wire has no operations
    // Find and remove the most recently added component
    let mostRecentIndex = -1;
    let mostRecentTime = 0;
    for (let i = 0; i < allParts.length; i++) {
      const compTime = allParts[i]._addTimestamp || 0;
      if (compTime > mostRecentTime) {
        mostRecentTime = compTime;
        mostRecentIndex = i;
      }
    }
    
    if (mostRecentIndex >= 0) {
      const mesh = allParts.splice(mostRecentIndex, 1)[0];
      undoStack.push({
        mesh: mesh,
        position: mesh.position.clone(),
        rotation: mesh.rotation.clone(),
        timestamp: mesh._addTimestamp || Date.now() // Store timestamp for redo
      });
      
      mesh.setEnabled(false);
      
      // Unregister from collision system
      if (collisionSystem) {
        collisionSystem.unregisterPart(mesh);
      }
      
      updateComponentCount();
      
      if (selected === mesh) {
        selected = null;
        window.selected = null;
        updateSelectionIndicator();
      }
      
      // Update last component operation time (find next most recent)
      lastComponentOperationTime = 0;
      for (let i = 0; i < allParts.length; i++) {
        const compTime = allParts[i]._addTimestamp || 0;
        if (compTime > lastComponentOperationTime) {
          lastComponentOperationTime = compTime;
        }
      }
    }
  }
}

function redo() {
  // Get timestamps of most recent redo operations
  let wireRedoTime = 0;
  let componentRedoTime = 0;
  
  // Check wire redo stack for most recent operation
  if (window._wiringRedoStack && window._wiringRedoStack.length > 0) {
    const lastWireRedo = window._wiringRedoStack[window._wiringRedoStack.length - 1];
    wireRedoTime = lastWireRedo.timestamp || lastWireRedo.connections?.[0]?.timestamp || 0;
  }
  
  // Check component redo stack for most recent operation
  if (undoStack.length > 0) {
    // Find the component that was most recently undone (highest timestamp in undoStack)
    for (let i = 0; i < undoStack.length; i++) {
      const item = undoStack[i];
      const itemTime = item.timestamp || 0;
      if (itemTime > componentRedoTime) {
        componentRedoTime = itemTime;
      }
    }
  }
  
  // Determine which operation is more recent
  const hasWireRedo = wireRedoTime > 0 && typeof window.redoWireOperation === 'function';
  const hasComponentRedo = undoStack.length > 0 && componentRedoTime > 0;
  
  if (!hasWireRedo && !hasComponentRedo) {
    // No operations to redo
    return;
  }
  
  // Redo the most recent operation (wire or component)
  if (hasWireRedo && (!hasComponentRedo || wireRedoTime >= componentRedoTime)) {
    // Wire operation is more recent or component has no operations
    window.redoWireOperation();
  } else if (hasComponentRedo) {
    // Component operation is more recent or wire has no operations
    // Find and redo the most recently undone component
    let mostRecentIndex = -1;
    let mostRecentTime = 0;
    for (let i = 0; i < undoStack.length; i++) {
      const itemTime = undoStack[i].timestamp || 0;
      if (itemTime > mostRecentTime) {
        mostRecentTime = itemTime;
        mostRecentIndex = i;
      }
    }
    
    if (mostRecentIndex >= 0) {
      const item = undoStack.splice(mostRecentIndex, 1)[0];
      item.mesh.position = item.position;
      item.mesh.rotation = item.rotation;
      item.mesh.setEnabled(true);
      allParts.push(item.mesh);
      
      // Re-register with collision system
      if (collisionSystem) {
        collisionSystem.registerPart(item.mesh);
      }
      
      updateComponentCount();
      
      // Update last component operation time
      lastComponentOperationTime = item.timestamp || Date.now();
    }
  }
}

//----------------------------------------redundant code------------------------------------------------
// Disconnect selected component
function disconnectSelected() {
  if (!selected) {
    showMessage("No component selected");
    return;
  }

  // Use new connection system if available
  if (window.houseConnectionSystem && window.houseConnectionSystem.isConnected(selected)) {
    window.houseConnectionSystem.disconnectPart(selected);
    showMessage("House part disconnected from assembly");
    showDisconnectionEffect(selected.position);
    return;
  }
  // Fallback to old system
  else if (window.houseGroupManager && window.houseGroupManager.isConnected(selected)) {
    window.houseGroupManager.breakConnection(selected);
    showMessage("House part disconnected from assembly");
    showDisconnectionEffect(selected.position);
    return;
  }

  if (selected.parent && selected.parent !== scene) {
    const worldPosition = selected.getAbsolutePosition().clone();
    selected.setParent(null);
    selected.position = worldPosition;
    
    showMessage("Component disconnected");
    showDisconnectionEffect(selected.position);
  } else {
    showMessage("Component is not connected to anything");
  }
}

// Disconnect all connected parts
function disconnectAll() {
  let disconnectedCount = 0;

  // Use new connection system if available
  if (window.houseConnectionSystem) {
    disconnectedCount = window.houseConnectionSystem.disconnectAll();
  }
  
  // Also handle old system if it exists
  if (window.houseGroupManager) {
    // Get all connected parts from old system
    const allParts = window.allParts || [];
    allParts.forEach(part => {
      if (window.houseGroupManager.isConnected(part)) {
        window.houseGroupManager.breakConnection(part);
        disconnectedCount++;
      }
    });
  }

  // Also disconnect any parent-child relationships
  const allParts = window.allParts || [];
  allParts.forEach(part => {
    if (part.parent && part.parent !== scene) {
      const worldPosition = part.getAbsolutePosition().clone();
      part.setParent(null);
      part.position = worldPosition;
      disconnectedCount++;
    }
  });

  if (disconnectedCount > 0) {
    showMessage(`✅ Disconnected ${disconnectedCount} part(s) from all connections`);
  } else {
    showMessage("ℹ️ No connected parts found");
  }
}

//----------------------------------------redundant code------------------------------------------------

// Delete selected component
function deleteSelected() {
  
  if (!selected) {
    showMessage("No component selected");
    return;
  }

  const componentName = selected.metadata?.baseName || selected.metadata?.fileName || selected.name;
  if (confirm(`Delete ${componentName}?`)) {
    const index = allParts.indexOf(selected);
    if (index > -1) {
      // Break house connections (NEW connection system)
      if (window.houseConnectionSystem && window.houseConnectionSystem.isConnected(selected)) {
        try {
          window.houseConnectionSystem.disconnectPart(selected);
        } catch(e) {
          console.warn('Error breaking house connection (new system):', e);
        }
      }
      // Fallback to old system
      else if (window.houseGroupManager && window.houseGroupManager.isConnected) {
        try {
        window.houseGroupManager.breakConnection(selected);
        } catch(e) {
          console.warn('Error breaking house connection:', e);
        }
      }
     
      // Unregister from collision system
      if (collisionSystem && collisionSystem.unregisterPart) {
        try {
        collisionSystem.unregisterPart(selected);
        } catch(e) {
          console.warn('Error unregistering from collision system:', e);
        }
      }
     
    //-----------------------------------------------------------need to fix---------------------------

      if (window.componentRegistry) {
        try {
          // 1. Get the ID the registry uses to track this part
          const compId = selected.metadata?.componentId || window.componentRegistry.generateComponentId(selected);
          console.log(`🧠 Unregistering ${componentName} with ID: ${compId}`, selected.metadata);
          // 2. Remove it from the "Brain" so the CPU stops talking to it
          if (compId) {
             window.componentRegistry.unregisterComponent(compId);
             console.log(`🧠 Unregistered ${componentName} from logic registry`);
          }
        } catch (e) {
          console.warn('Error unregistering from component registry:', e);
        }
      }
     
      // ✅ ENHANCEMENT: Delete wires connected to this component (improved)
      if (window.scene) {
        // Find and delete wires connected to this component's terminals
        const componentTerminals = selected.getChildMeshes(true).filter(m =>
          m.metadata && m.metadata.isTerminal
        );
       
        // Also check component itself if it has terminal metadata
        if (selected.metadata && selected.metadata.isTerminal) {
          componentTerminals.push(selected);
        }
       
        if (window.wireLines && Array.isArray(window.wireLines)) {
          const wiresToDelete = [];
          const componentTerminalIds = componentTerminals.map(t => t.metadata?.terminalId).filter(Boolean);
         
          window.wireLines.forEach(wire => {
            const wireMeta = wire.metadata || {};
            const fromTerm = wireMeta.fromTerminal;
            const toTerm = wireMeta.toTerminal;
            const fromId = wireMeta.fromTerminalId;
            const toId = wireMeta.toTerminalId;
           
            // Check by terminal reference
            const connectedByReference = (fromTerm && fromTerm.parent === selected) ||
                                         (toTerm && toTerm.parent === selected) ||
                                         componentTerminals.includes(fromTerm) ||
                                         componentTerminals.includes(toTerm);
           
            // Check by terminal ID
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
           
            // Update terminal states after wire deletion
            if (typeof window.updateTerminalConnectionStates === 'function') {
              setTimeout(() => window.updateTerminalConnectionStates(), 100);
            }
          }
        }
      }
     
      // Show deletion effect
      if (typeof showDeletionEffect === 'function') {
      showDeletionEffect(selected.position);
      }
     
      // Dispose child meshes first
      const children = selected.getChildMeshes();
      children.forEach(child => {
        try {
          if (child.material) child.material.dispose();
          if (child.actionManager) child.actionManager.dispose();
          child.dispose();
        } catch(e) {
          console.warn('Error disposing child mesh:', e);
        }
      });
     
      // Remove from arrays
      allParts.splice(index, 1);
      if (window.allParts && window.allParts !== allParts) {
        const globalIndex = window.allParts.indexOf(selected);
        if (globalIndex > -1) {
          window.allParts.splice(globalIndex, 1);
        }
      }
      if (window.loadedParts && Array.isArray(window.loadedParts)) {
        const loadedIndex = window.loadedParts.indexOf(selected);
        if (loadedIndex > -1) {
          window.loadedParts.splice(loadedIndex, 1);
        }
      }
     
      // Dispose the component
      try {
        // ✅ Dispose component label if it exists
        const labelMesh = selected.getChildMeshes().find(m => m.metadata && m.metadata.isComponentLabel);
        if (labelMesh) {
          labelMesh.dispose();
        }
       
        if (selected.material) selected.material.dispose();
        if (selected.actionManager) selected.actionManager.dispose();
        selected.dispose(true, true);
      } catch(e) {
        console.warn('Error disposing component:', e);
      }
     
      // Clear selection
      selected = null;
      window.selected = null;
     
      // ✅ Hide component properties panel
      if (typeof window.hideComponentProperties === 'function') {
        window.hideComponentProperties();
      }
     
      // ✅ Update UI - ensure count is synchronized
      // Force update component count immediately
      updateComponentCount();
      // Also call global updateComponentCount if it exists
      if (typeof window.updateComponentCount === 'function') {
        window.updateComponentCount();
      }
      if (typeof updateSelectionIndicator === 'function') {
      updateSelectionIndicator();
      }
     
      showMessage(`✅ ${componentName} deleted`);
    }
  }
}

// Enhanced Selection System with Multi-Select Mode (select component function here)
export function setupPointerSelection(scene) {
  scene.onPointerObservable.add((pointerInfo) => {
    if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
      const picked = pointerInfo.pickInfo.pickedMesh;
      const hit = pointerInfo.pickInfo.hit;

      // Helper function to deselect everything
      const deselectAll = () => {
        clearSelectionHighlight();
        selected = null;
        selectedComponents = [];
        window.selected = null;
        window.selectedComponents = [];
        
        // Also deselect any selected wires
        if (typeof window.clearWireSelection === 'function') {
          window.clearWireSelection();
        }
        
        updateSelectionIndicator();
        
        // Hide component properties panel
        if (typeof window.hideComponentProperties === 'function') {
          window.hideComponentProperties();
        }
        
        // Clear snap preview
        if (collisionSystem) {
          collisionSystem.clearSnapPreview();
        }
      };

      // If nothing was picked (clicked on ground or empty space), deselect
      if (!hit || !picked) {
        deselectAll();
        return;
      }

      // ✅ DISABLED: Old wiring system - use wiring-controls.ts instead
      // The proper terminal-based wiring system is handled by wiring-controls.ts
      // which sets up its own pointer observers when wiring mode is enabled
      // This old handler was causing wires to be created to non-terminal meshes
      if (window.wiringMode) {
        // Let wiring-controls.ts handle all wiring interactions
        // Do not call handleWiringClick here as it bypasses terminal validation
        return;
      }

      // ✅ Handle wire clicks when NOT in wiring mode
      if (picked && picked.metadata && (picked.metadata.wireId || picked.metadata.isWire)) {
        const event = pointerInfo.event;
        
        // Right-click to delete wire
        if (event.button === 2) {
          const fromName = picked.metadata.fromTerminalName || 'Unknown';
          const toName = picked.metadata.toTerminalName || 'Unknown';
          const confirmMessage = `Delete wire connection?\n\nFrom: ${fromName}\nTo: ${toName}`;
          if (confirm(confirmMessage)) {
            if (typeof window.deleteWire === 'function') {
              window.deleteWire(picked);
            }
          }
          return;
        }
        
        // Left-click to select wire (with Ctrl for multi-select)
        if (event.button === 0) {
          if (event.ctrlKey || event.metaKey) {
            // Multi-select with Ctrl+Click
            const isSelected = window.selectedWires?.indexOf(picked) > -1;
            if (typeof window.selectWire === 'function') {
              window.selectWire(picked, !isSelected);
            }
          } else {
            // Single select
            window.selectedWire = picked;
            const fromName = picked.metadata.fromTerminalName || 'Unknown';
            const toName = picked.metadata.toTerminalName || 'Unknown';
            
            // Show wire properties panel
            const wirePropsPanel = document.getElementById('wirePropertiesPanel');
            if (wirePropsPanel) {
              wirePropsPanel.style.display = 'block';
            }
            
            // Update wire properties UI if function exists
            if (typeof window.updateWirePropertiesUI === 'function') {
              window.updateWirePropertiesUI(picked);
            }
            
            // Select wire
            if (typeof window.selectWire === 'function') {
              window.selectWire(picked, false);
            }
            
            // Show message
            if (typeof showMessage === 'function') {
              showMessage(`Wire selected: ${fromName} → ${toName}. Change color/thickness below, then click Apply.`);
            }
            
            // Deselect any selected components
            deselectAll();
          }
          return;
        }
        
        // If it's a wire click but not handled above, return to prevent component selection
        return;
      }

      // ✅ Multi-select mode: add/remove from selection
      if (multiSelectMode) {
        // Check if ground was clicked - deselect everything
        if (picked && (picked.name === "ground" || picked.metadata?.isGround)) {
          deselectAll();
          return;
        }
        
        if (picked && picked.name !== "ground" && !picked.metadata?.isGround) {
          // Skip terminals - they should not trigger component selection
          if (picked.metadata?.isTerminal && !picked.metadata?.isBatteryTerminal) {
            return;
          }
          
          let target = picked;
          
          // Enhanced selection logic for battery components
          if (picked.metadata?.isBatteryTerminal || picked.metadata?.componentType === 'battery') {
            let current = picked;
            while (current.parent && !(current.parent instanceof BABYLON.Scene)) {
              if (current.metadata?.componentType === 'battery' || 
                  current.metadata?.partType === 'battery' ||
                  (current.parent instanceof BABYLON.TransformNode && current.parent.name.startsWith("container_"))) {
                if (current.parent instanceof BABYLON.TransformNode && current.parent.name.startsWith("container_")) {
                  target = current.parent;
                  break;
                } else if (current.metadata?.componentType === 'battery' || current.metadata?.partType === 'battery') {
                  let batteryComponent = current;
                  while (batteryComponent.parent && !(batteryComponent.parent instanceof BABYLON.Scene)) {
                    if (batteryComponent.parent instanceof BABYLON.TransformNode && batteryComponent.parent.name.startsWith("container_")) {
                      target = batteryComponent.parent;
                      break;
                    }
                    batteryComponent = batteryComponent.parent;
                  }
                  if (target !== picked) break;
                }
              }
              current = current.parent;
            }
          }
          
          while (target.parent && !(target.parent instanceof BABYLON.Scene)) {
            if (target.parent instanceof BABYLON.TransformNode && target.parent.name.startsWith("container_")) {
              target = target.parent;
              break;
            }
            target = target.parent;
          }

          const index = selectedComponents.indexOf(target);
          if (index > -1) {
            // Deselect
            selectedComponents.splice(index, 1);
            clearSelectionHighlight(target);
            console.log("🔘 Deselected:", target.name);
          } else {
            // Add to selection
            selectedComponents.push(target);
            highlightSelection(target);
            console.log("✅ Added to selection:", target.name);
          }
          
          selected = selectedComponents.length > 0 ? selectedComponents[selectedComponents.length - 1] : null;
          window.selected = selected;
          window.selectedComponents = selectedComponents;
          updateSelectionIndicator();
        }
        return;
      }

      // Normal single selection mode
      // Check if ground was clicked - deselect everything
      if (picked && (picked.name === "ground" || picked.metadata?.isGround)) {
        deselectAll();
      } else if (picked && picked.name !== "ground" && !picked.metadata?.isGround) {
        // Clear previous selection before selecting new object
        clearSelectionHighlight();
        
        console.log("🎯 Picked mesh:", picked.name);
        
        let target = picked;
        
        // Enhanced selection logic: ensure all components are selectable from any side
        // Skip terminals - they should not trigger component selection (handled by wiring system)
        // Exception: battery terminals should allow component selection (like Arduino pins)
        if (picked.metadata?.isTerminal && !picked.metadata?.isBatteryTerminal && !picked.metadata?.isArduinoPin) {
          // Terminals are handled by wiring system, skip component selection
          return;
        }
        
        // Standard container finding logic for all components (works for Arduino, battery, and others)
        // This simple approach works because all components follow the same container pattern
        while (target.parent && !(target.parent instanceof BABYLON.Scene)) {
          if (target.parent instanceof BABYLON.TransformNode && target.parent.name.startsWith("container_")) {
            target = target.parent;
            break;
          }
          target = target.parent;
        }

        selected = target;
        selectedComponents = [target]; // Reset multi-select
        window.selected = selected;
        window.selectedComponents = selectedComponents;
        console.log("📦 Selected container:", selected.name);
        highlightSelection(selected);
        updateSelectionIndicator();
        
        // ✅ Show component properties panel
        if (typeof window.showComponentProperties === 'function') {
          window.showComponentProperties(selected);
        }
        
        // Use new connection system if available
        if (window.houseConnectionSystem && selected.metadata && selected.metadata.baseName && selected.metadata.baseName.startsWith('part_')) {
          const connInfo = window.houseConnectionSystem.getConnectionInfo(selected);
          if (connInfo) {
            if (connInfo.isConnected) {
              console.log(`🔗 Connected to ${connInfo.groupSize - 1} other part(s) (Group: ${connInfo.groupSize}/${connInfo.maxSize})`);
            } else {
              console.log(`⚪ Not connected. Press 'C' to connect.`);
            }
          }
        }
        // Fallback to old system
        else if (window.houseGroupManager && selected.metadata && selected.metadata.baseName && selected.metadata.baseName.startsWith('part_')) {
          const connInfo = window.houseGroupManager.getConnectionInfo(selected);
          if (connInfo) {
            if (connInfo.hasParent) {
              console.log(`🔗 Connected to: ${connInfo.parentId}`);
            } else {
              console.log(`⚪ Not connected. Press 'C' to connect.`);
            }
            if (connInfo.childrenCount > 0) {
              console.log(`👥 Has ${connInfo.childrenCount} children`);
            }
          }
        }
      } else {
        // Fallback: if picked is null or undefined, deselect
        deselectAll();
      }
    }
  });
}

// Enhanced picking for orthographic cameras
function enhancePickingForOrthographic(scene) {
  const originalPick = scene.pick.bind(scene);
  
  scene.pick = function(x, y, predicate, fastCheck, camera) {
    const cam = camera || scene.activeCamera;
    
    if (cam && cam.mode === BABYLON.Camera.ORTHOGRAPHIC_CAMERA) {
      const ray = cam.getForwardRay();
      
      if (ray) {
        const engine = scene.getEngine();
        const canvas = engine.getRenderingCanvas();
        
        if (canvas) {
          const canvasRect = canvas.getBoundingClientRect();
          const normalizedX = ((x - canvasRect.left) / canvasRect.width) * 2 - 1;
          const normalizedY = -((y - canvasRect.top) / canvasRect.height) * 2 + 1;
          
          const worldX = normalizedX * (cam.orthoRight - cam.orthoLeft) / 2;
          const worldY = normalizedY * (cam.orthoTop - cam.orthoBottom) / 2;
          
          const cameraMatrix = cam.getWorldMatrix();
          const rayOrigin = BABYLON.Vector3.TransformCoordinates(
            new BABYLON.Vector3(worldX, worldY, -1000),
            cameraMatrix
          );
          
          const adjustedRay = new BABYLON.Ray(rayOrigin, ray.direction);
          const hit = scene.pickWithRay(adjustedRay, predicate, fastCheck);
          
          if (hit && hit.hit) {
            return hit;
          }
        }
      }
      
      const hits = scene.multiPick(x, y, predicate, camera);
      if (hits && hits.length > 0) {
        const nonGroundHits = hits.filter(hit => hit.pickedMesh && hit.pickedMesh.name !== "ground");
        if (nonGroundHits.length > 0) {
          return nonGroundHits[0];
        }
        return hits[0];
      }
    }
    
    return originalPick(x, y, predicate, fastCheck, camera);
  };
}

// UI Helper Functions
function updateSelectionIndicator() {
  const indicator = document.getElementById("selectionIndicator");
  if (indicator) {
    // Show multi-select mode status
    if (multiSelectMode) {
      const count = selectedComponents.length;
      indicator.textContent = `Multi-Select Mode: ${count} selected (Press M to exit)`;
      indicator.style.background = "rgba(76, 175, 80, 0.95)";
      indicator.style.color = "white";
      return;
    }

    // Show multi-select count if multiple selected
    if (selectedComponents && selectedComponents.length > 1) {
      indicator.textContent = `Selected: ${selectedComponents.length} components (Press M for multi-select mode)`;
      indicator.style.background = "rgba(102, 126, 234, 0.95)";
      indicator.style.color = "white";
      return;
    }

    if (selected) {
      let text = `Selected: ${selected.metadata?.baseName || selected.name}`;
      
      // Use new connection system if available
      if (window.houseConnectionSystem && selected.metadata && selected.metadata.baseName && selected.metadata.baseName.startsWith('part_')) {
        const connInfo = window.houseConnectionSystem.getConnectionInfo(selected);
        if (connInfo) {
          if (connInfo.isConnected) {
            text += ` | 🔗 Connected (${connInfo.groupSize}/${connInfo.maxSize} parts)`;
          } else {
            text += ` | Press 'C' to connect`;
          }
        }
      }
      // Fallback to old system
      else if (window.houseGroupManager && selected.metadata && selected.metadata.baseName && selected.metadata.baseName.startsWith('part_')) {
        const connInfo = window.houseGroupManager.getConnectionInfo(selected);
        if (connInfo) {
          if (connInfo.hasParent) {
            text += ` | 🔗 Connected`;
          }
          if (connInfo.childrenCount > 0) {
            text += ` | 👥 ${connInfo.childrenCount} child(ren)`;
          }
          if (!connInfo.hasParent && connInfo.childrenCount === 0) {
            text += ` | Press 'C' to connect`;
          }
        }
      }
      
      indicator.textContent = text;
      indicator.style.background = "rgba(102, 126, 234, 0.95)";
      indicator.style.color = "white";
    } else {
      indicator.textContent = "No component selected (Press M for multi-select)";
      indicator.style.background = "rgba(255, 255, 255, 0.95)";
      indicator.style.color = "#2c3e50";
    }
  }
}

function updateComponentCount() {
  const countEl = document.getElementById('componentCount');
  if (countEl) {
    // ✅ Use window.allParts as the primary source (most reliable)
    // Fallback to other arrays if window.allParts is not available
    let finalCount = 0;
    
    if (window.allParts && Array.isArray(window.allParts)) {
      finalCount = window.allParts.length;
    } else if (allParts && Array.isArray(allParts)) {
      finalCount = allParts.length;
    } else if (window.loadedParts && Array.isArray(window.loadedParts)) {
      finalCount = window.loadedParts.length;
  }
    
    countEl.textContent = `Components: ${finalCount}`;
    console.log(`📊 Component count updated: ${finalCount}`);
  }
}

function highlightSelection(mesh) {
  
  if (!mesh) return;
  mesh.getChildMeshes().forEach(childMesh => {
    if (childMesh.material) {
      // Store original emissive color
      if (!childMesh._originalEmissiveColor) {
        childMesh._originalEmissiveColor = childMesh.material.emissiveColor.clone();
      }
      childMesh.material.emissiveColor = new BABYLON.Color3(0.3, 0.3, 1.0);
    }
  });
}

function clearSelectionHighlight(meshToClear = null) {
  // Clear specific mesh or all selected components
  const meshesToClear = meshToClear ? [meshToClear] : 
                       (selectedComponents.length > 0 ? selectedComponents : 
                       (selected ? [selected] : []));
  
  meshesToClear.forEach(mesh => {
    if (!mesh) return;
    mesh.getChildMeshes().forEach(childMesh => {
      if (childMesh.material) {
        // Restore original emissive color
        if (childMesh._originalEmissiveColor) {
          childMesh.material.emissiveColor = childMesh._originalEmissiveColor;
          childMesh._originalEmissiveColor = null;
        } else {
        childMesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
        }
      }
    });
    });
}

// Visual Effects
// ✅ GREEN CONNECTION EFFECT DISABLED - No visual feedback when connecting
function showConnectionEffect(position) {
  // Function disabled - no visual effects
  const sphere = BABYLON.MeshBuilder.CreateSphere("connectionEffect", {diameter: 0.5}, scene);
  sphere.position = position.clone();
  sphere.position.y += 1;
  
  const material = new BABYLON.StandardMaterial("connectionMat", scene);
  material.emissiveColor = new BABYLON.Color3(0, 1, 0);
  sphere.material = material;
  
  BABYLON.Animation.CreateAndStartAnimation("scaleUp", sphere, "scaling", 30, 15, 
    new BABYLON.Vector3(1, 1, 1), new BABYLON.Vector3(2, 2, 2), 0);
  
  setTimeout(() => {
    sphere.dispose();
  }, 500);
}

function showDisconnectionEffect(position) {
  const cylinder = BABYLON.MeshBuilder.CreateCylinder("disconnectEffect", {height: 2, diameter: 1}, scene);
  cylinder.position = position.clone();
  cylinder.position.y += 1;
  
  const material = new BABYLON.StandardMaterial("disconnectMat", scene);
  material.emissiveColor = new BABYLON.Color3(1, 1, 0);
  material.alpha = 0.8;
  cylinder.material = material;
  
  BABYLON.Animation.CreateAndStartAnimation("fadeOut", material, "alpha", 30, 20, 0.8, 0, 0);
  
  setTimeout(() => {
    cylinder.dispose();
  }, 600);
}

function showDeletionEffect(position) {
  const box = BABYLON.MeshBuilder.CreateBox("deleteEffect", {size: 2}, scene);
  box.position = position.clone();
  box.position.y += 1;
  
  const material = new BABYLON.StandardMaterial("deleteMat", scene);
  material.emissiveColor = new BABYLON.Color3(1, 0, 0);
  material.alpha = 0.8;
  box.material = material;
  
  BABYLON.Animation.CreateAndStartAnimation("shrink", box, "scaling", 30, 15, 
    new BABYLON.Vector3(1, 1, 1), new BABYLON.Vector3(0.1, 0.1, 0.1), 0);
  
  setTimeout(() => {
    box.dispose();
  }, 500);
}

function showMessage(text) {
  console.log(text);
  
  const indicator = document.getElementById("selectionIndicator");
  if (indicator) {
    indicator.textContent = text;
    indicator.style.background = "rgba(255, 193, 7, 0.95)";
    indicator.style.color = "black";
    
    setTimeout(() => {
      updateSelectionIndicator();
    }, 2000);
  }
}

// Export functions
window.setupPointerSelection = setupPointerSelection;
window.addDragBehavior = addDragBehavior;
// Use header buttons module functions instead of local ones
window.eraseAll = headerEraseAll;
window.undo = undo;
window.redo = redo;
window.disconnectSelected = headerDisconnectSelected;
window.disconnectAll = headerDisconnectAll;
window.deleteSelected = headerDeleteSelected;
window.selected = selected;
window.selectedComponents = selectedComponents;
window.multiSelectMode = multiSelectMode;
window.allParts = allParts;
// ✅ Expose updateComponentCount globally to ensure synchronization
window.updateComponentCount = updateComponentCount;

// ✅ Multi-select rotation function
window.rotateSelectedComponents = function(axis, angle) {
  if (!multiSelectMode || selectedComponents.length === 0) {
    if (selected) {
      selected.rotation[axis] += angle;
    }
    return;
  }
  
  // Calculate center point of all selected components
  let center = new BABYLON.Vector3(0, 0, 0);
  selectedComponents.forEach(comp => {
    center = center.add(comp.position);
  });
  center = center.scale(1 / selectedComponents.length);
  
  // Rotate each component around the center
  selectedComponents.forEach(comp => {
    const offset = comp.position.subtract(center);
    const rotationMatrix = BABYLON.Matrix.RotationAxis(
      axis === 'x' ? BABYLON.Vector3.Right() : 
      axis === 'y' ? BABYLON.Vector3.Up() : 
      BABYLON.Vector3.Forward(),
      angle
    );
    const rotatedOffset = BABYLON.Vector3.TransformCoordinates(offset, rotationMatrix);
    comp.position = center.add(rotatedOffset);
    comp.rotation[axis] += angle;
  });
  
  console.log(`🔄 Rotated ${selectedComponents.length} components around ${axis} axis`);
};

// ✅ Keyboard shortcuts are now handled in keyboard-shortcuts.ts module
// Import and initialize keyboard shortcuts
import { initializeKeyboardShortcuts } from './keyboard-shortcuts';


// Initialize
setTimeout(() => {
  if (scene) {
    enhancePickingForOrthographic(scene);
    console.log("✅ Enhanced picking for orthographic cameras initialized");
  }
  
  // Initialize keyboard shortcuts
  initializeKeyboardShortcuts();
}, 1000);

console.log("✅ Enhanced dragLogic.js with COLLISION DETECTION & AUTO-SNAP loaded");
console.log("   Ctrl+B: Show collision bounds | Ctrl+K: Toggle collision system");