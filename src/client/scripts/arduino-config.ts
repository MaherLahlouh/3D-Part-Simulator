// @ts-nocheck
/**
 * Centralized Arduino Hardware Configuration
 * Single source of truth for all Arduino board definitions, pin configurations,
 * terminal types, and hardware constants.
 * 
 * Used by: wiring-logic.ts, wiring-controls.ts, component-behaviors.ts, enhancements.ts
 */

/**
 * Arduino Pin Definitions for all supported board types
 * Each board type includes:
 * - digital: Array of digital pin names (D0-D13)
 * - analog: Array of analog pin names (A0-A5)
 * - pwm: Array of PWM-capable pins
 * - power: Array of power pin names
 * - ground: Array of ground pin names
 * - pinTypes: Detailed pin information (type, mode, voltage, maxCurrent, special features)
 */
export const ARDUINO_PIN_DEFINITIONS = {
  'Arduino-UNO': {
    digital: ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12', 'D13'],
    analog: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'],
    pwm: ['D3', 'D5', 'D6', 'D9', 'D10', 'D11'],
    power: ['5V', '3.3V', 'VIN'],
    ground: ['GND'], // Single GND pin (multiple physical GND pins share same electrical connection)
    pinTypes: {
      'D0': { type: 'digital', mode: 'io', voltage: 5, maxCurrent: 40, special: 'RX (Serial)' },
      'D1': { type: 'digital', mode: 'io', voltage: 5, maxCurrent: 40, special: 'TX (Serial)' },
      'D2': { type: 'digital', mode: 'io', voltage: 5, maxCurrent: 40, special: 'INT0' },
      'D3': { type: 'digital', mode: 'io', voltage: 5, maxCurrent: 40, special: 'PWM, INT1' },
      'D4': { type: 'digital', mode: 'io', voltage: 5, maxCurrent: 40 },
      'D5': { type: 'digital', mode: 'io', voltage: 5, maxCurrent: 40, special: 'PWM' },
      'D6': { type: 'digital', mode: 'io', voltage: 5, maxCurrent: 40, special: 'PWM' },
      'D7': { type: 'digital', mode: 'io', voltage: 5, maxCurrent: 40 },
      'D8': { type: 'digital', mode: 'io', voltage: 5, maxCurrent: 40 },
      'D9': { type: 'digital', mode: 'io', voltage: 5, maxCurrent: 40, special: 'PWM' },
      'D10': { type: 'digital', mode: 'io', voltage: 5, maxCurrent: 40, special: 'PWM, SS' },
      'D11': { type: 'digital', mode: 'io', voltage: 5, maxCurrent: 40, special: 'PWM, MOSI' },
      'D12': { type: 'digital', mode: 'io', voltage: 5, maxCurrent: 40, special: 'MISO' },
      'D13': { type: 'digital', mode: 'io', voltage: 5, maxCurrent: 40, special: 'PWM, SCK, LED' },
      'A0': { type: 'analog', mode: 'input', voltage: 5, maxCurrent: 40, resolution: 10 },
      'A1': { type: 'analog', mode: 'input', voltage: 5, maxCurrent: 40, resolution: 10 },
      'A2': { type: 'analog', mode: 'input', voltage: 5, maxCurrent: 40, resolution: 10 },
      'A3': { type: 'analog', mode: 'input', voltage: 5, maxCurrent: 40, resolution: 10 },
      'A4': { type: 'analog', mode: 'input', voltage: 5, maxCurrent: 40, special: 'SDA (I2C)' },
      'A5': { type: 'analog', mode: 'input', voltage: 5, maxCurrent: 40, special: 'SCL (I2C)' },
      '5V': { type: 'power', mode: 'output', voltage: 5, maxCurrent: 500 },
      '3.3V': { type: 'power', mode: 'output', voltage: 3.3, maxCurrent: 50 },
      'VIN': { type: 'power', mode: 'input', voltage: '7-12V', maxCurrent: 1000 },
      'GND': { type: 'ground', mode: 'ground', voltage: 0, maxCurrent: 1000 }
    }
  },
};

/**
 * Board type aliases mapping
 * Maps alternative board type names to the canonical board type name
 */
const BOARD_TYPE_ALIASES = {
  'arduino_uno': 'Arduino-UNO',
  'sized_arduino': 'Arduino-UNO',
  'arduino_r3': 'Arduino-UNO',
  'basic_arduino_uno': 'Arduino-UNO'
};

/**
 * Resolve board type alias to canonical name
 * @param {string} boardType - Board type name (may be an alias)
 * @returns {string} Canonical board type name
 */
export function resolveBoardType(boardType) {
  if (!boardType) return null;
  return BOARD_TYPE_ALIASES[boardType] || boardType;
}

/**
 * Get pin definitions for a board type (with alias resolution)
 * @param {string} boardType - Board type name (may be an alias)
 * @returns {Object|null} Pin definitions object or null if not found
 */
export function getPinDefinitions(boardType) {
  const canonicalType = resolveBoardType(boardType);
  return ARDUINO_PIN_DEFINITIONS[canonicalType] || null;
}

/**
 * Terminal type identification arrays
 * Used for validation and terminal type detection
 */
export const TERMINAL_TYPES = {
  power: ['vcc', 'v+', 'vcc3v3', 'v5', '5v', '+5v', 'vin', 'power', '+', '3.3v', '33v'],
  ground: ['gnd', 'ground', '0v', 'v-', 'vss', '-'],
  analog: ['a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'adc'],
  digital: ['d0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'd10', 'd11', 'd12', 'd13']
};

/**
 * Shared terminal detection utility
 * Checks if a mesh is a terminal by name patterns or metadata
 */
export function isTerminalMesh(mesh) {
  if (!mesh) return false;
  
  // Check by name patterns
  const name = mesh.name.toLowerCase();
  if (name.includes('terminal') || 
      name.includes('connector') || 
      name.includes('contact') ||
      name.includes('port')) {
    return true;
  }
  
  // Check by metadata
  if (mesh.metadata) {
    // Standard terminal metadata
    if (mesh.metadata.isTerminal || mesh.metadata.terminalId) {
      return true;
    }
    // Arduino pin metadata
    if (mesh.metadata.isArduinoPin || mesh.metadata.pinName) {
      return true;
    }
    // LED pin metadata
    if (mesh.metadata.isLEDPin || mesh.metadata.terminalName) {
      return true;
    }
    // Breadboard terminal metadata
    if (mesh.metadata.isBreadboardTerminal || mesh.metadata.holeId) {
      return true;
    }
  }
  
  return false;
}

/**
 * Expose to window for global access (backward compatibility)
 */
if (typeof window !== 'undefined') {
  window.ARDUINO_PIN_DEFINITIONS = ARDUINO_PIN_DEFINITIONS;
  window.isTerminalMesh = isTerminalMesh;
  window.TERMINAL_TYPES = TERMINAL_TYPES;
  window.resolveBoardType = resolveBoardType;
  window.getPinDefinitions = getPinDefinitions;
}

console.log("✅ Arduino hardware configuration loaded");

