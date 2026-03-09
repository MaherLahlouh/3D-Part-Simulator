// wiringLogic.js - Thin wrapper that imports and re-exports all wiring modules
// Enhanced Wiring system — TERMINAL-BASED (not pin dots) wiring with Bezier curves
//@ts-nocheck

// Import centralized Arduino hardware configuration
import { ARDUINO_PIN_DEFINITIONS } from './arduino-config';

// Import all wiring modules
import * as TerminalHelpers from './wiring-modules/terminal-helpers';
import * as CircuitValidation from './wiring-modules/circuit-validation';
import * as WiringUndoRedo from './wiring-modules/wiring-undo-redo';
import * as WiringSelection from './wiring-modules/wiring-selection';
import * as WireProperties from './wiring-modules/wire-properties';
import * as WiringState from './wiring-modules/wiring-state';
import * as WireDrawing from './wiring-modules/wire-drawing';
import * as ArduinoPinManagement from './wiring-modules/arduino-pin-management';
import * as WiringDebug from './wiring-modules/wiring-debug';
import * as ComponentTerminals from './wiring-modules/component-terminals';

// Import component behavior managers (for terminal initialization)
//import { ledBlinkingManager } from './led_blinking';
//import { resistorBehaviorManager } from './resistor-behaviors';
//import { rfidRC522BehaviorManager } from './rfid_rc522_arduino_behavior ';

// Initialize wiring state
WiringState.initializeWiring(window.scene);

// Get state references (these are the actual arrays from the module)
const wiringConnections = WiringState.getWiringConnections();
const wireLines = WiringState.getWireLines();
const selectedWires = WiringState.getSelectedWires();

// ✅ Expose to window for global access
window.wiringConnections = wiringConnections;
window.wireLines = wireLines;
window.selectedWires = selectedWires;

// ✅ Expose Arduino pin definitions to window (backward compatibility)
if (!window.ARDUINO_PIN_DEFINITIONS) {
  window.ARDUINO_PIN_DEFINITIONS = ARDUINO_PIN_DEFINITIONS;
}

// ENHANCEMENT: Pin connection tracker
window.ARDUINO_PIN_CONNECTIONS = {};

// Wire properties
window.WIRE_PROPERTIES = WireProperties.WIRE_PROPERTIES;

// ========================================
// RE-EXPORT ALL FUNCTIONS TO WINDOW
// ========================================

// Terminal Helpers
window.getTerminalId = TerminalHelpers.getTerminalId;
window.getTerminalName = TerminalHelpers.getTerminalName;
window.findTerminalMeshById = TerminalHelpers.findTerminalMeshById;
window.getTerminalAbsolutePosition = TerminalHelpers.getTerminalAbsolutePosition;
window.getTerminalConnectionPoint = TerminalHelpers.getTerminalConnectionPoint;
window.findClosestTerminalOnComponent = TerminalHelpers.findClosestTerminalOnComponent;
window.canConnectTerminals = TerminalHelpers.canConnectTerminals;
window.highlightTerminal = TerminalHelpers.highlightTerminal;

// Circuit Validation
window.validateConnection = (fromMesh, toMesh) => CircuitValidation.validateConnection(fromMesh, toMesh, wiringConnections);
window.showValidationMessages = CircuitValidation.showValidationMessages;

// Undo/Redo - Create wrapper that passes wiringConnections and wireLines
window.undoWireOperation = () => {
  WiringUndoRedo.undoWireOperation(wiringConnections, wireLines, (fromMesh, toMesh, options) => {
    return WireDrawing.drawWireBetween(fromMesh, toMesh, options, wiringConnections, wireLines, WiringState.updateWireCount);
  }, TerminalHelpers.findTerminalMeshById, WiringState.updateWireCount);
  // Update window references
  window.wiringConnections = wiringConnections;
  window.wireLines = wireLines;
};
window.redoWireOperation = () => {
  WiringUndoRedo.redoWireOperation(wiringConnections, wireLines, (fromMesh, toMesh, options) => {
    return WireDrawing.drawWireBetween(fromMesh, toMesh, options, wiringConnections, wireLines, WiringState.updateWireCount);
  }, TerminalHelpers.findTerminalMeshById, WiringState.updateWireCount);
  // Update window references
  window.wiringConnections = wiringConnections;
  window.wireLines = wireLines;
};

// Wire Selection
window.selectWire = (wireMesh, addToSelection) => WiringSelection.selectWire(wireMesh, addToSelection, WiringSelection.clearWireHighlight, WiringSelection.updateWireSelectionUI);
window.deleteSelectedWires = () => WiringSelection.deleteSelectedWires(wireLines, WiringState.getState, WiringSelection.deleteWireSilent, WiringUndoRedo.saveStateToUndo, wiringConnections, WiringState.updateWireCount);
window.clearWireSelection = () => WiringSelection.clearWireSelection(WiringSelection.clearWireHighlight);
window.highlightWire = WiringSelection.highlightWire;
window.clearWireHighlight = WiringSelection.clearWireHighlight;
window.updateWireSelectionUI = WiringSelection.updateWireSelectionUI;

// Wire Properties
window.setWireColor = WireProperties.setWireColor;
window.setWireThickness = WireProperties.setWireThickness;
window.updateWireProperties = WireProperties.updateWireProperties;

// Wire Drawing
window.drawWireBetween = (fromMesh, toMesh, options) => {
  const result = WireDrawing.drawWireBetween(fromMesh, toMesh, options, wiringConnections, wireLines, WiringState.updateWireCount);
  if (result) {
    // Update window references
    window.wiringConnections = wiringConnections;
    window.wireLines = wireLines;
  }
  return result;
};
window.refreshAllWires = () => WireDrawing.refreshAllWires(wireLines);
window.generateCurvePoints = WireDrawing.generateCurvePoints;

// Wiring State
window.initializeWiring = WiringState.initializeWiring;
window.getWiringData = WiringState.getWiringData;
window.restoreWiring = (scene, wiringDataArray) => {
  WiringState.restoreWiring(scene, wiringDataArray, WireDrawing.drawWireBetween, TerminalHelpers.findTerminalMeshById, WiringState.updateWireCount);
  // Update window references
  window.wiringConnections = wiringConnections;
  window.wireLines = wireLines;
};
window.clearAllWiring = () => {
  WiringState.clearAllWiring(WiringUndoRedo.saveStateToUndo, WiringState.updateWireCount);
  // Update window references
  window.wiringConnections = wiringConnections;
  window.wireLines = wireLines;
};
window.updateWireCount = WiringState.updateWireCount;
window.deleteWire = (wireMesh) => {
  WireDrawing.deleteWire(wireMesh, wiringConnections, wireLines, WiringState.updateWireCount);
  // Update window references
  window.wiringConnections = wiringConnections;
  window.wireLines = wireLines;
  if (window.selectedWires) {
    // Remove deleted wire from selection
    const index = window.selectedWires.indexOf(wireMesh);
    if (index > -1) {
      window.selectedWires.splice(index, 1);
    }
  }
};

// Arduino Pin Management
window.isArduinoBoard = ArduinoPinManagement.isArduinoBoard;
window.getArduinoBoardType = ArduinoPinManagement.getArduinoBoardType;
window.getArduinoPins = ArduinoPinManagement.getArduinoPins;
window.isPinConnected = ArduinoPinManagement.isPinConnected;
window.setPinConnection = ArduinoPinManagement.setPinConnection;
window.getPinInfo = ArduinoPinManagement.getPinInfo;
window.validatePinConnection = ArduinoPinManagement.validatePinConnection;
window.showPinSelector = ArduinoPinManagement.showPinSelector;
window.hidePinSelector = ArduinoPinManagement.hidePinSelector;

// Component Terminals
window.initializePinsForComponent = ComponentTerminals.initializePinsForComponent;

/*
// LED Behavior Manager (from led_blinking.ts)
window.ledBlinkingManager = ledBlinkingManager;
window.findLEDsConnectedToPin = (pinName) => ledBlinkingManager.findLEDsConnectedToPin(pinName);
window.lightUpLED = (ledComponent, state) => ledBlinkingManager.lightUpLED(ledComponent, state);
window.validateLEDPinCompatibility = (pinType) => ledBlinkingManager.validateLEDPinCompatibility(pinType);
window.checkResistorInPath = (fromMesh, toMesh) => ledBlinkingManager.checkResistorInPath(fromMesh, toMesh);
window.validateLEDConnection = (fromMeta, toMeta, fromMesh, toMesh) => ledBlinkingManager.validateLEDConnection(fromMeta, toMeta, fromMesh, toMesh);

// Resistor Behavior Manager (from resistor-behaviors.ts)
window.resistorBehaviorManager = resistorBehaviorManager;
window.findResistorsConnectedToTerminal = (terminalId) => resistorBehaviorManager.findResistorsConnectedToTerminal(terminalId);

// RFID Behavior Manager (from rfid_rc522_arduino_behavior.ts)
window.rfidRC522BehaviorManager = rfidRC522BehaviorManager;
window.findRFIDsConnectedToPin = (pinName) => rfidRC522BehaviorManager.findRFIDsConnectedToPin(pinName);
*/
// Wiring Debug
window.setTerminalsVisible = WiringDebug.setTerminalsVisible;
window.adjustArduinoPinPosition = WiringDebug.adjustArduinoPinPosition;

// Arduino Pin Display (from arduino-pin-management, not wiring-debug)
window.updateArduinoPinDisplay = ArduinoPinManagement.updateArduinoPinDisplay;

// Backward compatibility aliases
window.getPinAbsolutePosition = TerminalHelpers.getTerminalAbsolutePosition;
window.findClosestPinOnComponent = TerminalHelpers.findClosestTerminalOnComponent;
window.highlightPin = TerminalHelpers.highlightTerminal;

console.log("✅ Wiring logic modules loaded");
console.log("✅ Real-time circuit simulation loaded");
