/*
 * Blink with Serial Output
 * Blinks LED and prints status to Serial Monitor
 */

void setup() {
  // Initialize serial communication at 9600 baud
  Serial.begin(9600);
  
  // Initialize digital pin 13 as an output
  pinMode(13, OUTPUT);
  
  Serial.println("Blink with Serial started!");
}

void loop() {
  // Turn LED on
  digitalWrite(13, HIGH);
  Serial.println("LED ON");
  delay(1000);  // Wait 1 second
  
  // Turn LED off
  digitalWrite(13, LOW);
  Serial.println("LED OFF");
  delay(1000);  // Wait 1 second
}





