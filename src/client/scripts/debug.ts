// @ts-nocheck

/**
 * Local Debug Script
 * Purpose: Tests the connection between the Editor and the Simulator 
 * without needing a backend or Firebase.
 */

setTimeout(async () => {
    console.log("🛠️ Starting Local Debug Test...");

    // 1. Check if Monaco is actually ready
    if (!window.monacoEditor) {
        console.log("❌ Debug: Monaco Editor not found yet.");
    } else {
        console.log("✅ Debug: Monaco Editor is active.");
    }

    // 2. Simulate a Project Load Test
    try {
        console.log("🧪 Testing Simulator Communication...");
        
        // We look for the simulator loading function you use
        if (typeof window.loadRobotFromData === 'function') {
            console.log("✅ SUCCESS: Simulator 'loadRobotFromData' found.");
            
            // We verify we can read/write to the editor
            const testCode = "// Debug Test: " + new Date().toLocaleTimeString();
            if (typeof window.setArduinoCode === 'function') {
                window.setArduinoCode(testCode);
                console.log("✅ SUCCESS: Wrote test code to Editor.");
            }
            
        } else {
            console.warn("⚠️ Debug: Simulator function 'loadRobotFromData' not detected yet. Is the 3D scene loaded?");
        }

    } catch (error) {
        console.error("❌ DEBUG SCRIPT ERROR:", error);
    }
}, 3000);