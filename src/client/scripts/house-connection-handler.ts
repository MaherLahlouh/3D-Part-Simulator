// @ts-nocheck
/**
 * House Connection Handler
 * Handles keyboard input and integrates the connection system with drag logic
 */

const BABYLON = window.BABYLON;

// Ensure the function is defined immediately when this file loads
if (!window.connectHouseParts) {
    /**
     * Connect selected house part to the nearest house part
     * Triggered by pressing 'C' or 'c' key
     */
    window.connectHouseParts = function() {
        console.log("🔗 connectHouseParts() called");
        
        if (!window.houseConnectionSystem) {
            console.warn("⚠️ House Connection System not initialized");
            if (typeof window.showMessage === 'function') {
                window.showMessage("⚠️ Connection system not available");
            }
            return;
        }

        // Get selected part from drag-logic.ts
        const selected = window.selected;
        console.log("📦 Selected part:", selected ? (selected.metadata?.baseName || selected.name) : "null");
        
        if (!selected) {
            const message = "⚠️ No part selected! Select a house part first, then press 'C' to connect.";
            console.warn(message);
            if (typeof window.showMessage === 'function') {
                window.showMessage(message);
            }
            return;
        }

        // Validate that selected is a house part
        if (!selected.metadata || !selected.metadata.baseName || !selected.metadata.baseName.startsWith('part_')) {
            const message = "⚠️ Selected item is not a house part. Please select a house part (part_1, part_2, etc.)";
            console.warn(message);
            if (typeof window.showMessage === 'function') {
                window.showMessage(message);
            }
            return;
        }

        console.log(`🔗 Attempting to connect: ${selected.metadata.baseName}`);

        // Find nearest house part
        let nearestPart = null;
        let nearestDistance = Infinity;
        const MAX_CONNECT_DISTANCE = 15.0;

        if (!window.allParts || !Array.isArray(window.allParts)) {
            const message = "❌ No parts available in the scene";
            console.warn(message);
            console.log("🔍 window.allParts:", window.allParts);
            if (typeof window.showMessage === 'function') {
                window.showMessage(message);
            }
            return;
        }

        console.log(`🔍 Searching through ${window.allParts.length} parts for nearest house part...`);

        window.allParts.forEach(part => {
            // Skip self
            if (part === selected) return;
            
            // Only consider house parts
            if (!part.metadata || !part.metadata.baseName || !part.metadata.baseName.startsWith('part_')) {
                return;
            }

            // Calculate distance
            const distance = BABYLON.Vector3.Distance(selected.position, part.position);
            
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestPart = part;
            }
        });

        if (!nearestPart) {
            const message = "❌ No nearby house parts found to connect to";
            console.warn(message);
            console.log(`🔍 Searched ${window.allParts.length} parts, found ${nearestPart ? 1 : 0} house parts`);
            if (typeof window.showMessage === 'function') {
                window.showMessage(message);
            }
            return;
        }

        console.log(`✅ Found nearest part: ${nearestPart.metadata?.baseName || nearestPart.name} at distance ${nearestDistance.toFixed(2)}`);

        // Check if already connected
        const connInfo = window.houseConnectionSystem.getConnectionInfo(selected);
        if (connInfo && connInfo.isConnected) {
            const message = `ℹ️ Part is already connected to ${connInfo.groupSize - 1} other part(s). Press 'X' to disconnect first.`;
            console.log(message);
            if (typeof window.showMessage === 'function') {
                window.showMessage(message);
            }
            return;
        }

        // Attempt connection
        const success = window.houseConnectionSystem.connectParts(selected, nearestPart);

        if (success) {
            const part1Name = selected.metadata.baseName;
            const part2Name = nearestPart.metadata.baseName;
            const finalInfo = window.houseConnectionSystem.getConnectionInfo(selected);
            const message = `✅ Connected ${part1Name} to ${part2Name} (Group: ${finalInfo.groupSize}/${finalInfo.maxSize} parts)`;
            console.log(message);
            
            if (typeof window.showMessage === 'function') {
                window.showMessage(message);
            }

            // ✅ GREEN HIGHLIGHTING REMOVED - No visual feedback when connecting
            // Parts connect silently without any color changes
        }
    };
}

// Ensure disconnect function is also defined
if (!window.disconnectHouseParts) {
    /**
     * Disconnect selected house part from its group
     * Triggered by pressing 'X' key
     */
    window.disconnectHouseParts = function() {
        if (!window.houseConnectionSystem) {
            console.warn("⚠️ House Connection System not initialized");
            return;
        }

        const selected = window.selected;
        
        if (!selected) {
            if (typeof window.showMessage === 'function') {
                window.showMessage("⚠️ No part selected");
            }
            return;
        }

        const success = window.houseConnectionSystem.disconnectPart(selected);

        if (success) {
            const message = "✅ House part disconnected";
            console.log(message);
            if (typeof window.showMessage === 'function') {
                window.showMessage(message);
            }
        } else {
            const message = "ℹ️ Part is not connected to anything";
            console.log(message);
            if (typeof window.showMessage === 'function') {
                window.showMessage(message);
            }
        }
    };
}

/**
 * Setup keyboard handlers for connection system
 * This integrates with the existing keyboard handler in drag-logic.ts
 */
export function setupConnectionKeyboardHandlers() {
    // The keyboard handler is already set up in drag-logic.ts
    // We just need to make sure it calls our new connection function
    // The handler in drag-logic.ts will be updated to use connectHouseParts instead of manualConnectSelected
    
    console.log("✅ House Connection Keyboard Handlers ready");
    console.log("   Press 'C' to connect house parts");
    console.log("   Press 'X' to disconnect house parts");
}

/**
 * Initialize the connection handler
 */
export function initHouseConnectionHandler() {
    setupConnectionKeyboardHandlers();
    
    // Verify the function is accessible
    if (typeof window.connectHouseParts === 'function') {
        console.log("✅ window.connectHouseParts is accessible");
    } else {
        console.error("❌ window.connectHouseParts is NOT accessible!");
    }
    
    console.log("✅ House Connection Handler initialized");
}
