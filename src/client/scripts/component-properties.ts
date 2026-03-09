// Component Properties Management
// Handles scale, rotate, position, and label editing for selected components
//@ts-nocheck

let currentSelectedComponent = null;
let originalComponentScale = { x: 1, y: 1, z: 1 }; // Store original scale for relative scaling

//need refactoring
// Purpose: Show component properties panel with current values
// Called from: When a component is selected
export function showComponentProperties(component) {

  //need to separate the logic
  console.log('🔍 Showing properties for component:', component);
  if (!component) {
    hideComponentProperties();
    return;
  }

  currentSelectedComponent = component;
  const panel = document.getElementById('componentPropertiesPanel');
  const content = document.getElementById('propertiesContent');
  const applyBtn = document.getElementById('applyPropertiesBtn');

  if (!panel || !content) {
    console.warn('Component properties panel not found');
    return;
  }

  // Get current values
  const position = component.position || { x: 0, y: 0, z: 0 };
  const rotation = component.rotation || { x: 0, y: 0, z: 0 };
  const scaling = component.scaling || { x: 1, y: 1, z: 1 };
  
  //posibly not used
  // Store original scale for relative scaling calculations
  originalComponentScale = {
    x: scaling.x,
    y: scaling.y,
    z: scaling.z
  };
  
  const componentName = component.metadata?.baseName || component.name || 'Unnamed Component';
  const displayName = component.metadata?.displayName || componentName;

  //need to separate this logic
  //need to separate styling becouse it take styles from too many places and it is hard to track where the styles come from
  // Populate properties panel
  content.innerHTML = `
    <!-- Component Label/Name -->
    <div style="margin-bottom: 16px;">
      <label style="display: block; font-size: 12px; margin-bottom: 6px; opacity: 0.9; font-weight: 500;">
        📝 Component Label
      </label>
      <input type="text" id="componentLabelInput" value="${displayName}" placeholder="Enter component name" style="
        width: 100%;
        padding: 8px;
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 6px;
        color: white;
        font-size: 13px;
        box-sizing: border-box;
      "/>
      <p style="opacity: 0.6; font-size: 11px; margin-top: 4px; margin-bottom: 0;">Original: ${componentName}</p>
    </div>

    <!-- Position Controls -->
    <div style="margin-bottom: 16px;">
      <label style="display: block; font-size: 12px; margin-bottom: 8px; opacity: 0.9; font-weight: 500;">
        📍 Position (X, Y, Z)
      </label>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
        <div>
          <label style="display: block; font-size: 10px; margin-bottom: 4px; opacity: 0.7;">X: <span id="positionXValue">${position.x.toFixed(2)}</span></label>
          <input type="range" id="positionX" value="${position.x}" min="-50" max="50" step="0.1" style="
            width: 100%;
            height: 6px;
            background: rgba(255,255,255,0.2);
            border-radius: 3px;
            outline: none;
            cursor: pointer;
          "/>
        </div>
        <div>
          <label style="display: block; font-size: 10px; margin-bottom: 4px; opacity: 0.7;">Y: <span id="positionYValue">${position.y.toFixed(2)}</span></label>
          <input type="range" id="positionY" value="${position.y}" min="0" max="50" step="0.1" style="
            width: 100%;
            height: 6px;
            background: rgba(255,255,255,0.2);
            border-radius: 3px;
            outline: none;
            cursor: pointer;
          "/>
        </div>
        <div>
          <label style="display: block; font-size: 10px; margin-bottom: 4px; opacity: 0.7;">Z: <span id="positionZValue">${position.z.toFixed(2)}</span></label>
          <input type="range" id="positionZ" value="${position.z}" min="-50" max="50" step="0.1" style="
            width: 100%;
            height: 6px;
            background: rgba(255,255,255,0.2);
            border-radius: 3px;
            outline: none;
            cursor: pointer;
          "/>
        </div>
      </div>
    </div>

    <!-- Rotation Controls -->
    <div style="margin-bottom: 16px;">
      <label style="display: block; font-size: 12px; margin-bottom: 8px; opacity: 0.9; font-weight: 500;">
        🔄 Rotation (X, Y, Z) - Degrees
      </label>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
        <div>
          <label style="display: block; font-size: 10px; margin-bottom: 4px; opacity: 0.7;">X (Pitch): <span id="rotationXValue">${(rotation.x * 180 / Math.PI).toFixed(1)}</span>°</label>
          <input type="range" id="rotationX" value="${(rotation.x * 180 / Math.PI)}" min="-180" max="180" step="1" style="
            width: 100%;
            height: 6px;
            background: rgba(255,255,255,0.2);
            border-radius: 3px;
            outline: none;
            cursor: pointer;
          "/>
        </div>
        <div>
          <label style="display: block; font-size: 10px; margin-bottom: 4px; opacity: 0.7;">Y (Yaw): <span id="rotationYValue">${(rotation.y * 180 / Math.PI).toFixed(1)}</span>°</label>
          <input type="range" id="rotationY" value="${(rotation.y * 180 / Math.PI)}" min="-180" max="180" step="1" style="
            width: 100%;
            height: 6px;
            background: rgba(255,255,255,0.2);
            border-radius: 3px;
            outline: none;
            cursor: pointer;
          "/>
        </div>
        <div>
          <label style="display: block; font-size: 10px; margin-bottom: 4px; opacity: 0.7;">Z (Roll): <span id="rotationZValue">${(rotation.z * 180 / Math.PI).toFixed(1)}</span>°</label>
          <input type="range" id="rotationZ" value="${(rotation.z * 180 / Math.PI)}" min="-180" max="180" step="1" style="
            width: 100%;
            height: 6px;
            background: rgba(255,255,255,0.2);
            border-radius: 3px;
            outline: none;
            cursor: pointer;
          "/>
        </div>
      </div>
      <button onclick="resetRotation()" style="
        width: 100%;
        margin-top: 8px;
        padding: 6px;
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 4px;
        color: white;
        cursor: pointer;
        font-size: 11px;
      ">Reset Rotation</button>
    </div>

    <!-- Unified Scale Control -->
    <div style="margin-bottom: 16px;">
      <label style="display: block; font-size: 12px; margin-bottom: 8px; opacity: 0.9; font-weight: 500;">
        📏 Scale - Unified Multiplier
      </label>
      <div style="margin-bottom: 8px;">
        <label style="display: block; font-size: 10px; margin-bottom: 4px; opacity: 0.7;">
          Scale: <span id="scaleUnifiedValue">${((scaling.x / originalComponentScale.x + scaling.y / originalComponentScale.y + scaling.z / originalComponentScale.z) / 3).toFixed(2)}</span>x
        </label>
        <input type="range" id="scaleUnified" value="${((scaling.x / originalComponentScale.x + scaling.y / originalComponentScale.y + scaling.z / originalComponentScale.z) / 3).toFixed(2)}" min="0.1" max="5" step="0.05" style="
          width: 100%;
          height: 6px;
          background: rgba(255,255,255,0.2);
          border-radius: 3px;
          outline: none;
          cursor: pointer;
        "/>
      </div>
      <div style="display: flex; gap: 8px; margin-top: 8px;">
        <button onclick="uniformScale(0.3)" style="
          flex: 1;
          padding: 6px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 4px;
          color: white;
          cursor: pointer;
          font-size: 11px;
        ">0.3x</button>
        <button onclick="uniformScale(0.5)" style="
          flex: 1;
          padding: 6px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 4px;
          color: white;
          cursor: pointer;
          font-size: 11px;
        ">0.5x</button>
        <button onclick="uniformScale(1.2)" style="
          flex: 1;
          padding: 6px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 4px;
          color: white;
          cursor: pointer;
          font-size: 11px;
        ">1.2x</button>
      </div>
    </div>
  `;

  // Show panel and apply button
  panel.style.display = 'flex'; // Use flexbox layout
  panel.style.flexDirection = 'column'; // Stack vertically
  if (applyBtn) {
    applyBtn.style.display = 'block';
  }
  
  // Ensure panel maintains fixed size - prevent expansion
  panel.style.width = '280px';
  panel.style.maxWidth = '280px';
  panel.style.minWidth = '280px';
  panel.style.height = '500px';
  panel.style.maxHeight = '500px';
  panel.style.minHeight = '50px';
  panel.style.overflow = 'hidden'; // Prevent content overflow
  panel.style.boxSizing = 'border-box';
  
  // ✅ Create label if displayName exists
  if (component.metadata?.displayName) {
    updateComponentLabel(component, component.metadata.displayName);
  }

  //everything here need rename
  // Add real-time update listener for unified scale slider
  const scaleUnifiedSlider = document.getElementById('scaleUnified');
  const scaleUnifiedValue = document.getElementById('scaleUnifiedValue');

  if (scaleUnifiedSlider && scaleUnifiedValue) {
    scaleUnifiedSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      scaleUnifiedValue.textContent = value.toFixed(2) + 'x';
      applyScaleInRealTime();
    });
  }

  // Add real-time update listeners for position sliders
  const positionXSlider = document.getElementById('positionX');
  const positionYSlider = document.getElementById('positionY');
  const positionZSlider = document.getElementById('positionZ');
  const positionXValue = document.getElementById('positionXValue');
  const positionYValue = document.getElementById('positionYValue');
  const positionZValue = document.getElementById('positionZValue');

  if (positionXSlider && positionXValue) {
    positionXSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      positionXValue.textContent = value.toFixed(2);
      applyPositionInRealTime();
    });
  }

  if (positionYSlider && positionYValue) {
    positionYSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      positionYValue.textContent = value.toFixed(2);
      applyPositionInRealTime();
    });
  }

  if (positionZSlider && positionZValue) {
    positionZSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      positionZValue.textContent = value.toFixed(2);
      applyPositionInRealTime();
    });
  }

  // Add real-time update listeners for rotation sliders
  const rotationXSlider = document.getElementById('rotationX');
  const rotationYSlider = document.getElementById('rotationY');
  const rotationZSlider = document.getElementById('rotationZ');
  const rotationXValue = document.getElementById('rotationXValue');
  const rotationYValue = document.getElementById('rotationYValue');
  const rotationZValue = document.getElementById('rotationZValue');

  if (rotationXSlider && rotationXValue) {
    rotationXSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      rotationXValue.textContent = value.toFixed(1) + '°';
      applyRotationInRealTime();
    });
  }

  if (rotationYSlider && rotationYValue) {
    rotationYSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      rotationYValue.textContent = value.toFixed(1) + '°';
      applyRotationInRealTime();
    });
  }

  if (rotationZSlider && rotationZValue) {
    rotationZSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      rotationZValue.textContent = value.toFixed(1) + '°';
      applyRotationInRealTime();
    });
  }

  //need to check if they need to kill after close the panel (check handling Garbage Collection)

  //need fix and refactor and be more specific
  // Add real-time update listeners for other inputs
  const inputs = content.querySelectorAll('input[type="text"]');
  inputs.forEach(input => {
    input.addEventListener('input', () => {
      // Optional: Live preview as user types
      // applyComponentProperties();
    });
  });
}

//need to rewrite in a way can handle close all listeners and not cause memory leak
// Purpose: Hide component properties panel
export function hideComponentProperties() {
  const panel = document.getElementById('componentPropertiesPanel');
  if (panel) {
    panel.style.display = 'none';
  }
  //need check if it is used
  currentSelectedComponent = null;
}

//need fix 
//need refactor
// Purpose: Apply component properties changes
export function applyComponentProperties() {
  if (!currentSelectedComponent) {
    console.warn('No component selected');
    return;
  }

  const component = currentSelectedComponent;
  
  // Get input values
  const labelInput = document.getElementById('componentLabelInput');
  const posX = document.getElementById('positionX');
  const posY = document.getElementById('positionY');
  const posZ = document.getElementById('positionZ');
  const rotX = document.getElementById('rotationX');
  const rotY = document.getElementById('rotationY');
  const rotZ = document.getElementById('rotationZ');
  const scaleUnified = document.getElementById('scaleUnified');

  if (!labelInput || !posX || !posY || !posZ || !rotX || !rotY || !rotZ || !scaleUnified) {
    console.error('Property inputs not found');
    return;
  }

  //need check
  //need refactor after editing metadata to be more specific
  // Apply label/name
  const newLabel = labelInput.value.trim();
  if (newLabel) {
    component.metadata = component.metadata || {};
    component.metadata.displayName = newLabel;
    // Update the component name if it's a simple name
    if (!component.metadata.baseName || component.metadata.baseName === component.name) {
      component.name = newLabel;
    }
    
    //mybe doesnt work
    // ✅ Create or update 3D label text
    updateComponentLabel(component, newLabel);
    
    console.log(`📝 Component label updated to: ${newLabel}`);
  }

  // Apply position
  const newPos = {
    x: parseFloat(posX.value) || 0,
    y: parseFloat(posY.value) || 0,
    z: parseFloat(posZ.value) || 0
  };
  

  //need to put this logic in central place to prevent code duplication
  // Ensure Y position is not below ground
  if (newPos.y < 0) {
    newPos.y = 0;
    posY.value = '0';
    const positionYValue = document.getElementById('positionYValue');
    if (positionYValue) positionYValue.textContent = '0.00';
  }
  
  //need fix
  component.position.x = newPos.x;
  component.position.y = newPos.y;
  component.position.z = newPos.z;
  console.log(`📍 Position updated: (${newPos.x.toFixed(2)}, ${newPos.y.toFixed(2)}, ${newPos.z.toFixed(2)})`);

  // Apply rotation (convert degrees to radians)
  const newRot = {
    x: (parseFloat(rotX.value) || 0) * Math.PI / 180,
    y: (parseFloat(rotY.value) || 0) * Math.PI / 180,
    z: (parseFloat(rotZ.value) || 0) * Math.PI / 180
  };
  component.rotation.x = newRot.x;
  component.rotation.y = newRot.y;
  component.rotation.z = newRot.z;
  console.log(`🔄 Rotation updated: (${(newRot.x * 180 / Math.PI).toFixed(1)}°, ${(newRot.y * 180 / Math.PI).toFixed(1)}°, ${(newRot.z * 180 / Math.PI).toFixed(1)}°)`);

  //need refactor
  // Apply unified scale - single multiplier applied to all axes
  const scaleMultiplier = Math.max(0.1, Math.min(5, parseFloat(scaleUnified.value) || 1));
  
  // Calculate actual scale by multiplying original scale with unified multiplier
  const newScale = {
    x: originalComponentScale.x * scaleMultiplier,
    y: originalComponentScale.y * scaleMultiplier,
    z: originalComponentScale.z * scaleMultiplier
  };
  
  // Apply scaling directly
  const BABYLON = window.BABYLON;
  if (component.scaling) {
    component.scaling.x = newScale.x;
    component.scaling.y = newScale.y;
    component.scaling.z = newScale.z;
  } else {
    component.scaling = new BABYLON.Vector3(newScale.x, newScale.y, newScale.z);
  }
  
  //before use component.getBoundingInfo() need to update position mesh and the box shape
  //need to write one logic and use it every time
  //need to check the logic for bounding box and updating it after every change to the component
  // Force update the mesh
  if (component.getBoundingInfo) {
    component.getBoundingInfo().update(component.getWorldMatrix());
  }
  
  console.log(`📏 Scale updated: (${newScale.x.toFixed(2)}, ${newScale.y.toFixed(2)}, ${newScale.z.toFixed(2)})`);

  //not exist here and posibly undefined in the project
  // Update selection indicator
  if (typeof updateSelectionIndicator === 'function') {
    updateSelectionIndicator();
  }

  // Refresh wires if component moved
  if (typeof window.refreshAllWires === 'function') {
    window.refreshAllWires();
  }

  //need rename
  // Show success message
  if (typeof window.showToast === 'function') {
    window.showToast('✅ Component properties updated', 'success', 2000);
  } else if (typeof showMessage === 'function') {
    showMessage('✅ Component properties updated');
  }
}

// Purpose: Reset rotation to zero
export function resetRotation() {
  const rotX = document.getElementById('rotationX');
  const rotY = document.getElementById('rotationY');
  const rotZ = document.getElementById('rotationZ');
  const rotXValue = document.getElementById('rotationXValue');
  const rotYValue = document.getElementById('rotationYValue');
  const rotZValue = document.getElementById('rotationZValue');
  
  if (rotX) {
    rotX.value = '0';
    if (rotXValue) rotXValue.textContent = '0.0°';
  }
  if (rotY) {
    rotY.value = '0';
    if (rotYValue) rotYValue.textContent = '0.0°';
  }
  if (rotZ) {
    rotZ.value = '0';
    if (rotZValue) rotZValue.textContent = '0.0°';
  }
  


  //check if it not needed and posibly need fix
  applyComponentProperties();
}


//need to use same function for buttons not this
// Purpose: Apply uniform scale (factor is a multiplier relative to original scale)
export function uniformScale(factor) {

  const scaleUnified = document.getElementById('scaleUnified');
  const scaleUnifiedValue = document.getElementById('scaleUnifiedValue');
  
  // Clamp factor to valid range (this is a multiplier, not absolute scale)
  const clampedFactor = Math.max(0.1, Math.min(5, factor));
  
  if (scaleUnified) {
    scaleUnified.value = clampedFactor;
    if (scaleUnifiedValue) scaleUnifiedValue.textContent = clampedFactor.toFixed(2) + 'x';
  }
  
  //check if it not needed and posibly need fix
  applyComponentProperties();
}

//need fix
// Purpose: Apply scale in real-time as slider moves (for live preview)
function applyScaleInRealTime() {
  if (!currentSelectedComponent) return;
  
  const component = currentSelectedComponent;
  const scaleUnified = document.getElementById('scaleUnified');
  
  if (!scaleUnified) return;
  
  // Get unified multiplier from slider
  const scaleMultiplier = Math.max(0.1, Math.min(5, parseFloat(scaleUnified.value) || 1));
  
  // Calculate actual scale by multiplying original scale with unified multiplier
  const newScale = {
    x: originalComponentScale.x * scaleMultiplier,
    y: originalComponentScale.y * scaleMultiplier,
    z: originalComponentScale.z * scaleMultiplier
  };
  
  //need to make just one babylon variable and use it every time and same for all other things
  // Apply scaling directly
  const BABYLON = window.BABYLON;
  if (component.scaling) {
    component.scaling.x = newScale.x;
    component.scaling.y = newScale.y;
    component.scaling.z = newScale.z;
  } else {
    component.scaling = new BABYLON.Vector3(newScale.x, newScale.y, newScale.z);
  }
  
  //need check
  // Force update
  if (component.getBoundingInfo) {
    component.getBoundingInfo().update(component.getWorldMatrix());
  }
}

// Purpose: Apply position in real-time as slider moves (for live preview)
function applyPositionInRealTime() {
  if (!currentSelectedComponent) return;
  
  const component = currentSelectedComponent;
  const posX = document.getElementById('positionX');
  const posY = document.getElementById('positionY');
  const posZ = document.getElementById('positionZ');
  
  if (!posX || !posY || !posZ) return;
  
  const newPos = {
    x: parseFloat(posX.value) || 0,
    y: Math.max(0, parseFloat(posY.value) || 0), // Ensure Y is not below ground
    z: parseFloat(posZ.value) || 0
  };
  
  component.position.x = newPos.x;
  component.position.y = newPos.y;
  component.position.z = newPos.z;
  
  // Refresh wires if component moved
  if (typeof window.refreshAllWires === 'function') {
    window.refreshAllWires();
  }
}

// Purpose: Apply rotation in real-time as slider moves (for live preview)
function applyRotationInRealTime() {
  if (!currentSelectedComponent) return;
  
  const component = currentSelectedComponent;
  const rotX = document.getElementById('rotationX');
  const rotY = document.getElementById('rotationY');
  const rotZ = document.getElementById('rotationZ');
  
  if (!rotX || !rotY || !rotZ) return;
  
  // Convert degrees to radians
  const newRot = {
    x: (parseFloat(rotX.value) || 0) * Math.PI / 180,
    y: (parseFloat(rotY.value) || 0) * Math.PI / 180,
    z: (parseFloat(rotZ.value) || 0) * Math.PI / 180
  };
  
  component.rotation.x = newRot.x;
  component.rotation.y = newRot.y;
  component.rotation.z = newRot.z;
  
  // Refresh wires if component rotated
  if (typeof window.refreshAllWires === 'function') {
    window.refreshAllWires();
  }
}

//need fix
// Purpose: Close properties panel
export function closePropertiesPanel() {
  hideComponentProperties();
}


//need check when call it and if it needed
//need refactor
// Purpose: Create or update 3D label text above component
function updateComponentLabel(component, labelText) {
  if (!component || !labelText || !window.scene) return;
  
  //need to make just one variable for scene and use it every time
  const scene = window.scene;
  
  // Remove existing label if it exists
  const existingLabel = component.getChildMeshes().find(m => m.metadata && m.metadata.isComponentLabel);
  if (existingLabel) {
    existingLabel.dispose();
  }
  
  // Create text plane using BABYLON.GUI
  if (typeof BABYLON !== 'undefined' && BABYLON.GUI) {
    try {
      // Create a dynamic texture for the label
      const texture = new BABYLON.DynamicTexture('label_' + component.name, { width: 256, height: 64 }, scene);
      const ctx = texture.getContext();
      
      // Draw text on canvas
      ctx.fillStyle = 'rgb(238, 255, 0)';
      ctx.fillRect(0, 0, 256, 64);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, 128, 32);
      texture.update();
      
      // Create plane mesh for label
      const labelPlane = BABYLON.MeshBuilder.CreatePlane('labelPlane_' + component.name, {
        width: 2,
        height: 0.5
      }, scene);
      
      const labelMaterial = new BABYLON.StandardMaterial('labelMat_' + component.name, scene);
      labelMaterial.diffuseTexture = texture;
      labelMaterial.emissiveTexture = texture;
      labelMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
      labelMaterial.disableLighting = true;
      labelPlane.material = labelMaterial;
      
      // Position label above component
      labelPlane.parent = component;
      labelPlane.position.y = 1.5; // Above component
      labelPlane.position.z = 0;
      labelPlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL; // Always face camera
      labelPlane.renderingGroupId = 3; // Render on top
      labelPlane.isPickable = false;
      
      // Store metadata
      labelPlane.metadata = {
        isComponentLabel: true,
        componentName: component.name
      };
      
      console.log(`✅ Created 3D label for component: ${labelText}`);
    } catch (error) {
      console.warn('Failed to create 3D label:', error);
    }
  }
}

// Expose functions globally
window.showComponentProperties = showComponentProperties;
window.hideComponentProperties = hideComponentProperties;
window.applyComponentProperties = applyComponentProperties;
window.resetRotation = resetRotation;
window.uniformScale = uniformScale;
window.closePropertiesPanel = closePropertiesPanel;

console.log('✅ Component properties management loaded');

