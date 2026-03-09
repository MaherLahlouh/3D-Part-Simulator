//@ts-nocheck
import { Vector3 } from '@babylonjs/core';


export function getPartBounds(part) {
    if (!part) return null;

    const hierarchy = part.getHierarchyBoundingVectors(true);

    const min = hierarchy.min;
    const max = hierarchy.max;

    return {
        min: min,
        max: max,
        center: Vector3.Center(min, max), // Built-in helper
        size: max.subtract(min),
        lowestY: min.y,
        highestY: max.y
    };
}


