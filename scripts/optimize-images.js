/**
 * Baby Shower Image Optimization Script
 * 
 * Converts images to WebP format and generates multiple sizes.
 * Run with: node scripts/optimize-images.js
 * 
 * Prerequisites:
 * 1. Install sharp: npm install sharp
 * 2. Images in: baby_content/Pictures
 * 3. Output to: baby_content/Pictures_optimized
 * 
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
require('dotenv').config();

// Configuration
const CONFIG = {
  SOURCE_DIR: path.join(__dirname, '..', 'baby_content', 'Pictures'),
  OUTPUT_DIR: path.join(__dirname, '..', 'baby_content', 'Pictures_optimized'),
  QUALITY: {
    webp: 85,           // Quality for WebP conversion (0-100)
    png: 1,             // zlib compression level for PNG (0-9)
    jpeg: 85            // Quality for JPEG (0-100)
  },
  IMAGE_SIZES: {
    thumbnail: { width: 150, height: 150, fit: 'cover' },
    small: { width: 400, height: 400, fit: 'inside' },
    medium: { width: 600, height: 600, fit: 'inside' },
    large: { width: 800, height: 800, fit: 'inside' },
    hero: { width: 1200, height: 630, fit: 'cover' }
  },
  KEEP_ORIGINAL: true,
  GENERATE_WEBP: true,
  PRESERVE_PNG: true  // Keep original PNG for transparency
};

/**
 * Create output directories
 */
function setupDirectories() {
  const dirs = [
    CONFIG.OUTPUT_DIR,
    path.join(CONFIG.OUTPUT_DIR, 'hero'),
    path.join(CONFIG.OUTPUT_DIR, 'gallery'),
    path.join(CONFIG.OUTPUT_DIR, 'gallery', 'jazeel_baby'),
    path.join(CONFIG.OUTPUT_DIR, 'gallery', 'michelle_baby'),
    path.join(CONFIG.OUTPUT_DIR, 'decorations'),
    path.join(CONFIG.OUTPUT_DIR, 'icons'),
    path.join(CONFIG.OUTPUT_DIR, 'icons', 'jazeel_avatar'),
    path.join(CONFIG.OUTPUT_DIR, 'icons', 'michelle_avatar'),
    path.join(CONFIG.OUTPUT_DIR, 'icons', 'shared'),
    path.join(CONFIG.OUTPUT_DIR, 'documents')
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  console.log(`Output directory: ${CONFIG.OUTPUT_DIR}`);
}

/**
 * Get image metadata using Sharp
 */
async function getImageMetadata(imagePath) {
  try {
    const metadata = await sharp(imagePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: fs.statSync(imagePath).size,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation
    };
  } catch (error) {
    console.error(`Error reading metadata for ${imagePath}:`, error.message);
    return null;
  }
}

/**
 * Optimize a single image
 */
async function optimizeImage(inputPath, outputDir, baseName) {
  const results = {
    input: inputPath,
    output: outputDir,
    variants: [],
    success: true,
    error: null
  };

  try {
    // Get original metadata
    const metadata = await getImageMetadata(inputPath);
    if (!metadata) {
      throw new Error('Could not read image metadata');
    }

    console.log(`\nProcessing: ${path.basename(inputPath)}`);
    console.log(`  Original: ${metadata.width}x${metadata.height} (${(metadata.size / 1024).toFixed(1)} KB)`);

    // Load image with Sharp
    const image = sharp(inputPath);

    // Apply auto-orientation based on EXIF
    if (metadata.orientation && metadata.orientation > 1) {
      image.rotate();
    }

    // Generate WebP versions for each size
    if (CONFIG.GENERATE_WEBP) {
      for (const [sizeName, sizeConfig] of Object.entries(CONFIG.IMAGE_SIZES)) {
        const outputPath = path.join(outputDir, `${baseName}-${sizeName}.webp`);
        
        let pipeline = image.clone();
        
        // Resize maintaining aspect ratio
        pipeline = pipeline.resize({
          width: sizeConfig.width,
          height: sizeConfig.height,
          fit: sizeConfig.fit,
          withoutEnlargement: true  // Don't upscale smaller images
        });

        // Convert to WebP
        await pipeline
          .webp({ quality: CONFIG.QUALITY.webp, effort: 6 })
          .toFile(outputPath);

        const outputSize = fs.statSync(outputPath).size;
        results.variants.push({
          size: sizeName,
          format: 'webp',
          path: path.relative(CONFIG.OUTPUT_DIR, outputPath),
          width: sizeConfig.width,
          height: sizeConfig.height,
          fileSize: outputSize,
          compression: ((1 - outputSize / metadata.size) * 100).toFixed(1)
        });

        console.log(`  ✓ ${sizeName}.webp: ${(outputSize / 1024).toFixed(1)} KB (${results.variants[results.variants.length - 1].compression}% reduction)`);
      }
    }

    // Keep original PNG for illustrations with transparency
    if (CONFIG.PRESERVE_PNG && metadata.format === 'png') {
      const originalPath = path.join(outputDir, `${baseName}.png`);
      await sharp(inputPath).png({ compressionLevel: CONFIG.QUALITY.png }).toFile(originalPath);
      const originalSize = fs.statSync(originalPath).size;
      
      results.variants.push({
        size: 'original',
        format: 'png',
        path: path.relative(CONFIG.OUTPUT_DIR, originalPath),
        width: metadata.width,
        height: metadata.height,
        fileSize: originalSize
      });

      console.log(`  ✓ original.png: ${(originalSize / 1024).toFixed(1)} KB`);
    }

  } catch (error) {
    results.success = false;
    results.error = error.message;
    console.error(`  ✗ Error: ${error.message}`);
  }

  return results;
}

/**
 * Process all images in source directory
 */
async function processAllImages() {
  console.log('='.repeat(50));
  console.log('Baby Shower Image Optimization');
  console.log('='.repeat(50));
  console.log(`\nSource: ${CONFIG.SOURCE_DIR}`);
  console.log(`Output: ${CONFIG.OUTPUT_DIR}`);
  console.log(`WebP Quality: ${CONFIG.QUALITY.webp}%`);

  // Setup directories
  setupDirectories();

  // Folder mapping
  const folderMap = {
    'Michelle_Jazeel': 'hero',
    'Jazeel_Baby': 'gallery/jazeel_baby',
    'Michelle_Baby': 'gallery/michelle_baby',
    'Theme': 'decorations',
    'Jazeel_Icon': 'icons/jazeel_avatar',
    'Michelle_Icon': 'icons/michelle_avatar',
    'Jazeel&Michelle_Icon': 'icons/shared',
    'Map': 'documents'
  };

  const results = {
    timestamp: new Date().toISOString(),
    images: [],
    summary: { total: 0, success: 0, failed: 0, totalOriginalSize: 0, totalOptimizedSize: 0 }
  };

  // Walk through source directory
  const processDirectory = async (dir, baseDir = dir) => {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        await processDirectory(fullPath, baseDir);
      } else if (stat.isFile()) {
        const ext = path.extname(item).toLowerCase();
        const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif'];
        
        if (imageExtensions.includes(ext)) {
          const relativePath = path.relative(baseDir, fullPath);
          const folderName = relativePath.split(path.sep)[0];
          const outputSubdir = folderMap[folderName] || 'other';
          const outputDir = path.join(CONFIG.OUTPUT_DIR, outputSubdir);
          const baseName = item.replace(ext, '');
          
          // Ensure output directory exists
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }

          const result = await optimizeImage(fullPath, outputDir, baseName);
          
          results.images.push(result);
          results.summary.total++;
          
          if (result.success) {
            results.summary.success++;
            result.variants.forEach(v => {
              results.summary.totalOptimizedSize += v.fileSize;
            });
          } else {
            results.summary.failed++;
          }
          
          results.summary.totalOriginalSize += stat.size;
        }
      }
    }
  };

  if (!fs.existsSync(CONFIG.SOURCE_DIR)) {
    console.error(`\n✗ Source directory not found: ${CONFIG.SOURCE_DIR}`);
    process.exit(1);
  }

  await processDirectory(CONFIG.SOURCE_DIR);

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('Optimization Summary');
  console.log('='.repeat(50));
  console.log(`Total images processed: ${results.summary.total}`);
  console.log(`Successful: ${results.summary.success}`);
  console.log(`Failed: ${results.summary.failed}`);
  console.log(`Original total size: ${(results.summary.totalOriginalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Optimized total size: ${(results.summary.totalOptimizedSize / 1024 / 1024).toFixed(2)} MB`);
  const overallReduction = ((1 - results.summary.totalOptimizedSize / results.summary.totalOriginalSize) * 100).toFixed(1);
  console.log(`Overall reduction: ${overallReduction}%`);

  // Save manifest
  const manifestPath = path.join(CONFIG.OUTPUT_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(results, null, 2));
  console.log(`\nManifest saved to: ${manifestPath}`);

  return results;
}

/**
 * Generate responsive image manifest for image service
 */
function generateImageManifest(optimizationResults) {
  const manifest = {
    version: '1.0.0',
    generated: new Date().toISOString(),
    images: {},
    cdn: {
      baseUrl: 'https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures',
      bucket: 'baby-shower-pictures'
    },
    sizes: CONFIG.IMAGE_SIZES,
    formats: ['webp', 'png', 'jpeg']
  };

  for (const result of optimizationResults.images) {
    if (result.success) {
      const imageKey = path.basename(result.input, path.extname(result.input));
      manifest.images[imageKey] = {
        path: result.output,
        variants: result.variants,
        metadata: {
          original: {
            width: result.variants.find(v => v.size === 'original')?.width,
            height: result.variants.find(v => v.size === 'original')?.height
          }
        }
      };
    }
  }

  const manifestPath = path.join(CONFIG.OUTPUT_DIR, 'image-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Image manifest saved to: ${manifestPath}`);

  return manifest;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'optimize';

  switch (command) {
    case 'manifest':
      // Generate manifest from existing optimized images
      const manifestPath = path.join(CONFIG.OUTPUT_DIR, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        const results = JSON.parse(fs.readFileSync(manifestPath));
        generateImageManifest(results);
      }
      break;
      
    case 'optimize':
    default:
      const results = await processAllImages();
      generateImageManifest(results);
      break;
  }
}

// Export for testing
module.exports = {
  optimizeImage,
  processAllImages,
  generateImageManifest,
  setupDirectories,
  CONFIG
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
