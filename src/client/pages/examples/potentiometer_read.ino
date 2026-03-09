/*
 * Potentiometer Read Example
 * Reads analog value from potentiometer on pin A0
 * and prints it to Serial Monitor
 */

void setup() {
  // Initialize serial communication
  Serial.begin(9600);
  
  // Pin A0 is analog input by default, no need to set pinMode
  Serial.println("Potentiometer Reading Started");
}

void loop() {
  // Read the analog value from pin A0 (0-1023)
  int sensorValue = analogRead(A0);
  
  // Convert to voltage (0-5V)
  float voltage = sensorValue * (5.0 / 1023.0);
  
  // Print to Serial Monitor
  Serial.print("Sensor Value: ");
  Serial.print(sensorValue);
  Serial.print(" | Voltage: ");
  Serial.print(voltage);
  Serial.println("V");
  
  delay(500);  // Wait 500ms before next reading
}





