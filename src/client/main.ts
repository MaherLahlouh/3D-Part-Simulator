

//need check the imports and import just needed things
import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui'; 
import 'babylonjs-loaders';
import 'babylonjs-materials';

//import './scripts/environment/theme.ts'
import { initTheme } from './scripts/environment/theme.ts'; 

import { SceneSetup } from './scripts/environment/scene-setup.ts'; 
initTheme();
SceneSetup();

import { setupArduinoUploader } from './scripts/board-sellector.ts'; 
import { initManualConnectionMode } from './scripts/manual-connection-mode.ts';
import { initHouseGroupManager } from './scripts/manual-connection-ui.ts';

(window as any).BABYLON = BABYLON;
(window as any).BABYLON.GUI = GUI;

import { setupCameraControlsButtons } from './scripts/environment/camera-system.ts'
setupCameraControlsButtons();


import { initHouseConnectionSystem } from './scripts/house-connection-system.ts';
import { initHouseConnectionHandler } from './scripts/house-connection-handler.ts';
// House Tutorial System
import { initHouseTutorial } from './scripts/house-tutorial.ts';



// Logic & UI Controllers
import './scripts/enhancements.ts';

import './scripts/save-load.ts';
import './scripts/drag-logic.ts';
import './scripts/part-loader.ts';
import './scripts/monaco.ts';
//new imports for side menu and learn export
import './scripts/learn-export.ts'
import './scripts/side-menue.ts'
//-------------------------------------------
import './scripts/debug.ts';
import { initializeMenu } from './scripts/parts/parts-menu.ts';
initializeMenu();
import './scripts/board-sellector.ts'; // Note: Your spelling "sellector"


import './scripts/event-handeler.ts'; // Note: Your spelling "handeler"




// Manual Connection Features
 import './scripts/manual-connection-instructions.ts';
 import './scripts/manual-connection-mode.ts';
 import './scripts/manual-connection-ui.ts';

// // Core Simulator Logic
// import './js/avr8-simulator.js';
 import './scripts/arduino-config.ts';  // ✅ Must load first - centralized hardware definitions
 import './scripts/wiring-logic.ts';  // Must load before wiring-controls.ts (provides drawWireBetween)
 import './scripts/wiring-controls.ts';
 import './scripts/collision-system.ts';
 import './scripts/component-properties.ts';
 import './scripts/component-behaviors.ts';
 import './scripts/panel-minimize.ts';


console.log("🚀 MAIN.TS: All scripts imported!");

const selectedKit = localStorage.getItem('selectedKit');

console.log("🛠️ SIMULATOR STATE: Checking for kit...");

document.addEventListener('DOMContentLoaded', () => {
    console.log("🔌 Initializing Arduino Uploader...");
    setupArduinoUploader();
    initManualConnectionMode();
    initHouseGroupManager();
    initHouseConnectionSystem();
    initHouseConnectionHandler();
    initHouseTutorial();
});

import { authService } from './scripts/services/authService.ts';
const loginButton = document.getElementById('logoutBtn');
loginButton?.addEventListener('click', () => {
    authService.logout();
});



if (selectedKit) {
    console.log(`✅ Kit Found: ${selectedKit}`);
    
    // We wait a moment to ensure Babylon/UI is ready, then trigger any specific setup
    // If your "componentLibrary.js" or "simulator-ui-controller.js" has a setup function, call it here.
    // Example:
    // if (typeof loadKit === 'function') loadKit(selectedKit);
    
} else {
    console.warn("⚠️ No kit selected. User might have come directly to this page.");
    // Optional: Redirect back to landing?
    // window.location.href = "/index.html";
}


import './scripts/avr-executor.ts';


