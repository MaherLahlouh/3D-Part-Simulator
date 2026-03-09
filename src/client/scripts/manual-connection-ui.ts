// @ts-nocheck
import * as BABYLON from 'babylonjs';

/**
 * Enhanced House Group Manager
 * Handles hierarchical connections between house parts and collision awareness.
 */
export class HouseGroupManager {
    constructor() {
        this.connectionGroups = new Map();
        this.activeGroup = null;
        this.isDraggingGroup = false;
        this.visualIndicators = [];
        this.groupOutlines = new Map();
        this.dragStartPositions = new Map();
        this.draggedPart = null;
        this.lastDraggedPosition = null;
        
        // Surface alignment settings
        this.connectionPreview = null;
        this.surfaceIndicators = [];
        this.snapThreshold = 2.0;
        this.alignmentTolerance = 0.15;
        this.snapStrength = 0.8;
        
        // Collision awareness
        this.checkCollisionsDuringDrag = true;
        this.autoResolveCollisions = true;

        console.log("🏠 House Group Manager Instance Created");
    }

    // --- SURFACE MATCHING LOGIC ---

    findBestSurfaceMatch(part1, part2) {
        if (!part1.metadata?.connectionSurfaces || !part2.metadata?.connectionSurfaces) {
            return null;
        }

        const surfaces1 = part1.metadata.connectionSurfaces;
        const surfaces2 = part2.metadata.connectionSurfaces;
        let bestMatch = null;
        let bestScore = 0.3;

        Object.keys(surfaces1).forEach(key1 => {
            Object.keys(surfaces2).forEach(key2 => {
                const surf1 = surfaces1[key1];
                const surf2 = surfaces2[key2];
                const score = this.calculateSurfaceAlignment(surf1, surf2, part1, part2);
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = {
                        surface1: key1,
                        surface2: key2,
                        score: score,
                        surf1Data: surf1,
                        surf2Data: surf2,
                        snapPosition: this.calculateSnapPosition(surf1, surf2, part1, part2)
                    };
                }
            });
        });
        return bestMatch;
    }

    calculateSurfaceAlignment(surf1, surf2, part1, part2) {
        const center1 = this.getSurfaceWorldPosition(surf1, part1);
        const center2 = this.getSurfaceWorldPosition(surf2, part2);
        const distance = BABYLON.Vector3.Distance(center1, center2);
        
        if (distance > this.snapThreshold * 2) return 0;

        const normal1 = this.getSurfaceWorldNormal(surf1, part1);
        const normal2 = this.getSurfaceWorldNormal(surf2, part2);
        const normalDot = BABYLON.Vector3.Dot(normal1, normal2);
        
        const normalAlignment = Math.max(0, -(normalDot + 1) / 2);
        const sizeMatch = this.calculateSizeCompatibility(surf1, surf2);
        const distanceScore = 1 - (distance / (this.snapThreshold * 2));
        
        return (distanceScore * 0.4) + (normalAlignment * 0.4) + (sizeMatch * 0.2);
    }

    getSurfaceWorldPosition(surface, part) {
        const localCenter = surface.center.clone();
        const worldMatrix = part.getWorldMatrix();
        return BABYLON.Vector3.TransformCoordinates(localCenter, worldMatrix);
    }

    getSurfaceWorldNormal(surface, part) {
        const localNormal = surface.normal.clone();
        const worldMatrix = part.getWorldMatrix();
        const rotationMatrix = worldMatrix.clone();
        rotationMatrix.setTranslation(BABYLON.Vector3.Zero());
        return BABYLON.Vector3.TransformNormal(localNormal, rotationMatrix).normalize();
    }

    calculateSizeCompatibility(surf1, surf2) {
        const area1 = surf1.area || 1;
        const area2 = surf2.area || 1;
        return Math.min(area1, area2) / Math.max(area1, area2);
    }

    calculateSnapPosition(surf1, surf2, part1, part2) {
        const worldMatrix2 = part2.getWorldMatrix();
        const targetCenter = BABYLON.Vector3.TransformCoordinates(surf2.center, worldMatrix2);
        const rotMatrix2 = worldMatrix2.clone();
        rotMatrix2.setTranslation(BABYLON.Vector3.Zero());
        const normal2 = BABYLON.Vector3.TransformNormal(surf2.normal, rotMatrix2).normalize();
        const offset = surf1.center.scale(-1);
        return targetCenter.add(normal2.scale(0.01)).add(offset);
    }

    // --- VISUAL FEEDBACK ---

    showConnectionPreview(part1, part2, matchData) {
        this.clearConnectionPreview();
        if (!matchData || !window.scene) return;

        const center1 = this.getSurfaceWorldPosition(matchData.surf1Data, part1);
        const center2 = this.getSurfaceWorldPosition(matchData.surf2Data, part2);

        const line = BABYLON.MeshBuilder.CreateLines("connectionPreview", {
            points: [center1, center2],
            updatable: false
        }, window.scene);

        let color = matchData.score > 0.8 ? new BABYLON.Color3(0, 1, 0) : 
                    matchData.score > 0.6 ? new BABYLON.Color3(1, 1, 0) : 
                    new BABYLON.Color3(1, 0.5, 0);

        line.color = color;
        line.isPickable = false;

        this.surfaceIndicators.push(this.createSurfaceIndicator(center1, matchData.surf1Data, part1, color));
        this.surfaceIndicators.push(this.createSurfaceIndicator(center2, matchData.surf2Data, part2, color));
        this.connectionPreview = line;
    }

    createSurfaceIndicator(position, surfaceData, part, color) {
        const size = Math.min(surfaceData.width || 0.5, surfaceData.depth || 0.5, 0.3);
        const indicator = BABYLON.MeshBuilder.CreatePlane("surfaceIndicator", { size }, window.scene);
        indicator.position = position.clone();
        indicator.lookAt(position.add(this.getSurfaceWorldNormal(surfaceData, part)));

        const mat = new BABYLON.StandardMaterial("surfaceIndicatorMat", window.scene);
        mat.emissiveColor = color;
        mat.alpha = 0.6;
        mat.wireframe = true;
        indicator.material = mat;
        indicator.isPickable = false;
        return indicator;
    }

    clearConnectionPreview() {
        if (this.connectionPreview) this.connectionPreview.dispose();
        this.surfaceIndicators.forEach(i => i.dispose());
        this.surfaceIndicators = [];
    }

    // --- CONNECTION MANAGEMENT ---

    createConnection(childPart, parentPart) {
        if (!childPart || !parentPart || childPart === parentPart) return false;

        const childId = childPart.id || childPart.name;
        const parentId = parentPart.id || parentPart.name;
        
        // ✅ Check if parent already has maximum connections (20 for byte kit)
        const parentData = this.connectionGroups.get(parentId);
        if (parentData && parentData.children.size >= 20) {
            console.warn(`⚠️ Maximum connection limit reached (20 parts)`);
            if (typeof window.showMessage === 'function') {
                window.showMessage('⚠️ Maximum connection limit reached (20 parts per group)');
            }
            return false;
        }

        const surfaceMatch = this.findBestSurfaceMatch(childPart, parentPart);
        if (surfaceMatch) {
            this.alignPartsBySurfaces(childPart, parentPart, surfaceMatch);
            if (window.collisionSystem && this.autoResolveCollisions) {
                setTimeout(() => window.collisionSystem.detectAndResolveCollisions(), 50);
            }
        }

        const offset = this.calculateOffset(childPart, parentPart);

        // Update Internal Maps
        if (!this.connectionGroups.has(parentId)) {
            this.connectionGroups.set(parentId, { part: parentPart, children: new Set(), parent: null });
        }
        
        const childData = this.connectionGroups.get(childId) || { part: childPart, children: new Set() };
        if (childData.parent) this.breakConnection(childPart);
        
        childData.parent = parentId;
        childData.offset = offset;
        this.connectionGroups.set(childId, childData);
        this.connectionGroups.get(parentId).children.add(childId);

        // Update Metadata
        childPart.metadata = { ...childPart.metadata, connectedTo: parentId, connectionOffset: offset };
        
        this.showConnectionSuccess(parentPart.position);
        this.clearConnectionPreview();
        return true;
    }

    alignPartsBySurfaces(childPart, parentPart, matchData) {
        const center1 = this.getSurfaceWorldPosition(matchData.surf1Data, childPart);
        const center2 = this.getSurfaceWorldPosition(matchData.surf2Data, parentPart);
        childPart.position.addInPlace(center2.subtract(center1));

        const normal1 = this.getSurfaceWorldNormal(matchData.surf1Data, childPart);
        const targetNormal = this.getSurfaceWorldNormal(matchData.surf2Data, parentPart).scale(-1);
        
        const rotationAxis = BABYLON.Vector3.Cross(normal1, targetNormal);
        const rotationAngle = Math.acos(Math.max(-1, Math.min(1, BABYLON.Vector3.Dot(normal1, targetNormal))));

        if (rotationAxis.length() > 0.001) {
            const quaternion = BABYLON.Quaternion.RotationAxis(rotationAxis.normalize(), rotationAngle);
            const currentRotation = childPart.rotationQuaternion || BABYLON.Quaternion.FromEulerAngles(childPart.rotation.x, childPart.rotation.y, childPart.rotation.z);
            childPart.rotationQuaternion = quaternion.multiply(currentRotation);
        }
    }

    calculateOffset(childPart, parentPart) {
        return {
            x: childPart.position.x - parentPart.position.x,
            y: childPart.position.y - parentPart.position.y,
            z: childPart.position.z - parentPart.position.z,
            rotation: {
                x: childPart.rotation.x - parentPart.rotation.x,
                y: childPart.rotation.y - parentPart.rotation.y,
                z: childPart.rotation.z - parentPart.rotation.z
            }
        };
    }

    // --- GROUP DRAGGING ---

    startDraggingGroup(part) {
        if (!part) return [];
        this.isDraggingGroup = true;
        this.draggedPart = part;
        this.lastDraggedPosition = part.position.clone();
        this.dragStartPositions.clear();
        
        const rootPart = this.findRootPart(part);
        this.activeGroup = this.getAllConnectedParts(rootPart);

        this.showGroupIndicators(this.activeGroup);
        return this.activeGroup;
    }

    updateGroupPositions(draggedPart) {
        if (!this.isDraggingGroup || !this.activeGroup || !this.lastDraggedPosition) return;

        const delta = draggedPart.position.subtract(this.lastDraggedPosition);
        if (delta.length() < 0.0001) return;

        const draggedId = draggedPart.id || draggedPart.name;
        this.activeGroup.forEach(part => {
            if ((part.id || part.name) === draggedId) return;
            part.position.addInPlace(delta);
            if (window.collisionSystem) window.collisionSystem.updatePartBounds(part);
        });

        this.lastDraggedPosition = draggedPart.position.clone();
    }

    endDraggingGroup() {
        if (this.isDraggingGroup && window.collisionSystem && this.activeGroup) {
            this.activeGroup.forEach(p => window.collisionSystem.updatePartBounds(p));
            window.collisionSystem.detectAndResolveCollisions();
        }
        this.isDraggingGroup = false;
        this.activeGroup = null;
        this.clearGroupIndicators();
    }

    findRootPart(part) {
        let current = part;
        let safety = 0;
        while (safety < 100) {
            const data = this.connectionGroups.get(current.id || current.name);
            if (!data || !data.parent) return current;
            const parent = this.connectionGroups.get(data.parent);
            if (!parent) return current;
            current = parent.part;
            safety++;
        }
        return current;
    }

    getAllConnectedParts(part) {
        const visited = new Set();
        const parts = [];
        const traverse = (p) => {
            const id = p.id || p.name;
            if (visited.has(id)) return;
            visited.add(id);
            parts.push(p);
            const data = this.connectionGroups.get(id);
            if (!data) return;
            data.children.forEach(cId => traverse(this.connectionGroups.get(cId).part));
            if (data.parent) traverse(this.connectionGroups.get(data.parent).part);
        };
        traverse(part);
        return parts;
    }

    breakConnection(childPart) {
        const id = childPart.id || childPart.name;
        const data = this.connectionGroups.get(id);
        if (data?.parent) {
            this.connectionGroups.get(data.parent).children.delete(id);
            data.parent = null;
            if (childPart.metadata) delete childPart.metadata.connectedTo;
            this.showDisconnectionEffect(childPart.position);
        }
    }

    // --- EFFECTS ---

    showGroupIndicators(parts) {
        this.clearGroupIndicators();
        parts.forEach(p => {
            p.getChildMeshes().forEach(m => {
                if (!m.material) return;
                m._originalEmissive = m.material.emissiveColor?.clone() || new BABYLON.Color3(0,0,0);
                m.material.emissiveColor = new BABYLON.Color3(0, 0.7, 0.7);
                this.visualIndicators.push(m);
            });
        });
    }

    clearGroupIndicators() {
        this.visualIndicators.forEach(m => {
            if (m.material && m._originalEmissive) m.material.emissiveColor = m._originalEmissive;
        });
        this.visualIndicators = [];
    }

    showConnectionSuccess(pos) {
        const s = BABYLON.MeshBuilder.CreateSphere("connSucc", { diameter: 0.5 }, window.scene);
        s.position = pos.add(new BABYLON.Vector3(0, 1, 0));
        const mat = new BABYLON.StandardMaterial("m", window.scene);
        mat.emissiveColor = BABYLON.Color3.Green();
        s.material = mat;
        setTimeout(() => s.dispose(), 700);
    }

    showDisconnectionEffect(pos) {
        const t = BABYLON.MeshBuilder.CreateTorus("disc", { diameter: 2 }, window.scene);
        t.position = pos.clone();
        setTimeout(() => t.dispose(), 500);
    }

    getConnectionInfo(part) {
        const data = this.connectionGroups.get(part.id || part.name);
        return data ? { hasParent: !!data.parent, childrenCount: data.children.size } : null;
    }
}

// Global Initialize for Vite
export function initHouseGroupManager() {
    window.houseGroupManager = new HouseGroupManager();
    console.log("✅ House Group Manager Global Instance Ready");
}