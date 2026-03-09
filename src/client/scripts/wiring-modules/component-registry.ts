

/**
 * Component State Interface
 * Base structure for all component states
 */
export interface ComponentState {
  lastUpdate: number;
  hasChanged: boolean;
  [key: string]: any; // Allow component-specific state properties
}

/**
 * Component Entry
 * Represents a registered component in the registry
 */
export interface ComponentEntry {
  id: string;
  mesh: BABYLON.AbstractMesh;
  type: string;
  metadata: any;
  data: any;
  registeredAt: number;
  lastUpdate: number;
}

/**
 * Component Registry Configuration
 */
export interface RegistryConfig {
  autoRefresh: boolean;
  optimizeUpdates: boolean;
  enableChangeDetection: boolean;
}

/**
 * Component Registry
 * Centralized cache and state management for all scene components
 * 
 * Features:
 * - Unified component caching by unique identifier
 * - State tracking with automatic change detection
 * - Type-safe component organization
 * - Performance-optimized updates
 * - Extensible for any component type
 */
export class ComponentRegistry {
  private components: Map<string, ComponentEntry>;
  private componentStates: Map<string, ComponentState>;
  private typeRegistry: Map<string, Set<string>>;
  private config: RegistryConfig;
  //decide if we want to use record or map 
  private stats: {
    totalComponents: number;
    componentsByType: Record<string, number>;
    updatedComponents: number;
    skippedComponents: number;
    lastUpdateTime: number;
    cacheRefreshCount: number;
  };

  //need check fields
  constructor() {
   // (window as any).getStats = this.getStats.bind(this);
    console.log('🔧 Initializing Component Registry...');
    this.components = new Map();
    this.componentStates = new Map();
    this.typeRegistry = new Map();
    
    this.config = {
      autoRefresh: true,
      optimizeUpdates: true,
      enableChangeDetection: true
    };
    
    this.stats = {
      totalComponents: 0,
      componentsByType: {},
      updatedComponents: 0,
      skippedComponents: 0,
      lastUpdateTime: 0,
      cacheRefreshCount: 0
    };
  }

  /**
   * Generate unique component identifier from mesh
   * Priority: uniqueId > id > name > generated fallback
   * 
   * @param mesh - Component mesh
   * @returns Unique component identifier
   */
  
    //-----------------------------------------------------------need to fix---------------------------
    //it will use always a temp id
  generateComponentId(mesh: BABYLON.AbstractMesh): string | null {
    if (!mesh) return null;
    //need check and spefiy one thing from object layer
    // Try existing identifiers first
    //------------------------------------------------------------------------------------------------------
    //important note: mesh.uniqueId is something generated automatically by babylon but we cant always relay
    //on it becouse its temporary thing so some times its usefull but other times we need to create our uniqe 
    //one and we should put it in metadata
    //------------------------------------------------------------------------------------------------------

    const id = mesh.uniqueId || mesh.id || mesh.name;

    if (id) return String(id);
    
    // Fallback: generate from position and type
    const componentType = mesh.metadata?.partType || 'unknown';
    const position = mesh.position 
      ? `${mesh.position.x.toFixed(2)}_${mesh.position.y.toFixed(2)}_${mesh.position.z.toFixed(2)}`
      : '0_0_0';
    const timestamp = Date.now();
    return `${componentType}_${position}_${timestamp}`;
  }

  /**
   * Register a component in the registry
   * 
   * @param mesh - Component mesh
   * @param componentData - Component-specific data
   * @param initialState - Initial state object
   * @returns Component ID if successful, null otherwise
   */
  registerComponent(
    mesh: BABYLON.AbstractMesh,
    componentData: any = {},
    initialState: Partial<ComponentState> = {}
  ): string | null {
    if (!mesh) return null;
    
    const componentId = this.generateComponentId(mesh);
    if (!componentId) return null;
    
    // Check if already registered
    if (this.components.has(componentId)) {
      return componentId;
    }
    
    const componentType = mesh.metadata?.partType || componentData.type || 'unknown';
    
    //need fix
    // Create component entry
    const entry: ComponentEntry = {
      id: componentId,
      mesh,
      type: componentType,
      metadata: mesh.metadata || {},
      data: componentData,
      registeredAt: Date.now(),
      lastUpdate: 0
    };
    
    // Register component
    this.components.set(componentId, entry);
    
    //need check
    // Register by type for efficient queries
    if (!this.typeRegistry.has(componentType)) {
      this.typeRegistry.set(componentType, new Set());
    }
    this.typeRegistry.get(componentType)!.add(componentId);
    
    // Initialize state
    const state: ComponentState = {
      lastUpdate: 0,
      hasChanged: false,
      ...initialState
    };
    this.componentStates.set(componentId, state);
    
    // Update statistics
    this.stats.totalComponents = this.components.size;
    this.stats.componentsByType[componentType] = (this.stats.componentsByType[componentType] || 0) + 1;
    
    return componentId;
  }

  /**
   * Unregister a component from the registry
   * 
   * @param componentId - Component identifier
   */
  unregisterComponent(componentId: string): void {
    if (!componentId || !this.components.has(componentId)) return;
    
    const entry = this.components.get(componentId)!;
    const componentType = entry.type;
    
    // Remove from type registry
    if (this.typeRegistry.has(componentType)) {
      this.typeRegistry.get(componentType)!.delete(componentId);
      if (this.typeRegistry.get(componentType)!.size === 0) {
        this.typeRegistry.delete(componentType);
      }
    }
    
    // Remove component and state
    this.components.delete(componentId);
    this.componentStates.delete(componentId);
    
    // Update statistics
    this.stats.totalComponents = this.components.size;
    if (this.stats.componentsByType[componentType]) {
      this.stats.componentsByType[componentType]--;
      if (this.stats.componentsByType[componentType] === 0) {
        delete this.stats.componentsByType[componentType];
      }
    }
  }

  /**
   * Get component entry by ID
   * 
   * @param componentId - Component identifier
   * @returns Component entry or null if not found
   */
  getComponent(componentId: string): ComponentEntry | null {
    return this.components.get(componentId) || null;
  }

  /**
   * Get component state by ID
   * 
   * @param componentId - Component identifier
   * @returns Component state or null if not found
   */
  getComponentState(componentId: string): ComponentState | null {
    return this.componentStates.get(componentId) || null;
  }

  /**
   * Update component state with change detection
   * Only updates if state actually changed (when optimizeUpdates is enabled)
   * 
   * @param componentId - Component identifier
   * @param newState - New state data
   * @param stateComparator - Optional custom comparison function
   * @returns true if state changed and was updated, false otherwise
   */
  updateComponentState(
    componentId: string,
    newState: Partial<ComponentState>,
    stateComparator?: (current: ComponentState, next: Partial<ComponentState>) => boolean
  ): boolean {
    if (!componentId || !this.componentStates.has(componentId)) return false;
    
    const currentState = this.componentStates.get(componentId)!;
    
    // Change detection
    let hasChanged = true;
    if (this.config.optimizeUpdates && this.config.enableChangeDetection) {
      if (stateComparator) {
        hasChanged = stateComparator(currentState, newState);
      } else {
        // Default: check if any key-value pair changed
        hasChanged = Object.keys(newState).some(
          key => currentState[key] !== newState[key]
        );
      }
    }
    
    // Skip update if state unchanged
    if (!hasChanged && this.config.optimizeUpdates) {
      return false;
    }
    
    // Update state
    Object.assign(currentState, newState, {
      lastUpdate: Date.now(),
      hasChanged: true
    });
    
    // Update component entry timestamp
    if (this.components.has(componentId)) {
      this.components.get(componentId)!.lastUpdate = Date.now();
    }
    
    return true;
  }

  /**
   * Get all components of a specific type
   * 
   * @param componentType - Component type identifier
   * @returns Array of component entries
   */
  //need check
  getComponentsByType(componentType: string): ComponentEntry[] {
    const ids = this.typeRegistry.get(componentType) || new Set();
    return Array.from(ids)
      .map(id => this.components.get(id))
      .filter((entry): entry is ComponentEntry => entry !== undefined);
  }

  /**
   * Refresh cache by scanning scene for components
   * 
   * @param componentFilter - Function to filter which meshes are components
   * @param componentDataExtractor - Function to extract component-specific data
   * @param stateExtractor - Function to extract initial state
   */
  //need refactor 
  //posibly not needed -need check- 
  refreshCache(
    componentFilter: (mesh: BABYLON.AbstractMesh) => boolean,
    componentDataExtractor?: (mesh: BABYLON.AbstractMesh) => any,
    stateExtractor?: (mesh: BABYLON.AbstractMesh, data: any) => Partial<ComponentState>
  ): void {
    if (!(window as any).scene?.meshes) return;
    
    const startTime = performance.now();
    const previousCount = this.components.size;
    
    // Clear existing cache
    this.components.clear();
    this.componentStates.clear();
    this.typeRegistry.clear();
    this.stats.componentsByType = {};
    
    // Scan scene for components
    (window as any).scene.meshes
      .filter(componentFilter)
      .forEach((mesh: BABYLON.AbstractMesh) => {
        const componentData = componentDataExtractor ? componentDataExtractor(mesh) : {};
        const initialState = stateExtractor ? stateExtractor(mesh, componentData) : {};
        this.registerComponent(mesh, componentData, initialState);
      });
    
    // Update statistics
    this.stats.totalComponents = this.components.size;
    this.stats.cacheRefreshCount++;
    this.stats.lastUpdateTime = performance.now() - startTime;
    
    const changeCount = Math.abs(this.components.size - previousCount);
    console.log(
      `✅ Component cache refreshed: ${this.components.size} component(s) found ` +
      `(${changeCount > 0 ? `changed: ${changeCount}` : 'no change'})`
    );
  }

  /**
   * Update all components of a specific type
   * 
   * @param componentType - Component type identifier
   * @param updateFunction - Function to update each component
   * @returns Update statistics
   */
  //need check
  updateComponentsByType(
    componentType: string,
    updateFunction: (mesh: BABYLON.AbstractMesh, entry: ComponentEntry, state: ComponentState) => boolean
  ): { updated: number; skipped: number; time: number } {
    if (typeof updateFunction !== 'function') {
      return { updated: 0, skipped: 0, time: 0 };
    }
    
    const components = this.getComponentsByType(componentType);
    let updated = 0;
    let skipped = 0;
    const startTime = performance.now();
    
    components.forEach(entry => {
      const state = this.getComponentState(entry.id);
      if (!state) return;
      
      const wasUpdated = updateFunction(entry.mesh, entry, state);
      if (wasUpdated) {
        updated++;
      } else {
        skipped++;
      }
    });
    
    this.stats.updatedComponents = updated;
    this.stats.skippedComponents = skipped;
    this.stats.lastUpdateTime = performance.now() - startTime;
    
    return { updated, skipped, time: this.stats.lastUpdateTime };
  }

  /**
   * Get registry statistics
   * 
   * @returns Statistics object
   */
  getStats() {
    return {
      ...this.stats,
      components: this.components.size,
      states: this.componentStates.size,
      types: Array.from(this.typeRegistry.keys())
    };
  }
  
  /**
   * Clear all components and reset registry
   */
  clear(): void {
    this.components.clear();
    this.componentStates.clear();
    this.typeRegistry.clear();
    
    this.stats.totalComponents = 0;
    this.stats.componentsByType = {};
    this.stats.updatedComponents = 0;
    this.stats.skippedComponents = 0;
    
    console.log('🗑️ Component registry cleared');
  }

  /**
   * Configure registry settings
   * 
   * @param newConfig - Partial configuration object
   */
  configure(newConfig: Partial<RegistryConfig>): void {
    Object.assign(this.config, newConfig);
    console.log('⚙️ Component Registry configured:', this.config);
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.clear();
    console.log('✅ Component Registry disposed');
  }
}

// Create singleton instance
export const componentRegistry = new ComponentRegistry();

// Expose to window for global access
(window as any).componentRegistry = componentRegistry;
