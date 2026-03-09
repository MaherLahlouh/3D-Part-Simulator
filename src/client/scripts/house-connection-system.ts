// @ts-nocheck
/**
 * House Connection System
 * 
 * PURPOSE: Manages connections between house parts (part_1, part_2, etc.) in the 3D scene.
 * When parts are connected, they form a "group" that moves together as one unit.
 * 
 * KEY FEATURES:
 * - Connects up to 30 house parts in a single group
 * - Automatically snaps parts together to eliminate gaps
 * - Maintains relative positions when dragging connected parts
 * - Provides connection information and status
 * 
 * HOW IT WORKS:
 * 1. Parts are organized into "connection groups" (sets of connected parts)
 * 2. Each part has a unique ID that maps to a group ID
 * 3. When dragging, all parts in a group move together by the same delta
 * 4. When connecting, parts are automatically snapped edge-to-edge
 */

// Get BABYLON.js and scene from global window object
const BABYLON = window.BABYLON;
const scene = window.scene;

/**
 * HouseConnectionSystem Class
 * 
 * Manages all house part connections and group movements.
 * Uses Maps for efficient lookups: partId -> groupId, groupId -> ConnectionGroup
 */
export class HouseConnectionSystem {
    // Map of group IDs to ConnectionGroup objects (stores all connection groups)
    private connectionGroups: Map<string, ConnectionGroup>;
    
    // Map of part IDs to group IDs (quick lookup: which group does a part belong to?)
    private partToGroup: Map<string, string>;
    
    // Maximum number of parts allowed in a single connection group
    private maxPartsPerGroup: number;
    
    // Currently active drag group (null if not dragging or single part)
    private activeDragGroup: ConnectionGroup | null;
    
    // Stores starting positions of all parts when drag begins (for calculating movement delta)
    private dragStartPositions: Map<string, BABYLON.Vector3>;
    
    // Reference to the part being dragged (used to calculate movement delta)
    private draggedPart: any;

    /**
     * Constructor - Initialize the connection system
     * Sets up empty Maps and default values
     */
    constructor() {
        this.connectionGroups = new Map();  // Start with no groups
        this.partToGroup = new Map();       // Start with no part-to-group mappings
        this.maxPartsPerGroup = 30;         // Limit: 30 parts per group
        this.activeDragGroup = null;        // No active drag initially
        this.dragStartPositions = new Map(); // No stored positions initially
        this.draggedPart = null;            // No part being dragged initially

        console.log("🏠 House Connection System initialized (Max 30 parts per group)");
    }

    /**
     * Connect two house parts together
     * 
     * PROCESS:
     * 1. Validate both parts are house parts (start with 'part_')
     * 2. Check if parts are already connected
     * 3. Check if merging groups would exceed max limit (30 parts)
     * 4. Check if parts are close enough (within 15 units)
     * 5. Snap parts together to eliminate gaps
     * 6. Create or merge connection groups
     * 7. Show visual feedback
     * 
     * @param part1 First house part to connect
     * @param part2 Second house part to connect
     * @returns true if connection was successful, false otherwise
     */
    connectParts(part1: any, part2: any): boolean {
        // Validation: Check if parts exist
        if (!part1 || !part2) {
            console.warn("⚠️ Invalid parts for connection");
            return false;
        }

        // Validation: Both must be house parts (name starts with 'part_')
        if (!this.isHousePart(part1) || !this.isHousePart(part2)) {
            console.warn("⚠️ Both parts must be house parts (starting with 'part_')");
            return false;
        }

        // Get unique IDs for both parts
        const part1Id = this.getPartId(part1);
        const part2Id = this.getPartId(part2);

        // Validation: Can't connect a part to itself
        if (part1Id === part2Id) {
            console.warn("⚠️ Cannot connect part to itself");
            return false;
        }

        // Check if parts are already in the same group
        const group1 = this.getGroupForPart(part1);
        const group2 = this.getGroupForPart(part2);

        if (group1 && group2 && group1 === group2) {
            console.log("ℹ️ Parts are already connected");
            return false;
        }

        // Calculate total parts if we merge groups
        // If part1 is in a group, get all parts in that group; otherwise just part1
        const group1Parts = group1 ? this.getGroupParts(group1) : [part1];
        const group2Parts = group2 ? this.getGroupParts(group2) : [part2];
        const totalParts = group1Parts.length + group2Parts.length;

        // Validation: Check maximum limit (30 parts per group)
        if (totalParts > this.maxPartsPerGroup) {
            const message = `⚠️ Maximum connection limit reached (${this.maxPartsPerGroup} parts). Cannot connect groups with ${group1Parts.length} and ${group2Parts.length} parts.`;
            console.warn(message);
            if (typeof window.showMessage === 'function') {
                window.showMessage(message);
            }
            return false;
        }

        // ✅ DISTANCE CHECK REMOVED - Connect parts at any distance
        // ✅ SNAPPING REMOVED - Parts keep their exact positions when connecting
        // You can now connect parts above, below, overlapping, or at any distance

        // Now create or merge connection groups
        let targetGroup: ConnectionGroup;

        if (group1 && group2) {
            // Both parts are in different groups - merge the two groups into one
            targetGroup = this.mergeGroups(group1, group2);
        } else if (group1) {
            // part1 is in a group, add part2 to that group
            targetGroup = group1;
            this.addPartToGroup(part2, targetGroup);
        } else if (group2) {
            // part2 is in a group, add part1 to that group
            targetGroup = group2;
            this.addPartToGroup(part1, targetGroup);
        } else {
            // Neither part is in a group - create a new group with both parts
            targetGroup = this.createNewGroup([part1, part2]);
        }

        console.log(`✅ Connected parts: ${part1Id} ↔ ${part2Id} (Group size: ${targetGroup.parts.size}/${this.maxPartsPerGroup})`);
        
        // ✅ GREEN CONNECTION EFFECT REMOVED - No visual feedback when connecting
        // Parts connect silently without any visual effects
        
        return true;
    }

    /**
     * Disconnect a part from its group
     * 
     * PROCESS:
     * 1. Find which group the part belongs to
     * 2. Remove the part from that group
     * 3. If group has only 1 part left, remove the group entirely
     * 4. Show visual feedback
     * 
     * @param part The part to disconnect
     * @returns true if disconnection was successful, false if part wasn't connected
     */
    disconnectPart(part: any): boolean {
        const partId = this.getPartId(part);
        const groupId = this.partToGroup.get(partId); // Find which group this part belongs to

        // If part is not in any group, it's not connected
        if (!groupId) {
            console.log("ℹ️ Part is not connected");
            return false;
        }

        const group = this.connectionGroups.get(groupId);
        if (!group) return false;

        // Remove part from the group
        group.parts.delete(partId);
        this.partToGroup.delete(partId);

        // If group has only one part left (or none), remove the group entirely
        // A group with 1 part is the same as no group
        if (group.parts.size <= 1) {
            if (group.parts.size === 1) {
                // Remove the last part from the mapping too
                const remainingPartId = Array.from(group.parts)[0];
                this.partToGroup.delete(remainingPartId);
            }
            this.connectionGroups.delete(groupId);
        }

        console.log(`🔌 Disconnected part: ${partId}`);
        this.showDisconnectionEffect(part.position);
        
        return true;
    }

    /**
     * Disconnect all parts from all connection groups
     * 
     * PROCESS:
     * 1. Collect all parts from all connection groups
     * 2. Show visual disconnection effects for each part
     * 3. Clear all groups and mappings
     * 
     * @returns Number of parts that were disconnected
     */
    disconnectAll(): number {
        let disconnectedCount = 0;
        
        // Collect all parts from all groups before clearing
        const partsToDisconnect: any[] = [];
        
        this.connectionGroups.forEach((group) => {
            group.parts.forEach(partId => {
                const part = this.findPartById(partId);
                if (part) {
                    partsToDisconnect.push(part);
                    disconnectedCount++;
                }
            });
        });

        // Show visual disconnection effects for each part
        partsToDisconnect.forEach(part => {
            this.showDisconnectionEffect(part.position);
        });

        // Clear all groups and mappings
        this.connectionGroups.clear();
        this.partToGroup.clear();

        console.log(`🔌 Disconnected all parts: ${disconnectedCount} parts disconnected`);
        
        return disconnectedCount;
    }

    /**
     * Start dragging a group of connected parts
     * 
     * Called when user starts dragging a part that belongs to a group.
     * Stores initial positions of ALL parts in the group so we can move them together.
     * 
     * PROCESS:
     * 1. Find the group this part belongs to
     * 2. Store starting positions of all parts in the group
     * 3. Mark this as the active drag group
     * 
     * @param part The part being dragged (must be part of a group)
     */
    startDragging(part: any): void {
        const group = this.getGroupForPart(part);
        
        // If part is not in a group or group has only 1 part, no special handling needed
        if (!group || group.parts.size <= 1) {
            this.activeDragGroup = null;
            return;
        }

        // Set this as the active drag group
        this.activeDragGroup = group;
        this.draggedPart = part;
        this.dragStartPositions.clear(); // Clear any old positions

        // ✅ CRITICAL: Store initial positions of all parts in the group
        // Use position.clone() to ensure we store exact values without reference issues
        // Force world matrix update to ensure positions are accurate
        group.parts.forEach(partId => {
            const p = this.findPartById(partId);
            if (p) {
                // Force world matrix update to ensure accurate position
                p.computeWorldMatrix(true);
                // Store exact position value (cloned to avoid reference issues)
                this.dragStartPositions.set(partId, p.position.clone());
            }
        });

        console.log(`🎯 Started dragging group with ${group.parts.size} parts`);
    }

    /**
     * Update positions of all parts in the group during drag
     * 
     * Called continuously while dragging. Moves all parts in the group by the same amount.
     * 
     * PROCESS:
     * 1. Calculate how far the dragged part has moved (delta)
     * 2. Apply the same movement to all other parts in the group
     * 3. Update collision bounds for moved parts
     * 
     * This ensures all connected parts move together as one unit, maintaining their relative positions.
     * 
     * @param draggedPart The part currently being dragged
     */
    updateDrag(draggedPart: any): void {
        // Safety checks: must have active drag group and dragged part
        if (!this.activeDragGroup || !this.draggedPart) return;

        const draggedPartId = this.getPartId(draggedPart);
        // Safety check: dragged part must be in the active group
        if (!this.activeDragGroup.parts.has(draggedPartId)) return;

        // Force world matrix update to ensure we get the current accurate position
        draggedPart.computeWorldMatrix(true);
        
        // Calculate movement delta: how far has the dragged part moved?
        const startPos = this.dragStartPositions.get(draggedPartId);
        if (!startPos) return;

        // ✅ CRITICAL: Calculate delta using position (same as stored start position)
        // Delta = current position - starting position
        const delta = draggedPart.position.clone().subtract(startPos);

        // Apply the same delta to all other parts in the group
        // This keeps all parts moving together, maintaining their EXACT relative positions with NO gaps
        this.activeDragGroup.parts.forEach(partId => {
            if (partId === draggedPartId) return; // Skip the dragged part itself (already moved)

            const part = this.findPartById(partId);
            if (!part) return;

            const partStartPos = this.dragStartPositions.get(partId);
            if (partStartPos) {
                // ✅ CRITICAL: Maintain exact relative positions with NO gaps
                // New position = starting position + movement delta
                // This ensures all parts move together maintaining their exact relative arrangement
                const newPosition = partStartPos.clone().add(delta);
                
                // Directly set position (house parts are direct children of scene, no parent transformation needed)
                part.position.x = newPosition.x;
                part.position.y = newPosition.y;
                part.position.z = newPosition.z;
                
                // Force world matrix update to ensure position is applied correctly
                part.computeWorldMatrix(true);
            }
        });
    }

    /**
     * End dragging
     * 
     * Called when user releases the mouse after dragging.
     * Performs final collision checks, re-snaps parts to eliminate gaps, and cleanup.
     * 
     * PROCESS:
     * 1. Re-snap all parts in the group to eliminate any gaps that may have appeared
     * 2. Update collision bounds for all parts in the group
     * 3. Run final collision detection and resolution
     * 4. Clear drag state
     */
    endDragging(): void {
        if (this.activeDragGroup) {
            // ✅ RE-SNAPPING DISABLED - Parts maintain their exact relative positions
            // No re-snapping after dragging - parts stay exactly where you positioned them
            // this.resnapGroupParts(this.activeDragGroup);

            // Update collision bounds for all parts in the group (optional, for collision system)
            if (window.collisionSystem) {
                this.activeDragGroup.parts.forEach(partId => {
                    const part = this.findPartById(partId);
                    if (part && window.collisionSystem.updatePartBounds) {
                        window.collisionSystem.updatePartBounds(part);
                    }
                });

                // ✅ Collision detection disabled - parts can overlap freely
                // if (window.collisionSystem.detectAndResolveCollisions) {
                //     window.collisionSystem.detectAndResolveCollisions();
                // }
            }
        }

        // Clear drag state
        this.activeDragGroup = null;
        this.draggedPart = null;
        this.dragStartPositions.clear();
    }

    /**
     * Re-snap all parts in a group to eliminate gaps
     * 
     * PURPOSE: After dragging, parts may have slight misalignments due to floating-point errors.
     * This function re-snaps all parts in the group to ensure perfect edge-to-edge contact.
     * 
     * PROCESS:
     * 1. Get all parts in the group
     * 2. Use the first part as the reference (anchor)
     * 3. Snap all other parts to their nearest neighbor in the group
     * 4. This ensures all parts maintain perfect alignment
     * 
     * @param group The connection group to re-snap
     */
    private resnapGroupParts(group: ConnectionGroup): void {
        if (!group || group.parts.size <= 1) return;

        const parts = this.getGroupParts(group);
        if (parts.length <= 1) return;

        // Use first part as reference anchor
        const anchorPart = parts[0];
        if (!anchorPart) return;

        // Re-snap all other parts to their nearest neighbor
        // This maintains the group structure while eliminating gaps
        for (let i = 1; i < parts.length; i++) {
            const part = parts[i];
            if (!part) continue;

            // Find the nearest part in the group (excluding self)
            let nearestPart = anchorPart;
            let nearestDistance = BABYLON.Vector3.Distance(part.position, anchorPart.position);

            for (let j = 0; j < parts.length; j++) {
                if (i === j) continue; // Skip self
                const otherPart = parts[j];
                if (!otherPart) continue;

                const distance = BABYLON.Vector3.Distance(part.position, otherPart.position);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestPart = otherPart;
                }
            }

            // Snap this part to its nearest neighbor
            if (nearestPart && nearestPart !== part) {
                this.snapPartsTogether(nearestPart, part);
            }
        }

        console.log(`🔧 Re-snapped ${parts.length} parts in group to eliminate gaps`);
    }

    /**
     * Check if a part is connected to any other part
     * 
     * @param part The part to check
     * @returns true if part is in a group with other parts, false otherwise
     */
    isConnected(part: any): boolean {
        const partId = this.getPartId(part);
        const group = this.getGroupForPart(part);
        // Connected means group exists AND has more than 1 part
        return group ? group.parts.size > 1 : false;
    }

    /**
     * Get all parts connected to a given part
     * 
     * @param part The part to get connections for
     * @returns Array of all parts in the same group (including the part itself)
     */
    getConnectedParts(part: any): any[] {
        const group = this.getGroupForPart(part);
        if (!group) return [part]; // Not in a group, return just this part

        // Collect all parts in the group
        const connectedParts: any[] = [];
        group.parts.forEach(partId => {
            const p = this.findPartById(partId);
            if (p) connectedParts.push(p);
        });

        return connectedParts;
    }

    /**
     * Get connection info for a part
     * 
     * Returns detailed information about a part's connection status.
     * Used by UI and other systems to display connection information.
     * 
     * @param part The part to get info for
     * @returns ConnectionInfo object with connection status, group size, etc.
     */
    getConnectionInfo(part: any): ConnectionInfo | null {
        const group = this.getGroupForPart(part);
        if (!group) {
            // Not in any group - return "not connected" info
            return {
                isConnected: false,
                groupSize: 1,
                maxSize: this.maxPartsPerGroup
            };
        }

        // Return connection info
        return {
            isConnected: group.parts.size > 1, // Connected if group has more than 1 part
            groupSize: group.parts.size,      // How many parts in this group
            maxSize: this.maxPartsPerGroup,   // Maximum allowed (30)
            connectedParts: this.getConnectedParts(part) // Array of all connected parts
        };
    }

    /**
     * Clear all connections
     * 
     * Removes all connection groups and mappings.
     * Used for resetting the scene or cleanup.
     */
    clearAllConnections(): void {
        this.connectionGroups.clear();
        this.partToGroup.clear();
        this.activeDragGroup = null;
        this.dragStartPositions.clear();
        this.draggedPart = null;
        console.log("🧹 All house connections cleared");
    }

    // ========== PRIVATE HELPER METHODS ==========
    // These methods are used internally and not exposed publicly

    /**
     * Check if a part is a house part
     * 
     * House parts are identified by their baseName starting with 'part_'
     * (e.g., 'part_1', 'part_2', etc.)
     * 
     * @param part The part to check
     * @returns true if part is a house part, false otherwise
     */
    private isHousePart(part: any): boolean {
        return part && 
               part.metadata && 
               part.metadata.baseName && 
               typeof part.metadata.baseName === 'string' &&
               part.metadata.baseName.startsWith('part_');
    }

    /**
     * Get unique ID for a part
     * 
     * Uses part.id if available, otherwise part.name, otherwise generates a random ID.
     * 
     * @param part The part to get ID for
     * @returns Unique string ID for the part
     */
    private getPartId(part: any): string {
        return part.id || part.name || `part_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Create a new connection group
     * 
     * Creates a new group and adds all provided parts to it.
     * 
     * @param parts Array of parts to add to the new group
     * @returns The newly created ConnectionGroup
     */
    private createNewGroup(parts: any[]): ConnectionGroup {
        // Generate unique group ID using timestamp and random string
        const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const group: ConnectionGroup = {
            id: groupId,
            parts: new Set(), // Use Set for efficient membership testing
            created: Date.now()
        };

        // Add all parts to the group and create part-to-group mappings
        parts.forEach(part => {
            const partId = this.getPartId(part);
            group.parts.add(partId);
            this.partToGroup.set(partId, groupId); // Map: partId -> groupId
        });

        // Store the group
        this.connectionGroups.set(groupId, group);
        return group;
    }

    /**
     * Add a part to an existing group
     * 
     * @param part The part to add
     * @param group The group to add it to
     */
    private addPartToGroup(part: any, group: ConnectionGroup): void {
        const partId = this.getPartId(part);
        group.parts.add(partId);
        this.partToGroup.set(partId, group.id); // Update mapping
    }

    /**
     * Get the group that a part belongs to
     * 
     * @param part The part to look up
     * @returns The ConnectionGroup the part belongs to, or null if not in any group
     */
    private getGroupForPart(part: any): ConnectionGroup | null {
        const partId = this.getPartId(part);
        const groupId = this.partToGroup.get(partId); // Look up group ID
        if (!groupId) return null;
        return this.connectionGroups.get(groupId) || null; // Get the group object
    }

    /**
     * Get all parts in a group
     * 
     * Converts the Set of part IDs to an array of actual part objects.
     * 
     * @param group The group to get parts from
     * @returns Array of part objects
     */
    private getGroupParts(group: ConnectionGroup): any[] {
        const parts: any[] = [];
        group.parts.forEach(partId => {
            const part = this.findPartById(partId);
            if (part) parts.push(part);
        });
        return parts;
    }

    /**
     * Merge two groups into one
     * 
     * When connecting parts from two different groups, we merge them.
     * All parts from group2 are moved into group1, then group2 is deleted.
     * 
     * @param group1 The group to merge into (kept)
     * @param group2 The group to merge from (deleted)
     * @returns The merged group (group1)
     */
    private mergeGroups(group1: ConnectionGroup, group2: ConnectionGroup): ConnectionGroup {
        // Move all parts from group2 into group1
        group2.parts.forEach(partId => {
            group1.parts.add(partId);
            this.partToGroup.set(partId, group1.id); // Update mapping to point to group1
        });

        // Remove group2 (no longer needed)
        this.connectionGroups.delete(group2.id);
        return group1;
    }

    /**
     * Find a part by its ID
     * 
     * Searches through window.allParts array to find a part with matching ID.
     * 
     * @param partId The ID to search for
     * @returns The part object, or null if not found
     */
    private findPartById(partId: string): any {
        if (!window.allParts || !Array.isArray(window.allParts)) {
            return null;
        }

        return window.allParts.find(part => {
            const id = part.id || part.name;
            return id === partId;
        }) || null;
    }

    /**
     * Show visual connection effect
     * 
     * Creates a green animated sphere at the connection point to provide visual feedback.
     * The sphere scales up and fades out.
     * 
     * @param position Where to show the effect (usually part1's position)
     */
    private showConnectionEffect(position: BABYLON.Vector3): void {
        if (!scene) return;

        try {
            // Create a small green sphere
            const sphere = BABYLON.MeshBuilder.CreateSphere("connectionEffect", {
                diameter: 0.5
            }, scene);
            
            sphere.position = position.clone();
            sphere.position.y += 1; // Position above the part
            
            // Create green emissive material
            const material = new BABYLON.StandardMaterial("connectionMat", scene);
            material.emissiveColor = new BABYLON.Color3(0, 1, 0); // Green
            material.alpha = 0.8;
            sphere.material = material;
            sphere.isPickable = false; // Don't interfere with picking
            
            // Animate: scale up from 1x to 2x
            BABYLON.Animation.CreateAndStartAnimation(
                "scaleUp",
                sphere,
                "scaling",
                30, // 30 FPS
                15, // 15 frames = 0.5 seconds
                new BABYLON.Vector3(1, 1, 1),
                new BABYLON.Vector3(2, 2, 2),
                0
            );
            
            // Animate: fade out
            BABYLON.Animation.CreateAndStartAnimation(
                "fadeOut",
                material,
                "alpha",
                30, // 30 FPS
                20, // 20 frames = 0.67 seconds
                0.8,
                0,
                0
            );
            
            // Clean up after animation completes
            setTimeout(() => {
                sphere.dispose();
            }, 700);
        } catch (error) {
            console.warn("Error showing connection effect:", error);
        }
    }

    /**
     * Show visual disconnection effect
     * 
     * Creates a yellow animated cylinder at the disconnection point.
     * Similar to connection effect but uses a cylinder shape.
     * 
     * @param position Where to show the effect
     */
    private showDisconnectionEffect(position: BABYLON.Vector3): void {
        if (!scene) return;

        try {
            // Create a yellow cylinder
            const cylinder = BABYLON.MeshBuilder.CreateCylinder("disconnectEffect", {
                height: 2,
                diameter: 1
            }, scene);
            
            cylinder.position = position.clone();
            cylinder.position.y += 1;
            
            // Create yellow emissive material
            const material = new BABYLON.StandardMaterial("disconnectMat", scene);
            material.emissiveColor = new BABYLON.Color3(1, 1, 0); // Yellow
            material.alpha = 0.8;
            cylinder.material = material;
            cylinder.isPickable = false;
            
            // Animate: fade out
            BABYLON.Animation.CreateAndStartAnimation(
                "fadeOut",
                material,
                "alpha",
                30,
                20,
                0.8,
                0,
                0
            );
            
            // Clean up
            setTimeout(() => {
                cylinder.dispose();
            }, 600);
        } catch (error) {
            console.warn("Error showing disconnection effect:", error);
        }
    }

    /**
     * Snap two parts together to eliminate gaps
     * 
     * CRITICAL FUNCTION: This is what prevents gaps between connected parts.
     * 
     * PROCESS:
     * 1. Get bounding boxes of both parts (in world space)
     * 2. Calculate centers and sizes
     * 3. Determine which axis (X, Y, or Z) has the strongest alignment
     * 4. Calculate snap position: align edges along that axis
     * 5. Align other two axes to match part1
     * 6. Apply the snap position to part2
     * 
     * EXAMPLE:
     * If part2 is to the right of part1:
     * - Snap part2's left edge to part1's right edge (X axis)
     * - Align Y and Z positions to match part1
     * 
     * @param part1 The reference part (stays in place)
     * @param part2 The part to snap (moves to align with part1)
     */
    private snapPartsTogether(part1: any, part2: any): void {
        if (!part1 || !part2) return;

        // Get bounding boxes in world space (accounts for rotation, scale, position)
        const bounds1 = this.getPartBounds(part1);
        const bounds2 = this.getPartBounds(part2);

        if (!bounds1 || !bounds2) {
            console.warn("⚠️ Could not get bounds for snapping");
            return;
        }

        // Calculate centers (in world space) - use clones to avoid modifying originals
        const center1 = bounds1.center.clone();
        const center2 = bounds2.center.clone();

        // Calculate sizes (width, height, depth) - use clones to avoid modifying originals
        const size1 = bounds1.size.clone();
        const size2 = bounds2.size.clone();

        // Find the direction vector from part1 to part2
        // Use clone to avoid modifying center2
        const direction = center2.clone().subtract(center1);
        
        // Get absolute values to find which axis has the largest separation
        const absDirection = new BABYLON.Vector3(
            Math.abs(direction.x),
            Math.abs(direction.y),
            Math.abs(direction.z)
        );

        // Determine which axis has the strongest alignment
        // This tells us which faces are closest (left/right, top/bottom, or front/back)
        let snapAxis: 'x' | 'y' | 'z';
        if (absDirection.x >= absDirection.y && absDirection.x >= absDirection.z) {
            snapAxis = 'x'; // Parts are aligned horizontally (left/right)
        } else if (absDirection.y >= absDirection.z) {
            snapAxis = 'y'; // Parts are aligned vertically (top/bottom)
        } else {
            snapAxis = 'z'; // Parts are aligned front-to-back
        }

        // Calculate the offset from part position to bounding box center
        // Parts might not be centered at their position, so we need to account for this
        // Use clone to avoid modifying center vectors
        const offset1 = center1.clone().subtract(part1.position);
        const offset2 = center2.clone().subtract(part2.position);

        // Calculate snap position for part2
        // CRITICAL: We want edge-to-edge contact with ZERO gap
        // This means: part2's edge should be EXACTLY at part1's edge
        let newPosition = part2.position.clone();

        if (snapAxis === 'x') {
            // Snap along X axis (left/right alignment)
            if (direction.x > 0) {
                // part2 is to the right of part1
                // Snap part2's LEFT edge to part1's RIGHT edge (no gap)
                // part2.leftEdge = part1.rightEdge
                // part2.center - (size2/2) = part1.center + (size1/2)
                // part2.center = part1.center + (size1/2) + (size2/2)
                // part2.position = part1.position + offset1 + (size1/2) + (size2/2) - offset2
                newPosition.x = part1.position.x + offset1.x + (size1.x / 2) + (size2.x / 2) - offset2.x;
            } else {
                // part2 is to the left of part1
                // Snap part2's RIGHT edge to part1's LEFT edge (no gap)
                // part2.rightEdge = part1.leftEdge
                // part2.center + (size2/2) = part1.center - (size1/2)
                // part2.center = part1.center - (size1/2) - (size2/2)
                newPosition.x = part1.position.x + offset1.x - (size1.x / 2) - (size2.x / 2) - offset2.x;
            }
            // Align Y and Z to part1's center (accounting for offsets)
            newPosition.y = part1.position.y + offset1.y - offset2.y;
            newPosition.z = part1.position.z + offset1.z - offset2.z;
        } else if (snapAxis === 'y') {
            // Snap along Y axis (up/down alignment)
            if (direction.y > 0) {
                // part2 is above part1
                // Snap part2's BOTTOM edge to part1's TOP edge (no gap)
                newPosition.y = part1.position.y + offset1.y + (size1.y / 2) + (size2.y / 2) - offset2.y;
            } else {
                // part2 is below part1
                // Snap part2's TOP edge to part1's BOTTOM edge (no gap)
                newPosition.y = part1.position.y + offset1.y - (size1.y / 2) - (size2.y / 2) - offset2.y;
            }
            // Align X and Z to part1's center
            newPosition.x = part1.position.x + offset1.x - offset2.x;
            newPosition.z = part1.position.z + offset1.z - offset2.z;
        } else {
            // Snap along Z axis (front/back alignment)
            if (direction.z > 0) {
                // part2 is in front of part1
                // Snap part2's BACK edge to part1's FRONT edge (no gap)
                newPosition.z = part1.position.z + offset1.z + (size1.z / 2) + (size2.z / 2) - offset2.z;
            } else {
                // part2 is behind part1
                // Snap part2's FRONT edge to part1's BACK edge (no gap)
                newPosition.z = part1.position.z + offset1.z - (size1.z / 2) - (size2.z / 2) - offset2.z;
            }
            // Align X and Y to part1's center
            newPosition.x = part1.position.x + offset1.x - offset2.x;
            newPosition.y = part1.position.y + offset1.y - offset2.y;
        }

        // Apply the calculated snap position to part2
        part2.position = newPosition;

        // Force world matrix update (ensures transformations are applied)
        part2.computeWorldMatrix(true);
        part2.getChildMeshes().forEach((mesh: any) => {
            if (mesh) mesh.computeWorldMatrix(true);
        });

        // Update collision bounds if collision system exists
        // This ensures collision detection works correctly after snapping
        if (window.collisionSystem && window.collisionSystem.updatePartBounds) {
            window.collisionSystem.updatePartBounds(part2);
        }

        // Update bounding box metadata if function exists
        // This keeps the bounding box info up-to-date
        if (typeof window.calculateAndStoreBoundingBox === 'function') {
            window.calculateAndStoreBoundingBox(part2);
        }

        console.log(`🧲 Snapped ${this.getPartId(part2)} to ${this.getPartId(part1)} along ${snapAxis} axis`);
    }

    /**
     * Get bounding box for a part in world space
     * 
     * Calculates the actual bounding box of a part accounting for:
     * - Position
     * - Rotation
     * - Scale
     * - All child meshes
     * 
     * Returns center and size in world coordinates.
     * 
     * @param part The part to get bounds for
     * @returns Object with center and size vectors, or null if calculation fails
     */
    private getPartBounds(part: any): { center: BABYLON.Vector3; size: BABYLON.Vector3 } | null {
        if (!part) return null;

        // Get all child meshes (the actual 3D geometry)
        const meshes = part.getChildMeshes();
        if (meshes.length === 0) return null;

        // Force world matrix update (ensures transformations are applied)
        part.computeWorldMatrix(true);
        meshes.forEach((mesh: any) => {
            if (mesh) mesh.computeWorldMatrix(true);
        });

        // Initialize min/max to extreme values
        let min = new BABYLON.Vector3(Infinity, Infinity, Infinity);
        let max = new BABYLON.Vector3(-Infinity, -Infinity, -Infinity);

        // Iterate through all meshes and find the overall bounding box
        meshes.forEach((mesh: any) => {
            if (mesh && mesh.getBoundingInfo) {
                const bounds = mesh.getBoundingInfo().boundingBox;
                if (bounds.minimumWorld && bounds.maximumWorld) {
                    // Use world-space bounds if available (preferred)
                    min = BABYLON.Vector3.Minimize(min, bounds.minimumWorld);
                    max = BABYLON.Vector3.Maximize(max, bounds.maximumWorld);
                } else {
                    // Fallback: transform local bounds to world space
                    const localMin = bounds.minimum;
                    const localMax = bounds.maximum;
                    if (localMin && localMax) {
                        // Transform local coordinates to world coordinates
                        const worldMin = BABYLON.Vector3.TransformCoordinates(localMin, mesh.getWorldMatrix());
                        const worldMax = BABYLON.Vector3.TransformCoordinates(localMax, mesh.getWorldMatrix());
                        min = BABYLON.Vector3.Minimize(min, worldMin);
                        max = BABYLON.Vector3.Maximize(max, worldMax);
                    }
                }
            }
        });

        // Safety check: if no valid bounds found, use default
        if (min.x === Infinity || max.x === -Infinity) {
            // Fallback: use part position as center with default size
            const defaultSize = 2.0;
            return {
                center: part.position.clone(),
                size: new BABYLON.Vector3(defaultSize, defaultSize, defaultSize)
            };
        }

        // Calculate center (midpoint between min and max)
        // Use clone to avoid modifying the original vectors
        const center = BABYLON.Vector3.Lerp(min.clone(), max.clone(), 0.5);
        // Calculate size (difference between max and min)
        // Use clone to avoid modifying max vector
        const size = max.clone().subtract(min);

        return { center, size };
    }
}

// ========== TYPE DEFINITIONS ==========

/**
 * ConnectionGroup Interface
 * 
 * Represents a group of connected house parts.
 * All parts in a group move together when dragged.
 */
interface ConnectionGroup {
    id: string;              // Unique group identifier
    parts: Set<string>;      // Set of part IDs in this group (Set for efficient lookups)
    created: number;         // Timestamp when group was created
}

/**
 * ConnectionInfo Interface
 * 
 * Information about a part's connection status.
 * Returned by getConnectionInfo() for UI display.
 */
interface ConnectionInfo {
    isConnected: boolean;    // Is this part connected to others?
    groupSize: number;       // How many parts in the group
    maxSize: number;         // Maximum allowed parts (30)
    connectedParts?: any[];  // Array of all connected part objects
}

// ========== GLOBAL INITIALIZATION ==========

/**
 * Initialize the House Connection System globally
 * 
 * Creates a single global instance that can be accessed from anywhere.
 * Called during application startup.
 */
export function initHouseConnectionSystem() {
    window.houseConnectionSystem = new HouseConnectionSystem();
    console.log("✅ House Connection System Global Instance Ready");
}
