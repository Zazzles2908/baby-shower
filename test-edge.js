const jwt = require("jsonwebtoken");
const fs = require("fs");
const http = require("http");

// Read .env.local file
const envContent = fs.readFileSync("/c/Project/Baby_Shower/.env.local", "utf8");
const envVars = {};
envContent.split("\n").forEach(line => {
  const trimmedLine = line.trim();
  if (trimmedLine && !trimmedLine.startsWith("#")) {
    const eqIndex = trimmedLine.indexOf("=");
    if (eqIndex > 0) {
      const key = trimmedLine.substring(0, eqIndex).trim();
      const value = trimmedLine.substring(eqIndex + 1).trim();
      envVars[key] = value;
    }
  }
});

const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error("Missing SERVICE_ROLE_KEY");
  process.exit(1);
}

console.log("✓ Service Role Key found (length:", serviceRoleKey.length, ")");

// Create JWT payload for service role
const payload = {
  sub: "service-role",
  role: "service_role",
  iss: "supabase",
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600
};

console.log("\nGenerating JWT...");
const token = jwt.sign(payload, serviceRoleKey, { algorithm: "HS256" });
console.log("✓ JWT generated successfully");
console.log("JWT:", token.substring(0, 50) + "...");

// Test the Edge Function
console.log("\n=== Testing Edge Function with JWT ===");
const postData = JSON.stringify({ lobby_key: "LOBBY-A" });

const options = {
  hostname: "bkszmvfsfgvdwzacgmfz.functions.supabase.co",
  path: "/functions/v1/lobby-status",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(postData),
    "Authorization": `Bearer ${token}`
  }
};

const req = http.request(options, (res) => {
  console.log("✓ Response status:", res.statusCode);
  let body = "";
  res.on("data", chunk => body += chunk);
  res.on("end", () => {
    console.log("Response:", body);
  });
});

req.on("error", (e) => console.error("✗ Error:", e.message));
req.write(postData);
req.end();
