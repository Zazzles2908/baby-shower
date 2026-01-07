#!/usr/bin/env node
/**
 * Baby Shower App - Development Server
 * Node.js version for Windows compatibility
 * 
 * This script provides a reliable development server that works
 * consistently across all platforms including Windows.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = 3000;
const INDEX_FILE = "index.html";
const CACHE_CONTROL = "no-cache, no-store, must-revalidate";

// MIME types for static assets
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.ts': 'application/typescript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
};

// Directories to serve
const PUBLIC_DIR = ".";
const STATIC_DIRS = [
    "scripts",
    "styles",
    "images",
    "fonts"
];

console.log("🚀 Baby Shower App - Node.js Development Server");
console.log("=============================================");
console.log(`📍 Server running at http://localhost:${PORT}`);
console.log(`📁 Serving files from: ${PUBLIC_DIR}`);
console.log("");
console.log("✅ Windows-Compatible Features:");
console.log("   • Stable file system operations");
console.log("   • Cross-platform compatibility");
console.log("   • No native module dependencies");
console.log("");
console.log("🔧 Available Commands:");
console.log("   Ctrl+C - Stop server");
console.log("");
console.log("✨ Server is ready!");
console.log("");

// Create HTTP server
const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    let pathname = url.pathname;
    
    // Default to index.html for root
    if (pathname === "/") {
        pathname = `/${INDEX_FILE}`;
    }
    
    // Security: prevent directory traversal
    if (pathname.includes("..")) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end("Forbidden");
        return;
    }
    
    // Check each static directory
    for (const staticDir of STATIC_DIRS) {
        const filePath = path.join(staticDir, pathname);
        if (existsSync(filePath)) {
            serveFile(filePath, res);
            return;
        }
    }
    
    // Check public directory
    const publicPath = path.join(".", pathname);
    if (existsSync(publicPath)) {
        serveFile(publicPath, res);
        return;
    }
    
    // 404 - Return index.html for SPA routing
    if (existsSync(INDEX_FILE)) {
        serveFile(INDEX_FILE, res);
        return;
    }
    
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end("Not Found");
});

// Check if file exists using fs.existsSync
function existsSync(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch {
        return false;
    }
}

// Serve a file with proper headers
function serveFile(filePath, res) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    try {
        const content = fs.readFileSync(filePath);
        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': CACHE_CONTROL
        });
        res.end(content);
    } catch (error) {
        console.error(`❌ Error serving ${filePath}:`, error.message);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end("Error reading file");
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log("\n\n🛑 Stopping Node.js development server...");
    server.close(() => {
        console.log("✅ Server stopped. Goodbye!");
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log("\n\n🛑 Received SIGTERM, stopping server...");
    server.close(() => {
        console.log("✅ Server stopped. Goodbye!");
        process.exit(0);
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`🌐 Access the app at: http://localhost:${PORT}`);
    console.log("");
});

// Export for testing
export { server };
