/*
 * Motor Control Example
 * Controls a DC motor using PWM (Pulse Width Modulation)
 * Motor connected to pin 9 with motor driver
 */

void setup() {
  // Initialize serial communication
  Serial.begin(9600);
  
  // Pin 9 as output for motor control (PWM)
  pinMode(9, OUTPUT);
  
  Serial.println("Motor Control Started");
  Serial.println("Motor will speed up and slow down");
}

void loop() {
  // Gradually increase motor speed (0-255)
  for (int speed = 0; speed <= 255; speed += 5) {
    analogWrite(9, speed);
    Serial.print("Motor Speed: ");
    Serial.println(speed);
    delay(50);
  }
  
  // Gradually decrease motor speed (255-0)
  for (int speed = 255; speed >= 0; speed -= 5) {
    analogWrite(9, speed);
    Serial.print("Motor Speed: ");
    Serial.println(speed);
    delay(50);
  }
  
  // Stop motor for 1 second
  analogWrite(9, 0);
  Serial.println("Motor STOPPED");
  delay(1000);
}





