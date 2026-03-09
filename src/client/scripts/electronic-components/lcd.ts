//@ts-nocheck
import { componentRegistry } from './wiring-modules/component-registry';

/**
 * LCD 16x2 Display Behavior Manager
 * Handles LCD display-specific logic and terminal initialization
 */
class LCDBehaviorManager {
  /**
   * Initialize LCD 16x2 display component with terminals
   */
  initializeLCD16x2Terminals(component, scene) {
    if (!component || !component.metadata || !scene) return [];

    // Set component type
    component.metadata.partType = 'lcd';
    component.metadata.componentType = 'lcd';
    component.metadata.displayType = '16x2';

    // LCD pin names (16 pins total)
    const pinNames = ['vss', 'vdd', 'v0', 'rs', 'e', 'd0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'a', 'k'];
    const terminals = [];
    const pinSpacing = 0.5;
    const startX = 0;

    pinNames.forEach((pinName, index) => {
      const terminal = this.createTerminal(component, scene, pinName, { x: startX - (index * pinSpacing), y: -6, z: 0 }, 0.3);
      terminal.metadata.partType = 'lcd';
      terminal.metadata.isLCDPin = true;
      terminal.metadata.pinNumber = index + 1;
      terminal.metadata.pinInfo = {
        type: pinName === 'vss' || pinName === 'k' ? 'ground' : pinName === 'vdd' || pinName === 'a' ? 'power' : 'signal',
        voltage: pinName === 'vdd' || pinName === 'a' ? 5 : 0
      };
      this.setTerminalMaterial(terminal, pinName, scene, pinName === 'vdd' || pinName === 'a' ? 'power' : pinName === 'vss' || pinName === 'k' ? 'ground' : 'signal');
      terminals.push(terminal);
    });

    component.metadata.terminals = terminals;
    component.metadata.hasTerminals = true;

    // Register component in registry
    componentRegistry.registerComponent(component, { type: 'lcd' }, {
      displayText: ['', ''],
      cursorPosition: { row: 0, col: 0 },
      backlight: true
    });

    console.log(`✅ Initialized ${terminals.length} 16x2 LCD Display terminals`);
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
      const signalColors = {
        'rs': new BABYLON.Color3(0, 1, 0),
        'e': new BABYLON.Color3(0, 1, 1),
        'd0': new BABYLON.Color3(1, 0.5, 1),
        'd1': new BABYLON.Color3(1, 0.5, 1),
        'd2': new BABYLON.Color3(1, 0.5, 1),
        'd3': new BABYLON.Color3(1, 0.5, 1),
        'd4': new BABYLON.Color3(1, 0.5, 1),
        'd5': new BABYLON.Color3(1, 0.5, 1),
        'd6': new BABYLON.Color3(1, 0.5, 1),
        'd7': new BABYLON.Color3(1, 0.5, 1),
        'v0': new BABYLON.Color3(1, 1, 0)
      };
      const color = signalColors[pinName] || new BABYLON.Color3(0.5, 0.5, 0.5);
      mat.diffuseColor = color;
      mat.emissiveColor = color.scale(0.3);
    }
    terminal.material = mat;
  }

  /**
   * Update LCD display text
   */
  updateLCDDisplay(component, line1 = '', line2 = '') {
    if (!component || !component.metadata) return;

    const componentId = componentRegistry.generateComponentId(component);
    if (componentId) {
      componentRegistry.updateComponentState(componentId, {
        displayText: [line1.substring(0, 16), line2.substring(0, 16)],
        lastUpdate: Date.now()
      });
    }
  }

  /**
   * Get all LCD displays
   */
  getLCDDisplays() {
    return componentRegistry.getComponentsByType('lcd');
  }
}

// Create singleton instance
export const lcdBehaviorManager = new LCDBehaviorManager();

// Expose to window for global access
window.lcdBehaviorManager = lcdBehaviorManager;
window.initializeLCD16x2Terminals = (component, scene) => lcdBehaviorManager.initializeLCD16x2Terminals(component, scene);
window.updateLCDDisplay = (component, line1, line2) => lcdBehaviorManager.updateLCDDisplay(component, line1, line2);
window.getLCDDisplays = () => lcdBehaviorManager.getLCDDisplays();
