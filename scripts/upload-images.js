/**
 * Baby Shower Image Upload Script
 * 
 * Uploads optimized images to Supabase Storage.
 * Run with: node scripts/upload-images.js
 * 
 * Prerequisites:
 * 1. Install dependencies: npm install @supabase/supabase-js form-data axios
 * 2. Set environment variables:
 *    - SUPABASE_URL (project URL)
 *    - SUPABASE_SERVICE_KEY (service role key for admin access)
 *    - Or use .env file
 * 
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// Configuration
const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://bkszmvfsfgvdwzacgmfz.supabase.co',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',
  BUCKET_NAME: 'baby-shower-pictures',
  SOURCE_DIR: path.join(__dirname, '..', 'baby_content', 'Pictures'),
  OUTPUT_DIR: path.join(__dirname, '..', 'baby_content', 'Pictures_optimized'),
  IMAGE_SIZES: {
    thumbnail: 150,
    small: 400,
    medium: 600,
    large: 800,
    hero: 1200
  }
};

// Folder mapping for organizing images in storage
const FOLDER_MAPPING = {
  'Michelle_Jazeel': 'hero',
  'Jazeel_Baby': 'gallery/jazeel_baby',
  'Michelle_Baby': 'gallery/michelle_baby',
  'Theme': 'decorations',
  'Jazeel_Icon': 'icons/jazeel_avatar',
  'Michelle_Icon': 'icons/michelle_avatar',
  'Jazeel&Michelle_Icon': 'icons/shared',
  'Map': 'documents'
};

/**
 * Initialize Supabase admin client
 */
function getSupabaseClient() {
  if (!CONFIG.SUPABASE_SERVICE_KEY) {
    console.error('Error: SUPABASE_SERVICE_KEY not set');
    process.exit(1);
  }

  return axios.create({
    baseURL: `${CONFIG.SUPABASE_URL}/storage/v1`,
    headers: {
      'Authorization': `Bearer ${CONFIG.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'apikey': CONFIG.SUPABASE_SERVICE_KEY
    }
  });
}

/**
 * Upload a single file to Supabase Storage
 * @param {string} filePath - Local file path
 * @param {string} storagePath - Path in storage bucket
 */
async function uploadFile(filePath, storagePath) {
  const client = getSupabaseClient();
  const fileName = path.basename(filePath);
  const fileContent = fs.readFileSync(filePath);
  const mimeType = getMimeType(fileName);

  try {
    const formData = new FormData();
    formData.append('file', new Blob([fileContent], { type: mimeType }), fileName);
    formData.append('path', storagePath);
    formData.append('bucketId', CONFIG.BUCKET_NAME);
    formData.append('upsert', 'true');

    const response = await client.post('/object', formData, {
      headers: {
        'Authorization': `Bearer ${CONFIG.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    console.log(`✓ Uploaded: ${storagePath}`);
    return { success: true, path: storagePath, response: response.data };
  } catch (error) {
    console.error(`✗ Failed to upload ${storagePath}:`, error.response?.data || error.message);
    return { success: false, path: storagePath, error: error.message };
  }
}

/**
 * Get MIME type from file extension
 */
function getMimeType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Process and upload all images
 */
async function uploadAllImages() {
  console.log('Starting image upload to Supabase Storage...');
  console.log(`Bucket: ${CONFIG.BUCKET_NAME}`);
  console.log(`Source: ${CONFIG.SOURCE_DIR}`);
  console.log('---');

  if (!fs.existsSync(CONFIG.SOURCE_DIR)) {
    console.error(`Source directory not found: ${CONFIG.SOURCE_DIR}`);
    process.exit(1);
  }

  const results = {
    uploaded: [],
    failed: [],
    skipped: []
  };

  // Walk through source directory
  const walkDir = (dir, baseDir = dir) => {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDir(fullPath, baseDir);
      } else if (stat.isFile()) {
        const relativePath = path.relative(baseDir, fullPath);
        const folderName = relativePath.split(path.sep)[0];
        const storageFolder = FOLDER_MAPPING[folderName] || 'other';
        const storagePath = `${storageFolder}/${item}`;
        
        // Skip non-image files (except PDF)
        const ext = path.extname(item).toLowerCase();
        const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.pdf'];
        
        if (imageExtensions.includes(ext)) {
          results.uploaded.push({ local: fullPath, storage: storagePath });
        } else {
          results.skipped.push({ file: item, reason: 'Not an image' });
        }
      }
    }
  };

  walkDir(CONFIG.SOURCE_DIR);

  console.log(`Found ${results.uploaded.length} images to upload`);
  console.log(`Skipped ${results.skipped.length} non-image files`);
  console.log('---');

  // Upload all files
  for (const file of results.uploaded) {
    const result = await uploadFile(file.local, file.storage);
    if (result.success) {
      results.uploaded_success.push(result);
    } else {
      results.failed.push(result);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Summary
  console.log('---');
  console.log('Upload Summary:');
  console.log(`  Successful: ${results.uploaded_success?.length || 0}`);
  console.log(`  Failed: ${results.failed.length}`);
  console.log(`  Skipped: ${results.skipped.length}`);

  // Save upload report
  const reportPath = path.join(__dirname, '..', 'upload-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    bucket: CONFIG.BUCKET_NAME,
    results
  }, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);

  return results;
}

/**
 * Create folder structure (empty folders) in storage
 */
async function createFolderStructure() {
  console.log('Creating folder structure in storage...');
  
  const folders = [
    'hero',
    'gallery/jazeel_baby',
    'gallery/michelle_baby',
    'decorations',
    'icons/jazeel_avatar',
    'icons/michelle_avatar',
    'icons/shared',
    'documents',
    'activities',
    'sections'
  ];

  const client = getSupabaseClient();
  
  for (const folder of folders) {
    try {
      await client.post('/object', {
        bucketId: CONFIG.BUCKET_NAME,
        name: `${folder}/.keep`,
        upsert: true
      });
      console.log(`✓ Created folder: ${folder}`);
    } catch (error) {
      console.log(`? Folder check: ${folder}`);
    }
  }
}

/**
 * Verify bucket configuration
 */
async function verifyBucket() {
  console.log('Verifying bucket configuration...');
  
  const client = getSupabaseClient();
  
  try {
    const response = await client.get(`/bucket/${CONFIG.BUCKET_NAME}`);
    console.log(`✓ Bucket found: ${response.data.name}`);
    console.log(`  Public: ${response.data.public}`);
    console.log(`  Allowed MIME types: ${response.data.allowed_mime_types?.join(', ')}`);
    
    // Check existing objects
    const objectsResponse = await client.get(`/object/list/${CONFIG.BUCKET_NAME}`, {
      params: { limit: 100 }
    });
    console.log(`  Objects in bucket: ${objectsResponse.data.length || 0}`);
    
    return response.data;
  } catch (error) {
    console.error('✗ Bucket not found or error:', error.response?.data || error.message);
    return null;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'upload';

  console.log('='.repeat(50));
  console.log('Baby Shower Image Upload Script');
  console.log('='.repeat(50));
  console.log();

  switch (command) {
    case 'verify':
      await verifyBucket();
      break;
      
    case 'folders':
      await createFolderStructure();
      break;
      
    case 'upload':
    default:
      await verifyBucket();
      await createFolderStructure();
      await uploadAllImages();
      break;
  }
}

// Export for testing
module.exports = {
  uploadFile,
  uploadAllImages,
  verifyBucket,
  createFolderStructure,
  CONFIG,
  FOLDER_MAPPING
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
