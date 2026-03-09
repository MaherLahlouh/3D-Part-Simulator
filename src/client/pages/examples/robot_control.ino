/*
 * Full Robot Control Example
 * Complete robot control with motors, sensors, and LED
 * Demonstrates multiple components working together
 */

// Motor pins
const int motorLeftPin = 9;
const int motorRightPin = 10;

// Sensor pins
const int sensorPin = A0;

// LED pin
const int ledPin = 13;

void setup() {
  // Initialize serial communication
  Serial.begin(9600);
  
  // Setup motor pins as outputs
  pinMode(motorLeftPin, OUTPUT);
  pinMode(motorRightPin, OUTPUT);
  
  // Setup LED pin as output
  pinMode(ledPin, OUTPUT);
  
  // Sensor pin is analog input by default
  
  Serial.println("Robot Control System Started");
  Serial.println("Reading sensors and controlling motors");
}

void loop() {
  // Read sensor value
  int sensorValue = analogRead(sensorPin);
  
  // Print sensor reading
  Serial.print("Sensor Reading: ");
  Serial.println(sensorValue);
  
  // Blink LED to show system is running
  digitalWrite(ledPin, HIGH);
  delay(100);
  digitalWrite(ledPin, LOW);
  
  // Control motors based on sensor value
  if (sensorValue > 512) {
    // High sensor value - move forward
    analogWrite(motorLeftPin, 200);
    analogWrite(motorRightPin, 200);
    Serial.println("Moving FORWARD");
  } else {
    // Low sensor value - turn
    analogWrite(motorLeftPin, 150);
    analogWrite(motorRightPin, 50);
    Serial.println("TURNING");
  }
  
  delay(100);  // Small delay for stability
}





