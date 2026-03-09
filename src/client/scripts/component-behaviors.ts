// Component Behaviors System
// Modular logic layer for GLB-based components with real-world electrical behavior
// Each component type has its own behavior module for maintainability and extensibility
//@ts-nocheck

// Import centralized Arduino hardware configuration
import { ARDUINO_PIN_DEFINITIONS } from './arduino-config';

/**
 * Component Behavior Registry
 * Maps component types to their behavior handlers
 * NOTE: This will be initialized after all behavior objects are defined below
 */
let COMPONENT_BEHAVIORS = {};

/**
 * Pin State Manager
 * Tracks voltage, current, and state for each pin/terminal
 */
class PinStateManager {
  constructor() {
    this.pinStates = new Map(); // Map<terminalId, PinState>
    this.connectionGraph = new Map(); // Map<terminalId, Set<connectedTerminalIds>>
  }

  /**
   * Get or create pin state for a terminal
   */
  getPinState(terminalId) {
    if (!this.pinStates.has(terminalId)) {
      this.pinStates.set(terminalId, {
        voltage: 0,
        current: 0,
        digitalState: 'LOW', // 'LOW' | 'HIGH' | 'FLOATING'
        analogValue: 0, // 0-1023 for analog
        mode: 'input', // 'input' | 'output' | 'pwm'
        connected: false,
        connections: new Set()
      });
    }
    return this.pinStates.get(terminalId);
  }

  /**
   * Update pin state
   */
  updatePinState(terminalId, updates) {
    const state = this.getPinState(terminalId);
    Object.assign(state, updates);
    this.pinStates.set(terminalId, state);
    
    // Notify connected components
    this.propagateStateChange(terminalId, state);
  }

  /**
   * Connect two terminals
   */
  connectTerminals(fromId, toId) {
    const fromState = this.getPinState(fromId);
    const toState = this.getPinState(toId);
    
    fromState.connections.add(toId);
    toState.connections.add(fromId);
    fromState.connected = true;
    toState.connected = true;
    
    // Update connection graph
    if (!this.connectionGraph.has(fromId)) {
      this.connectionGraph.set(fromId, new Set());
    }
    if (!this.connectionGraph.has(toId)) {
      this.connectionGraph.set(toId, new Set());
    }
    this.connectionGraph.get(fromId).add(toId);
    this.connectionGraph.get(toId).add(fromId);
    
    // Propagate state
    this.propagateStateChange(fromId, fromState);
  }

  /**
   * Disconnect two terminals
   */
  disconnectTerminals(fromId, toId) {
    const fromState = this.getPinState(fromId);
    const toState = this.getPinState(toId);
    
    fromState.connections.delete(toId);
    toState.connections.delete(fromId);
    fromState.connected = fromState.connections.size > 0;
    toState.connected = toState.connections.size > 0;
    
    if (this.connectionGraph.has(fromId)) {
      this.connectionGraph.get(fromId).delete(toId);
    }
    if (this.connectionGraph.has(toId)) {
      this.connectionGraph.get(toId).delete(fromId);
    }
  }

  /**
   * Propagate state change to connected terminals
   */
  propagateStateChange(terminalId, state) {
    const connectedIds = this.connectionGraph.get(terminalId) || new Set();
    
    connectedIds.forEach(connectedId => {
      const connectedState = this.getPinState(connectedId);
      const connectedTerminal = this.findTerminalMesh(connectedId);
      
      if (connectedTerminal) {
        // Update connected terminal state (voltage propagates)
        connectedState.voltage = state.voltage;
        connectedState.digitalState = state.digitalState;
        connectedState.analogValue = state.analogValue;
        
        // Notify component behavior
        const component = connectedTerminal.parent || connectedTerminal;
        const componentType = this.getComponentType(component);
        const behavior = COMPONENT_BEHAVIORS[componentType];
        
        if (behavior && behavior.onPinStateChange) {
          behavior.onPinStateChange(component, connectedTerminal, connectedState);
        }
      }
    });
  }

  /**
   * Find terminal mesh by ID
   */
  findTerminalMesh(terminalId) {
    if (!window.scene) return null;
    
    const meshes = window.scene.meshes;
    for (const mesh of meshes) {
      if (mesh.metadata && mesh.metadata.terminalId === terminalId) {
        return mesh;
      }
    }
    return null;
  }

  /**
   * Get component type from component mesh
   */
  getComponentType(component) {
    if (!component || !component.metadata) return 'unknown';
    return component.metadata.partType || component.metadata.componentType || 'unknown';
  }
}

// Global pin state manager
window.pinStateManager = new PinStateManager();

/**
 * Arduino Behavior
 * Handles Arduino-specific logic: pin modes, digital/analog I/O, PWM
 */
const ArduinoBehavior = {
  /**
   * Initialize Arduino component
   */
  initialize(component, scene) {
    component.metadata.arduinoState = {
      pins: {},
      serialActive: false,
      powered: false
    };
    
    // Initialize all pins
    const boardType = component.metadata.boardType || 'Arduino-UNO';
    // ✅ Use centralized pin definitions from arduino-config.ts
    const pinDef = ARDUINO_PIN_DEFINITIONS[boardType] || window.ARDUINO_PIN_DEFINITIONS?.[boardType];
    
    if (pinDef) {
      [...pinDef.digital, ...pinDef.analog, ...pinDef.power, ...pinDef.ground].forEach(pinName => {
        component.metadata.arduinoState.pins[pinName] = {
          mode: 'input',
          value: 0,
          pwmValue: 0
        };
      });
    }
    
    console.log(`✅ Arduino ${boardType} initialized`);
    console.log('this is the component:', component);
  },

  /**
   * Handle pin state change from code execution
   */
  onPinStateChange(component, terminal, state) {
    const pinName = terminal.metadata?.pinName || terminal.metadata?.terminalName;
    if (!pinName) return;
    
    const arduinoState = component.metadata.arduinoState;
    if (!arduinoState || !arduinoState.pins[pinName]) return;
    
    // Update Arduino pin state
    const pinState = arduinoState.pins[pinName];
    pinState.value = state.digitalState === 'HIGH' ? 1 : 0;
    pinState.voltage = state.voltage;
    
    // Visual feedback: highlight pin
    this.updatePinVisual(component, terminal, state);
  },

  /**
   * Update visual representation of pin state
   */
  updatePinVisual(component, terminal, state) {
    if (!terminal || !terminal.material) return;
    
    const material = terminal.material;
    
    // Color coding:
    // - HIGH (5V): Green
    // - LOW (0V): Red
    // - PWM: Blue (intensity based on duty cycle)
    // - Analog: Yellow (intensity based on value)
    
    if (state.digitalState === 'HIGH') {
      material.emissiveColor = new BABYLON.Color3(0, 1, 0); // Green
      material.diffuseColor = new BABYLON.Color3(0, 0.8, 0);
    } else if (state.digitalState === 'LOW') {
      material.emissiveColor = new BABYLON.Color3(1, 0, 0); // Red
      material.diffuseColor = new BABYLON.Color3(0.8, 0, 0);
    } else if (state.mode === 'pwm') {
      const intensity = state.analogValue / 255;
      material.emissiveColor = new BABYLON.Color3(0, 0, intensity); // Blue
      material.diffuseColor = new BABYLON.Color3(0, 0, 0.8 * intensity);
    } else if (state.mode === 'input' && state.analogValue > 0) {
      const intensity = state.analogValue / 1023;
      material.emissiveColor = new BABYLON.Color3(intensity, intensity, 0); // Yellow
      material.diffuseColor = new BABYLON.Color3(0.8 * intensity, 0.8 * intensity, 0);
    }
  },

  /**
   * Set pin mode (called from code execution)
   */
  setPinMode(component, pinName, mode) {
    const arduinoState = component.metadata.arduinoState;
    if (!arduinoState || !arduinoState.pins[pinName]) return;
    
    arduinoState.pins[pinName].mode = mode;
    
    // Find terminal and update state
    const terminal = this.findPinTerminal(component, pinName);
    if (terminal) {
      const terminalId = terminal.metadata?.terminalId;
      if (terminalId) {
        window.pinStateManager.updatePinState(terminalId, { mode });
      }
    }
  },

  /**
   * Digital write (called from code execution)
   */
  digitalWrite(component, pinName, value) {
    const arduinoState = component.metadata.arduinoState;
    if (!arduinoState || !arduinoState.pins[pinName]) return;
    
    arduinoState.pins[pinName].value = value;
    
    const terminal = this.findPinTerminal(component, pinName);
    if (terminal) {
      const terminalId = terminal.metadata?.terminalId;
      if (terminalId) {
        const state = window.pinStateManager.getPinState(terminalId);
        state.digitalState = value ? 'HIGH' : 'LOW';
        state.voltage = value ? 5 : 0;
        state.mode = 'output';
        
        window.pinStateManager.updatePinState(terminalId, state);
      }
    }
  },

  /**
   * Analog write / PWM (called from code execution)
   */
  analogWrite(component, pinName, value) {
    const arduinoState = component.metadata.arduinoState;
    if (!arduinoState || !arduinoState.pins[pinName]) return;
    
    arduinoState.pins[pinName].pwmValue = value;
    
    const terminal = this.findPinTerminal(component, pinName);
    if (terminal) {
      const terminalId = terminal.metadata?.terminalId;
      if (terminalId) {
        const state = window.pinStateManager.getPinState(terminalId);
        state.analogValue = value;
        state.voltage = (value / 255) * 5; // PWM voltage
        state.mode = 'pwm';
        state.digitalState = value > 127 ? 'HIGH' : 'LOW';
        
        window.pinStateManager.updatePinState(terminalId, state);
      }
    }
  },

  /**
   * Find pin terminal by name
   */
  findPinTerminal(component, pinName) {
    const children = component.getChildMeshes(true);
    for (const child of children) {
      if (child.metadata && 
          (child.metadata.pinName === pinName || child.metadata.terminalName === pinName)) {
        return child;
      }
    }
    return null;
  }
};

/**
 * LED Behavior
 * Handles LED-specific logic: polarity, lighting, current flow
 */
const LEDBehavior = {
  /**
   * Initialize LED component
   */
  initialize(component, scene) {
    component.metadata.ledState = {
      isOn: false,
      brightness: 0,
      current: 0,
      forwardVoltage: 2.0, // Typical LED forward voltage
      maxCurrent: 20 // mA
    };
    
    // Find LED body mesh for visual feedback
    const children = component.getChildMeshes();
    component.metadata.ledBody = children.find(m => 
      m.name.toLowerCase().includes('body') || 
      m.name.toLowerCase().includes('led') ||
      (!m.metadata || !m.metadata.isTerminal)
    );
    
    console.log(`✅ LED initialized`);
  },

  /**
   * Handle pin state change
   */
  onPinStateChange(component, terminal, state) {
    const ledState = component.metadata.ledState;
    if (!ledState) return;
    
    const polarity = terminal.metadata?.polarity;
    if (!polarity) return;
    
    // Find anode and cathode terminals
    const children = component.getChildMeshes();
    const anode = children.find(m => m.metadata?.polarity === 'positive');
    const cathode = children.find(m => m.metadata?.polarity === 'negative');
    
    if (!anode || !cathode) return;
    
    const anodeId = anode.metadata?.terminalId;
    const cathodeId = cathode.metadata?.terminalId;
    
    if (!anodeId || !cathodeId) return;
    
    const anodeState = window.pinStateManager.getPinState(anodeId);
    const cathodeState = window.pinStateManager.getPinState(cathodeId);
    
    // Check if LED should be on (forward bias)
    // Anode must be HIGH (positive) and Cathode must be LOW (ground/negative)
    const isForwardBiased = anodeState.voltage > cathodeState.voltage + ledState.forwardVoltage;
    
    if (isForwardBiased) {
      // Calculate current (simplified: voltage difference / resistance)
      const voltageDiff = anodeState.voltage - cathodeState.voltage;
      const current = Math.min((voltageDiff - ledState.forwardVoltage) * 10, ledState.maxCurrent);
      
      ledState.isOn = current > 1; // Minimum current to light up
      ledState.brightness = Math.min(current / ledState.maxCurrent, 1);
      ledState.current = current;
    } else {
      ledState.isOn = false;
      ledState.brightness = 0;
      ledState.current = 0;
    }
    
    // Update visual
    this.updateLEDVisual(component, ledState);
  },

  /**
   * Update LED visual appearance
   */
  updateLEDVisual(component, ledState) {
    const ledBody = component.metadata.ledBody;
    if (!ledBody || !ledBody.material) return;
    
    const material = ledBody.material;
    
    if (ledState.isOn) {
      // Emissive glow based on brightness
      const intensity = ledState.brightness;
      material.emissiveColor = new BABYLON.Color3(intensity, intensity * 0.8, 0); // Yellow/white glow
      material.emissiveIntensity = intensity * 2;
      
      // Add point light for realistic lighting
      if (!component.metadata.ledLight) {
        const light = new BABYLON.PointLight('ledLight_' + component.name, 
          component.getAbsolutePosition(), window.scene);
        light.intensity = 0;
        component.metadata.ledLight = light;
      }
      
      if (component.metadata.ledLight) {
        component.metadata.ledLight.intensity = intensity * 0.5;
        component.metadata.ledLight.diffuse = new BABYLON.Color3(1, 0.8, 0);
      }
    } else {
      // Turn off
      material.emissiveColor = new BABYLON.Color3(0, 0, 0);
      material.emissiveIntensity = 0;
      
      if (component.metadata.ledLight) {
        component.metadata.ledLight.intensity = 0;
      }
    }
  }
};

/**
 * Resistor Behavior
 * Handles resistor-specific logic: resistance value, current limiting
 */
const ResistorBehavior = {
  /**
   * Initialize resistor component
   */
  initialize(component, scene) {
    // Extract resistance from component name (e.g., "1k_ohm_resistor" = 1000 ohms)
    const name = (component.metadata?.baseName || component.name || '').toLowerCase();
    let resistance = 1000; // Default 1k ohm
    
    if (name.includes('1k')) resistance = 1000;
    else if (name.includes('10k')) resistance = 10000;
    else if (name.includes('100')) resistance = 100;
    else if (name.includes('220')) resistance = 220;
    else if (name.includes('330')) resistance = 330;
    else if (name.includes('470')) resistance = 470;
    
    component.metadata.resistorState = {
      resistance: resistance,
      current: 0,
      voltageDrop: 0
    };
    
    console.log(`✅ Resistor initialized: ${resistance}Ω`);
  },

  /**
   * Calculate voltage drop across resistor (Ohm's law: V = I * R)
   */
  calculateVoltageDrop(component, current) {
    const resistorState = component.metadata.resistorState;
    if (!resistorState) return 0;
    
    resistorState.current = current;
    resistorState.voltageDrop = current * (resistorState.resistance / 1000); // Convert mA to A
    return resistorState.voltageDrop;
  }
};

/**
 * Breadboard Behavior
 * Handles breadboard-specific logic: row connectivity (a-e and f-j groups)
 */
const BreadboardBehavior = {
  /**
   * Initialize breadboard component
   */
  initialize(component, scene) {
    component.metadata.breadboardState = {
      rows: 30,
      columns: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
      connectedGroups: new Map() // Map<row_group, Set<terminalIds>>
    };
    
    console.log(`✅ Breadboard initialized`);
  },

  /**
   * Get connected terminals in same breadboard row group
   * Holes a-e are connected, f-j are connected (same row)
   */
  getConnectedTerminals(component, terminal) {
    const metadata = terminal.metadata;
    if (!metadata || metadata.partType !== 'breadboard') return [];
    
    const row = metadata.row;
    const column = metadata.column;
    const connectedGroup = metadata.connectedGroup;
    
    if (!row || !column || !connectedGroup) return [];
    
    // Find all terminals in the same connected group
    const connected = [];
    const children = component.getChildMeshes();
    
    children.forEach(child => {
      if (child.metadata && 
          child.metadata.partType === 'breadboard' &&
          child.metadata.row === row &&
          child.metadata.connectedGroup === connectedGroup) {
        connected.push(child);
      }
    });
    
    return connected;
  },

  /**
   * Handle pin state change - propagate to connected holes in same row
   */
  onPinStateChange(component, terminal, state) {
    const connected = this.getConnectedTerminals(component, terminal);
    
    // Propagate state to all connected holes in same row group
    connected.forEach(connectedTerminal => {
      if (connectedTerminal !== terminal) {
        const connectedId = connectedTerminal.metadata?.terminalId;
        if (connectedId) {
          window.pinStateManager.updatePinState(connectedId, {
            voltage: state.voltage,
            digitalState: state.digitalState,
            analogValue: state.analogValue
          });
        }
      }
    });
  }
};

/**
 * Sensor Behavior (base class for all sensors)
 */
const SensorBehavior = {
  initialize(component, scene) {
    component.metadata.sensorState = {
      value: 0,
      reading: 0,
      active: false
    };
  },

  onPinStateChange(component, terminal, state) {
    // Sensors read from analog pins
    if (state.mode === 'input' && state.analogValue > 0) {
      component.metadata.sensorState.reading = state.analogValue;
      component.metadata.sensorState.active = true;
    }
  }
};

/**
 * Motor Behavior
 */
const MotorBehavior = {
  initialize(component, scene) {
    component.metadata.motorState = {
      speed: 0,
      direction: 0, // -1 reverse, 0 stop, 1 forward
      running: false
    };
  },

  onPinStateChange(component, terminal, state) {
    if (state.mode === 'pwm') {
      component.metadata.motorState.speed = state.analogValue;
      component.metadata.motorState.running = state.analogValue > 0;
    }
  }
};

/**
 * Buzzer Behavior
 */
const BuzzerBehavior = {
  initialize(component, scene) {
    component.metadata.buzzerState = {
      active: false,
      frequency: 0,
      volume: 0
    };
  },

  onPinStateChange(component, terminal, state) {
    component.metadata.buzzerState.active = state.digitalState === 'HIGH' || state.analogValue > 0;
    if (state.mode === 'pwm') {
      component.metadata.buzzerState.frequency = state.analogValue;
    }
  }
};

/**
 * Initialize Component Behavior Registry
 * Must be called after all behavior objects are defined
 */
COMPONENT_BEHAVIORS = {
  arduino: ArduinoBehavior,
  led: LEDBehavior,
  resistor: ResistorBehavior,
  breadboard: BreadboardBehavior,
  sensor: SensorBehavior,
  motor: MotorBehavior,
  buzzer: BuzzerBehavior
};

/**
 * Initialize component behavior
 * Called when component is loaded
 */
window.initializeComponentBehavior = function(component, scene) {
  if (!component || !component.metadata) return;
  
  const componentType = component.metadata.partType || component.metadata.componentType;
  if (!componentType) return;
  
  const behavior = COMPONENT_BEHAVIORS[componentType];
  if (behavior && behavior.initialize) {
    behavior.initialize(component, scene);
  }
};

/**
 * Get component behavior
 */
window.getComponentBehavior = function(componentType) {
  return COMPONENT_BEHAVIORS[componentType] || null;
};

// Export for use in other modules
window.COMPONENT_BEHAVIORS = COMPONENT_BEHAVIORS;
window.ArduinoBehavior = ArduinoBehavior;
window.LEDBehavior = LEDBehavior;
window.ResistorBehavior = ResistorBehavior;
window.BreadboardBehavior = BreadboardBehavior;

/**
 * Bridge: Connect AVR execution to component behaviors
 * Hooks into AVR port pin changes and updates component states
 */
window.connectAVRToComponents = function(portB, portC, portD) {
  if (!portB || !portC || !portD) {
    console.warn('⚠️ AVR ports not available for component connection');
    return;
  }

  // Map AVR ports to Arduino pin names
  const portBPins = ['D8', 'D9', 'D10', 'D11', 'D12', 'D13']; // PB0-PB5
  const portCPins = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5']; // PC0-PC5
  const portDPins = ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7']; // PD0-PD7

  // Find Arduino component in scene
  const arduinoComponent = findArduinoComponent();
  if (!arduinoComponent) {
    console.warn('⚠️ No Arduino component found in scene');
    return;
  }

  // Hook into port pin changes
  const updatePinFromPort = (port, pinNames, portName) => {
    for (let i = 0; i < pinNames.length; i++) {
      const pinName = pinNames[i];
      const pinState = port.pins[i];
      
      if (pinState && pinState.outputEnabled) {
        // Pin is configured as output
        const value = pinState.value;
        const pinNumber = pinName.replace(/[^0-9]/g, '');
        
        // Check if it's a PWM pin
        const isPWM = ['3', '5', '6', '9', '10', '11'].includes(pinNumber);
        
        if (isPWM && window.ArduinoBehavior) {
          // Use analogWrite for PWM pins
          window.ArduinoBehavior.analogWrite(arduinoComponent, pinName, value ? 255 : 0);
        } else if (window.ArduinoBehavior) {
          // Use digitalWrite for digital pins
          window.ArduinoBehavior.digitalWrite(arduinoComponent, pinName, value ? 1 : 0);
        }
      }
    }
  };

  // Monitor port changes
  const monitorPort = (port, pinNames, portName) => {
    let lastState = null;
    
    setInterval(() => {
      const currentState = port.pins.map(p => ({
        value: p.value,
        outputEnabled: p.outputEnabled
      }));
      
      if (JSON.stringify(currentState) !== JSON.stringify(lastState)) {
        updatePinFromPort(port, pinNames, portName);
        lastState = currentState;
      }
    }, 50); // Check every 50ms
  };

  monitorPort(portB, portBPins, 'B');
  monitorPort(portC, portCPins, 'C');
  monitorPort(portD, portDPins, 'D');

  console.log('✅ AVR-Component bridge connected');
};

/**
 * Find Arduino component in scene
 */
// ✅ Use shared isArduinoBoard function from wiring-logic.ts instead of duplicate logic
function findArduinoComponent() {
  if (!window.scene || !window.isArduinoBoard) return null;
  
  const meshes = window.scene.meshes;
  for (const mesh of meshes) {
    if (window.isArduinoBoard(mesh)) {
      return mesh;
    }
  }
  return null;
}

console.log("✅ Component Behaviors System loaded");

