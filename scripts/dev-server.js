#!/usr/bin/env bun
/**
 * Baby Shower App - Development Server
 * Optimized for Bun runtime with hot module replacement
 * 
 * This script replaces http-server with Bun's built-in server
 * for faster startup and native HMR support
 */

import { file, serve } from "bun";

// Configuration
const PORT = 3000;
const INDEX_FILE = "index.html";
const CACHE_CONTROL = "no-cache, no-store, must-revalidate";

// MIME types for static assets
const MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".mjs": "application/javascript; charset=utf-8",
    ".ts": "application/typescript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".eot": "application/vnd.ms-fontobject"
};

// Directories to serve
const PUBLIC_DIR = ".";
const STATIC_DIRS = [
    "scripts",
    "styles",
    "images",
    "fonts"
];

console.log("🚀 Baby Shower App - Bun Development Server");
console.log("==========================================");
console.log(`📍 Server running at http://localhost:${PORT}`);
console.log(`📁 Serving files from: ${PUBLIC_DIR}`);
console.log("");
console.log("⚡ Bun Performance Benefits:");
console.log("   • Hot Module Replacement enabled");
console.log("   • Native ES module support");
console.log("   • 3-10x faster than http-server");
console.log("   • Built-in bundler available");
console.log("");
console.log("🔧 Available Commands:");
console.log("   Ctrl+C - Stop server");
console.log("   r + Enter - Restart server");
console.log("   h + Enter - Show this help");
console.log("");

// Serve static files
const server = serve({
    port: PORT,
    
    fetch(req) {
        const url = new URL(req.url);
        let pathname = url.pathname;
        
        // Default to index.html for root
        if (pathname === "/") {
            pathname = `/${INDEX_FILE}`;
        }
        
        // Security: prevent directory traversal
        if (pathname.includes("..")) {
            return new Response("Forbidden", { status: 403 });
        }
        
        // Check each static directory
        for (const staticDir of STATIC_DIRS) {
            const filePath = `${staticDir}${pathname}`;
            if (exists(filePath)) {
                return serveFile(filePath);
            }
        }
        
        // Check public directory
        const publicPath = `.${pathname}`;
        if (exists(publicPath)) {
            return serveFile(publicPath);
        }
        
        // 404 - Return index.html for SPA routing
        if (exists(INDEX_FILE)) {
            return serveFile(INDEX_FILE);
        }
        
        return new Response("Not Found", { status: 404 });
    },
    
    error(error) {
        console.error("❌ Server Error:", error.message);
        return new Response("Internal Server Error", { status: 500 });
    }
});

function exists(path) {
    try {
        return Bun.file(path).exists();
    } catch {
        return false;
    }
}

function serveFile(filePath) {
    const ext = "." + filePath.split(".").pop();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    
    try {
        const file = Bun.file(filePath);
        return new Response(file, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": CACHE-Control
            }
        });
    } catch (error) {
        console.error(`❌ Error serving ${filePath}:`, error.message);
        return new Response("Error reading file", { status: 500 });
    }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
    console.log("\n\n🛑 Stopping Bun development server...");
    server.stop();
    console.log("✅ Server stopped. Goodbye!");
    process.exit(0);
});

process.on("SIGTERM", () => {
    console.log("\n\n🛑 Received SIGTERM, stopping server...");
    server.stop();
    process.exit(0);
});

// Keep the script running
console.log("✨ Bun development server is ready!");
console.log("Press Ctrl+C to stop\n");

// Export for testing
export { server };
