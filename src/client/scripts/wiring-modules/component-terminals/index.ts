// Component Terminal Initialization - All component terminal creation functions
//@ts-nocheck

import { ARDUINO_PIN_DEFINITIONS } from '../../arduino-config';
import { ledBlinkingManager } from '../../electronic-components/led.ts';
//import { resistorBehaviorManager } from '../../resistor-behaviors';
//import { ultrasonicBehaviorManager } from '../../ultrasonic-behaviour';
import { gasSensorBehaviorManager } from '../../electronic-components/gas-sensor.ts';
//import { rfidRC522BehaviorManager } from '../../rfid_rc522_arduino_behavior ';

/**
 * Main dispatcher: Initialize terminals for any component type
 */

//need fix - why return terminals when terminals are created and applied inside the functions called here-
//also why the array exist and used -no need-
// and no need to edit metadata
export function initializePinsForComponent(component, scene) {
  if (!component || !scene) {
    console.warn('⚠️ initializePinsForComponent: Invalid component or scene');
    return [];
  }

  //need to delete duplicated things
  const metadata = component.metadata || {};
  const componentType = metadata.type || metadata.detectedType || 'unknown';
  const baseName = (metadata.baseName || component.name || '').toLowerCase();

  console.log(`🔌 Initializing pins for component: ${baseName} (type: ${componentType})`);

  const createdTerminals = [];

  // need to find more dynamic way to do it
  //need to fix the condition for all
  if (componentType === 'arduino' || baseName.includes('arduino')) {
    const arduinoPins = initializeArduinoPins(component, scene, baseName);
    createdTerminals.push(...arduinoPins);
    //need fix and choose just one (for all)
    component.metadata.partType = 'arduino';
    component.metadata.componentType = 'arduino';
    component.metadata.boardType = baseName.includes('basic_arduino_uno') ? 'arduino_uno' : 'Arduino-UNO';
    console.log(`✅ Initialized ${arduinoPins.length} Arduino pins for ${baseName}`);
  }
  // Initialize breadboard holes
  else if (componentType === 'breadboard' || baseName.includes('breadboard')) {
    const breadboardTerminals = initializeBreadboardTerminals(component, scene);
    createdTerminals.push(...breadboardTerminals);
    component.metadata.partType = 'breadboard';
    component.metadata.componentType = 'breadboard';
    console.log(`✅ Initialized ${breadboardTerminals.length} breadboard terminals`);
  }
  // Initialize LED component (2-pin component) - Imported from led_blinking.ts
  else if (componentType === 'led' || baseName.includes('led')) {
    const ledTerminals = ledBlinkingManager.initializeLEDTerminals(component, scene);
    createdTerminals.push(...ledTerminals);
    component.metadata.partType = 'led';
    component.metadata.componentType = 'led';
    component.metadata.hasPolarity = true;
    console.log(`✅ Initialized ${ledTerminals.length} LED terminals`);
  }
  // Initialize Battery component
  else if (componentType === 'battery' || baseName.includes('battery') || baseName.includes('9v')) {
    const batteryTerminals = initializeBatteryTerminals(component, scene);
    createdTerminals.push(...batteryTerminals);
    component.metadata.partType = 'battery';
    component.metadata.componentType = 'battery';
    component.metadata.hasPolarity = true;
    component.metadata.voltage = 9;
    console.log(`✅ Initialized ${batteryTerminals.length} battery terminals`);
  }
  // Initialize 10K Ohm Resistor - Imported from resistor-behaviors.ts
  else if (componentType === 'resistor' || baseName.includes('10k') || baseName.includes('10kohm') || baseName.includes('10k_ohm')) {
    const resistorTerminals = resistorBehaviorManager.initializeResistor10KTerminals(component, scene);
    createdTerminals.push(...resistorTerminals);
    component.metadata.partType = 'resistor';
    component.metadata.componentType = 'resistor';
    component.metadata.resistance = 10000;
    component.metadata.hasPolarity = false;
    console.log(`✅ Initialized ${resistorTerminals.length} 10K Ohm resistor terminals`);
  }
  // Initialize 1K Ohm Resistor - Imported from resistor-behaviors.ts
  else if (componentType === 'resistor' || baseName.includes('1k') || baseName.includes('1kohm') || baseName.includes('1k_ohm')) {
    const resistorTerminals = resistorBehaviorManager.initializeResistor1KTerminals(component, scene);
    createdTerminals.push(...resistorTerminals);
    component.metadata.partType = 'resistor';
    component.metadata.componentType = 'resistor';
    component.metadata.resistance = 1000;
    component.metadata.hasPolarity = false;
    console.log(`✅ Initialized ${resistorTerminals.length} 1K Ohm resistor terminals`);
  }
  // Initialize IR Sensor Module (handles both regular and Arduino variants)
  else if (componentType === 'ir_sensor' || baseName.includes('ir_sensor') || baseName.includes('ir sensor') || baseName.includes('ir-module') || baseName.includes('ir_sensor_arduino') || baseName.includes('ir sensor arduino')) {
    const irTerminals = initializeIRSensorModuleTerminals(component, scene);
    createdTerminals.push(...irTerminals);
    component.metadata.partType = 'ir_sensor';
    component.metadata.componentType = 'ir_sensor';
    console.log(`✅ Initialized ${irTerminals.length} IR Sensor terminals`);
  }
  // Initialize 16x2 LCD Display
  else if (componentType === 'lcd' || baseName.includes('lcd') || baseName.includes('16x2') || baseName.includes('1602')) {
    // Use dedicated LCD behavior manager
    if (typeof window.initializeLCD16x2Terminals === 'function') {
      const lcdTerminals = window.initializeLCD16x2Terminals(component, scene);
      createdTerminals.push(...(lcdTerminals || []));
    }
  }
  // Initialize Servo Motor
  else if (componentType === 'servo' || baseName.includes('servo') || baseName.includes('servo_motor')) {
    // Use dedicated servo behavior manager
    if (typeof window.initializeServoMotorTerminals === 'function') {
      const servoTerminals = window.initializeServoMotorTerminals(component, scene);
      createdTerminals.push(...(servoTerminals || []));
    }
  }
  // Initialize Buzzer Module
  else if (componentType === 'buzzer' || baseName.includes('buzzer')) {
    // Use dedicated buzzer behavior manager
    if (typeof window.initializeBuzzerModuleTerminals === 'function') {
      const buzzerTerminals = window.initializeBuzzerModuleTerminals(component, scene);
      createdTerminals.push(...(buzzerTerminals || []));
    }
  }
  // Initialize Ultrasonic Sensor HC-SR04
  else if (componentType === 'ultrasonic' || baseName.includes('ultrasonic') || baseName.includes('hc-sr04') || baseName.includes('hc_sr04')) {
    const ultrasonicTerminals = ultrasonicBehaviorManager.initializeUltrasonicTerminals(component, scene);
    createdTerminals.push(...ultrasonicTerminals);
    component.metadata.partType = 'ultrasonic';
    component.metadata.componentType = 'ultrasonic';
    console.log(`✅ Initialized ${ultrasonicTerminals.length} Ultrasonic Sensor HC-SR04 terminals`);
  }
  // Initialize DHT11 Sensor - NO TERMINALS (user requested)
  else if (componentType === 'dht11' || baseName.includes('dht11') || baseName.includes('dht-11')) {
    // Terminals removed per user request - DHT11 doesn't need terminals
    component.metadata.partType = 'dht11';
    component.metadata.componentType = 'dht11';
    
    // Initialize DHT11 behavior using dedicated behavior manager
    if (typeof window.initializeDHT11 === 'function') {
      window.initializeDHT11(component, scene);
    }
    
    console.log(`✅ DHT11 Sensor loaded (no terminals)`);
  }
  // Initialize MQ2 Gas Sensor - NO TERMINALS (user requested)
  else if (componentType === 'mq2' || baseName.includes('mq2') || baseName.includes('gas_sensor') || baseName.includes('gas sensor')) {
    // Terminals removed per user request - Gas Sensor doesn't need terminals
    component.metadata.partType = 'mq2';
    component.metadata.componentType = 'mq2';
    console.log(`✅ MQ2 Gas Sensor loaded (no terminals)`);
  }
  // Initialize PIR Motion Sensor
  else if (componentType === 'pir' || baseName.includes('pir') || baseName.includes('motion_sensor') || baseName.includes('motion sensor')) {
    const pirTerminals = initializePIRMotionSensorTerminals(component, scene);
    createdTerminals.push(...pirTerminals);
    component.metadata.partType = 'pir';
    component.metadata.componentType = 'pir';
    console.log(`✅ Initialized ${pirTerminals.length} PIR Motion Sensor terminals`);
  }
  // Initialize RFID RC522 Module - Imported from rfid_rc522_arduino_behavior.ts
  else if (componentType === 'rfid' || baseName.includes('rfid') || baseName.includes('rc522') || baseName.includes('rfid-rc522')) {
    const rfidTerminals = rfidRC522BehaviorManager.initializeRFIDRC522Terminals(component, scene);
    createdTerminals.push(...rfidTerminals);
    component.metadata.partType = 'rfid';
    component.metadata.componentType = 'rfid';
    console.log(`✅ Initialized ${rfidTerminals.length} RFID RC522 Module terminals`);
  }

  return createdTerminals;
}


/**
 * Initialize Arduino UNO pin terminals
 * Arduino UNO pin layout (standard positions):
 * - Digital pins (D0-D13) on right side
 * - Analog pins (A0-A5) on left side
 * - Power pins (5V, 3.3V, VIN, GND) on both sides
 */
//need refactor
//we dont need to pass basename becouse its not used
function initializeArduinoPins(component, scene, baseName) {
  //check why this array is needed posibly no need for it becouse terminals are created here and no need to return them
  const terminals = [];

  //need to find a better logic for it and need refactor
  // Get board type for pin definitions
  const boardType = 'Arduino-UNO';
  // ✅ Use centralized pin definitions from arduino-config.ts
  const pinDef = ARDUINO_PIN_DEFINITIONS[boardType] || window.ARDUINO_PIN_DEFINITIONS?.[boardType];

  if (!pinDef) {
    console.warn(`⚠️ No pin definitions found for ${boardType}`);
    return terminals;
  }

  // Arduino UNO pin positions - Updated 3D coordinates for Arduino GLB model
  // Positioned on actual pin headers of the Arduino board with precise measurements
  const pinSpacing = 2.68;  // Standard Arduino pin spacing (2.54mm scaled)

  const pinPositions = {
    // Digital pins D0-D7 (right side, top header, front to back)
    // Updated coordinates for better alignment with GLB model
    'D0': { x: 11.7, y: 0.18, z: 28 },
    'D1': { x: 11.7, y: 0.18, z: 28 - pinSpacing },
    'D2': { x: 11.7, y: 0.18, z: 28 - pinSpacing * 2 },
    'D3': { x: 11.7, y: 0.18, z: 28 - pinSpacing * 3 },
    'D4': { x: 11.7, y: 0.18, z: 28 - pinSpacing * 4 },
    'D5': { x: 11.7, y: 0.18, z: 28 - pinSpacing * 5 },
    'D6': { x: 11.7, y: 0.18, z: 28 - pinSpacing * 6 },
    'D7': { x: 11.7, y: 0.18, z: 28 - pinSpacing * 7 },

    'D8': { x: 11.7, y: 0.18, z: 27 - pinSpacing *8},
    'D9': { x: 11.7, y: 0.18, z: 27 - pinSpacing *9},
    'D10': { x: 11.7, y: 0.18, z: 27 - pinSpacing * 10 },
    'D11': { x: 11.7, y: 0.18, z: 27 - pinSpacing * 11 },
    'D12': { x: 11.7, y: 0.18, z: 27 - pinSpacing * 12 },
    'D13': { x: 11.7, y: 0.18, z: 27 - pinSpacing * 13 },
    'A5': { x: -36, y: 0.18, z: 28 },
    'A4': { x: -36, y: 0.18, z: 28 - pinSpacing },
    'A3': { x: -36, y: 0.18, z: 28 - pinSpacing * 2 },
    'A2': { x: -36, y: 0.18, z: 28 - pinSpacing * 3 },
    'A1': { x: -36, y: 0.18, z: 28 - pinSpacing * 4 },
    'A0': { x: -36, y: 0.18, z: 28 - pinSpacing * 5 },

    'VIN': { x: -36, y: 0.18, z: 26 - pinSpacing *6},
    'GND': { x: -36, y: 0.18, z: 26 - pinSpacing *7},
    '5V': { x: -36, y: 0.18, z: 26 - pinSpacing * 8 },
    '3.3V': { x: -36, y: 0.18, z: 26 - pinSpacing * 9 }
  };

  // Create terminal meshes for each pin
  const allPins = [
    ...(pinDef.digital || []),
    ...(pinDef.analog || []),
    ...(pinDef.power || []),
    ...(pinDef.ground || [])
  ];

  allPins.forEach((pinName) => {
    const pinPos = pinPositions[pinName];
    if (!pinPos) {
      console.warn(`⚠️ No position defined for pin ${pinName}`);
      return;
    }

    // Create terminal sphere - enhanced for better visibility and picking
    const terminal = BABYLON.MeshBuilder.CreateSphere(
      `terminal_${component.name}_${pinName}`,
      { diameter: 3 }, // Increased diameter for better picking and visibility
      scene
    );

    // Position relative to Arduino board
    terminal.position = new BABYLON.Vector3(pinPos.x, 78 * pinPos.y, pinPos.z);
    terminal.parent = component;

    // Enhanced terminal visibility for better user experience
    terminal.visibility = 0.7; // Increased visibility for clearer terminal identification
    terminal.isPickable = true;
    terminal.enablePointerMoveEvents = true;
    terminal.renderingGroupId = 1; // Render on top

    //all metadata need check
    // Add metadata
    terminal.metadata = {
      isTerminal: true,
      terminalId: `${component.uniqueId || component.name}_${pinName}`,
      terminalName: pinName,
      pinName: pinName,
      partType: 'arduino',
      arduinoBoard: component,
      isArduinoPin: true,
      pinInfo: pinDef.pinTypes ? pinDef.pinTypes[pinName] : null
    };

    // Create material for potential visual feedback
    const mat = new BABYLON.StandardMaterial(`mat_terminal_${pinName}`, scene);
    mat.diffuseColor = new BABYLON.Color3(1, 1, 0);
    mat.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0);
    mat.alpha = 0.7; // Match visibility with material alpha
    terminal.material = mat;

    // ✅ Dynamic labeling system using BABYLON.GUI
    let label = null;
    let labelTexture = null;

    //need check
    try {
      // Check if GUI is available
      if (typeof BABYLON.GUI !== 'undefined' && typeof BABYLON.GUI.AdvancedDynamicTexture !== 'undefined') {
        // Create GUI texture for labels
        if (!window.arduinoLabelTexture) {
          window.arduinoLabelTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("ArduinoLabelsUI", true, scene);
          window.arduinoLabelTexture.idealWidth = 1920;
          window.arduinoLabelTexture.idealHeight = 1080;
          window.arduinoLabelTexture.renderAtIdealSize = true;
        }

        labelTexture = window.arduinoLabelTexture;

        // Create text block for pin label
        label = new BABYLON.GUI.TextBlock(`label_${component.name}_${pinName}`, pinName);
        label.color = "#FFFFFF";
        label.fontSize = 14;
        label.fontWeight = "bold";
        label.outlineWidth = 2;
        label.outlineColor = "#000000";
        label.background = "#1a73e8";
        label.paddingTop = "2px";
        label.paddingBottom = "2px";
        label.paddingLeft = "4px";
        label.paddingRight = "4px";
        label.cornerRadius = 3;

        // Position label above terminal
        labelTexture.addControl(label);

        label.linkWithMesh(terminal);
        label.linkOffsetY = -30; // Offset above terminal


        // Store label reference in terminal metadata
        terminal.metadata.label = label;
        terminal.metadata.labelTexture = labelTexture;

        //need check
        // Initially hide labels (toggle with 'L' key)
        label.isVisible = window.showArduinoLabels !== false;
      } else {
        console.warn('BABYLON.GUI not available, labels will not be created');
      }
    } catch (error) {
      console.warn('Error creating label for pin:', pinName, error);
    }

    terminals.push(terminal);
  });

  // Store terminals on component for later access
  component.metadata.terminals = terminals;
  component.metadata.hasTerminals = true;

  //need check
  // Store label visibility state
  if (!window.hasOwnProperty('showArduinoLabels')) {
    window.showArduinoLabels = false; // Labels hidden by default
  }

  return terminals;

}


/**
 * Initialize breadboard terminal holes
 */
function initializeBreadboardTerminals(component, scene) {
  const terminals = [];
  const holeSpacing = 0.05;
  const troughGap = 0.05;
  const rows = 60;
  const columns = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
  const startX = -0.25;
  const startZ = 1.75;
  const holeY = 0.2; // changed from 0.07 to 0.05 to make the holes above the board surface a little bit.

  for (let row = 1; row <= rows; row++) {
    for (let colIndex = 0; colIndex < columns.length; colIndex++) {
      const col = columns[colIndex];
      let xOffset = colIndex * holeSpacing ;
      if (colIndex > 4) {
        xOffset += troughGap;
      }
      const x = startX + xOffset;
      const z = startZ - ((row - 1) * holeSpacing);
      const holeName = `${col}${row}`;
      const terminal = BABYLON.MeshBuilder.CreateSphere(
        `terminal_${component.name}_${holeName}`,
        { diameter: 0.02 },
        scene
      );
      terminal.parent = component;
      terminal.position = new BABYLON.Vector3(z, x , holeY);
      terminal.visibility = 1;
      terminal.isPickable = true;
      // Flatten metadata: copy component metadata directly into terminal metadata
      const compMeta = component.metadata || {};
      terminal.metadata = {
        isTerminal: true,
        terminalId: `${component.uniqueId || component.name}_${holeName}`,
        terminalName: holeName,
        partType: 'breadboard',
        componentId: component.uniqueId || component.name,
        componentName: component.name,
        // Copy relevant component metadata directly
        baseName: compMeta.baseName || compMeta.fileName || compMeta.originalFileName,
        fileName: compMeta.fileName,
        originalFileName: compMeta.originalFileName,
        componentType: compMeta.componentType || compMeta.type || 'breadboard',
        kit: compMeta.kit,
        loadedAt: compMeta.loadedAt,
        // Terminal-specific properties
        row: row,
        column: col,
        connectedGroup: colIndex < 5 ? `row${row}_left` : `row${row}_right`,
        isBreadboardTerminal: true,
        holeId: holeName
      };
      const mat = new BABYLON.StandardMaterial(`mat_terminal_${holeName}`, scene);
      mat.diffuseColor = new BABYLON.Color3(0, 1, 0);
      mat.emissiveColor = new BABYLON.Color3(0, 0.2, 0);
      terminal.material = mat;
      terminals.push(terminal);
    }
  }

  const powerRailPositions = [
    { name: '+_left', x: startX - 0.08, type: 'power' },
    { name: '-_left', x: startX - 0.13, type: 'ground' },
    { name: '+_right', x: startX + (9 * holeSpacing) + troughGap + 0.08, type: 'power' },
    { name: '-_right', x: startX + (9 * holeSpacing) + troughGap + 0.13, type: 'ground' }
  ];

  for (let row = 1; row <= rows; row++) {
    powerRailPositions.forEach(rail => {
      const railHoleName = `${rail.name}_${row}`;
      const terminal = BABYLON.MeshBuilder.CreateSphere(
        `terminal_${component.name}_${railHoleName}`,
        { diameter: 0.02 },
        scene
      );
      terminal.parent = component;
      terminal.position = new BABYLON.Vector3(startZ - ((row - 1) * holeSpacing),rail.x, holeY);
      terminal.metadata = {
        isTerminal: true,
        terminalId: `${component.uniqueId || component.name}_${railHoleName}`,
        terminalName: railHoleName,
        partType: 'breadboard',
        railType: rail.type,
        isPowerRail: true
      };
      const mat = new BABYLON.StandardMaterial(`mat_rail_${railHoleName}`, scene);
      mat.diffuseColor = rail.type === 'power' ? new BABYLON.Color3(1, 0, 0) : new BABYLON.Color3(0, 0, 1);
      terminal.material = mat;
      terminals.push(terminal);
    });
  }

  component.metadata.terminals = terminals;
  component.metadata.hasTerminals = true;
  return terminals;
}

/**
 * Initialize Battery component terminals
 */
function initializeBatteryTerminals(component, scene) {
  const terminals = [];
  component.computeWorldMatrix(true);
  const childMeshes = component.getChildMeshes(true);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;

  childMeshes.forEach(mesh => {
    if (mesh.getBoundingInfo) {
      mesh.computeWorldMatrix(true);
      const boundingInfo = mesh.getBoundingInfo();
      const boundingBox = boundingInfo.boundingBox;
      const worldMatrix = component.getWorldMatrix();
      const invWorldMatrix = worldMatrix.clone();
      invWorldMatrix.invert();
      const corners = [
        boundingBox.minimumWorld, boundingBox.maximumWorld,
        new BABYLON.Vector3(boundingBox.minimumWorld.x, boundingBox.minimumWorld.y, boundingBox.maximumWorld.z),
        new BABYLON.Vector3(boundingBox.minimumWorld.x, boundingBox.maximumWorld.y, boundingBox.minimumWorld.z),
        new BABYLON.Vector3(boundingBox.maximumWorld.x, boundingBox.minimumWorld.y, boundingBox.minimumWorld.z),
        new BABYLON.Vector3(boundingBox.minimumWorld.x, boundingBox.maximumWorld.y, boundingBox.maximumWorld.z),
        new BABYLON.Vector3(boundingBox.maximumWorld.x, boundingBox.minimumWorld.y, boundingBox.maximumWorld.z),
        new BABYLON.Vector3(boundingBox.maximumWorld.x, boundingBox.maximumWorld.y, boundingBox.minimumWorld.z)
      ];
      corners.forEach(corner => {
        const localCorner = BABYLON.Vector3.TransformCoordinates(corner, invWorldMatrix);
        minX = Math.min(minX, localCorner.x);
        maxX = Math.max(maxX, localCorner.x);
        minY = Math.min(minY, localCorner.y);
        maxY = Math.max(maxY, localCorner.y);
        minZ = Math.min(minZ, localCorner.z);
        maxZ = Math.max(maxZ, localCorner.z);
      });
    }
  });

  if (minX === Infinity) {
    console.warn('⚠️ Could not detect battery dimensions, using fallback values');
    minX = -0.5; maxX = 0.5; minY = -1.0; maxY = 1.0; minZ = -0.3; maxZ = 0.3;
  }
  // Determine terminal positions based on detected dimensions(تعديل هنا)
  const terminalPositions = {
    'positive': { x: -1.3, y: 0, z: -4.0 }, //z:-2.9
    'negative': { x: -2.8, y: 0, z: -4.0 } //z:-2.9
  };

  ['positive', 'negative'].forEach(terminalName => {
    const terminalPos = terminalPositions[terminalName];
    const terminal = BABYLON.MeshBuilder.CreateSphere(
      `terminal_${component.name}_${terminalName}`,
      { diameter: 0.3 },
      scene
    );
    terminal.position = new BABYLON.Vector3(terminalPos.x, terminalPos.y, terminalPos.z);
    terminal.parent = component;
    terminal.visibility = 0.8;
    terminal.isPickable = true;
    terminal.enablePointerMoveEvents = true;
    terminal.renderingGroupId = 2;
    // Flatten metadata: copy component metadata directly into terminal metadata
    const compMeta = component.metadata || {};
    terminal.metadata = {
      isTerminal: true,
      terminalId: `${component.uniqueId || component.name}_${terminalName}`,
      terminalName: terminalName,
      partType: 'battery',
      componentId: component.uniqueId || component.name,
      componentName: component.name,
      // Copy relevant component metadata directly
      baseName: compMeta.baseName || compMeta.fileName || compMeta.originalFileName,
      fileName: compMeta.fileName,
      originalFileName: compMeta.originalFileName,
      componentType: compMeta.componentType || compMeta.type || 'battery',
      voltage: compMeta.voltage || (terminalName === 'positive' ? 9 : 0),
      hasPolarity: compMeta.hasPolarity !== undefined ? compMeta.hasPolarity : true,
      kit: compMeta.kit,
      loadedAt: compMeta.loadedAt,
      // Terminal-specific properties
      isBatteryTerminal: true,
      polarity: terminalName === 'positive' ? 'positive' : 'negative',
      pinInfo: {
        type: terminalName === 'positive' ? 'power' : 'ground',
        voltage: terminalName === 'positive' ? 9 : 0
      }
    };
    const mat = new BABYLON.StandardMaterial(`mat_terminal_${terminalName}`, scene);
    if (terminalName === 'positive') {
      mat.diffuseColor = new BABYLON.Color3(1, 0, 0);
      mat.emissiveColor = new BABYLON.Color3(0.6, 0, 0);
    } else {
      mat.diffuseColor = new BABYLON.Color3(0, 0, 0);
      mat.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    }
    mat.alpha = 0.9;
    terminal.material = mat;
    terminals.push(terminal);
  });

  // Ensure all battery child meshes are pickable for selection from any side
  component.isPickable = true;
  childMeshes.forEach(mesh => {
    if (mesh && !mesh.metadata?.isTerminal) {
      mesh.isPickable = true;
      mesh.enablePointerMoveEvents = true;
    }
  });

  component.metadata.terminals = terminals;
  component.metadata.hasTerminals = true;
  return terminals;
}

// Sensor initialization functions (abbreviated for space - full implementations follow same pattern)
function initializeIRSensorModuleTerminals(component, scene) {
  return createSensorTerminals(component, scene, ['vcc', 'gnd', 'out'], 'ir_sensor', 'irSensorComponent', 'isIRSensorPin');
}





function initializeDHT11SensorTerminals(component, scene) {
  return createSensorTerminals(component, scene, ['vcc', 'gnd', 'data'], 'dht11', 'dht11Component', 'isDHT11Pin');
}


function initializePIRMotionSensorTerminals(component, scene) {
  return createSensorTerminals(component, scene, ['vcc', 'gnd', 'out'], 'pir', 'pirComponent', 'isPIRPin');
}

//need check posibly not needed
// Helper functions
function createSensorTerminals(component, scene, pinNames, partType, componentRef, pinFlag) {
  const terminals = [];
  const positions = {
    'vcc': { x: 0, y: -6, z: 0.1 },
    'gnd': { x: -2, y: -6, z: 0 },
    'out': { x: -4, y: -6, z: -0.1 },
    'signal': { x: -4, y: -6, z: -0.1 },
    'trig': { x: -4, y: -6, z: -0.1 },
    'echo': { x: -6, y: -6, z: -0.2 },
    'data': { x: -4, y: -6, z: -0.1 },
    'a0': { x: -4, y: -6, z: -0.1 },
    'd0': { x: -6, y: -6, z: -0.2 }
  };
  pinNames.forEach((pinName, index) => {
    const pos = positions[pinName] || { x: -index * 2, y: -6, z: 0 };
    const terminal = createTerminal(component, scene, pinName, pos, 0.3);
    // Flatten metadata: component metadata already copied in createTerminal, just add part-specific props
    terminal.metadata.partType = partType;
    terminal.metadata[pinFlag] = true;
    terminal.metadata.pinInfo = {
      type: pinName === 'vcc' ? 'power' : pinName === 'gnd' ? 'ground' : 'signal',
      voltage: pinName === 'vcc' ? 5 : 0
    };
    setTerminalMaterial(terminal, pinName, scene, pinName === 'vcc' ? 'power' : pinName === 'gnd' ? 'ground' : 'signal');
    terminals.push(terminal);
  });
  component.metadata.terminals = terminals;
  component.metadata.hasTerminals = true;
  return terminals;
}

//need check posibly not needed
function createTerminal(component, scene, pinName, pos, diameter) {
 
  const terminal = BABYLON.MeshBuilder.CreateSphere(
    `terminal_${component.name}_${pinName}`,
    { diameter },
    scene
  );
  terminal.position = new BABYLON.Vector3(pos.x, pos.y, pos.z);
  terminal.parent = component;
  // Terminals should only be visible when in wiring mode
  // Check current wiring mode state (default to false if not set)
  const isWiringMode = window.wiringMode || false;
  terminal.visibility = isWiringMode ? 0.2 : 0;
  terminal.isPickable = true;
  terminal.enablePointerMoveEvents = true;
  terminal.renderingGroupId = 2;
  
  // Flatten metadata: copy component metadata directly into terminal metadata
  const compMeta = component.metadata || {};
  terminal.metadata = {
    isTerminal: true,
    terminalId: `${component.uniqueId || component.name}_${pinName}`,
    terminalName: pinName,
    componentId: component.uniqueId || component.name,
    componentName: component.name,
    // Copy relevant component metadata directly
    baseName: compMeta.baseName || compMeta.fileName || compMeta.originalFileName,
    fileName: compMeta.fileName,
    originalFileName: compMeta.originalFileName,
    componentType: compMeta.componentType || compMeta.type,
    kit: compMeta.kit,
    loadedAt: compMeta.loadedAt
  };
  return terminal;
}

//need check posibly not needed
function setTerminalMaterial(terminal, pinName, scene, type) {
  const mat = new BABYLON.StandardMaterial(`mat_terminal_${pinName}`, scene);
  if (type === 'power') {
    mat.diffuseColor = new BABYLON.Color3(1, 0, 0);
    mat.emissiveColor = new BABYLON.Color3(0.5, 0, 0);
  } else if (type === 'ground') {
    mat.diffuseColor = new BABYLON.Color3(0, 0, 1);
    mat.emissiveColor = new BABYLON.Color3(0, 0, 0.3);
  } else {
    const signalColors = {
      'out': new BABYLON.Color3(0, 1, 0),
      'signal': new BABYLON.Color3(1, 1, 0),
      'trig': new BABYLON.Color3(0, 1, 1),
      'echo': new BABYLON.Color3(0, 1, 1),
      'data': new BABYLON.Color3(0, 1, 0),
      'a0': new BABYLON.Color3(1, 0.5, 1),
      'd0': new BABYLON.Color3(1, 0.5, 1)
    };
    const color = signalColors[pinName] || new BABYLON.Color3(0.5, 0.5, 0.5);
    mat.diffuseColor = color;
    mat.emissiveColor = color.scale(0.3);
  }
  terminal.material = mat;
}
