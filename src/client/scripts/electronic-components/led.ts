//@ts-nocheck
import { PinState } from 'avr8js';
import { componentRegistry } from '../wiring-modules/component-registry';

class LEDBlinkingManager {
  colors = {
    on: { diffuse: [1, 0.8, 0.6], emissive: [0.3, 0.3, 0.2] },
    off: { diffuse: [0.2, 0.1, 0], emissive: [0, 0, 0] }
  };

  normalizePinState(pinState) {
    if (pinState === null || pinState === undefined) return false;
    
    // Handle PinState enum from avr8js
    if (pinState === PinState.High) return true;
    if (pinState === PinState.Low) return false;
    
    // Default to LOW/false for any other value
    return false;
  }

  updateLEDColor(ledComponent, pinState) {
    if (!ledComponent?.getChildMeshes) return;
    const isOn = this.normalizePinState(pinState);
    const colors = isOn ? this.colors.on : this.colors.off;
    ledComponent.getChildMeshes()
      .filter(m => m.material && !m.metadata?.isTerminal)
      .forEach(m => {
        m.material.diffuseColor = new BABYLON.Color3(...colors.diffuse);
        m.material.emissiveColor = new BABYLON.Color3(...colors.emissive);
      });
    
    // Update component registry state
    const componentId = componentRegistry.generateComponentId(ledComponent);
    if (componentId) {
      componentRegistry.updateComponentState(componentId, { pinState, lastUpdate: Date.now() });
    }
  }

  initializeLEDTerminals(component, scene) {
    const terminals = [];
    const pins = [
      { name: 'anode', pos: { x: 0, y: -6, z: 0.1 }, color: [1, 0, 0] },
      { name: 'cathode', pos: { x: -3, y: -6, z: -0.1 }, color: [0, 0, 0] }
    ];
    pins.forEach(pin => {
      const terminal = BABYLON.MeshBuilder.CreateSphere(`terminal_${component.name}_${pin.name}`, { diameter: 1 }, scene);
      terminal.position = new BABYLON.Vector3(pin.pos.x, pin.pos.y, pin.pos.z);
      terminal.parent = component;
      terminal.visibility = 0.2;
      terminal.isPickable = true;
      // Flatten metadata: copy component metadata directly into terminal metadata
      const compMeta = component.metadata || {};
      terminal.metadata = {
        isTerminal: true,
        terminalId: `${component.uniqueId || component.name}_${pin.name}`,
        terminalName: pin.name,
        partType: 'led',
        componentId: component.uniqueId || component.name,
        componentName: component.name,
        // Copy relevant component metadata directly
        baseName: compMeta.baseName || compMeta.fileName || compMeta.originalFileName,
        fileName: compMeta.fileName,
        originalFileName: compMeta.originalFileName,
        componentType: compMeta.componentType || compMeta.type || 'led',
        hasPolarity: compMeta.hasPolarity !== undefined ? compMeta.hasPolarity : true,
        kit: compMeta.kit,
        loadedAt: compMeta.loadedAt,
        // Terminal-specific properties
        isLEDPin: true,
        polarity: pin.name === 'anode' ? 'positive' : 'negative'
      };
      terminal.material = new BABYLON.StandardMaterial(`mat_terminal_${pin.name}`, scene);
      terminal.material.diffuseColor = new BABYLON.Color3(...pin.color);
      terminals.push(terminal);
    });
    component.metadata.terminals = terminals;
    component.metadata.partType = 'led';
    
    // Register LED component in registry
    componentRegistry.registerComponent(component, { type: 'led' }, { pinState: PinState.Low });
    
    return terminals;
  }

  updateAllLEDs() {
    const leds = componentRegistry.getComponentsByType('led');
    leds.forEach(entry => {
      const state = componentRegistry.getComponentState(entry.id);
      if (state && state.hasOwnProperty('pinState')) {
        this.updateLEDColor(entry.mesh, state.pinState);
      }
    });
  }

  getLEDs() {
    return componentRegistry.getComponentsByType('led');
  }
}

export const ledBlinkingManager = new LEDBlinkingManager();
window.ledBlinkingManager = ledBlinkingManager;
window.updateLEDColor = (ledComponent, pinState) => ledBlinkingManager.updateLEDColor(ledComponent, pinState);
window.initializeLEDTerminals = (component, scene) => ledBlinkingManager.initializeLEDTerminals(component, scene);
window.updateAllLEDs = () => ledBlinkingManager.updateAllLEDs();
window.getLEDs = () => ledBlinkingManager.getLEDs();