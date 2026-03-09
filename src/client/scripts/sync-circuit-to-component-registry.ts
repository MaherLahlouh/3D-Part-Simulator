//@ts-nocheck
/**
 * Scans the user's wires and updates the Registry 
 * so it knows which pin controls which component.
 */
export function syncCircuitToRegistry() {
  const wiringConnections = window.wiringConnections; 
  const scene = window.scene;

  console.log("🔍 Scanning circuit for connections...");

  wiringConnections.forEach(conn => {
    // 1. Find the 3D meshes for both ends of the wire
    const meshA = scene.getMeshById(conn.fromTerminalId);
    const meshB = scene.getMeshById(conn.toTerminalId);

    if (!meshA || !meshB) return;

    // 2. Figure out which one is the Arduino Pin and which is the Component Terminal
    const arduinoTerminal = [meshA, meshB].find(m => m.metadata?.partType === 'arduino');
    const componentTerminal = [meshA, meshB].find(m => m.metadata?.componentId && m.metadata?.partType !== 'arduino');

    if (arduinoTerminal && componentTerminal) {
      const pin = arduinoTerminal.metadata.arduinoPinNumber;
      const componentId = componentTerminal.metadata.componentId;

      // 3. Look up the component in your Registry
      const entry = window.componentRegistry.getComponent(componentId);
      
      if (entry) {
        // We save the pin number into the static 'data' object
        entry.data.arduinoPin = pin;
        console.log(`🔗 Success: ${componentId} is now linked to Pin ${pin}`);
      }
    }
  });
}