//@ts-nocheck
import { componentRegistry } from '../wiring-modules/component-registry';

class GasSensorBehaviorManager {
  initializeGasSensorTerminals(component, scene) {
    const terminals = [];
    const pins = [
      { name: 'vcc', pos: { x: 0, y: -6, z: 0.1 }, color: [1, 0, 0] },
      { name: 'gnd', pos: { x: -2, y: -6, z: 0 }, color: [0, 0, 1] },
      { name: 'a0', pos: { x: -4, y: -6, z: -0.1 }, color: [1, 0.5, 1] },
      { name: 'd0', pos: { x: -6, y: -6, z: -0.2 }, color: [1, 0.5, 1] }
    ];
    
    pins.forEach(pin => {
      const terminal = BABYLON.MeshBuilder.CreateSphere(`terminal_${component.name}_${pin.name}`, { diameter: 0.3 }, scene);
      terminal.position = new BABYLON.Vector3(pin.pos.x, pin.pos.y, pin.pos.z);
      terminal.parent = component;
      // Terminals should only be visible when in wiring mode
      // Check current wiring mode state (default to false if not set)
      const isWiringMode = window.wiringMode || false;
      terminal.visibility = isWiringMode ? 0.2 : 0;
      terminal.isPickable = true;
      
      const compMeta = component.metadata || {};
      terminal.metadata = {
        isTerminal: true,
        terminalId: `${component.uniqueId || component.name}_${pin.name}`,
        terminalName: pin.name,
        partType: 'mq2',
        componentId: component.uniqueId || component.name,
        componentName: component.name,
        baseName: compMeta.baseName || compMeta.fileName || compMeta.originalFileName,
        fileName: compMeta.fileName,
        originalFileName: compMeta.originalFileName,
        componentType: compMeta.componentType || compMeta.type || 'mq2',
        kit: compMeta.kit,
        loadedAt: compMeta.loadedAt,
        isMQ2Pin: true,
        pinInfo: {
          type: pin.name === 'vcc' ? 'power' : pin.name === 'gnd' ? 'ground' : 'signal',
          voltage: pin.name === 'vcc' ? 5 : 0
        }
      };
      
      terminal.material = new BABYLON.StandardMaterial(`mat_terminal_${pin.name}`, scene);
      terminal.material.diffuseColor = new BABYLON.Color3(...pin.color);
      terminal.material.emissiveColor = new BABYLON.Color3(...pin.color.map(c => c * 0.3));
      terminals.push(terminal);
    });
    
    component.metadata.terminals = terminals;
    component.metadata.partType = 'mq2';
    
    componentRegistry.registerComponent(component, { type: 'mq2' }, { gasLevel: 0, active: false });
    
    return terminals;
  }

  updateGasSensorState(component, gasLevel, active) {
    const componentId = componentRegistry.generateComponentId(component);
    if (componentId) {
      componentRegistry.updateComponentState(componentId, { gasLevel, active, lastUpdate: Date.now() });
    }
  }

  updateAllGasSensors() {
    const sensors = componentRegistry.getComponentsByType('mq2');
    sensors.forEach(entry => {
      const state = componentRegistry.getComponentState(entry.id);
      if (state) {
        // Update logic can be added here if needed
      }
    });
  }

  getGasSensors() {
    return componentRegistry.getComponentsByType('mq2');
  }
}

export const gasSensorBehaviorManager = new GasSensorBehaviorManager();
window.gasSensorBehaviorManager = gasSensorBehaviorManager;
window.initializeGasSensorTerminals = (component, scene) => gasSensorBehaviorManager.initializeGasSensorTerminals(component, scene);
window.updateGasSensorState = (component, gasLevel, active) => gasSensorBehaviorManager.updateGasSensorState(component, gasLevel, active);
window.updateAllGasSensors = () => gasSensorBehaviorManager.updateAllGasSensors();
window.getGasSensors = () => gasSensorBehaviorManager.getGasSensors();
