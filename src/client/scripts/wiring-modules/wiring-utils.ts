// Wiring Utilities - Shared helper functions for all wiring modules
//@ts-nocheck

/**
 * Synchronize local array with window reference
 */
export function syncWindowReference(windowKey, localArray) {
  if (window[windowKey] !== localArray) {
    window[windowKey] = localArray;
  }
}

/**
 * Remove item from array and sync window reference
 */
export function removeFromArray(array, item, windowKey) {
  const index = array.indexOf(item);
  if (index > -1) {
    array.splice(index, 1);
    syncWindowReference(windowKey, array);
  }
}

/**
 * Remove connection by wireId from array and sync window reference
 */
export function removeConnectionById(array, wireId, windowKey) {
  const index = array.findIndex(conn => conn.wireId === wireId);
  if (index > -1) {
    array.splice(index, 1);
    syncWindowReference(windowKey, array);
  }
}

/**
 * Dispose wire mesh and all its resources
 */
export function disposeWireMesh(wireMesh) {
  try {
    if (wireMesh.actionManager) {
      wireMesh.actionManager.dispose();
    }
    if (wireMesh.material) {
      wireMesh.material.dispose();
    }
    wireMesh.dispose(false, true);
  } catch (error) {
    console.error('❌ Error disposing wire mesh:', error);
  }
}

/**
 * Show user-friendly error or success message
 */
export function showUserMessage(message, type = 'info', duration = 2000) {
  if (typeof window.showToast === 'function') {
    window.showToast(message, type, duration);
  } else if (typeof window.showMessage === 'function') {
    window.showMessage(message);
  }
}

/**
 * Call all available updateWireCount functions
 */
export function updateAllWireCounts(localUpdateFn) {
  if (typeof localUpdateFn === 'function') {
    localUpdateFn();
  }
  if (typeof window.updateWireCount === 'function' && window.updateWireCount !== localUpdateFn) {
    window.updateWireCount();
  }
}
