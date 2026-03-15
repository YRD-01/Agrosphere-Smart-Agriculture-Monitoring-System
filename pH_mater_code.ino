#define PH_PIN 34         // Analog input pin for pH sensor
#define VREF 3.3          // ESP32 Reference Voltage (Set to 5.0V if using 5V)
#define ADC_RES 4095      // 12-bit ADC resolution

// Calibration values (Adjust based on real calibration tests)
float neutralVoltage = 1.50;  // Voltage at pH 7.0
float acidSlope = -0.18;      // Slope for pH calculation (from calibration)

// Noise Filtering
const int numSamples = 10;
float voltageSamples[numSamples] = {0.0};  // Initialize with zeros
int sampleIndex = 0;

void setup() {
  Serial.begin(115200);

  // Pin configuration check
  if (PH_PIN < 0 || PH_PIN > 39) {
    Serial.println("⚠️ Error: Invalid analog pin for PH_PIN. Check your wiring and configuration!");
    while (true); // Stop execution
  }

  Serial.println("ESP32 pH Sensor - Stable and Accurate Readings");
}

void loop() {
  int rawValue = analogRead(PH_PIN);
  float voltage = rawValue * (VREF / ADC_RES);

  // Add to sample array for noise filtering
  voltageSamples[sampleIndex] = voltage;
  sampleIndex = (sampleIndex + 1) % numSamples;

  // Compute the moving average voltage 
  float avgVoltage = 0;
  for (int i = 0; i < numSamples; i++) {
    avgVoltage += voltageSamples[i];
  }
  avgVoltage /= numSamples;

  // Ensure valid calibration values
  if (acidSlope == 0) {
    Serial.println("⚠️ Error: Acid slope cannot be zero. Check calibration values.");
    delay(1000);
    return;
  }

  // Ignore floating values when probe is in air (adjust threshold as needed)
  if (avgVoltage < 0.5 || avgVoltage > 3.0) {
    Serial.println("⚠️ Warning: Probe not submerged or incorrect connection!");
    delay(1000);
    return;
  }

  // Calculate pH value
  float pHValue = 7.0 + ((avgVoltage - neutralVoltage) / acidSlope);

  // Identify solution type
  String solutionType;
  if (pHValue < 3.0) {
    solutionType = "Strong Acid (Battery Acid, Stomach Acid)";
  } else if (pHValue >= 3.0 && pHValue < 5.5) {
    solutionType = "Acidic (Lemon Juice, Vinegar, Soda)";
  } else if (pHValue >= 5.5 && pHValue < 7.0) {
    solutionType = "Slightly Acidic (Tap Water, Milk)";
  } else if (pHValue == 7.0) {
    solutionType = "Neutral (Pure Water)";
  } else if (pHValue > 7.0 && pHValue < 8.5) {
    solutionType = "Slightly Basic (Seawater, Baking Soda)";
  } else if (pHValue >= 8.5 && pHValue < 11.0) {
    solutionType = "Basic (Soap, Detergent)";
  } else {
    solutionType = "Strong Base (Bleach, Ammonia)";
  }

  // Print values
  Serial.print("Raw ADC: ");
  Serial.print(rawValue);
  Serial.print(" | Voltage: ");
  Serial.print(avgVoltage, 3);
  Serial.print("V | pH Value: ");
  Serial.print(pHValue, 2);
  Serial.print(" | Solution: ");
  Serial.println(solutionType);

  delay(1000);
}
