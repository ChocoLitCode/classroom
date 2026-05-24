#include <SPI.h>
#include <MFRC522.h>
#include <ESP32Servo.h>
#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <AsyncTCP.h>
#include <LittleFS.h>

const int pirPin = 13;
const int buzzerPin = 2;
const int touchPin = 4;
const int servoPin = 21;
const int soundPin = 32;
const int ledPin = 33;

#define SS_PIN 5 // GPIO18  -> SCK, GPIO23  -> MOSI, GPIO19  -> MISO
#define RST_PIN 22
const char *ssid = "Classroom_101";
const char *password = "12345678";

String lastUser = "System";

MFRC522 rfid(SS_PIN, RST_PIN);
AsyncWebServer server(80);
AsyncWebSocket ws("/ws");
Servo myServo;

// TIMERS
unsigned long lastMotionTime = 0;
const unsigned long timeout = 5000;

unsigned long lastTouchTime = 0;
const unsigned long touchCooldown = 2000;

unsigned long lastClapTime = 0;
const unsigned long clapCooldown = 1000;

unsigned long servoMoveStart = 0;
const unsigned long servoMoveDuration = 700;

bool rfidUnlocked = false;
bool doorEnabled = false;
bool servoAt90 = false;
bool servoMoving = false;
bool lightOn = false;
bool wifiConnected = false;

void setup() {
  Serial.begin(115200);

  pinMode(pirPin, INPUT);
  pinMode(touchPin, INPUT);
  pinMode(soundPin, INPUT);
  pinMode(buzzerPin, OUTPUT);
  pinMode(ledPin, OUTPUT);

  digitalWrite(ledPin, LOW);
  myServo.attach(servoPin);
  myServo.write(0);

  SPI.begin();
  rfid.PCD_Init();

  initWiFi();
  initWebServer();
  initWebSocket();
  startServer();

  Serial.println("System Ready");
}

void loop() {
  updateServoState();
  checkRFID();
  if (!rfidUnlocked) {

    if (servoAt90) {
      moveServo(0);
    }
    return;
  }

  checkTouchSensor();
  checkClap();

  if (!doorEnabled) {
    return;
  }


  handlePIR();
}

void handlePIR() {
  int motion = digitalRead(pirPin);
  unsigned long currentMillis = millis();

  if (motion == HIGH) {
    lastMotionTime = currentMillis;

    if (!servoAt90) {

      moveServo(90);

      Serial.println("Motion Detected!");
    }
  }

  if (servoAt90 && (currentMillis - lastMotionTime >= timeout)) {
    moveServo(0);

    Serial.println("No Motion");
  }
}

void checkClap() {
  if (!rfidUnlocked) {
    return;
  }

  if (servoMoving) {
    return;
  }

  unsigned long currentMillis = millis();

  if (currentMillis - lastClapTime < clapCooldown) {
    return;
  }

  int soundDetected = digitalRead(soundPin);

  if (soundDetected == HIGH) {
    lastClapTime = currentMillis;
    lightOn = !lightOn;
    broadcastState();

    digitalWrite(ledPin, lightOn);

    if (lightOn) {
      Serial.println("CLAP DETECTED! LIGHTS ON");
    } else {
      Serial.println("CLAP DETECTED! LIGHTS OFF");
    }
  }
}

void checkTouchSensor() {
  unsigned long currentMillis = millis();

  if (currentMillis - lastTouchTime < touchCooldown) {
    return;
  }

  int touchState = digitalRead(touchPin);

  if (touchState == HIGH) {
    lastTouchTime = currentMillis;
    doorEnabled = !doorEnabled;

    if (!doorEnabled) {
      moveServo(0);

      Serial.println("DOOR CLOSED via TOUCH SENSOR");
    } else {
      Serial.println("DOOR OPEN via TOUCH SENSOR");
      Serial.println("PIR ENABLED");
    }
  }
}

void checkRFID() {
  if (!rfid.PICC_IsNewCardPresent()) {
    return;
  }

  if (!rfid.PICC_ReadCardSerial()) {
    return;
  }

  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {

    uid += String(rfid.uid.uidByte[i], HEX);
  }

  Serial.print("UID: ");
  Serial.println(uid);

  if (uid == "83d42228") {
    rfidUnlocked = !rfidUnlocked;
    lastUser = "RFID";

    if (!rfidUnlocked) {

      doorEnabled = false;
      moveServo(0);
      playLockMelody();
      lightOn = false;
      digitalWrite(ledPin, LOW);
      broadcastState();
      Serial.println("RFID LOCKED");
    } else {
      doorEnabled = true;
      playUnlockMelody();
      lightOn = true;
      moveServo(90);
      digitalWrite(ledPin, HIGH);
      broadcastState();
      Serial.println("RFID UNLOCKED");
      Serial.println("TOUCH SENSOR ENABLED");
    }
  } else {
    Serial.println("ACCESS DENIED");
    playDeniedMelody();
  }

  rfid.PICC_HaltA();
}

void moveServo(int angle) {
  servoMoving = true;
  servoMoveStart = millis();
  myServo.write(angle);
  servoAt90 = (angle == 90);
}

void updateServoState() {

  if (servoMoving && millis() - servoMoveStart >= servoMoveDuration) {
    servoMoving = false;
    broadcastState();
  }
}

void playUnlockMelody() {
  tone(buzzerPin, 1000);
  delay(120);

  tone(buzzerPin, 1400);
  delay(120);

  noTone(buzzerPin);
}

void playLockMelody() {
  tone(buzzerPin, 1400);
  delay(120);

  tone(buzzerPin, 900);
  delay(120);

  noTone(buzzerPin);
}

void playDeniedMelody() {
  tone(buzzerPin, 300);
  delay(200);

  tone(buzzerPin, 200);
  delay(250);

  noTone(buzzerPin);
}

void initWiFi() {
  WiFi.mode(WIFI_AP);
  WiFi.setSleep(false);

  Serial.println("[WiFi] Starting AP...");

  if (WiFi.softAP(ssid, password)) {
    wifiConnected = true;

    Serial.println("[WiFi] AP Started");
    Serial.print("[WiFi] IP: ");
    Serial.println(WiFi.softAPIP());

  } else {
    wifiConnected = false;
    Serial.println("[WiFi] AP Failed");
  }
}

void initWebServer() {
  if (!LittleFS.begin()) {
    Serial.println("[FS] Mount Failed");
    return;
  }

  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(LittleFS, "/index.html", "text/html");
  });

  server.on("/style.css", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(LittleFS, "/style.css", "text/css");
  });

  server.on("/script.js", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(LittleFS, "/script.js", "application/javascript");
  });

  server.serveStatic("/", LittleFS, "/");
}

void initWebSocket() {
  ws.onEvent([](AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len) {
    if (type == WS_EVT_CONNECT) {
      Serial.println("[WS] Client connected");
      broadcastState();

    } else if (type == WS_EVT_DISCONNECT) {
      Serial.println("[WS] Client disconnected");

    } else if (type == WS_EVT_DATA) {
      String msg = String((char *)data).substring(0, len);
      Serial.println("[WS] Message: " + msg);

      if (msg == "LIGHT") {
        lightOn = !lightOn;
        digitalWrite(ledPin, lightOn);
        broadcastState();

      } else if (
        msg.startsWith("RFID:")) {
        String uid = msg.substring(5);

        if (uid == "83d42228") {
          moveServo(90);
          rfidUnlocked = true;
          doorEnabled = true;
          lightOn = true;
          lastUser = "System";
          digitalWrite(ledPin, HIGH);
          playUnlockMelody();
          broadcastState();
          Serial.println("WEB RFID SUCCESS");

        } else {

          playDeniedMelody();

          Serial.println("WEB RFID FAIL");
        }
      } else if (msg == "LOCK") {
        rfidUnlocked = false;
        doorEnabled = false;
        lightOn = false;
        lastUser = "System";
        moveServo(0);
        digitalWrite(ledPin, LOW);

        broadcastState();

        Serial.println("SYSTEM LOCKED");
      }
    }
  });

  server.addHandler(&ws);
}

void handleWSCleanup() {
  static unsigned long lastCleanup = 0;

  if (!wifiConnected) return;

  if (millis() - lastCleanup > 5000) {
    lastCleanup = millis();
    ws.cleanupClients();
    Serial.println("[WS] Cleanup executed");
  }
}

void startServer() {
  server.begin();
  Serial.println("[HTTP] Server started");
}

void broadcastState() {
  String json = "{";
  json += "\"light\":\"" + String(lightOn ? "ON" : "OFF") + "\",";
  json += "\"rfid\":\"" + String(rfidUnlocked ? "UNLOCKED" : "LOCKED") + "\",";
  json += "\"user\":\"" + lastUser + "\",";
  json += "\"door\":\"" + String(servoAt90 ? "OPEN" : "CLOSED") + "\"";
  json += "}";

  ws.textAll(json);
}