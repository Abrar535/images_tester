// measure-website-images.js
// Measures latency of all images on a webpage hosted on image.dngroup.com

import puppeteer from 'puppeteer';
import https from 'https';
import http from 'http';
import fs from 'fs';
import { performance } from 'perf_hooks';

const TARGET_URL = 'https://stage.rechargenews.com/';
const IMAGE_DOMAIN = 'image-stage.dngroup.com';
const FETCH_COUNT = 3;
const OUTPUT_JSON = '(2)fastly_image_performance_stage_recharge_frontpage(18th_dec).json';
const OUTPUT_CSV = '(2)fastly_image_performance_stage_recharge_frontpage(18th_dec).csv';

// Fetch a single image and measure latency
function fetchImage(url) {
  return new Promise((resolve) => {
    const start = performance.now();
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (res) => {
      let size = 0;
      
      res.on('data', chunk => size += chunk.length);
      res.on('end', () => {
        const latency = performance.now() - start;
        resolve({
          latencyMs: parseFloat(latency.toFixed(2)),
          sizeKB: parseFloat((size / 1024).toFixed(2)),
          status: res.statusCode,
          cacheStatus: res.headers['x-cache'] || 'N/A',
          age: res.headers['age'] || '0',
          cacheControl: res.headers['cache-control'] || 'N/A',
          surrogate: res.headers['surrogate-control'] || 'N/A',
          expires: res.headers['expires'] || 'N/A'
        });
      });
    }).on('error', (err) => {
      resolve({
        latencyMs: null,
        error: err.message
      });
    });
  });
}

// Measure latency for a single image URL multiple times
async function measureImageLatency(url, index, total) {
  console.log(`Processing image ${index + 1}/${total}...`);
  
  const latencies = [];
  const results = [];
  
  for (let i = 0; i < FETCH_COUNT; i++) {
    const result = await fetchImage(url);
    results.push(result);
    if (result.latencyMs !== null) {
      latencies.push(result.latencyMs);
    }
    // Small delay between requests to avoid overwhelming server
    await new Promise(r => setTimeout(r, 100));
  }
  
  const validLatencies = latencies.filter(l => l !== null);
  const avgLatency = validLatencies.length > 0 
    ? parseFloat((validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length).toFixed(2))
    : null;
  
  const minLatency = validLatencies.length > 0 ? Math.min(...validLatencies) : null;
  const maxLatency = validLatencies.length > 0 ? Math.max(...validLatencies) : null;
  
  // Get size from first successful result
  const successfulResult = results.find(r => r.sizeKB);
  
  // Collect all cache statuses
  const cacheStatuses = results.map(r => r.cacheStatus || 'N/A');
  const ages = results.map(r => r.age || '0');
  
  return {
    url,
    latencies,
    avgLatency,
    minLatency,
    maxLatency,
    sizeKB: successfulResult?.sizeKB || null,
    cacheStatus: successfulResult?.cacheStatus || 'N/A', // Keep for backward compatibility
    cacheStatuses, // All 3 cache statuses
    age: successfulResult?.age || '0', // Keep for backward compatibility
    ages, // All 3 ages
    status: successfulResult?.status || null,
    error: results.find(r => r.error)?.error || null
  };
}

// Step 1 & 2: Load web page and extract image URLs
async function extractImageUrls() {
  console.log('🚀 Launching browser...');
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Set a realistic viewport
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Set user agent to avoid being blocked
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  console.log(`📄 Loading ${TARGET_URL}...`);
  await page.goto(TARGET_URL, { 
    waitUntil: 'networkidle2',
    timeout: 60000 
  });
  
  console.log('📜 Scrolling page to load lazy images...');
  
  // Scroll incrementally to trigger lazy loading
  const scrollStep = 500;
  const scrollDelay = 300;
  
  let previousHeight = 0;
  let currentHeight = await page.evaluate(() => document.body.scrollHeight);
  
  while (previousHeight < currentHeight) {
    previousHeight = currentHeight;
    
    // Scroll down in steps
    const scrolls = Math.ceil(currentHeight / scrollStep);
    for (let i = 0; i < scrolls; i++) {
      await page.evaluate((step) => window.scrollBy(0, step), scrollStep);
      await new Promise(r => setTimeout(r, scrollDelay));
    }
    
    // Wait for any new content to load
    await new Promise(r => setTimeout(r, 1000));
    currentHeight = await page.evaluate(() => document.body.scrollHeight);
  }
  
  // Scroll back to top and wait a bit more
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('🔍 Extracting image URLs...');
  
  // Extract all image URLs
  const imageUrls = await page.evaluate((domain) => {
    const images = new Set();
    
    // Get all img elements
    document.querySelectorAll('img').forEach(img => {
      const src = img.src || img.dataset.src || img.getAttribute('data-lazy-src');
      if (src && src.includes(domain)) {
        images.add(src);
      }
      
      // Check srcset
      const srcset = img.srcset || img.dataset.srcset;
      if (srcset) {
        srcset.split(',').forEach(s => {
          const url = s.trim().split(' ')[0];
          if (url && url.includes(domain)) {
            images.add(url);
          }
        });
      }
    });
    
    // Also check picture elements
    document.querySelectorAll('picture source').forEach(source => {
      const srcset = source.srcset;
      if (srcset) {
        srcset.split(',').forEach(s => {
          const url = s.trim().split(' ')[0];
          if (url && url.includes(domain)) {
            images.add(url);
          }
        });
      }
    });
    
    // Check background images in style attributes
    document.querySelectorAll('[style*="background"]').forEach(el => {
      const style = el.getAttribute('style');
      const match = style.match(/url\(['"]?([^'"]+)['"]?\)/);
      if (match && match[1].includes(domain)) {
        images.add(match[1]);
      }
    });
    
    return Array.from(images);
  }, IMAGE_DOMAIN);
  
  await browser.close();
  
  return imageUrls;
}

// Save results to JSON file
function saveToJson(results, summary) {
  const output = {
    timestamp: new Date().toISOString(),
    targetUrl: TARGET_URL,
    imageDomain: IMAGE_DOMAIN,
    fetchCount: FETCH_COUNT,
    summary,
    images: results
  };
  
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(output, null, 2));
  console.log(`📁 Results saved to ${OUTPUT_JSON}`);
}

// Save results to CSV file
function saveToCsv(results) {
  const headers = ['URL', 'Latency 1 (ms)', 'Latency 2 (ms)', 'Latency 3 (ms)', 'Avg Latency (ms)', 'Min (ms)', 'Max (ms)', 'Size (KB)', 'Cache Status 1', 'Cache Status 2', 'Cache Status 3', 'Age 1 (s)', 'Age 2 (s)', 'Age 3 (s)', 'Status', 'Error'];
  
  const rows = results.map(r => [
    r.url,
    r.latencies[0] || '',
    r.latencies[1] || '',
    r.latencies[2] || '',
    r.avgLatency || '',
    r.minLatency || '',
    r.maxLatency || '',
    r.sizeKB || '',
    r.cacheStatuses?.[0] || r.cacheStatus || '',
    r.cacheStatuses?.[1] || '',
    r.cacheStatuses?.[2] || '',
    r.ages?.[0] || r.age || '',
    r.ages?.[1] || '',
    r.ages?.[2] || '',
    r.status || '',
    r.error || ''
  ]);
  
  const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  
  fs.writeFileSync(OUTPUT_CSV, csv);
  console.log(`📁 Results saved to ${OUTPUT_CSV}`);
}

// Generate summary statistics
function generateSummary(results) {
  const validResults = results.filter(r => r.avgLatency !== null);
  
  if (validResults.length === 0) {
    return { error: 'No valid results to analyze' };
  }
  
  const allLatencies = validResults.map(r => r.avgLatency);
  const totalAvg = parseFloat((allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length).toFixed(2));
  
  const sorted = [...validResults].sort((a, b) => a.avgLatency - b.avgLatency);
  const fastest = sorted.slice(0, 5);
  const slowest = sorted.slice(-5).reverse();
  
  const allSizes = validResults.filter(r => r.sizeKB).map(r => r.sizeKB);
  const totalSize = allSizes.reduce((a, b) => a + b, 0);
  const avgSize = parseFloat((totalSize / allSizes.length).toFixed(2));
  
  // Latency distribution
  const under100 = validResults.filter(r => r.avgLatency < 100).length;
  const under200 = validResults.filter(r => r.avgLatency >= 100 && r.avgLatency < 200).length;
  const under500 = validResults.filter(r => r.avgLatency >= 200 && r.avgLatency < 500).length;
  const over500 = validResults.filter(r => r.avgLatency >= 500).length;
  
  return {
    totalImages: results.length,
    successfulMeasurements: validResults.length,
    failedMeasurements: results.length - validResults.length,
    averageLatency: totalAvg,
    minLatency: Math.min(...allLatencies),
    maxLatency: Math.max(...allLatencies),
    medianLatency: sorted[Math.floor(sorted.length / 2)]?.avgLatency,
    averageSize: avgSize,
    totalSize: parseFloat(totalSize.toFixed(2)),
    latencyDistribution: {
      under100ms: under100,
      '100-200ms': under200,
      '200-500ms': under500,
      over500ms: over500
    },
    fastest5: fastest.map(r => ({ url: r.url, avgLatency: r.avgLatency, sizeKB: r.sizeKB })),
    slowest5: slowest.map(r => ({ url: r.url, avgLatency: r.avgLatency, sizeKB: r.sizeKB }))
  };
}

// Print summary to console
function printSummary(summary) {
  console.log('\n' + '='.repeat(100));
  console.log('📊 PERFORMANCE SUMMARY');
  console.log('='.repeat(100));
  
  console.log(`\n📈 Overall Statistics:`);
  console.log(`   Total Images Found: ${summary.totalImages}`);
  console.log(`   Successful Measurements: ${summary.successfulMeasurements}`);
  console.log(`   Failed Measurements: ${summary.failedMeasurements}`);
  
  console.log(`\n⏱️  Latency Metrics:`);
  console.log(`   Average Latency: ${summary.averageLatency} ms`);
  console.log(`   Min Latency: ${summary.minLatency} ms`);
  console.log(`   Max Latency: ${summary.maxLatency} ms`);
  console.log(`   Median Latency: ${summary.medianLatency} ms`);
  
  console.log(`\n📦 Size Metrics:`);
  console.log(`   Average Image Size: ${summary.averageSize} KB`);
  console.log(`   Total Size: ${summary.totalSize} KB`);
  
  console.log(`\n📊 Latency Distribution:`);
  console.log(`   < 100ms: ${summary.latencyDistribution.under100ms} images`);
  console.log(`   100-200ms: ${summary.latencyDistribution['100-200ms']} images`);
  console.log(`   200-500ms: ${summary.latencyDistribution['200-500ms']} images`);
  console.log(`   > 500ms: ${summary.latencyDistribution.over500ms} images`);
  
  console.log(`\n🚀 Top 5 Fastest Images:`);
  summary.fastest5.forEach((img, i) => {
    console.log(`   ${i + 1}. ${img.avgLatency}ms (${img.sizeKB}KB) - ${img.url}`);
  });
  
  console.log(`\n🐌 Top 5 Slowest Images:`);
  summary.slowest5.forEach((img, i) => {
    console.log(`   ${i + 1}. ${img.avgLatency}ms (${img.sizeKB}KB) - ${img.url}`);
  });
  
  console.log('\n' + '='.repeat(100));
}

// Main function
async function main() {
  console.log('='.repeat(100));
  console.log('🖼️  IMAGE LATENCY MEASUREMENT TOOL');
  console.log(`   Target: ${TARGET_URL}`);
  console.log(`   Image Domain: ${IMAGE_DOMAIN}`);
  console.log(`   Fetch Count: ${FETCH_COUNT} times per image`);
  console.log('='.repeat(100) + '\n');
  
  try {
    // Step 1 & 2: Extract image URLs
    const imageUrls = await extractImageUrls();
    
    if (imageUrls.length === 0) {
      console.log('❌ No images found from ' + IMAGE_DOMAIN);
      return;
    }
    
    console.log(`\n✅ Found ${imageUrls.length} unique images from ${IMAGE_DOMAIN}\n`);
    
    // Step 3: Measure latency for each image
    console.log('📏 Starting latency measurements...\n');
    
    const results = [];
    for (let i = 0; i < imageUrls.length; i++) {
      const result = await measureImageLatency(imageUrls[i], i, imageUrls.length);
      results.push(result);
      
      // Log progress
      if (result.error) {
        console.log(`   ❌ Error: ${result.error}`);
      } else {
        console.log(`   ✅ Avg: ${result.avgLatency}ms, Size: ${result.sizeKB}KB, Cache: ${result.cacheStatus}`);
      }
    }
    
    // Step 4 & 5: Generate summary and save results
    const summary = generateSummary(results);
    
    saveToJson(results, summary);
    saveToCsv(results);
    
    // Print summary
    printSummary(summary);
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

main();
