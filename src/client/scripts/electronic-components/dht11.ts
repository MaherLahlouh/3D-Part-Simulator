//@ts-nocheck
import { componentRegistry } from './wiring-modules/component-registry';

/**
 * DHT11 Temperature and Humidity Sensor Behavior Manager
 * Handles DHT11 sensor-specific logic: temperature and humidity readings
 */
class DHT11BehaviorManager {
  /**
   * Initialize DHT11 sensor component
   */
  initializeDHT11(component, scene) {
    if (!component || !component.metadata) return;

    // Set component type
    component.metadata.partType = 'dht11';
    component.metadata.componentType = 'dht11';

    // Initialize sensor state
    component.metadata.dht11State = {
      temperature: 0,      // Celsius
      humidity: 0,         // Percentage (0-100)
      lastReading: 0,      // Timestamp of last reading
      active: false,       // Whether sensor is actively reading
      dataPin: null        // Arduino pin connected to data pin
    };

    // Register component in registry
    componentRegistry.registerComponent(component, { type: 'dht11' }, {
      temperature: 0,
      humidity: 0,
      lastReading: 0,
      active: false
    });

    console.log(`✅ DHT11 Sensor initialized`);
  }

  /**
   * Update DHT11 sensor readings
   * Simulates DHT11 sensor behavior with realistic temperature and humidity values
   */
  updateDHT11Readings(component, temperature = null, humidity = null) {
    if (!component || !component.metadata) return;

    const dht11State = component.metadata.dht11State;
    if (!dht11State) return;

    // If values provided, use them; otherwise generate realistic values
    if (temperature !== null) {
      dht11State.temperature = temperature;
    } else {
      // Generate realistic temperature (20-30°C room temperature range)
      dht11State.temperature = 20 + Math.random() * 10;
    }

    if (humidity !== null) {
      dht11State.humidity = humidity;
    } else {
      // Generate realistic humidity (30-70% range)
      dht11State.humidity = 30 + Math.random() * 40;
    }

    dht11State.lastReading = Date.now();
    dht11State.active = true;

    // Update component registry state
    const componentId = componentRegistry.generateComponentId(component);
    if (componentId) {
      componentRegistry.updateComponentState(componentId, {
        temperature: dht11State.temperature,
        humidity: dht11State.humidity,
        lastReading: dht11State.lastReading,
        active: dht11State.active,
        lastUpdate: Date.now()
      });
    }

    // Update visual feedback (optional - could show temperature/humidity on sensor)
    this.updateDHT11Visual(component, dht11State);
  }

  /**
   * Update visual representation of DHT11 sensor
   * Can show temperature/humidity values or visual indicators
   */
  updateDHT11Visual(component, dht11State) {
    if (!component || !dht11State) return;

    // Find sensor body mesh for visual feedback
    const children = component.getChildMeshes();
    const sensorBody = children.find(m => 
      m.name.toLowerCase().includes('body') || 
      m.name.toLowerCase().includes('sensor') ||
      m.name.toLowerCase().includes('dht11') ||
      (!m.metadata || !m.metadata.isTerminal)
    );

    if (!sensorBody || !sensorBody.material) return;

    const material = sensorBody.material;

    // Visual feedback based on temperature
    // Cool (blue) -> Normal (green) -> Warm (yellow) -> Hot (red)
    if (dht11State.active) {
      const temp = dht11State.temperature;
      let color;

      if (temp < 15) {
        // Cool - blue tint
        color = new BABYLON.Color3(0.3, 0.5, 1.0);
      } else if (temp < 25) {
        // Normal - green tint
        color = new BABYLON.Color3(0.3, 1.0, 0.5);
      } else if (temp < 30) {
        // Warm - yellow tint
        color = new BABYLON.Color3(1.0, 1.0, 0.3);
      } else {
        // Hot - red tint
        color = new BABYLON.Color3(1.0, 0.3, 0.3);
      }

      // Subtle emissive glow to indicate active sensor
      material.emissiveColor = color;
      material.emissiveIntensity = 0.2;
    } else {
      // Inactive - no glow
      material.emissiveColor = new BABYLON.Color3(0, 0, 0);
      material.emissiveIntensity = 0;
    }
  }

  /**
   * Handle pin state change from Arduino
   * DHT11 uses a single data pin for communication
   */
  onPinStateChange(component, terminal, state) {
    if (!component || !component.metadata) return;

    const dht11State = component.metadata.dht11State;
    if (!dht11State) return;

    // Check if this is the data pin
    const terminalName = terminal.metadata?.terminalName || terminal.metadata?.pinName;
    if (terminalName === 'data' || terminalName === 'signal') {
      dht11State.dataPin = terminalName;

      // When data pin is HIGH, sensor is being read
      if (state.digitalState === 'HIGH' || state.voltage > 3) {
        // Simulate sensor reading
        // In real DHT11, this would trigger a reading sequence
        // For simulation, we'll update readings periodically
        this.updateDHT11Readings(component);
      }
    }
  }

  /**
   * Get DHT11 sensor reading
   * Returns current temperature and humidity values
   */
  getDHT11Reading(component) {
    if (!component || !component.metadata) return null;

    const dht11State = component.metadata.dht11State;
    if (!dht11State) return null;

    return {
      temperature: dht11State.temperature,
      humidity: dht11State.humidity,
      lastReading: dht11State.lastReading,
      active: dht11State.active
    };
  }

  /**
   * Update all DHT11 sensors in the scene
   */
  updateAllDHT11Sensors() {
    const dht11Sensors = componentRegistry.getComponentsByType('dht11');
    dht11Sensors.forEach(entry => {
      const state = componentRegistry.getComponentState(entry.id);
      if (state && state.active) {
        // Update readings for active sensors
        this.updateDHT11Readings(entry.mesh);
      }
    });
  }

  /**
   * Get all DHT11 sensors
   */
  getDHT11Sensors() {
    return componentRegistry.getComponentsByType('dht11');
  }
}

// Create singleton instance
export const dht11BehaviorManager = new DHT11BehaviorManager();

// Expose to window for global access
window.dht11BehaviorManager = dht11BehaviorManager;
window.initializeDHT11 = (component, scene) => dht11BehaviorManager.initializeDHT11(component, scene);
window.updateDHT11Readings = (component, temperature, humidity) => dht11BehaviorManager.updateDHT11Readings(component, temperature, humidity);
window.getDHT11Reading = (component) => dht11BehaviorManager.getDHT11Reading(component);
window.updateAllDHT11Sensors = () => dht11BehaviorManager.updateAllDHT11Sensors();
window.getDHT11Sensors = () => dht11BehaviorManager.getDHT11Sensors();
