// Arduino Pin Management - Pin detection, validation, and UI
//@ts-nocheck

import { ARDUINO_PIN_DEFINITIONS } from '../arduino-config';
import { isArduinoTerminal, getPinOrTerminalName } from './terminal-helpers';
/*
// Check if a component is an Arduino board

export function isArduinoBoard(component) {
  if (!component) return false;
  const name = component.name || '';
  const metadata = component.metadata || {};

  return name.toLowerCase().includes('arduino') ||
         metadata.partType === 'arduino' ||
         metadata.componentType === 'arduino';
}


 // Get Arduino board type from component
 
export function getArduinoBoardType(component) {
  if (!component) return null;

  const name = component.name || '';
  const metadata = component.metadata || {};

  // Check metadata first
  if (metadata.boardType) return metadata.boardType;
  if (metadata.partName) {
    const partName = metadata.partName;
    // ✅ Use centralized pin definitions from arduino-config.ts
    if (ARDUINO_PIN_DEFINITIONS[partName] || window.ARDUINO_PIN_DEFINITIONS?.[partName]) {
      return partName;
    }
  }

  // Check by name
  // ✅ Use centralized pin definitions from arduino-config.ts
  for (const boardType in ARDUINO_PIN_DEFINITIONS) {
    if (name.toLowerCase().includes(boardType.toLowerCase())) {
      return boardType;
    }
  }

  // Default to Arduino-UNO
  if (name.toLowerCase().includes('arduino')) {
    return 'Arduino-UNO';
  }

  return null;
}

// Get all available pins for an Arduino board

export function getArduinoPins(component) {
  const boardType = getArduinoBoardType(component);
  // ✅ Use centralized pin definitions from arduino-config.ts
  if (!boardType || (!ARDUINO_PIN_DEFINITIONS[boardType] && !window.ARDUINO_PIN_DEFINITIONS?.[boardType])) {
    return null;
  }

  return ARDUINO_PIN_DEFINITIONS[boardType] || window.ARDUINO_PIN_DEFINITIONS[boardType];
}

// Check if a specific Arduino pin is connected

export function isPinConnected(componentId, pinName) {
  const key = `${componentId}_${pinName}`;
  return window.ARDUINO_PIN_CONNECTIONS[key] || false;
}

// Mark a pin as connected/disconnected

export function setPinConnection(componentId, pinName, connected, wireId = null) {
  const key = `${componentId}_${pinName}`;
  if (connected) {
    window.ARDUINO_PIN_CONNECTIONS[key] = {
      connected: true,
      wireId: wireId,
      timestamp: Date.now()
    };
  } else {
    delete window.ARDUINO_PIN_CONNECTIONS[key];
  }
}

// Get pin information for a specific pin
 
export function getPinInfo(component, pinName) {
  const boardType = getArduinoBoardType(component);
  if (!boardType) return null;

  // ✅ Use centralized pin definitions from arduino-config.ts
  const pinDef = ARDUINO_PIN_DEFINITIONS[boardType] || window.ARDUINO_PIN_DEFINITIONS?.[boardType];
  if (!pinDef || !pinDef.pinTypes) return null;

  return pinDef.pinTypes[pinName] || null;
}

// Validate if a component can connect to a specific Arduino pin

export function validatePinConnection(component, arduinoPin, componentType = 'unknown') {
  const pinInfo = getPinInfo(component, arduinoPin);
  if (!pinInfo) {
    return { valid: false, reason: 'Unknown pin' };
  }

  // Power pins can connect to multiple components
  if (pinInfo.type === 'power' || pinInfo.type === 'ground') {
    return { valid: true, reason: 'Power/Ground pin' };
  }

  // Check component type compatibility
  const compTypeLower = componentType.toLowerCase();

  // Motors should use PWM pins
  if (compTypeLower.includes('motor')) {
    const boardType = getArduinoBoardType(component);
    // ✅ Use centralized pin definitions from arduino-config.ts
    const pinDef = ARDUINO_PIN_DEFINITIONS[boardType] || window.ARDUINO_PIN_DEFINITIONS?.[boardType];
    const isPWM = pinDef?.pwm?.includes(arduinoPin);
    if (!isPWM) {
      return {
        valid: true,
        warning: 'Motor works best with PWM pins (D3, D5, D6, D9, D10, D11) for speed control',
        reason: 'Non-PWM pin for motor'
      };
    }
  }

  // Sensors typically use analog pins
  if (compTypeLower.includes('sensor') && pinInfo.type === 'digital') {
    return {
      valid: true,
      warning: 'Analog sensors work better with analog pins (A0-A5)',
      reason: 'Digital pin for analog sensor'
    };
  }

  // LEDs can use any digital pin
  // Moved to led_blinking.ts - delegate to LED manager
  if (compTypeLower.includes('led')) {
    if (window.ledBlinkingManager) {
      return window.ledBlinkingManager.validateLEDPinCompatibility(pinInfo.type);
    }
    // Fallback if LED manager not available
    if (pinInfo.type === 'analog') {
      return {
        valid: true,
        warning: 'LEDs work better with digital pins',
        reason: 'Analog pin for LED'
      };
    }
  }

  return { valid: true, reason: 'Compatible' };
}
 */


