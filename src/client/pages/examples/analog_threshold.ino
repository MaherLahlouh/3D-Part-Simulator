/*
 * Analog Threshold Example
 * Reads analog sensor and turns LED on when value exceeds threshold
 */

void setup() {
  // Initialize serial communication
  Serial.begin(9600);
  
  // Pin 13 as output for LED
  pinMode(13, OUTPUT);
  
  Serial.println("Analog Threshold Started");
  Serial.println("LED will turn ON when sensor value > 512");
}

void loop() {
  // Read analog value from pin A0
  int sensorValue = analogRead(A0);
  
  // Threshold value (middle of 0-1023 range)
  int threshold = 512;
  
  // Print sensor value
  Serial.print("Sensor Value: ");
  Serial.println(sensorValue);
  
  // Turn LED on if sensor value exceeds threshold
  if (sensorValue > threshold) {
    digitalWrite(13, HIGH);
    Serial.println("Threshold EXCEEDED - LED ON");
  } else {
    digitalWrite(13, LOW);
    Serial.println("Below threshold - LED OFF");
  }
  
  delay(200);  // Wait 200ms
}





