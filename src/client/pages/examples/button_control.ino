/*
 * Button Control Example
 * Reads button state on pin 2 and controls LED on pin 13
 * Uses internal pull-up resistor
 */

void setup() {
  // Initialize serial communication
  Serial.begin(9600);
  
  // Pin 2 as input with internal pull-up resistor
  pinMode(2, INPUT_PULLUP);
  
  // Pin 13 as output for LED
  pinMode(13, OUTPUT);
  
  Serial.println("Button Control Started");
  Serial.println("Press button to toggle LED");
}

void loop() {
  // Read button state (LOW when pressed due to pull-up)
  int buttonState = digitalRead(2);
  
  if (buttonState == LOW) {
    // Button is pressed
    digitalWrite(13, HIGH);
    Serial.println("Button PRESSED - LED ON");
  } else {
    // Button is not pressed
    digitalWrite(13, LOW);
    Serial.println("Button RELEASED - LED OFF");
  }
  
  delay(50);  // Small delay to debounce
}





