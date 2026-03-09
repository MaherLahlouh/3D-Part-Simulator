// Wiring Debug Utilities
//@ts-nocheck

import { getTerminalName } from './terminal-helpers';

/**
 * Helper to adjust Arduino pin positions programmatically
 * Usage: window.adjustArduinoPinPosition('D13', { x: 1.2, y: 0.1, z: -1.5 })
 */
export function adjustArduinoPinPosition(pinName, newPosition) {
  console.log(`🔧 To adjust ${pinName} position to (${newPosition.x}, ${newPosition.y}, ${newPosition.z}):`);
  console.log(`   Update line in wiring-logic.js pinPositions object:`);
  console.log(`   '${pinName}': { x: ${newPosition.x}, y: ${newPosition.y}, z: ${newPosition.z} },`);
}
