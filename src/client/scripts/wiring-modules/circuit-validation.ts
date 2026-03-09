// Circuit Validation - Safety checks for wiring connections
//@ts-nocheck

import { getTerminalName, getPinOrTerminalName } from './terminal-helpers';

/**
 * Validate circuit connection for safety and correctness
 * Returns { valid: boolean, warnings: [], errors: [] }
 */
export function validateConnection(fromMesh, toMesh, wiringConnections) {
  const warnings = [];
  const errors = [];

  const fromMeta = fromMesh.metadata || {};
  const toMeta = toMesh.metadata || {};

  // ✅ Use centralized helper function for terminal names
  const fromName = getTerminalName(fromMesh);
  const toName = getTerminalName(toMesh);

  // 1. SHORT CIRCUIT DETECTION - Prevent power → ground direct connections
  const isPowerToGround = (
    (fromMeta.pinInfo?.type === 'power' && toMeta.pinInfo?.type === 'ground') ||
    (fromMeta.pinInfo?.type === 'ground' && toMeta.pinInfo?.type === 'power') ||
    (fromMeta.railType === 'power' && toMeta.railType === 'ground') ||
    (fromMeta.railType === 'ground' && toMeta.railType === 'power')
  );

  if (isPowerToGround) {
    errors.push(`⚠️ SHORT CIRCUIT DETECTED!\n${fromName} → ${toName}\n\nConnecting power directly to ground will damage your Arduino!\nAdd a resistor or component between them.`);
  }

  // 2. VOLTAGE WARNINGS - Alert when connecting 5V to 3.3V pins
  // ✅ Use centralized helper to get pin names for comparison
  const fromPinName = getPinOrTerminalName(fromMesh);
  const toPinName = getPinOrTerminalName(toMesh);
  const is5Vto3V = (
    (fromPinName === '5V' && toPinName === '3.3V') ||
    (fromPinName === '3.3V' && toPinName === '5V')
  );

  if (is5Vto3V) {
    warnings.push(`⚠️ VOLTAGE MISMATCH WARNING!\n${fromName} → ${toName}\n\nConnecting 5V to 3.3V can damage 3.3V components.\nUse a voltage divider or level shifter.`);
  }

  // 3. LED POLARITY CHECKING - Warn when LED connected backwards
  // Moved to led_blinking.ts - delegate to LED manager
  if ((fromMeta.isLEDPin || fromMeta.partType === 'led') || (toMeta.isLEDPin || toMeta.partType === 'led')) {
    if (window.ledBlinkingManager) {
      //const ledWarnings = window.ledBlinkingManager.validateLEDConnection(fromMeta, toMeta, fromMesh, toMesh);
      //warnings.push(...ledWarnings);
    } else {
      // Fallback if LED manager not available
      if (fromMeta.isLEDPin && toMeta.pinInfo?.type === 'power' && fromMeta.polarity === 'negative') {
        warnings.push(`⚠️ LED POLARITY WARNING!\n\nLED cathode (-) should connect to ground, not power.\nReverse the LED connection.`);
      }
      if (toMeta.isLEDPin && fromMeta.pinInfo?.type === 'power' && toMeta.polarity === 'negative') {
        warnings.push(`⚠️ LED POLARITY WARNING!\n\nLED cathode (-) should connect to ground, not power.\nReverse the LED connection.`);
      }
    }
  }

  // 4. CURRENT LIMITING - Calculate total current draw
  // Check if connecting multiple components to single pin
  const existingConnections = wiringConnections.filter(conn =>
    conn.fromTerminalId.includes(fromName) || conn.toTerminalId.includes(fromName)
  );

  if (existingConnections.length >= 3 && fromMeta.partType === 'arduino') {
    warnings.push(`⚠️ CURRENT LIMIT WARNING!\n\nPin ${fromName} already has ${existingConnections.length} connections.\nArduino pins max: 40mA\nTotal pin current should not exceed this limit.`);
  }

  // 5. CONNECTION VALIDATION - Verify breadboard internal connections
  if (fromMeta.partType === 'breadboard' && toMeta.partType === 'breadboard') {
    const fromGroup = fromMeta.connectedGroup;
    const toGroup = toMeta.connectedGroup;

    // Same row, same group = internally connected already
    if (fromGroup === toGroup && fromMeta.row === toMeta.row) {
      warnings.push(`ℹ️ These holes are already electrically connected!\n\n${fromName} and ${toName} are in the same breadboard row.\nNo wire needed between them.`);
    }
  }

  // 6. VOLTAGE COMPATIBILITY - Check component voltage ratings
  const fromVoltage = fromMeta.pinInfo?.voltage || 5;
  const toVoltage = toMeta.pinInfo?.voltage || 5;
  
  if (Math.abs(fromVoltage - toVoltage) > 1 && 
      fromVoltage > 0 && toVoltage > 0 &&
      fromMeta.partType !== 'arduino' && toMeta.partType !== 'arduino') {
    warnings.push(`⚠️ VOLTAGE COMPATIBILITY WARNING!\n\nConnecting ${fromVoltage}V to ${toVoltage}V may damage components.\nEnsure voltage compatibility before connecting.`);
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors
  };
}

/**
 * Show validation messages to user
 */
export function showValidationMessages(validation) {
  if (validation.errors.length > 0) {
    alert(validation.errors.join('\n\n'));
    return false;
  }

  if (validation.warnings.length > 0) {
    const proceed = confirm(validation.warnings.join('\n\n') + '\n\nDo you want to continue anyway?');
    return proceed;
  }

  return true;
}
