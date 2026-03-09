//@ts-nocheck

import { CONFIG } from '../../config.ts'



export async function getPartsList()  {
    const response = await fetch(`${CONFIG.API_URL}/parts/`);
    if (!response.ok) throw new Error('Failed to load library');
    return response.json(); // Returns the array of parts
}

export async function createPart({ name, icon, fileName, desc }) {
    const partData = { name, icon, fileName, desc };
    const response = await fetch(`${CONFIG.API_URL}/parts/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partData)
    });
    if (response.ok) {
        localStorage.removeItem('parts_menu'); 
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Error adding part');
    return data;
}

export async function updatePartByName (name, { icon, desc, fileName })  {
    const updates = { icon, desc, fileName };
    const response = await fetch(`${CONFIG.API_URL}/parts/${name}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
    });
    if (response.ok) {
        localStorage.removeItem('parts_menu'); 
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Error updating part');
    return data;
}

export async function deletePartByName (name) {
    const response = await fetch(`${CONFIG.API_URL}/parts/${name}`, {
        method: 'DELETE'
    });
    if (response.ok) {
        localStorage.removeItem('parts_menu'); 
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Error deleting part');
    return data;
}

export function getCachedParts() {
    try {
        const savedData = localStorage.getItem('parts_menu');
        if (!savedData) {return [];}
        const parsedData = JSON.parse(savedData);
        return Array.isArray(parsedData) ? parsedData : [];

    } catch (error) {
        console.error("Critical: Cached data is corrupted. Clearing storage.", error);
        localStorage.removeItem('parts_menu');
        return [];
    }
}

export function generateUniqueId() {
    const timestamp = Date.now(); 
    const randomSuffix = Math.floor(Math.random() * 1000); 
    return Number(`${timestamp}${randomSuffix}`);
}


export function findClearSpawnPosition(partSize) {
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
        for (const part of window.loadedParts) {
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

    const gridIndex = window.loadedParts.length;
    const gridSize = 3;
    const gridSpacing = 3;
    return {
        x: (gridIndex % gridSize - 1) * gridSpacing,
        z: (Math.floor(gridIndex / gridSize) - 1) * gridSpacing
    };
}