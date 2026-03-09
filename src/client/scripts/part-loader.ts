// partLoader.js - COMPLETE VERSION with COLLISION SYSTEM INTEGRATION
// Objects spawn ON GROUND with proper positioning and automatic collision registration
//@ts-nocheck
const loadedParts = [];
window.loadedParts = loadedParts;
window.allParts = loadedParts;


//need to put all window functions in one place and use variables from there



// ENHANCEMENT #4: MEMORY LEAK PREVENTION - Asset caching with limits
// Track which assets have been loaded this session for faster subsequent loads
const loadedAssetMetadata = new Map();
const MAX_CACHE_SIZE = 50; // Maximum number of cached assets
const MAX_CACHE_AGE = 30 * 60 * 1000; // 30 minutes in milliseconds

//need check if it used correctly and maybe not needed
function markAssetLoaded(fileName, size) {
    // Check cache size limit
    if (loadedAssetMetadata.size >= MAX_CACHE_SIZE) {
        // Remove oldest entry
        const oldestKey = loadedAssetMetadata.keys().next().value;
        loadedAssetMetadata.delete(oldestKey);
        console.log(`🗑️ Cache limit reached, removed oldest: ${oldestKey}`);
    }
    loadedAssetMetadata.set(fileName, {
        fileName: fileName,
        size: size,
        loadedAt: Date.now()
    });
}

//need to know why this function exists and where it is used
function isAssetLoadedBefore(fileName) {
    const entry = loadedAssetMetadata.get(fileName);
    if (!entry) return false;
    // Check if cache entry is too old
    const age = Date.now() - entry.loadedAt;
    if (age > MAX_CACHE_AGE) {
        loadedAssetMetadata.delete(fileName);
        console.log(`🗑️ Cache entry expired: ${fileName}`);
        return false;
    }
    return true;
}


function getAssetCacheStats() {
    return {
        count: loadedAssetMetadata.size,
        maxSize: MAX_CACHE_SIZE,
        maxAge: MAX_CACHE_AGE,
        assets: Array.from(loadedAssetMetadata.keys())
    };
}

function clearAssetCache() {
    loadedAssetMetadata.clear();
    console.log('🗑️ Asset cache metadata cleared');
}

// Clean up old cache entries periodically
setInterval(() => {
    const now = Date.now();
    const keysToDelete = [];
    loadedAssetMetadata.forEach((entry, key) => {
        if (now - entry.loadedAt > MAX_CACHE_AGE) {
            keysToDelete.push(key);
        }
    });
    keysToDelete.forEach(key => {
        loadedAssetMetadata.delete(key);
        console.log(`🗑️ Auto-removed expired cache: ${key}`);
    });
    if (keysToDelete.length > 0) {
        console.log(`🧹 Cleaned ${keysToDelete.length} expired cache entries`);
    }
}, 5 * 60 * 1000); // Check every 5 minutes

//window.loadedAssetMetadata = loadedAssetMetadata;
window.clearAssetCache = clearAssetCache;
window.getAssetCacheStats = getAssetCacheStats;

// ENHANCEMENT #3: LOADING STATE FEEDBACK SYSTEM
// Purpose: Enhanced loading feedback with progress tracking
// Called from: All loading operations throughout the application

/**
 * Show loading overlay with message
 * @param {string} message - Loading message to display
 * @param {number} progress - Progress percentage (0-100)
 */
// need to put in another place 
function showLoadingOverlay(message = 'Loading...', progress = 0) {
    const overlay = document.getElementById("loadingOverlay");
    const loadingText = document.getElementById("loadingText");
    const loadingProgressFill = document.getElementById("loadingProgressFill");
    const loadingPercentage = document.getElementById("loadingPercentage");
    const loadingProgressBar = document.getElementById("loadingProgressBar");

    if (overlay) overlay.style.display = "flex";
    if (loadingText) loadingText.textContent = message;
    if (loadingProgressBar) loadingProgressBar.style.display = "block";
    if (loadingPercentage) {
        loadingPercentage.style.display = "block";
        loadingPercentage.textContent = Math.round(progress) + "%";
    }
    if (loadingProgressFill) loadingProgressFill.style.width = Math.round(progress) + "%";
}

/**
 * Update loading progress
 * @param {number} progress - Progress percentage (0-100)
 * @param {string} message - Optional message update
 */
// need to put in another place 
function updateLoadingProgress(progress, message = null) {
    const loadingText = document.getElementById("loadingText");
    const loadingProgressFill = document.getElementById("loadingProgressFill");
    const loadingPercentage = document.getElementById("loadingPercentage");

    if (loadingProgressFill) loadingProgressFill.style.width = Math.round(progress) + "%";
    if (loadingPercentage) loadingPercentage.textContent = Math.round(progress) + "%";
    if (message && loadingText) loadingText.textContent = message;
}

/**
 * Hide loading overlay
 */
// need to put in another place 
function hideLoadingOverlay() {
    const overlay = document.getElementById("loadingOverlay");
    const loadingProgressBar = document.getElementById("loadingProgressBar");
    const loadingPercentage = document.getElementById("loadingPercentage");

    if (overlay) overlay.style.display = "none";
    if (loadingProgressBar) loadingProgressBar.style.display = "none";
    if (loadingPercentage) loadingPercentage.style.display = "none";
}

// Export loading functions globally
window.showLoadingOverlay = showLoadingOverlay;
window.updateLoadingProgress = updateLoadingProgress;
window.hideLoadingOverlay = hideLoadingOverlay;

//need to find better way to use it 
//suggeston: use it just for kit selection not for parts
//suggeston: use a json file to store kit parts
//need to find better way to write it
const KIT_PARTS = {
    house: {
        name: 'House Kit',
        parts: {
            'part_1': 'part_1.obj',
            'part_2': 'part_2.obj',
            'part_3': 'part_3.obj',
            'part_4': 'part_4.obj',
            'part_5': 'part_5.obj',
            'part_6': 'part_6.obj',
            'part_7': 'part_7.obj',
            'part_8': 'part_8.obj',
            'part_9': 'part_9.obj',
            'part_10': 'part_10.obj',
            'part_11': 'part_11.obj',
            'part_12': 'part_12.obj',
            'part_13': 'part_13.obj',
            'part_14': 'part_14.obj',
            'part_15': 'part_15.obj',
        }
    },
    byte: {
        name: 'Byte Kit',
        parts: {
            'basic_arduino_uno': 'basic_arduino_uno.glb',
            'motor_driver': 'L293D.glb',
            'holding_board': 'holding_board__9V.glb',
            'battery': '9V-battery.glb',
            'chassis': 'chassis_-SL.glb',
            'wheel': 'master_wheel.glb',
            'motor': 'N20DCMotor.glb',
            'track': 'Mechachical_track_Yellow.glb',
            'slave_wheel': 'slave_wheel_SL.glb',
            'led_light': 'led_light.glb',
            '1k_ohm_resistor': '1k_ohm_resistor.glb',
            '10k_ohm_resistor': '10k_ohm_resistor.glb',
            'ir_sensor_module': 'ir_sensor_module.glb',
            'ir_sensor_module_for_arduino_projects__3d_model': 'ir_sensor_module_for_arduino_projects__3d_model.glb',
            '162__lcd_display': '162__lcd_display.glb',
            'lcd_16x2_second try': 'lcd_16x2_second try.glb',
            // ✅ New sensor components - Byte Kit now supports up to 20 parts
            'arduino_module_buzzer': 'arduino_module_buzzer.glb',
            'servo': 'servo.glb',
            'hc_sr04': 'hc_sr04.glb',
            'modulo_sensor_de_umidade_e_temperatura_dht11': 'modulo_sensor_de_umidade_e_temperatura_dht11.glb',
            'mq2_lpg_co_smoke_gas_sensor': 'mq2_lpg_co_smoke_gas_sensor.glb',
            'pir_sensor': 'pir_sensor.glb',
            'rfid_readwrite_module_rc522': 'rfid_readwrite_module_rc522.glb'
        }
    },
    normal: {
        name: 'Standard Kit',
        parts: 'all'
    }
};

//need to find better way to write it
const FILENAME_MAPPING = {
    'part_1': 'part_1.obj',
    'part_2': 'part_2.obj',
    'part_3': 'part_3.obj',
    'part_4': 'part_4.obj',
    'part_5': 'part_5.obj',
    'part_6': 'part_6.obj',
    'part_7': 'part_7.obj',
    'part_8': 'part_8.obj',
    'part_9': 'part_9.obj',
    'part_10': 'part_10.obj',
    'part_11': 'part_11.obj',
    'part_12': 'part_12.obj',
    'part_13': 'part_13.obj',
    'part_14': 'part_14.obj',
    'part_15': 'part_15.obj',
    'battery': '9V-battery.glb',
    'Battery': '9V-battery.glb',
    '9V-battery': '9V-battery.glb',
    'L293D': 'L293D.glb',
    'motor_driver': 'L293D.glb',
    'holding_board': 'holding_board__9V.glb',
    'holding_board__9V': 'holding_board__9V.glb',
    'chassis': 'chassis_-SL.glb',
    'chassis_-SL': 'chassis_-SL.glb',
    'wheel': 'master_wheel.glb',
    'master_wheel': 'master_wheel.glb',
    'slave_wheel': 'slave_wheel_SL.glb',
    'slave_wheel_SL': 'slave_wheel_SL.glb',
    'motor': 'N20DCMotor.glb',
    'N20DCMotor': 'N20DCMotor.glb',
    'track': 'Mechachical_track_Yellow.glb',
    'Mechachical_track_Yellow': 'Mechachical_track_Yellow.glb',
    'breadboard': 'breadboard.glb',
    'basic_arduino_uno': 'basic_arduino_uno.glb',
    'led_light': 'led_light.glb',
    'led': 'led_light.glb',
    '1k_ohm_resistor': '1k_ohm_resistor.glb',
    'resistor_1k': '1k_ohm_resistor.glb',
    '10k_ohm_resistor': '10k_ohm_resistor.glb',
    'resistor_10k': '10k_ohm_resistor.glb',
    'ir_sensor': 'ir_sensor_module.glb',
    'ir_sensor_module': 'ir_sensor_module.glb',
    'ir_sensor_module_for_arduino_projects__3d_model': 'ir_sensor_module_for_arduino_projects__3d_model.glb',
    'lcd_display': '162__lcd_display.glb',
    'lcd_16x2': '162__lcd_display.glb',
    '162__lcd_display': '162__lcd_display.glb',
    'lcd_16x2_second try': 'lcd_16x2_second try.glb',
    'lcd_16x2_second_try': 'lcd_16x2_second try.glb',
    'servo': 'servo.glb',
    'servo_motor': 'servo.glb',
    // New sensor and module components
    'arduino_module_buzzer': 'arduino_module_buzzer.glb',
    'buzzer': 'arduino_module_buzzer.glb',
    'hc_sr04': 'hc_sr04.glb',
    'ultrasonic_sensor': 'hc_sr04.glb',
    'modulo_sensor_de_umidade_e_temperatura_dht11': 'modulo_sensor_de_umidade_e_temperatura_dht11.glb',
    'dht11': 'modulo_sensor_de_umidade_e_temperatura_dht11.glb',
    'dht11_sensor': 'modulo_sensor_de_umidade_e_temperatura_dht11.glb',
    'mq2_lpg_co_smoke_gas_sensor': 'mq2_lpg_co_smoke_gas_sensor.glb',
    'mq2': 'mq2_lpg_co_smoke_gas_sensor.glb',
    'gas_sensor': 'mq2_lpg_co_smoke_gas_sensor.glb',
    'pir_sensor': 'pir_sensor.glb',
    'motion_sensor': 'pir_sensor.glb',
    'rfid_readwrite_module_rc522': 'rfid_readwrite_module_rc522.glb',
    'rfid_rc522': 'rfid_readwrite_module_rc522.glb',
    'rfid_module': 'rfid_readwrite_module_rc522.glb',
};

window.KIT_PARTS = KIT_PARTS;
window.FILENAME_MAPPING = FILENAME_MAPPING;

// Purpose: Get currently selected kit from localStorage
// Called from: isPartAvailable(), getAvailablePartsForKit(), resolveFilename(), simulatorLoadPart()
//need to rebuild kit logic
function getSelectedKit() {
    return localStorage.getItem('selectedKit') || 'normal';
}

// Purpose: Check if a part is available in the currently selected kit
// Called from: simulatorLoadPart() before loading a part
function isPartAvailable(buttonName) {
    const selectedKit = getSelectedKit();
    if (selectedKit === 'normal') {
        return true;
    }
    const kitConfig = KIT_PARTS[selectedKit];
    if (!kitConfig || !kitConfig.parts) {
        return true;
    }
    return kitConfig.parts.hasOwnProperty(buttonName);
}




// Purpose: Get list of available parts for currently selected kit
// Called from: UI components that need to filter available parts
function getAvailablePartsForKit() {
    const selectedKit = getSelectedKit();
    if (selectedKit === 'normal') {
        return null;
    }
    const kitConfig = KIT_PARTS[selectedKit];
    return kitConfig && kitConfig.parts ? Object.keys(kitConfig.parts) : null;
}

// Purpose: Resolve button name to actual filename using mapping and kit config
// Called from: simulatorLoadPart() to get the actual file to load
function resolveFilename(buttonName) {
    const cleanName = buttonName.replace(/\.(glb|obj)$/i, '');
    if (FILENAME_MAPPING[cleanName]) {
        console.log(`✅ Mapped "${cleanName}" → "${FILENAME_MAPPING[cleanName]}"`);
        return FILENAME_MAPPING[cleanName];
    }
    const selectedKit = getSelectedKit();
    const kitConfig = KIT_PARTS[selectedKit];
    if (kitConfig && kitConfig.parts && typeof kitConfig.parts === 'object') {
        if (kitConfig.parts[cleanName]) {
            console.log(`✅ Found in ${selectedKit} kit: "${cleanName}" → "${kitConfig.parts[cleanName]}"`);
            return kitConfig.parts[cleanName];
        }
    }
    console.warn(`⚠️ No mapping found for "${cleanName}", trying auto-detection...`);
    return cleanName + '.glb';
}

// Purpose: Calculate bounding box of part accounting for rotation (world space)
// Called from: simulatorLoadPart() for positioning, collision system
//posibly duplicated logic
//need to learn babylon better to optimize this part
//there are built in functions in babylon js can do almost the same thing -need to update the logic-
function getPartBounds(part) {
    if (!part) return null;
    const childMeshes = part.getChildMeshes();
    if (childMeshes.length === 0) return null;

    let min = new BABYLON.Vector3(Infinity, Infinity, Infinity);
    let max = new BABYLON.Vector3(-Infinity, -Infinity, -Infinity);

    childMeshes.forEach(mesh => {
        if (mesh.getBoundingInfo) {
            // Force update world matrix to account for rotation


            //need to learn babylon better to optimize this part
            mesh.computeWorldMatrix(true);
            part.computeWorldMatrix(true);
            const bounds = mesh.getBoundingInfo().boundingBox;


           


            // Get all 8 corners of the bounding box in WORLD space
            const corners = [
                bounds.minimumWorld,
                bounds.maximumWorld,
                new BABYLON.Vector3(bounds.minimumWorld.x, bounds.minimumWorld.y, bounds.maximumWorld.z),
                new BABYLON.Vector3(bounds.minimumWorld.x, bounds.maximumWorld.y, bounds.minimumWorld.z),
                new BABYLON.Vector3(bounds.maximumWorld.x, bounds.minimumWorld.y, bounds.minimumWorld.z),
                new BABYLON.Vector3(bounds.minimumWorld.x, bounds.maximumWorld.y, bounds.maximumWorld.z),
                new BABYLON.Vector3(bounds.maximumWorld.x, bounds.minimumWorld.y, bounds.maximumWorld.z),
                new BABYLON.Vector3(bounds.maximumWorld.x, bounds.maximumWorld.y, bounds.minimumWorld.z)
            ];

            // Find actual min/max from all corners
            corners.forEach(corner => {
                min = BABYLON.Vector3.Minimize(min, corner);
                max = BABYLON.Vector3.Maximize(max, corner);
            });
        }
    });

    return {
        min: min,
        max: max,
        center: BABYLON.Vector3.Lerp(min, max, 0.5),
        size: max.subtract(min),
        lowestY: min.y,
        highestY: max.y
    };
}

// Purpose: Main function to load 3D part from file, position on ground, register with collision system
// Called from: index.html part buttons, loadPart() function
//need rename it to loadPart
//need refactoring
window.simulatorLoadPart = async function (buttonName) {
    return new Promise(async (resolve, reject) => {
        //need to rewrite kit logic
        const selectedKit = getSelectedKit();
        if (!isPartAvailable(buttonName)) {
            const kitName = KIT_PARTS[selectedKit]?.name || selectedKit;
            alert(`⚠️ "${buttonName}" is not available in the ${kitName}.\nPlease select a different kit or use the Standard Kit.`);
            console.warn(`Part ${buttonName} not available in ${selectedKit} kit`);
            reject(new Error(`Part not available in ${selectedKit} kit`));
            return;
        }


        //possibly duplicated logic
        console.log(`🔄 Loading part: "${buttonName}" (Kit: ${selectedKit})`);
        const overlay = document.getElementById("loadingOverlay");
        const loadingText = document.getElementById("loadingText");
        const loadingProgressBar = document.getElementById("loadingProgressBar");
        const loadingProgressFill = document.getElementById("loadingProgressFill");
        const loadingPercentage = document.getElementById("loadingPercentage");

        if (overlay) overlay.style.display = "flex";
        if (loadingProgressBar) loadingProgressBar.style.display = "block";
        if (loadingPercentage) loadingPercentage.style.display = "block";

        const actualFilename = resolveFilename(buttonName);
        const partBaseName = actualFilename.replace(/\.(glb|obj)$/i, '');
        //used just for the log
        const isOBJ = actualFilename.toLowerCase().endsWith('.obj');

        console.log(`📦 Loading file: ${actualFilename} (Format: ${isOBJ ? 'OBJ' : 'GLB'})`);

        // Check if asset was loaded before
        const wasCached = isAssetLoadedBefore(actualFilename);
        if (wasCached) {
            console.log(`💾 Asset previously loaded (browser cached): ${actualFilename}`);
        }
        if (loadingText) {
            loadingText.textContent = wasCached ? `Loading ${partBaseName} (cached)...` : `Loading ${partBaseName}...`;
        }

        //need refactoring 
        const container = new BABYLON.TransformNode(`container_${partBaseName}_${Date.now()}`, scene);
        container.metadata = {
            fileName: actualFilename,
            originalFileName: buttonName,
            baseName: partBaseName,
            type: detectComponentType(partBaseName),
            detectedType: detectComponentType(partBaseName),
            kit: selectedKit,
            loadedAt: new Date().toISOString(),
            isPhysicsEnabled: true,
            mass: 1.0,
            canConnect: partBaseName.startsWith('part_'),
            hasCollision: true
        };

        BABYLON.SceneLoader.ImportMesh(
            "",
            "/glb_images/",
            actualFilename,
            scene,
            (meshes) => {
                console.log(`✅ Loaded ${meshes.length} meshes for ${actualFilename}`);

                // Update progress to 100%
                if (loadingProgressFill) loadingProgressFill.style.width = "100%";
                if (loadingPercentage) loadingPercentage.textContent = "100%";
                if (loadingText) loadingText.textContent = "Processing meshes...";

                if (meshes.length === 0) {
                    console.error("No meshes loaded");
                    if (overlay) overlay.style.display = "none";
                    if (loadingProgressBar) loadingProgressBar.style.display = "none";
                    if (loadingPercentage) loadingPercentage.style.display = "none";
                    reject(new Error("No meshes loaded"));
                    return;
                }

                //-------------------------------------------------------need to rewrite this part--------------------------------
                // ============ HOUSE PARTS COLOR MANAGEMENT ============
                // House parts: Most are white, two specific parts are red
                // Configure which parts should be red (part_10 and part_11 are red, all others are white)
                const redParts = ['part_10', 'part_11']; // part_10 and part_11 are red, all other house parts are white
                const isHousePart = partBaseName.startsWith('part_');
                const shouldBeRed = isHousePart && redParts.includes(partBaseName);

                // Check if this is a DHT11 or MQ2 Gas Sensor
                const isDHT11Sensor = partBaseName.includes('dht11') || partBaseName.includes('dht-11') ||
                                      partBaseName.includes('temperatura');
                const isMQ2Sensor = partBaseName.includes('mq2') || partBaseName.includes('gas_sensor') ||
                                    partBaseName.includes('gas sensor') || partBaseName.includes('smoke');

                meshes.forEach((mesh) => {
                    if (mesh) {
                        mesh.parent = container;
                        mesh.isPickable = true;
                        mesh.checkCollisions = false; // ✅ Disabled to allow overlapping parts
                        //console.log(mesh.getChildMeshes()[0]);                        // Ensure material exists
                        if (!mesh.material) {
                            mesh.material = new BABYLON.StandardMaterial(`mat_${mesh.name}_${Date.now()}`, scene);
                        }

                        //need change this part
                        // Apply color scheme for house parts
                        if (isHousePart) {
                            if (shouldBeRed) {
                                // Set red color for the two specified parts
                                mesh.material.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.2);
                                mesh.material.emissiveColor = new BABYLON.Color3(0.3, 0.05, 0.05);
                            } else {
                                // Set white color for all other house parts
                                mesh.material.diffuseColor = new BABYLON.Color3(0.95, 0.95, 0.95);
                                mesh.material.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                            }
                            // Ensure material properties for better visibility
                            mesh.material.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
                        }

                        //need fix this part
                        // ============ FIX DHT11 AND MQ2 SENSOR MATERIALS ============
                        // These sensors from Sketchfab may have material issues
                        // Fix alpha/transparency to ensure proper rendering
                        else if (isDHT11Sensor || isMQ2Sensor) {
                            if (mesh.material) {
                                // Disable transparency to prevent pink sphere issue
                                mesh.material.alpha = 1.0;
                                mesh.material.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;

                                // For PBR materials, ensure proper settings
                                if (mesh.material instanceof BABYLON.PBRMaterial) {
                                    mesh.material.alphaMode = BABYLON.Engine.ALPHA_DISABLE;
                                    mesh.material.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_OPAQUE;
                                    // Ensure backface culling is enabled
                                    mesh.material.backFaceCulling = true;
                                }
                                // For Standard materials
                                else if (mesh.material instanceof BABYLON.StandardMaterial) {
                                    mesh.material.backFaceCulling = true;
                                }
                            }
                        }
                        // ============ END DHT11 AND MQ2 SENSOR MATERIAL FIX ============
                        // Non-house parts keep their original colors/textures
                    }
                });

                // ============ END HOUSE PARTS COLOR MANAGEMENT ============

                // Force world matrix update after all meshes are parented
                container.computeWorldMatrix(true);
                //need to remove this 
                meshes.forEach(mesh => {
                    if (mesh) mesh.computeWorldMatrix(true);
                });

                //posibly duplicated logic
                //need to learn babylon better to optimize this part
                // Calculate combined bounding box from all child meshes
                let combinedMin = new BABYLON.Vector3(Infinity, Infinity, Infinity);
                let combinedMax = new BABYLON.Vector3(-Infinity, -Infinity, -Infinity);
                let hasValidBounds = false;
                meshes.forEach(mesh => {
                    if (mesh && mesh.getBoundingInfo) {
                        const bounds = mesh.getBoundingInfo().boundingBox;
                        if (bounds.minimumWorld && bounds.maximumWorld) {
                            combinedMin = BABYLON.Vector3.Minimize(combinedMin, bounds.minimumWorld);
                            combinedMax = BABYLON.Vector3.Maximize(combinedMax, bounds.maximumWorld);
                            hasValidBounds = true;
                        }
                    }
                });

                //no need for this need to find better way to write it
                //need to learn babylon better to optimize this part

                // ============ HOUSE PARTS UNIFORM SCALING ============
                // House parts use uniform scale for consistent sizing
                // Only part_4 is smaller than others
                // part_1, part_11 (red part) and others use the same scale as part_2
                if (isHousePart) {
                    // Parts that should be smaller (only part_4)
                    const smallerParts = ['part_4'];
                    const isSmallerPart = smallerParts.includes(partBaseName);

                    // Apply different scales: smaller parts get 0.15, others (including part_1, part_11) get 0.2
                    const uniformHouseScale = isSmallerPart ? 0.15 : 0.2;
                    container.scaling = new BABYLON.Vector3(uniformHouseScale, uniformHouseScale, uniformHouseScale);
                    console.log(`📏 Applied ${isSmallerPart ? 'smaller' : 'uniform'} scale (${uniformHouseScale}) to house part: ${actualFilename}`);
                }
                // ============ DHT11 AND GAS SENSOR SPECIFIC SCALING ============
                // These sensors from Sketchfab have very small model dimensions (millimeters)
                // so they need specific fixed scaling to appear at correct size
                else if (partBaseName.includes('dht11') || partBaseName.includes('dht-11') ||
                         partBaseName.includes('temperatura')) {
                    // DHT11 sensor - model is in millimeters, scale to reasonable size
                    const dht11Scale = 50; // Scale up from mm to visible size
                    container.scaling = new BABYLON.Vector3(dht11Scale, dht11Scale, dht11Scale);
                    console.log(`📏 Applied DHT11 specific scale (${dht11Scale}) to: ${actualFilename}`);
                }
                else if (partBaseName.includes('mq2') || partBaseName.includes('gas_sensor') ||
                         partBaseName.includes('gas sensor') || partBaseName.includes('smoke')) {
                    // MQ2 Gas sensor - model is also in small units
                    const mq2Scale = 50; // Scale to reasonable size
                    container.scaling = new BABYLON.Vector3(mq2Scale, mq2Scale, mq2Scale);
                    console.log(`📏 Applied MQ2 Gas Sensor specific scale (${mq2Scale}) to: ${actualFilename}`);
                }
                // ============ END SENSOR SPECIFIC SCALING ============
                else {
                    // Non-house parts use dynamic scaling based on bounding box
                    if (hasValidBounds) {
                        const combinedSize = combinedMax.subtract(combinedMin);
                        const maxDimension = Math.max(combinedSize.x, combinedSize.y, combinedSize.z);
                        console.log(`📐 Combined bounding box size: ${combinedSize.x.toFixed(2)} x ${combinedSize.y.toFixed(2)} x ${combinedSize.z.toFixed(2)}`);
                        console.log(`📐 Max dimension: ${maxDimension.toFixed(2)}`);

                        if (maxDimension > 0 && isFinite(maxDimension)) {
                            const targetSize = 2;
                            const scaleFactor = targetSize / maxDimension;
                            container.scaling = new BABYLON.Vector3(scaleFactor, scaleFactor, scaleFactor);
                            console.log(`📏 Scaled ${actualFilename} by factor: ${scaleFactor.toFixed(2)}`);
                        } else {
                            container.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);
                            console.log(`⚠️ Using default scale for ${actualFilename} (invalid max dimension: ${maxDimension})`);
                        }
                    } else {
                        container.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);
                        console.log(`⚠️ Using default scale for ${actualFilename} (no valid bounding boxes found)`);
                    }
                }
                // ============ END HOUSE PARTS UNIFORM SCALING ============

                // ✅ Position object ON GROUND properly
                setTimeout(() => {
                    container.computeWorldMatrix(true);
                    //posibly no need for this
                    meshes.forEach(mesh => {
                        if (mesh) mesh.computeWorldMatrix(true);
                    });

                    const bounds = getPartBounds(container);
                    if (bounds) {
                        const heightOffset = -bounds.lowestY;
                        const spawnPos = findClearSpawnPosition(bounds.size);
                        container.position = new BABYLON.Vector3(
                            spawnPos.x,
                            heightOffset,
                            spawnPos.z
                        );
                        console.log(`📍 Positioned ${actualFilename} at (${spawnPos.x.toFixed(2)}, ${heightOffset.toFixed(2)}, ${spawnPos.z.toFixed(2)})`);
                    } else {
                        container.position = new BABYLON.Vector3(
                            Math.random() * 4 - 2,
                            0.5,
                            Math.random() * 4 - 2
                        );
                        console.log(`⚠️ Used fallback positioning for ${actualFilename}`);
                    }


                    //need to find bettter way to write it
                    // ✅ Apply rotation for breadboard - right face up
                    if (partBaseName.includes('breadboard')) {
                        // Rotate 90 degrees around Z axis to make right face point upward
                        container.rotation = new BABYLON.Vector3(
                            -Math.PI / 2,  // No rotation around X axis
                            0,            // No rotation around Y axis
                            -Math.PI / 2  // -90 degrees around Z axis to make right face point upward
                        );
                        console.log(`🔄 Rotated breadboard to have right face up`);
                    }

                    // ✅ Apply rotation for Arduino
                    // if (partBaseName.includes('arduino')) {
                    //     // Adjust rotation values here to orient Arduino as desired
                    //     container.rotation = new BABYLON.Vector3(
                    //         Math.PI / 1,            // Rotation around X axis (in radians)
                    //         0,            // Rotation around Y axis (in radians)
                    //         0            // Rotation around Z axis (in radians)
                    //     );
                    //     console.log(`🔄 Rotated Arduino`);
                    // }

                    //posibly duplicated logic
                    calculateAndStoreBoundingBox(container);

                    //need the same system for every part
                    if (partBaseName.startsWith('part_')) {
                        calculateConnectionSurfaces(container);
                    }

                    if (window.collisionSystem) {
                        window.collisionSystem.registerPart(container);
                        console.log(`🎯 Registered ${actualFilename} with collision system`);
                    }
                }, 100);

                //need to store parts in one place not in different places and each time use one of them
                loadedParts.push(container);

                if (typeof addDragBehavior === "function") {
                    addDragBehavior(container, meshes[0]);
                } else {
                    console.warn("addDragBehavior not available");
                }

                setTimeout(() => {
                    if (typeof window.initializePinsForComponent === 'function') {
                        //the function called two times - just one needed -
                        const pins = window.initializePinsForComponent(container, scene);
                        console.log(`🔌 Initialized ${pins.length} pins for ${actualFilename}`);
                    }
                    
                    //posibly not needed and need to rewrite new better logic
                    // ✅ Initialize component behavior
                    if (typeof window.initializeComponentBehavior === 'function') {
                        window.initializeComponentBehavior(container, scene);
                    }
                }, 200);

                if (typeof updateComponentCount === "function") {
                    updateComponentCount();
                } else {
                    console.log(`Component count: ${loadedParts.length}`);
                }

                if (overlay) overlay.style.display = "none";
                if (loadingProgressBar) loadingProgressBar.style.display = "none";
                if (loadingPercentage) loadingPercentage.style.display = "none";

                markAssetLoaded(actualFilename, meshes.length);
                console.log(`✅ Successfully loaded ${actualFilename} from ${selectedKit} kit`);
                resolve(container);
            },
            (event) => {
                // Progress callback
                if (event.lengthComputable && loadingProgressFill && loadingPercentage) {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    loadingProgressFill.style.width = percentComplete + "%";
                    loadingPercentage.textContent = percentComplete + "%";
                    console.log(`📥 Loading progress: ${percentComplete}%`);
                }
            },
            (scene, message, exception) => {
                console.error(`❌ Error loading ${actualFilename}:`, message, exception);
                if (overlay) overlay.style.display = "none";
                if (loadingProgressBar) loadingProgressBar.style.display = "none";
                if (loadingPercentage) loadingPercentage.style.display = "none";

                let errorMsg = `Failed to load ${actualFilename}.\n`;
                if (message.includes('404') || message.includes('Not Found')) {
                    errorMsg += `File not found in glb_images/ folder.\nPlease ensure the file exists:\nglb_images/${actualFilename}\nButton clicked: "${buttonName}"`;
                } else {
                    errorMsg += 'Error: ' + message;
                }
                alert(errorMsg);
                reject(new Error(message));
            }
        );
        console.log(`🌐 ImportMesh called for ${actualFilename}`,container.metadata);
    });
};

// Purpose: Find a clear spawn position to avoid overlapping with existing parts
// Called from: simulatorLoadPart() when positioning new parts
function findClearSpawnPosition(partSize) {
    const maxAttempts = 20;
    const spawnRadius = 5;
    const minDistance = Math.max(partSize.x, partSize.z) + 0.5;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * spawnRadius;
        const testPos = {
            x: Math.cos(angle) * radius,
            z: Math.sin(angle) * radius
        };

        let isClear = true;
        for (const part of loadedParts) {
            if (!part || !part.position) continue;
            const distance = Math.sqrt(
                Math.pow(testPos.x - part.position.x, 2) +
                Math.pow(testPos.z - part.position.z, 2)
            );
            if (distance < minDistance) {
                isClear = false;
                break;
            }
        }

        if (isClear) {
            return testPos;
        }
    }

    const gridIndex = loadedParts.length;
    const gridSize = 3;
    const gridSpacing = 3;
    return {
        x: (gridIndex % gridSize - 1) * gridSpacing,
        z: (Math.floor(gridIndex / gridSize) - 1) * gridSpacing
    };
}

//need review after babylon js learning

// Purpose: Calculate and store bounding box in part metadata for collision detection
// Called from: simulatorLoadPart() after part is loaded and positioned
function calculateAndStoreBoundingBox(container) {
    if (!container || !container.metadata) return;
    const childMeshes = container.getChildMeshes();
    if (childMeshes.length === 0) return;

    let min = new BABYLON.Vector3(Infinity, Infinity, Infinity);
    let max = new BABYLON.Vector3(-Infinity, -Infinity, -Infinity);

    childMeshes.forEach(mesh => {
        if (mesh.getBoundingInfo) {
            mesh.computeWorldMatrix(true);
            const bounds = mesh.getBoundingInfo().boundingBox;
            const meshMin = bounds.minimumWorld;
            const meshMax = bounds.maximumWorld;
            min = BABYLON.Vector3.Minimize(min, meshMin);
            max = BABYLON.Vector3.Maximize(max, meshMax);
        }
    });

    container.metadata.boundingBox = {
        min: min,
        max: max,
        size: max.subtract(min),
        center: BABYLON.Vector3.Lerp(min, max, 0.5)
    };

    container.metadata.collisionBounds = container.metadata.boundingBox;
    console.log(`📦 Bounding box for ${container.metadata.baseName}:`, container.metadata.boundingBox);
}

// Purpose: Calculate connection surfaces for house parts
// Called from: simulatorLoadPart() for parts that start with 'part_'
function calculateConnectionSurfaces(container) {
    if (!container || !container.metadata || !container.metadata.boundingBox) return;
    const bounds = container.metadata.boundingBox;

    container.metadata.connectionSurfaces = {
        top: {
            normal: new BABYLON.Vector3(0, 1, 0),
            center: new BABYLON.Vector3(bounds.center.x, bounds.max.y, bounds.center.z),
            width: bounds.size.x,
            depth: bounds.size.z,
            area: bounds.size.x * bounds.size.z,
            canConnect: true
        },
        bottom: {
            normal: new BABYLON.Vector3(0, -1, 0),
            center: new BABYLON.Vector3(bounds.center.x, bounds.min.y, bounds.center.z),
            width: bounds.size.x,
            depth: bounds.size.z,
            area: bounds.size.x * bounds.size.z,
            canConnect: true
        },
        front: {
            normal: new BABYLON.Vector3(0, 0, 1),
            center: new BABYLON.Vector3(bounds.center.x, bounds.center.y, bounds.max.z),
            width: bounds.size.x,
            height: bounds.size.y,
            area: bounds.size.x * bounds.size.y,
            canConnect: true
        },
        back: {
            normal: new BABYLON.Vector3(0, 0, -1),
            center: new BABYLON.Vector3(bounds.center.x, bounds.center.y, bounds.min.z),
            width: bounds.size.x,
            height: bounds.size.y,
            area: bounds.size.x * bounds.size.y,
            canConnect: true
        },
        right: {
            normal: new BABYLON.Vector3(1, 0, 0),
            center: new BABYLON.Vector3(bounds.max.x, bounds.center.y, bounds.center.z),
            height: bounds.size.y,
            depth: bounds.size.z,
            area: bounds.size.y * bounds.size.z,
            canConnect: true
        },
        left: {
            normal: new BABYLON.Vector3(-1, 0, 0),
            center: new BABYLON.Vector3(bounds.min.x, bounds.center.y, bounds.center.z),
            height: bounds.size.y,
            depth: bounds.size.z,
            area: bounds.size.y * bounds.size.z,
            canConnect: true
        }
    };

    console.log(`🔧 Calculated ${Object.keys(container.metadata.connectionSurfaces).length} connection surfaces for ${container.metadata.baseName}`);
}


//need to rerwite this part in better logic and make it more dynamic
//if it depend on the specific attribute (type) it is better not to use filename
// Purpose: Detect component type from filename
// Called from: simulatorLoadPart() to set metadata.type
function detectComponentType(fileName) {
    const lowerName = fileName.toLowerCase();
    if (lowerName.includes("arduino")) return "arduino";
    if (lowerName.includes("battery") || lowerName.includes("9v")) return "battery";
    if (lowerName.includes("resistor") || lowerName.includes("ohm")) return "resistor";
    if (lowerName.includes("lcd") || lowerName.includes("display")) return "lcd";
    if (lowerName.includes("servo")) return "servo";
    if (lowerName.includes("buzzer")) return "buzzer";
    if (lowerName.includes("dht11") || lowerName.includes("dht-11") || lowerName.includes("temperatura")) return "dht11";
    if (lowerName.includes("ir_sensor") || lowerName.includes("ir sensor")) return "ir_sensor";
    if (lowerName.includes("motor")) return "motor";
    if (lowerName.includes("wheel")) return "wheel";
    if (lowerName.includes("chassis")) return "chassis";
    if (lowerName.includes("car")) return "car";
    if (lowerName.includes("l293")) return "motor_driver";
    if (lowerName.includes("led")) return "led";
    if (lowerName.includes("sensor")) return "sensor";
    if (lowerName.includes("breadboard")) return "breadboard";
    if (lowerName.includes("part")) return "house_part";
    if (lowerName.includes("holding")) return "board";
    if (lowerName.includes("track")) return "track";
    return "unknown";
}

//not used now but needed
// Update component and wire counts
window.updateWireCount = function() {
    const wireCountElement = document.getElementById("wireCount");
    if (wireCountElement) {
        // ✅ Use the most reliable source - check both arrays
        const connectionsCount = (window.wiringConnections && Array.isArray(window.wiringConnections)) ? window.wiringConnections.length : 0;
        const linesCount = (window.wireLines && Array.isArray(window.wireLines)) ? window.wireLines.length : 0;
        
        // Use the maximum to ensure we don't miss any wires
        const finalCount = Math.max(connectionsCount, linesCount);
        
        wireCountElement.textContent = `Wires: ${finalCount}`;
        console.log(`📊 Wire count updated (part-loader): ${finalCount} (connections: ${connectionsCount}, lines: ${linesCount})`);
    }
};


//not used now but needed
window.updateComponentCount = function () {
    const countElement = document.getElementById("componentCount");
    if (countElement) {
        // ✅ Use window.allParts as the primary source (most reliable)
        // Fallback to loadedParts if window.allParts is not available
        let finalCount = 0;
        
        if (window.allParts && Array.isArray(window.allParts)) {
            finalCount = window.allParts.length;
        } else if (loadedParts && Array.isArray(loadedParts)) {
            finalCount = loadedParts.length;
        }
        
        countElement.textContent = `Components: ${finalCount}`;
        console.log(`📊 Component count updated (part-loader): ${finalCount}`);
    }
};

window.loadPart = window.simulatorLoadPart;
window.getSelectedKit = getSelectedKit;
window.isPartAvailable = isPartAvailable;
window.getAvailablePartsForKit = getAvailablePartsForKit;
window.resolveFilename = resolveFilename;
window.getPartBounds = getPartBounds;

//useful for memory leak prevention
// ENHANCEMENT #4: MEMORY LEAK PREVENTION - Memory monitoring utilities
window.getMemoryStats = function() {
    if (!window.scene) {
        return { error: 'Scene not available' };
    }
    const stats = {
        meshes: window.scene.meshes.length,
        materials: window.scene.materials.length,
        textures: window.scene.textures.length,
        components: window.allParts ? window.allParts.length : 0,
        assetCache: loadedAssetMetadata.size,
        cacheLimit: MAX_CACHE_SIZE
    };
    if (performance && performance.memory) {
        stats.heapUsed = Math.round(performance.memory.usedJSHeapSize / 1048576);
        stats.heapLimit = Math.round(performance.memory.jsHeapSizeLimit / 1048576);
        stats.heapPercentage = Math.round((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100);
    }
    return stats;
};

window.logMemoryStats = function() {
    const stats = window.getMemoryStats();
    console.log('📊 Memory Statistics:');
    console.log(`   Meshes: ${stats.meshes}`);
    console.log(`   Materials: ${stats.materials}`);
    console.log(`   Textures: ${stats.textures}`);
    console.log(`   Components: ${stats.components}`);
    console.log(`   Asset Cache: ${stats.assetCache}/${stats.cacheLimit}`);
    if (stats.heapUsed) {
        console.log(`   Heap Used: ${stats.heapUsed}MB / ${stats.heapLimit}MB (${stats.heapPercentage}%)`);
    }
};

//usefull but not used
//need check
window.cleanupMemory = function() {
    console.log('🧹 Starting memory cleanup...');
    let disposedMaterials = 0;
    let disposedTextures = 0;

    if (window.scene && window.scene.materials) {
        const materials = window.scene.materials.slice();
        materials.forEach(mat => {
            const isUsed = window.scene.meshes.some(mesh => mesh.material === mat);
            if (!isUsed && mat.dispose && !mat.name.includes('ground')) {
                try {
                    mat.dispose(true, true);
                    disposedMaterials++;
                } catch (e) {}
            }
        });
    }

    if (window.scene && window.scene.textures) {
        const textures = window.scene.textures.slice();
        textures.forEach(tex => {
            const isUsed = window.scene.materials.some(mat =>
                mat.diffuseTexture === tex ||
                mat.specularTexture === tex ||
                mat.emissiveTexture === tex ||
                mat.ambientTexture === tex
            );
            if (!isUsed && tex.dispose) {
                try {
                    tex.dispose();
                    disposedTextures++;
                } catch (e) {}
            }
        });
    }

    console.log(`✅ Cleanup complete: Disposed ${disposedMaterials} materials, ${disposedTextures} textures`);
    window.logMemoryStats();
};

// Trigger markUnsavedChanges when parts are loaded
const originalSimulatorLoadPart = window.simulatorLoadPart;
window.simulatorLoadPart = function(...args) {
    return originalSimulatorLoadPart.apply(this, args).then(result => {
        if (typeof window.markUnsavedChanges === 'function') {
            window.markUnsavedChanges();
        }
        return result;
    });
};

console.log("✅ COMPLETE partLoader.js with MEMORY MANAGEMENT and ORIGINAL COLORS loaded!");