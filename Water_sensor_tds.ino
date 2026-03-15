#define TDS_PIN 34  // Use GPIO 32, 34, 35, or 36 for better ADC performance
#define VREF 3.3    // ESP32 ADC reference voltage
#define ADC_RES 4095 // ESP32 ADC resolution (12-bit)
#define TEMP 25.0    // Set water temperature manually (°C) for now

float calibration_factor = 0.5;  // Adjust based on your calibration

void setup() {
  Serial.begin(115200);
  delay(1000);
}

void loop() {
  // Take multiple readings for accuracy
  int rawValue = 0;
  for (int i = 0; i < 10; i++) {  
    rawValue += analogRead(TDS_PIN);
    delay(10);
  }
  rawValue /= 10;  // Average the readings

  float voltage = rawValue * (VREF / ADC_RES);

  // Calculate TDS using proper formula
  float tdsValue = (voltage * calibration_factor) * 1000;  

  // Apply temperature compensation
  float compensationCoefficient = 1.0 + 0.02 * (TEMP - 25.0);
  float tdsCompensated = tdsValue / compensationCoefficient;

  // Print results
  Serial.print("Raw ADC: ");
  Serial.print(rawValue);
  Serial.print(" | Voltage: ");
  Serial.print(voltage, 2);
  Serial.print("V | TDS: ");
  Serial.print(tdsCompensated);
  Serial.println(" ppm");

  delay(1000);
}
