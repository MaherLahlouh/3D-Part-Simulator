
// @ts-nocheck
import * as BABYLON from '@babylonjs/core';
import { getTerminalAbsolutePosition, findClosestTerminalOnComponent, getTerminalConnectionPoint } from './wiring-modules/terminal-helpers.ts';

/**
 * collisionSystem.ts
 * Optimized for Vite while preserving all original logic.
 * ENHANCED: Terminal-based snapping for accurate component connections
 */

console.log("🎯 Loading Collision & Physics System...");

class CollisionSystem {
    scene: BABYLON.Scene;
    collidableParts: any[];
    collisionPairs: Map<any, any>;
    isEnabled: boolean;
    settings: any;
    physics: any;
    activeCollisions: Set<any>;
    velocities: Map<string | number, BABYLON.Vector3>;
    lastPositions: Map<string | number, BABYLON.Vector3>;
    collisionIndicators: any[];
    snapPreview: any;
    _updateInterval: any;
    partsInCollision: Set<any>; // Track parts currently in collision
    originalColors: Map<any, BABYLON.Color3>; // Store original emissive colors

    constructor(scene: BABYLON.Scene) {
        this.scene = scene;
        this.collidableParts = [];
        this.collisionPairs = new Map();
        this.isEnabled = true;
        
        // Collision settings
        this.settings = {
            checkInterval: 16, // ms between collision checks
            pushbackStrength: 0.5,
            overlapThreshold: 0.01,
            snapDistance: 1.5,
            magneticPullDistance: 2.0,
            magneticPullStrength: 0.15,
            groundLevel: 0,
            enablePhysics: true,
            enableSnapping: true,
            enableMagneticPull: true,
            showCollisionDebug: false
        };
        
        // Physics simulation
        this.physics = {
            gravity: -9.81,
            friction: 0.3,
            bounciness: 0.1,
            damping: 0.95
        };
        
        // Collision state
        this.activeCollisions = new Set();
        this.velocities = new Map();
        this.lastPositions = new Map();
        this.partsInCollision = new Set(); // Track parts currently in collision
        this.originalColors = new Map(); // Store original emissive colors
        
        // Visual indicators
        this.collisionIndicators = [];
        this.snapPreview = null;
        
        // Bind methods
        this.update = this.update.bind(this);
        
        console.log("✅ Collision System initialized");
    }

    registerPart(part: any) {
        if (!part || this.collidableParts.includes(part)) return;
        this.collidableParts.push(part);
        this.velocities.set(part.id || part.name, new BABYLON.Vector3(0, 0, 0));
        this.lastPositions.set(part.id || part.name, part.position.clone());
        this.updatePartBounds(part);
        console.log(`📦 Registered part for collision: ${part.name || part.id}`);
    }

    unregisterPart(part: any) {
        // Restore color if part was in collision
        if (this.partsInCollision.has(part)) {
            this.setCollisionColor(part, false);
            this.partsInCollision.delete(part);
        }
        
        const index = this.collidableParts.indexOf(part);
        if (index > -1) {
            this.collidableParts.splice(index, 1);
            this.velocities.delete(part.id || part.name);
            this.lastPositions.delete(part.id || part.name);
        }
        
        // Clean up stored colors for this part's meshes
        if (part.getChildMeshes) {
            part.getChildMeshes().forEach((mesh: any) => {
                this.originalColors.delete(mesh);
            });
        }
    }

    updatePartBounds(part: any) {
        if (!part) return null;
        const childMeshes = part.getChildMeshes ? part.getChildMeshes() : [];
        if (childMeshes.length === 0) return null;
        
        let min = new BABYLON.Vector3(Infinity, Infinity, Infinity);
        let max = new BABYLON.Vector3(-Infinity, -Infinity, -Infinity);
        
        childMeshes.forEach((mesh: any) => {
            if (mesh.getBoundingInfo) {
                mesh.computeWorldMatrix(true);
                const bounds = mesh.getBoundingInfo().boundingBox;
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
                corners.forEach(corner => {
                    min = BABYLON.Vector3.Minimize(min, corner);
                    max = BABYLON.Vector3.Maximize(max, corner);
                });
            }
        });
        
        const bounds = {
            min: min,
            max: max,
            size: max.subtract(min),
            center: BABYLON.Vector3.Lerp(min, max, 0.5)
        };
        if (!part.metadata) part.metadata = {};
        part.metadata.collisionBounds = bounds;
        return bounds;
    }

    checkBoundsIntersection(bounds1: any, bounds2: any) {
        if (!bounds1 || !bounds2) return false;
        return (
            bounds1.min.x <= bounds2.max.x && bounds1.max.x >= bounds2.min.x &&
            bounds1.min.y <= bounds2.max.y && bounds1.max.y >= bounds2.min.y &&
            bounds1.min.z <= bounds2.max.z && bounds1.max.z >= bounds2.min.z
        );
    }

    calculateOverlap(bounds1: any, bounds2: any) {
        const overlapX = Math.min(bounds1.max.x, bounds2.max.x) - Math.max(bounds1.min.x, bounds2.min.x);
        const overlapY = Math.min(bounds1.max.y, bounds2.max.y) - Math.max(bounds1.min.y, bounds2.min.y);
        const overlapZ = Math.min(bounds1.max.z, bounds2.max.z) - Math.max(bounds1.min.z, bounds2.min.z);
        if (overlapX < 0 || overlapY < 0 || overlapZ < 0) return null;
        return { x: overlapX, y: overlapY, z: overlapZ, volume: overlapX * overlapY * overlapZ };
    }

    calculatePushDirection(part1: any, part2: any, overlap: any) {
        const center1 = part1.metadata.collisionBounds.center;
        const center2 = part2.metadata.collisionBounds.center;
        let minOverlap = Math.min(overlap.x, overlap.y, overlap.z);
        let pushDir = new BABYLON.Vector3(0, 0, 0);
        if (minOverlap === overlap.x) pushDir.x = center1.x > center2.x ? 1 : -1;
        else if (minOverlap === overlap.y) pushDir.y = center1.y > center2.y ? 1 : -1;
        else pushDir.z = center1.z > center2.z ? 1 : -1;
        return { direction: pushDir, magnitude: minOverlap };
    }

    detectAndResolveCollisions(excludePart = null) {
        // ✅ COLLISION RESOLUTION DISABLED - Parts can now overlap freely
        // This allows parts to be placed above, under, or overlapping each other
        // Visual feedback (red highlighting) is also disabled to avoid confusion
        return [];
        
        // OLD CODE - DISABLED:
        // if (!this.isEnabled) return [];
        // const collisions: any[] = [];
        // const currentlyColliding = new Set<any>(); // Track parts colliding in this frame
        // this.collidableParts.forEach(part => this.updatePartBounds(part));
        // for (let i = 0; i < this.collidableParts.length; i++) {
        //     const part1 = this.collidableParts[i];
        //     if (part1 === excludePart || !part1.metadata?.collisionBounds) continue;
        //     for (let j = i + 1; j < this.collidableParts.length; j++) {
        //         const part2 = this.collidableParts[j];
        //         if (part2 === excludePart || !part2.metadata?.collisionBounds) continue;
        //         if (this.arePartsConnected(part1, part2)) continue;
        //         const bounds1 = part1.metadata.collisionBounds;
        //         const bounds2 = part2.metadata.collisionBounds;
        //         if (this.checkBoundsIntersection(bounds1, bounds2)) {
        //             const overlap = this.calculateOverlap(bounds1, bounds2);
        //             if (overlap && overlap.volume > this.settings.overlapThreshold) {
        //                 const push = this.calculatePushDirection(part1, part2, overlap);
        //                 collisions.push({ part1, part2, overlap, pushDirection: push.direction, pushMagnitude: push.magnitude });
        //                 this.resolveCollision(part1, part2, push);
        //                 // Mark parts as currently colliding
        //                 currentlyColliding.add(part1);
        //                 currentlyColliding.add(part2);
        //             }
        //         }
        //     }
        // }
        // 
        // // Update collision state: set red for parts in collision, restore original for parts no longer colliding
        // currentlyColliding.forEach(part => {
        //     if (!this.partsInCollision.has(part)) {
        //         // Part just entered collision - set red color
        //         this.setCollisionColor(part, true);
        //         this.partsInCollision.add(part);
        //     }
        // });
        // 
        // // Restore colors for parts that are no longer colliding
        // this.partsInCollision.forEach(part => {
        //     if (!currentlyColliding.has(part)) {
        //         // Part is no longer colliding - restore original color
        //         this.setCollisionColor(part, false);
        //         this.partsInCollision.delete(part);
        //     }
        // });
        // 
        // return collisions;
    }

    arePartsConnected(part1: any, part2: any) {
        const hgm = (window as any).houseGroupManager;
        if (!hgm) return false;
        return hgm.getAllConnectedParts(part1).includes(part2);
    }

    resolveCollision(part1: any, part2: any, push: any) {
        const halfPush = push.magnitude * this.settings.pushbackStrength * 0.5;
        const selected = (window as any).selected;
        if (selected === part1) {
            part2.position.subtractInPlace(push.direction.scale(push.magnitude * this.settings.pushbackStrength));
        } else if (selected === part2) {
            part1.position.addInPlace(push.direction.scale(push.magnitude * this.settings.pushbackStrength));
        } else {
            part1.position.addInPlace(push.direction.scale(halfPush));
            part2.position.subtractInPlace(push.direction.scale(halfPush));
        }
        if (this.settings.showCollisionDebug) this.showCollisionIndicator(push, part1, part2);
        this.flashCollisionFeedback(part1);
        this.flashCollisionFeedback(part2);
    }

    flashCollisionFeedback(part: any) {
        // This function is kept for backward compatibility but is now handled by setCollisionColor
        // The color management is now done in detectAndResolveCollisions
        if (!part) return;
    }
    
    /**
     * Set or restore collision color for a part
     * @param part The part to update
     * @param inCollision true to set red color, false to restore original
     */
    setCollisionColor(part: any, inCollision: boolean) {
        if (!part) return;
        const meshes = part.getChildMeshes ? part.getChildMeshes() : [];
        meshes.forEach((mesh: any) => {
            if (!mesh.material) return;
            
            if (inCollision) {
                // Store original color if not already stored
                if (!this.originalColors.has(mesh)) {
                    const original = mesh.material.emissiveColor ? 
                        mesh.material.emissiveColor.clone() : 
                        new BABYLON.Color3(0, 0, 0);
                    this.originalColors.set(mesh, original);
                }
                // Set red collision color
                mesh.material.emissiveColor = new BABYLON.Color3(1, 0.3, 0.3);
            } else {
                // Restore original color
                const original = this.originalColors.get(mesh);
                if (original) {
                    mesh.material.emissiveColor = original.clone();
                    this.originalColors.delete(mesh); // Clean up stored color
                } else {
                    // Fallback: restore appropriate color based on part type
                    // Check if this is a house part (white) or red house part
                    const part = mesh.parent;
                    if (part && part.metadata && part.metadata.baseName) {
                        const baseName = part.metadata.baseName;
                        const redParts = ['part_1', 'part_2']; // Match the red parts from part-loader
                        if (baseName.startsWith('part_')) {
                            if (redParts.includes(baseName)) {
                                // Restore red color for red house parts
                                mesh.material.emissiveColor = new BABYLON.Color3(0.3, 0.05, 0.05);
                            } else {
                                // Restore white color for white house parts
                                mesh.material.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                            }
                        } else {
                            // Non-house parts: set to black if no original was stored
                            mesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
                        }
                    } else {
                        // Fallback: set to black if no original was stored
                        mesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
                    }
                }
            }
        });
    }

    checkSnapOpportunities(draggedPart: any) {
        if (!this.settings.enableSnapping || !draggedPart) return null;
        let bestSnap: any = null;
        let bestDistance = this.settings.snapDistance;
        
        // Try terminal-based snapping first (more accurate)
        const terminalSnap = this.checkTerminalSnapOpportunities(draggedPart);
        if (terminalSnap && terminalSnap.distance < bestDistance) {
            bestSnap = terminalSnap;
            bestDistance = terminalSnap.distance;
        }
        
        // Fallback to surface-based snapping for house parts
        if (!bestSnap || bestDistance > this.settings.snapDistance * 0.8) {
            this.collidableParts.forEach(part => {
                if (part === draggedPart || this.arePartsConnected(draggedPart, part)) return;
                if (!draggedPart.metadata?.baseName?.startsWith('part_')) return;
                if (!part.metadata?.baseName?.startsWith('part_')) return;
                const distance = BABYLON.Vector3.Distance(draggedPart.position, part.position);
                if (distance < bestDistance) {
                    const match = this.findBestSnapSurface(draggedPart, part);
                    if (match) {
                        bestDistance = distance;
                        bestSnap = { target: part, distance, surfaceMatch: match };
                    }
                }
            });
        }
        
        return bestSnap;
    }

    /**
     * Check for terminal-based snap opportunities
     * Uses terminal positions instead of component centers for accurate snapping
     */
    checkTerminalSnapOpportunities(draggedPart: any) {
        if (!draggedPart) return null;
        
        // Get all terminals on the dragged component
        const draggedTerminals = this.getComponentTerminals(draggedPart);
        if (draggedTerminals.length === 0) return null;
        
        let bestSnap: any = null;
        let bestDistance = this.settings.snapDistance;
        
        // Check against all other parts
        this.collidableParts.forEach(targetPart => {
            if (targetPart === draggedPart || this.arePartsConnected(draggedPart, targetPart)) return;
            
            // Get terminals on target component
            const targetTerminals = this.getComponentTerminals(targetPart);
            if (targetTerminals.length === 0) return;
            
            // Find closest terminal pair
            draggedTerminals.forEach(draggedTerminal => {
                const draggedTerminalPos = getTerminalConnectionPoint(draggedTerminal);
                
                targetTerminals.forEach(targetTerminal => {
                    const targetTerminalPos = getTerminalConnectionPoint(targetTerminal);
                    const distance = BABYLON.Vector3.Distance(draggedTerminalPos, targetTerminalPos);
                    
                    if (distance < bestDistance) {
                        bestDistance = distance;
                        bestSnap = {
                            target: targetPart,
                            distance: distance,
                            terminalMatch: {
                                draggedTerminal: draggedTerminal,
                                targetTerminal: targetTerminal,
                                draggedTerminalPos: draggedTerminalPos,
                                targetTerminalPos: targetTerminalPos,
                                snapPosition: this.calculateTerminalSnapPosition(
                                    draggedTerminal, targetTerminal, draggedPart, targetPart
                                )
                            }
                        };
                    }
                });
            });
        });
        
        return bestSnap;
    }

    /**
     * Get all terminals on a component
     */
    getComponentTerminals(component: any): any[] {
        const terminals: any[] = [];
        
        if (!component) return terminals;
        
        // Check metadata.terminals first
        if (component.metadata?.terminals) {
            component.metadata.terminals.forEach((terminal: any) => {
                if (terminal && (terminal.metadata?.isTerminal || terminal.metadata?.terminalId)) {
                    terminals.push(terminal);
                }
            });
        }
        
        // Search through child meshes
        if (component.getChildMeshes) {
            component.getChildMeshes().forEach((mesh: any) => {
                if (mesh.metadata) {
                    const isTerminal = mesh.metadata.isTerminal || 
                                      mesh.metadata.terminalId ||
                                      mesh.metadata.isLEDPin ||
                                      mesh.metadata.isArduinoPin ||
                                      mesh.metadata.isBreadboardTerminal ||
                                      mesh.metadata.isResistorPin;
                    
                    if (isTerminal) {
                        terminals.push(mesh);
                    }
                }
            });
        }
        
        return terminals;
    }

    /**
     * Calculate snap position based on terminal positions
     * Ensures components snap to terminal edges, not centers
     */
    calculateTerminalSnapPosition(draggedTerminal: any, targetTerminal: any, draggedPart: any, targetPart: any) {
        if (!draggedTerminal || !targetTerminal) return null;
        
        // Get world positions of terminals (use clone to avoid modifying originals)
        const targetTerminalWorldPos = getTerminalConnectionPoint(targetTerminal).clone();
        const draggedTerminalWorldPos = getTerminalConnectionPoint(draggedTerminal).clone();
        
        // Calculate offset from dragged component's position to its terminal
        const draggedPartWorldPos = draggedPart.getAbsolutePosition();
        const terminalOffset = draggedTerminalWorldPos.subtract(draggedPartWorldPos);
        
        // Calculate snap position: target terminal position minus the offset
        // This ensures the dragged component's terminal aligns with the target terminal
        const snapPosition = targetTerminalWorldPos.subtract(terminalOffset);
        
        return snapPosition;
    }

    findBestSnapSurface(part1: any, part2: any) {
        if (!part1.metadata?.connectionSurfaces || !part2.metadata?.connectionSurfaces) return null;
        const surfaces1 = part1.metadata.connectionSurfaces;
        const surfaces2 = part2.metadata.connectionSurfaces;
        let bestMatch: any = null;
        let bestScore = 0.3;
        Object.keys(surfaces1).forEach(key1 => {
            Object.keys(surfaces2).forEach(key2 => {
                const score = this.calculateSurfaceScore(surfaces1[key1], surfaces2[key2], part1, part2);
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = {
                        surface1: key1, surface2: key2, score,
                        surf1Data: surfaces1[key1], surf2Data: surfaces2[key2],
                        snapPosition: this.calculateSnapPosition(surfaces1[key1], surfaces2[key2], part1, part2)
                    };
                }
            });
        });
        return bestMatch;
    }

    calculateSurfaceScore(surf1: any, surf2: any, part1: any, part2: any) {
        const worldMatrix1 = part1.getWorldMatrix();
        const worldMatrix2 = part2.getWorldMatrix();
        const center1 = BABYLON.Vector3.TransformCoordinates(surf1.center, worldMatrix1);
        const center2 = BABYLON.Vector3.TransformCoordinates(surf2.center, worldMatrix2);
        const distance = BABYLON.Vector3.Distance(center1, center2);
        if (distance > this.settings.snapDistance * 2) return 0;
        const rotMatrix1 = worldMatrix1.clone().setTranslation(BABYLON.Vector3.Zero());
        const rotMatrix2 = worldMatrix2.clone().setTranslation(BABYLON.Vector3.Zero());
        const normal1 = BABYLON.Vector3.TransformNormal(surf1.normal, rotMatrix1).normalize();
        const normal2 = BABYLON.Vector3.TransformNormal(surf2.normal, rotMatrix2).normalize();
        const normalDot = BABYLON.Vector3.Dot(normal1, normal2);
        const normalAlignment = Math.max(0, -(normalDot + 1) / 2);
        const distanceScore = 1 - (distance / (this.settings.snapDistance * 2));
        return (distanceScore * 0.5) + (normalAlignment * 0.5);
    }

    calculateSnapPosition(surf1: any, surf2: any, part1: any, part2: any) {
        // Transform surface centers to world space
        const worldMatrix1 = part1.getWorldMatrix();
        const worldMatrix2 = part2.getWorldMatrix();
        
        const sourceCenter = BABYLON.Vector3.TransformCoordinates(surf1.center, worldMatrix1);
        const targetCenter = BABYLON.Vector3.TransformCoordinates(surf2.center, worldMatrix2);
        
        // Calculate normal vectors in world space
        const rotMatrix1 = worldMatrix1.clone().setTranslation(BABYLON.Vector3.Zero());
        const rotMatrix2 = worldMatrix2.clone().setTranslation(BABYLON.Vector3.Zero());
        const normal1 = BABYLON.Vector3.TransformNormal(surf1.normal, rotMatrix1).normalize();
        const normal2 = BABYLON.Vector3.TransformNormal(surf2.normal, rotMatrix2).normalize();
        
        // Calculate offset from part1's position to its surface center
        const part1WorldPos = part1.getAbsolutePosition();
        const offsetFromPart1ToSurface = sourceCenter.subtract(part1WorldPos);
        
        // Calculate snap position: target surface center minus the offset
        // This ensures part1's surface aligns with part2's surface
        const snapPos = targetCenter.subtract(offsetFromPart1ToSurface);
        
        // Add small gap to prevent overlap
        const gapDirection = normal2.scale(-1); // Opposite of target normal
        const snapPosWithGap = snapPos.add(gapDirection.scale(0.01));
        
        return snapPosWithGap;
    }

    applyMagneticPull(draggedPart: any, snapInfo: any) {
        if (!this.settings.enableMagneticPull || !snapInfo) return;
        
        // Get target position - prefer terminal-based snapping
        let targetPos: BABYLON.Vector3;
        if (snapInfo.terminalMatch && snapInfo.terminalMatch.snapPosition) {
            targetPos = snapInfo.terminalMatch.snapPosition;
        } else if (snapInfo.surfaceMatch && snapInfo.surfaceMatch.snapPosition) {
            targetPos = snapInfo.surfaceMatch.snapPosition;
        } else {
            return;
        }
        
        const draggedPartWorldPos = draggedPart.getAbsolutePosition();
        const direction = targetPos.subtract(draggedPartWorldPos);
        const distance = direction.length();
        if (distance < this.settings.magneticPullDistance && distance > 0.1) {
            const pullStrength = (1 - distance / this.settings.magneticPullDistance) * this.settings.magneticPullStrength;
            draggedPart.position.addInPlace(direction.scale(pullStrength));
        }
    }

    showSnapPreview(draggedPart: any, snapInfo: any) {
        // ✅ SNAP PREVIEW DISABLED - No green lines or preview boxes
        // This prevents green overlay lines from appearing on parts
        this.clearSnapPreview();
        return;
        
        // OLD CODE - DISABLED:
        // if (!snapInfo) return;
        // 
        // // Get target position - prefer terminal-based snapping
        // let targetPos: BABYLON.Vector3;
        // let previewSize = { width: 1, height: 0.1, depth: 1 };
        // 
        // if (snapInfo.terminalMatch && snapInfo.terminalMatch.snapPosition) {
        //     targetPos = snapInfo.terminalMatch.snapPosition;
        //     previewSize = { width: 0.3, height: 0.3, depth: 0.3 };
        // } else if (snapInfo.surfaceMatch && snapInfo.surfaceMatch.snapPosition) {
        //     targetPos = snapInfo.surfaceMatch.snapPosition;
        // } else {
        //     return;
        // }
        // 
        // const draggedPartWorldPos = draggedPart.getAbsolutePosition();
        // const preview = BABYLON.MeshBuilder.CreateBox("snapPreview", previewSize, this.scene);
        // preview.position = targetPos;
        // preview.isPickable = false;
        // const material = new BABYLON.StandardMaterial("snapPreviewMat", this.scene);
        // material.diffuseColor = new BABYLON.Color3(0.3, 1, 0.3);
        // material.alpha = 0.4;
        // material.wireframe = true;
        // preview.material = material;
        // this.snapPreview = preview;
        // 
        // // Show line from dragged part to snap position
        // const line = BABYLON.MeshBuilder.CreateLines("snapLine", { 
        //     points: [draggedPartWorldPos, targetPos] 
        // }, this.scene);
        // line.color = new BABYLON.Color3(0, 1, 0);
        // line.alpha = 0.5;
        // line.isPickable = false;
        // this.collisionIndicators.push(line);
        // 
        // // If terminal-based, also highlight the terminals
        // if (snapInfo.terminalMatch) {
        //     const draggedTerminal = snapInfo.terminalMatch.draggedTerminal;
        //     const targetTerminal = snapInfo.terminalMatch.targetTerminal;
        //     
        //     if (draggedTerminal && draggedTerminal.material) {
        //         draggedTerminal.material.emissiveColor = new BABYLON.Color3(0, 1, 0.5);
        //     }
        //     if (targetTerminal && targetTerminal.material) {
        //         targetTerminal.material.emissiveColor = new BABYLON.Color3(0, 1, 0.5);
        //     }
        // }
    }

    clearSnapPreview() {
        if (this.snapPreview) { this.snapPreview.dispose(); this.snapPreview = null; }
        this.collisionIndicators.forEach(indicator => indicator?.dispose?.());
        this.collisionIndicators = [];
        
        // Note: Terminal highlights are restored in executeSnap or when new preview is shown
        // This prevents flickering during drag
    }

    executeSnap(draggedPart: any, snapInfo: any) {
        if (!snapInfo) return false;
        
        // Get target position - prefer terminal-based snapping
        let targetPos: BABYLON.Vector3;
        if (snapInfo.terminalMatch && snapInfo.terminalMatch.snapPosition) {
            targetPos = snapInfo.terminalMatch.snapPosition;
        } else if (snapInfo.surfaceMatch && snapInfo.surfaceMatch.snapPosition) {
            targetPos = snapInfo.surfaceMatch.snapPosition;
        } else {
            return false;
        }
        
        // Animate to the snap position
        this.animateToPosition(draggedPart, targetPos, 200);
        
        // Restore terminal highlight colors after snap
        if (snapInfo.terminalMatch) {
            setTimeout(() => {
                const draggedTerminal = snapInfo.terminalMatch.draggedTerminal;
                const targetTerminal = snapInfo.terminalMatch.targetTerminal;
                
                if (draggedTerminal && draggedTerminal.material && draggedTerminal.material.diffuseColor) {
                    draggedTerminal.material.emissiveColor = draggedTerminal.material.diffuseColor.scale(0.2);
                }
                if (targetTerminal && targetTerminal.material && targetTerminal.material.diffuseColor) {
                    targetTerminal.material.emissiveColor = targetTerminal.material.diffuseColor.scale(0.2);
                }
            }, 250);
        }
        
        // Create connection if house parts
        const hgm = (window as any).houseGroupManager;
        if (hgm) {
            setTimeout(() => hgm.createConnection(draggedPart, snapInfo.target, null), 250);
        }
        
        return true;
    }

    animateToPosition(part: any, targetPos: BABYLON.Vector3, duration: number) {
        const startPos = part.position.clone();
        const startTime = Date.now();
        const animate = () => {
            const progress = Math.min((Date.now() - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            part.position = BABYLON.Vector3.Lerp(startPos, targetPos, eased);
            if (progress < 1) requestAnimationFrame(animate);
        };
        animate();
    }

    applyPhysics(deltaTime: number) {
        if (!this.settings.enablePhysics) return;
        this.collidableParts.forEach(part => {
            if (!part || part === (window as any).selected) return;
            const partId = part.id || part.name;
            let velocity = this.velocities.get(partId) || new BABYLON.Vector3(0, 0, 0);
            velocity.y += this.physics.gravity * deltaTime;
            velocity.scaleInPlace(this.physics.damping);
            part.position.addInPlace(velocity.scale(deltaTime));
            this.updatePartBounds(part);
            const bounds = part.metadata?.collisionBounds;
            if (bounds && bounds.min.y < this.settings.groundLevel) {
                part.position.y += (this.settings.groundLevel - bounds.min.y);
                velocity.y = Math.abs(velocity.y) > 0.1 ? -velocity.y * this.physics.bounciness : 0;
            }
            this.velocities.set(partId, velocity);
        });
    }

    showCollisionIndicator(push: any, part1: any, part2: any) {
        const center = BABYLON.Vector3.Lerp(part1.metadata.collisionBounds.center, part2.metadata.collisionBounds.center, 0.5);
        const sphere = BABYLON.MeshBuilder.CreateSphere("collisionIndicator", { diameter: 0.3 }, this.scene);
        sphere.position = center;
        const mat = new BABYLON.StandardMaterial("collisionMat", this.scene);
        mat.emissiveColor = new BABYLON.Color3(1, 0, 0);
        mat.alpha = 0.7;
        sphere.material = mat;
        sphere.isPickable = false;
        setTimeout(() => sphere.dispose(), 200);
    }

    update(deltaTime = 0.016) {
        if (!this.isEnabled) return;
        // ✅ Collision resolution disabled - parts can overlap freely
        // this.detectAndResolveCollisions();
        // ✅ Physics disabled to prevent parts from being pushed around
        // this.applyPhysics(deltaTime);
        // ✅ SNAP PREVIEW DISABLED - No green lines or visual overlays when dragging
        // Parts can be positioned freely without any visual feedback
        // const selected = (window as any).selected;
        // if (selected) {
        //     const snapInfo = this.checkSnapOpportunities(selected);
        //     if (snapInfo) {
        //         this.showSnapPreview(selected, snapInfo);
        //         this.applyMagneticPull(selected, snapInfo);
        //     } else {
        //         this.clearSnapPreview();
        //     }
        // }
    }

    start() {
        if (this._updateInterval) return;
        let lastTime = Date.now();
        this._updateInterval = setInterval(() => {
            const now = Date.now();
            this.update((now - lastTime) / 1000);
            lastTime = now;
        }, this.settings.checkInterval);
        console.log("▶️ Collision system started");
    }

    stop() {
        if (this._updateInterval) { clearInterval(this._updateInterval); this._updateInterval = null; }
        this.clearSnapPreview();
        console.log("⏹️ Collision system stopped");
    }

    clear() {
        // Restore all original colors before clearing
        this.partsInCollision.forEach(part => {
            this.setCollisionColor(part, false);
        });
        this.partsInCollision.clear();
        this.originalColors.clear();
        
        this.collidableParts = [];
        this.velocities.clear();
        this.lastPositions.clear();
        this.clearSnapPreview();
    }

    toggle() {
        this.isEnabled = !this.isEnabled;
        return this.isEnabled;
    }
}

// Attach to window for global access
(window as any).CollisionSystem = CollisionSystem;
export { CollisionSystem };