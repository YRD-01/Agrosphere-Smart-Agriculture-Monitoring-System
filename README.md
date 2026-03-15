AgroSphere – IoT Based Smart Agriculture Monitoring System

AgroSphere is a multi-sensor IoT monitoring system designed to assist farmers with real-time insights about soil, water, and environmental conditions.  
The system collects field data using multiple sensors connected to Arduino and ESP-based microcontrollers, processes the information, and transmits it to a cloud backend for analysis and visualization.

This project focuses on building a reliable **data acquisition framework for smart agriculture applications**.

---

Project Objectives

• Monitor soil, water, and environmental parameters in real time  
• Provide reliable multi-sensor data acquisition using microcontrollers  
• Enable remote monitoring through IoT connectivity  
• Support data-driven decision making for farming operations  

---

System Architecture

The AgroSphere system is composed of three main layers.

| Layer | Description |
|------|-------------|
| Data Acquisition Layer | Sensors deployed in the field collect environmental and soil parameters |
| Processing Layer | Microcontrollers process sensor data and prepare it for transmission |
| Cloud Layer | Data is uploaded to a cloud backend for storage, analysis, and visualization |

---

Hardware Components

| Component | Purpose |
|----------|---------|
| ESP32 / ESP8266 | Main IoT microcontroller used for wireless communication |
| Arduino UNO | Handles sensor interfacing and local processing |
| Soil Moisture Sensor | Measures soil water content |
| pH Sensor Module | Measures acidity or alkalinity of soil or water |
| NPK Sensor | Measures nutrient levels in soil |
| Turbidity Sensor | Measures water quality through suspended particle detection |
| DHT Sensor | Measures temperature and humidity |
| Relay Module | Controls actuators such as water pumps |
| LCD Display | Displays local sensor readings |
| DC Pump | Demonstrates automated irrigation control |

---

System Features

| Feature | Description |
|-------|-------------|
| Multi-Sensor Data Acquisition | Collects data from soil, water, and environmental sensors |
| Sensor Calibration | Two-point calibration and filtering used to improve accuracy |
| Data Filtering | Moving-average filtering used to reduce noise |
| IoT Communication | Sensor data transmitted to cloud backend through Wi-Fi |
| Real-time Monitoring | Environmental conditions visualized on a dashboard |
| Modular Design | System can be expanded with additional sensors |

---

Data Acquisition Process

The firmware periodically collects data from all sensors and prepares it for transmission.

Steps involved:

1. Sensor polling and reading acquisition  
2. Conversion of ADC values to physical units  
3. Data filtering using moving average techniques  
4. JSON data packet formation  
5. Transmission to cloud server using HTTP requests  

Non-blocking firmware design ensures reliable operation even with multiple sensors connected simultaneously.

---

Experimental Setup

The system was tested using two hardware configurations.

| Setup | Description |
|-----|-------------|
| Water Quality Monitoring | Arduino UNO with turbidity sensor, pH sensor, DHT sensor, relay module, and DC pump |
| Soil Monitoring System | ESP-based system with soil moisture sensor, LCD display, DHT sensor, relay module, and irrigation pump |

---

Challenges Encountered

| Issue | Description |
|------|-------------|
| Sensor Noise | Variations in sensor readings due to environmental interference |
| Multi-Protocol Handling | Managing analog, UART, I2C, and RS485 sensors simultaneously |
| Wi-Fi Disconnections | Network instability in outdoor environments |
| Power Stability | Voltage fluctuations affecting field deployment |

---

Solutions Implemented

| Solution | Description |
|--------|-------------|
| Sensor Calibration | Applied two-point calibration to reduce measurement error |
| Data Filtering | Implemented moving average filters to stabilize readings |
| Robust Firmware | Non-blocking sensor polling and protocol drivers |
| Communication Reliability | Automatic Wi-Fi reconnection and local data buffering |

---

Results

The AgroSphere system successfully demonstrated:

• Stable multi-sensor data acquisition  
• Accurate measurement of soil and water parameters  
• Reliable wireless transmission of environmental data  
• Real-time monitoring capability for precision agriculture

---

Technologies Used

| Category | Technologies |
|--------|-------------|
| Microcontrollers | ESP32, ESP8266, Arduino UNO |
| Programming | Arduino IDE |
| Communication | Wi-Fi / HTTP |
| Data Format | JSON |
| Sensors | Soil moisture, pH, turbidity, NPK, temperature, humidity |

---

Future Improvements

• Integration of long-range communication protocols such as LoRaWAN or NB-IoT  
• Addition of advanced sensors like EC sensors and crop disease detection cameras  
• Development of a mobile dashboard for farmers  
• Field testing on large agricultural farms  

---

Author

Yash Raj Dash  
B.Tech Electronics and Communication Engineering  
National Institute of Technology, Rourkela
