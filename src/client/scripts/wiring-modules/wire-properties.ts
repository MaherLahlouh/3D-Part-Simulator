// Wire Properties Management - Color and thickness
//@ts-nocheck

// Global wire properties for color and thickness
export const WIRE_PROPERTIES = {
  currentColor: '#FF6600', // Default orange
  currentThickness: 0.05,  // Default thickness
  minThickness: 0.02,
  maxThickness: 0.15
};

// Purpose: Set wire color for new wires
export function setWireColor(colorHex) {
  if (!colorHex) return;
  WIRE_PROPERTIES.currentColor = colorHex;
  window.WIRE_PROPERTIES = WIRE_PROPERTIES; // Sync with window
  console.log(`🎨 Wire color set to: ${colorHex}`);
}

// Purpose: Set wire thickness for new wires
export function setWireThickness(thickness) {
  if (typeof thickness !== 'number') return;
  const clampedThickness = Math.max(
    WIRE_PROPERTIES.minThickness,
    Math.min(WIRE_PROPERTIES.maxThickness, thickness)
  );
  WIRE_PROPERTIES.currentThickness = clampedThickness;
  window.WIRE_PROPERTIES = WIRE_PROPERTIES; // Sync with window
  console.log(`📏 Wire thickness set to: ${clampedThickness}`);
}

// Purpose: Update properties of an existing wire
export function updateWireProperties(wireMesh, colorHex, thickness, wiringConnections, getTerminalConnectionPoint, generateCurvePoints) {
  if (!wireMesh || !wireMesh.metadata) return false;
  
  try {
    const color = BABYLON.Color3.FromHexString(colorHex);
    
    // Update material color
    if (wireMesh.material) {
      wireMesh.material.diffuseColor = color;
      wireMesh.material.emissiveColor = color.scale(0.3);
    } else if (wireMesh.color) {
      wireMesh.color = color;
    }
    
    // Update wire geometry if thickness changed
    const oldRadius = wireMesh.metadata.wireThickness || 0.05;
    if (Math.abs(thickness - oldRadius) > 0.001) {
      // Thickness changed - need to recreate wire geometry
      const fromTerminal = wireMesh.metadata.fromTerminal;
      const toTerminal = wireMesh.metadata.toTerminal;
      
      if (fromTerminal && toTerminal) {
        const startPos = getTerminalConnectionPoint(fromTerminal);
        const endPos = getTerminalConnectionPoint(toTerminal);
        const newPoints = generateCurvePoints(startPos, endPos, { steps: 24 });

        try {
          // Recreate the tube with new thickness
          BABYLON.MeshBuilder.CreateTube(wireMesh.name, {
            path: newPoints,
            radius: thickness,
            tessellation: 12,
            instance: wireMesh,
            updatable: true
          }, window.scene);
          
          console.log(`✅ Wire thickness updated from ${oldRadius} to ${thickness}`);
        } catch (err) {
          console.warn('Failed to update wire thickness, trying lines fallback:', err);
          try {
            BABYLON.MeshBuilder.CreateLines(wireMesh.name, {
              points: newPoints,
              instance: wireMesh
            }, window.scene);
            if (wireMesh.color) wireMesh.color = color;
          } catch (err2) {
            console.error('Failed to update wire geometry:', err2);
          }
        }
      }
    }

    wireMesh.metadata.wireColor = colorHex;
    wireMesh.metadata.wireThickness = thickness;
    
    const conn = wiringConnections.find(c => c.wireId === wireMesh.metadata.wireId);
    if (conn) {
      conn.wireColor = colorHex;
      conn.wireThickness = thickness;
    }

    console.log(`⚡ Updated wire ${wireMesh.metadata.wireId}: color=${colorHex}, thickness=${thickness}`);
    return true;
  } catch (error) {
    console.error('❌ Wire update failed:', error);
    return false;
  }
}
