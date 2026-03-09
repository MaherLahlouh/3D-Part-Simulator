//@ts-nocheck
import { componentRegistry } from './wiring-modules/component-registry';

/**
 * Buzzer Module Behavior Manager
 * Handles buzzer-specific logic and terminal initialization
 */
class BuzzerBehaviorManager {
  /**
   * Initialize Buzzer component with terminals
   */
  initializeBuzzerModuleTerminals(component, scene) {
    if (!component || !component.metadata || !scene) return [];

    // Set component type
    component.metadata.partType = 'buzzer';
    component.metadata.componentType = 'buzzer';

    // Buzzer pin names (3 pins: vcc, gnd, signal)
    const pinNames = ['vcc', 'gnd', 'signal'];
    const terminals = [];
    const positions = {
      'vcc': { x: 0, y: -6, z: 0.1 },
      'gnd': { x: -2, y: -6, z: 0 },
      'signal': { x: -4, y: -6, z: -0.1 }
    };

    pinNames.forEach((pinName) => {
      const pos = positions[pinName];
      const terminal = this.createTerminal(component, scene, pinName, pos, 0.3);
      terminal.metadata.partType = 'buzzer';
      terminal.metadata.isBuzzerPin = true;
      terminal.metadata.pinInfo = {
        type: pinName === 'vcc' ? 'power' : pinName === 'gnd' ? 'ground' : 'signal',
        voltage: pinName === 'vcc' ? 5 : 0
      };
      this.setTerminalMaterial(terminal, pinName, scene, pinName === 'vcc' ? 'power' : pinName === 'gnd' ? 'ground' : 'signal');
      terminals.push(terminal);
    });

    component.metadata.terminals = terminals;
    component.metadata.hasTerminals = true;

    // Register component in registry
    componentRegistry.registerComponent(component, { type: 'buzzer' }, {
      active: false,
      frequency: 0,
      volume: 0
    });

    console.log(`✅ Initialized ${terminals.length} Buzzer Module terminals`);
    return terminals;
  }

  /**
   * Create terminal mesh
   */
  createTerminal(component, scene, pinName, pos, diameter) {
    const terminal = BABYLON.MeshBuilder.CreateSphere(
      `terminal_${component.name}_${pinName}`,
      { diameter },
      scene
    );
    terminal.position = new BABYLON.Vector3(pos.x, pos.y, pos.z);
    terminal.parent = component;
    terminal.visibility = 0.2; // Always visible (semi-transparent), like LED terminals
    terminal.isPickable = true;
    terminal.enablePointerMoveEvents = true;
    terminal.renderingGroupId = 2;
    
    const compMeta = component.metadata || {};
    terminal.metadata = {
      isTerminal: true,
      terminalId: `${component.uniqueId || component.name}_${pinName}`,
      terminalName: pinName,
      componentId: component.uniqueId || component.name,
      componentName: component.name,
      baseName: compMeta.baseName || compMeta.fileName || compMeta.originalFileName,
      fileName: compMeta.fileName,
      originalFileName: compMeta.originalFileName,
      componentType: compMeta.componentType || compMeta.type,
      kit: compMeta.kit,
      loadedAt: compMeta.loadedAt
    };
    return terminal;
  }

  /**
   * Set terminal material based on pin type
   */
  setTerminalMaterial(terminal, pinName, scene, type) {
    const mat = new BABYLON.StandardMaterial(`mat_terminal_${pinName}`, scene);
    if (type === 'power') {
      mat.diffuseColor = new BABYLON.Color3(1, 0, 0);
      mat.emissiveColor = new BABYLON.Color3(0.5, 0, 0);
    } else if (type === 'ground') {
      mat.diffuseColor = new BABYLON.Color3(0, 0, 1);
      mat.emissiveColor = new BABYLON.Color3(0, 0, 0.3);
    } else {
      const color = new BABYLON.Color3(0, 1, 0); // Green for signal
      mat.diffuseColor = color;
      mat.emissiveColor = color.scale(0.3);
    }
    terminal.material = mat;
  }

  /**
   * Update buzzer state
   */
  updateBuzzerState(component, active, frequency = 0, volume = 0) {
    if (!component || !component.metadata) return;

    const componentId = componentRegistry.generateComponentId(component);
    if (componentId) {
      componentRegistry.updateComponentState(componentId, {
        active: active,
        frequency: frequency,
        volume: volume,
        lastUpdate: Date.now()
      });
    }
  }

  /**
   * Get all buzzer modules
   */
  getBuzzerModules() {
    return componentRegistry.getComponentsByType('buzzer');
  }
}

// Create singleton instance
export const buzzerBehaviorManager = new BuzzerBehaviorManager();

// Expose to window for global access
window.buzzerBehaviorManager = buzzerBehaviorManager;
window.initializeBuzzerModuleTerminals = (component, scene) => buzzerBehaviorManager.initializeBuzzerModuleTerminals(component, scene);
window.updateBuzzerState = (component, active, frequency, volume) => buzzerBehaviorManager.updateBuzzerState(component, active, frequency, volume);
window.getBuzzerModules = () => buzzerBehaviorManager.getBuzzerModules();
