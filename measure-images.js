// measure-images.js
import https from 'https';
import { performance } from 'perf_hooks';
import sizeOf from 'image-size';

const imageUrls = [
  "https://image.dngroup.com/dn/nhst/binary/f91e519182d3f1b9e0967c59b0c54d77?crop=1601%2C1067%2Cx0%2Cy0%2Csafe&width=1300&format=webp&quality=80",
  "https://image.dngroup.com/dn/nhst/binary/e77cc086f9d09d57c6880db40f58b5f6?crop=2047%2C1150%2Cx0%2Cy0%2Csafe&width=1300&format=webp&quality=80",
  "https://image.dngroup.com/dn/nhst/binary/4b552c16b4aa2aa355aa8d4dc0ef5226?crop=1601%2C1067%2Cx0%2Cy0%2Csafe&width=650&format=webp&quality=80",
  "https://image.dngroup.com/dn/nhst/binary/3facec5459fd56ce51687e5d0d41957a?crop=1600%2C1067%2Cx0%2Cy0%2Csafe&width=1300&format=webp&quality=80",
  "https://image.dngroup.com/dn/nhst/binary/3e1111a0eb22d2f5e8da60109d6f7869?crop=2048%2C1365%2Cx0%2Cy0%2Csafe&width=1300&format=webp&quality=80",
  "https://image.dngroup.com/dn/nhst/binary/3b925b67c52edea7f1bd628372d1b0ee?crop=1602%2C1068%2Cx0%2Cy0%2Csafe&width=1300&format=webp&quality=80",
  "https://image.dngroup.com/dn/nhst/binary/ad8f29b51a8d731c3cfa361daf3cf9f8?crop=1601%2C1067%2Cx0%2Cy0%2Csafe&width=1300&format=webp&quality=80",
  // "https://image-stage.dngroup.com/dn/nhst/binary/71e67a785896db5f43b8434a877e57a9?crop=1600%2C1093%2Cx0%2Cy0%2Csafe&width=2000&format=webp&quality=80"
];
const oldImageUrls = [
    "https://media.dngroup.com/image/eyJ3IjoxMzAwLCJmIjoid2VicCIsImsiOiJmOTFlNTE5MTgyZDNmMWI5ZTA5NjdjNTliMGM1NGQ3NyIsImNyb3AiOlswLDAsMTYwMSwxMDY3XSwiciI6MS41LCJvIjoiZG4ifQ",
    "https://media.dngroup.com/image/eyJ3IjoxMzAwLCJmIjoid2VicCIsImsiOiJlNzdjYzA4NmY5ZDA5ZDU3YzY4ODBkYjQwZjU4YjVmNiIsImNyb3AiOlswLDAsMjA0NywxMTUwXSwiciI6MS43OCwibyI6ImRuIn0",
    "https://media.dngroup.com/image/eyJ3Ijo2NTAsImYiOiJ3ZWJwIiwiayI6IjRiNTUyYzE2YjRhYTJhYTM1NWFhOGQ0ZGMwZWY1MjI2IiwiY3JvcCI6WzAsMCwxNjAxLDEwNjddLCJyIjoxLjUsIm8iOiJkbiJ9",
    "https://media.dngroup.com/image/eyJ3IjoxMzAwLCJmIjoid2VicCIsImsiOiIzZmFjZWM1NDU5ZmQ1NmNlNTE2ODdlNWQwZDQxOTU3YSIsImNyb3AiOlswLDAsMTYwMCwxMDY3XSwiciI6MS41LCJvIjoiZG4ifQ",
    "https://media.dngroup.com/image/eyJ3IjoxMzAwLCJmIjoid2VicCIsImsiOiIzZTExMTFhMGViMjJkMmY1ZThkYTYwMTA5ZDZmNzg2OSIsImNyb3AiOlswLDAsMjA0OCwxMzY1XSwiciI6MS41LCJvIjoiZG4ifQ",
    "https://media.dngroup.com/image/eyJ3IjoxMzAwLCJmIjoid2VicCIsImsiOiIzYjkyNWI2N2M1MmVkZWE3ZjFiZDYyODM3MmQxYjBlZSIsImNyb3AiOlswLDAsMTYwMiwxMDY4XSwiciI6MS41LCJvIjoiZG4ifQ",
    "https://media.dngroup.com/image/eyJ3IjoxMzAwLCJmIjoid2VicCIsImsiOiJhZDhmMjliNTFhOGQ3MzFjM2NmYTM2MWRhZjNjZjlmOCIsImNyb3AiOlswLDAsMTYwMSwxMDY3XSwiciI6MS41LCJvIjoiZG4ifQ",
    // "https://media.dngroup.com/image/eyJ3IjoyMDAwLCJmIjoid2VicCIsImsiOiI3MWU2N2E3ODU4OTZkYjVmNDNiODQzNGE4NzdlNTdhOSIsImZwIjpbMC42MjE2NSwwLjE3MTUxN10sIm8iOiJkbiJ9"
];

function fetchImage(url) {
  return new Promise((resolve) => {
    const start = performance.now();
    https.get(url, (res) => {
      let size = 0;
      const chunks = [];
      
      // Capture cache-related headers
      const cacheStatus = res.headers['x-cache'] || res.headers['x-fastly-cache'] || 'N/A';
      const cacheHit = res.headers['x-cache-hits'] || 'N/A';
      const age = res.headers['age'] || '0';
      const server = res.headers['server'] || 'N/A';
      const viaHeader = res.headers['via'] || 'N/A';
      const xServedBy = res.headers['x-served-by'] || 'N/A';
      
      // KEY INSIGHT: Age header determines if content is CACHED or FRESH
      // age > 0 = served from cache, age = 0 = fresh from origin
      const ageNum = parseInt(age);
      const servedFrom = ageNum > 0 ? '📦 CACHE' : '🔄 ORIGIN';

      res.on("data", chunk => {
        size += chunk.length;
        chunks.push(chunk);
      });
      res.on("end", () => {
        const latency = performance.now() - start;
        const buffer = Buffer.concat(chunks);
        
        let dimensions = { width: 'N/A', height: 'N/A' };
        try {
          dimensions = sizeOf(buffer);
        } catch (err) {
          // If dimension reading fails, keep N/A
        }
        
        resolve({
          url,
          latencyMs: latency.toFixed(2),
          sizeKB: (size / 1024).toFixed(2),
          width: dimensions.width,
          height: dimensions.height,
          cacheStatus,
          cacheHit,
          age,
          servedFrom,
          server
        });
      });
    }).on("error", (err) => {
      resolve({ url, error: err.message });
    });
  });
}

async function run() {
  const useCacheBuster = false; // Toggle this to test with/without cache busting
  const iterations = 3; // Number of times to hit each image per run
  const runCount = 5; // Number of times to run the entire test
  
  console.log(`Cache Buster: ${useCacheBuster ? 'ON' : 'OFF'}`);
  console.log(`Iterations per image: ${iterations}`);
  console.log(`Total runs: ${runCount}\n`);
  
  // Store results for each run
  const allRuns = [];
  
  for (let run = 1; run <= runCount; run++) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`RUN ${run}/${runCount}`);
    console.log(`${'='.repeat(80)}\n`);
    
    const timestamp = Date.now();
    
    console.log("Fetching NEW images...");
    const newResults = [];
    for (const url of imageUrls) {
      const finalUrl = useCacheBuster 
        ? url + (url.includes('?') ? '&' : '?') + `t=${timestamp}`
        : url;
      
      // Run multiple iterations and collect all latencies
      const latencies = [];
      let lastResult = null;
      for (let i = 0; i < iterations; i++) {
        const result = await fetchImage(finalUrl);
        latencies.push(parseFloat(result.latencyMs));
        lastResult = result;
      }
      
      // Store first hit, average, and last hit latencies
      newResults.push({
        ...lastResult,
        firstHitMs: latencies[0].toFixed(2),
        avgLatencyMs: (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2),
        lastHitMs: latencies[latencies.length - 1].toFixed(2),
        allLatencies: latencies,
        cacheInfo: `${lastResult.cacheStatus} | Age: ${lastResult.age}s | ${lastResult.servedFrom}`
      });
    }

    console.log("Fetching OLD images...\n");
    const oldResults = [];
    for (const url of oldImageUrls) {
      const finalUrl = useCacheBuster 
        ? url + (url.includes('?') ? '&' : '?') + `t=${timestamp}`
        : url;
      
      const latencies = [];
      let lastResult = null;
      for (let i = 0; i < iterations; i++) {
        const result = await fetchImage(finalUrl);
        latencies.push(parseFloat(result.latencyMs));
        lastResult = result;
      }
      
      oldResults.push({
        ...lastResult,
        firstHitMs: latencies[0].toFixed(2),
        avgLatencyMs: (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2),
        lastHitMs: latencies[latencies.length - 1].toFixed(2),
        allLatencies: latencies,
        cacheInfo: `${lastResult.cacheStatus} | Age: ${lastResult.age}s | ${lastResult.servedFrom}`
      });
    }
    
    // Store this run's results
    allRuns.push({ newResults, oldResults });

    // Display cache diagnostic info for this run
    console.log("CACHE DIAGNOSTICS:");
    console.log("\nNEW Images:");
    newResults.forEach((r, i) => {
      console.log(`  #${i + 1}: ${r.cacheInfo} | Server: ${r.server}`);
    });
    console.log("\nOLD Images:");
    oldResults.forEach((r, i) => {
      console.log(`  #${i + 1}: ${r.cacheInfo} | Server: ${r.server}`);
    });
  }
  
  // After all runs, display summary comparing cache consistency
  displayCacheCostistencySummary(allRuns);
}

function displayCacheCostistencySummary(allRuns) {
  console.log(`\n\n${'='.repeat(170)}`);
  console.log("CACHE CONSISTENCY ANALYSIS ACROSS ALL RUNS");
  console.log(`${'='.repeat(170)}\n`);
  
  // Analyze cache hit/miss patterns
  const newImagesCacheStatus = {};
  const oldImagesCacheStatus = {};
  
  for (let imgIdx = 0; imgIdx < allRuns[0].newResults.length; imgIdx++) {
    newImagesCacheStatus[imgIdx] = [];
    oldImagesCacheStatus[imgIdx] = [];
    
    for (let runIdx = 0; runIdx < allRuns.length; runIdx++) {
      const newRes = allRuns[runIdx].newResults[imgIdx];
      const oldRes = allRuns[runIdx].oldResults[imgIdx];
      
      newImagesCacheStatus[imgIdx].push({
        age: parseInt(newRes.age),
        servedFrom: newRes.servedFrom,
        latency: parseFloat(newRes.avgLatencyMs)
      });
      
      oldImagesCacheStatus[imgIdx].push({
        age: parseInt(oldRes.age),
        servedFrom: oldRes.servedFrom,
        latency: parseFloat(oldRes.avgLatencyMs)
      });
    }
  }
  
  // Print detailed analysis
  console.log("NEW IMAGES - Cache Consistency:");
  console.log("┌───┬──────────────────────────────────────────────────────────────────────────────────────┐");
  console.log("│ # │ RUN 1          │ RUN 2          │ RUN 3          │ RUN 4          │ RUN 5          │");
  console.log("├───┼──────────────────────────────────────────────────────────────────────────────────────┤");
  
  for (let imgIdx = 0; imgIdx < Object.keys(newImagesCacheStatus).length; imgIdx++) {
    const status = newImagesCacheStatus[imgIdx];
    let row = `│ ${imgIdx + 1} │`;
    status.forEach(s => {
      const cacheStr = s.servedFrom === '📦 CACHE' ? 'CACHE' : 'FRESH';
      const ageStr = s.age > 0 ? `${s.age}s` : 'age=0';
      row += ` ${cacheStr}(${ageStr.padEnd(8)}) │`;
    });
    console.log(row);
  }
  console.log("└───┴──────────────────────────────────────────────────────────────────────────────────────┘");
  
  console.log("\nOLD IMAGES - Cache Consistency:");
  console.log("┌───┬──────────────────────────────────────────────────────────────────────────────────────┐");
  console.log("│ # │ RUN 1          │ RUN 2          │ RUN 3          │ RUN 4          │ RUN 5          │");
  console.log("├───┼──────────────────────────────────────────────────────────────────────────────────────┤");
  
  for (let imgIdx = 0; imgIdx < Object.keys(oldImagesCacheStatus).length; imgIdx++) {
    const status = oldImagesCacheStatus[imgIdx];
    let row = `│ ${imgIdx + 1} │`;
    status.forEach(s => {
      const cacheStr = s.servedFrom === '📦 CACHE' ? 'CACHE' : 'FRESH';
      const ageStr = s.age > 0 ? `${s.age}s` : 'age=0';
      row += ` ${cacheStr}(${ageStr.padEnd(8)}) │`;
    });
    console.log(row);
  }
  console.log("└───┴──────────────────────────────────────────────────────────────────────────────────────┘");
  
  // Latency variance analysis
  console.log("\n\nLATENCY VARIANCE:");
  console.log("┌────────────────────────────────────────────────┐");
  console.log("│ Image # │ NEW Min  │ NEW Max  │ OLD Min  │ OLD Max  │");
  console.log("├────────────────────────────────────────────────┤");
  
  for (let imgIdx = 0; imgIdx < Object.keys(newImagesCacheStatus).length; imgIdx++) {
    const newLats = newImagesCacheStatus[imgIdx].map(s => s.latency);
    const oldLats = oldImagesCacheStatus[imgIdx].map(s => s.latency);
    
    const newMin = Math.min(...newLats).toFixed(2);
    const newMax = Math.max(...newLats).toFixed(2);
    const oldMin = Math.min(...oldLats).toFixed(2);
    const oldMax = Math.max(...oldLats).toFixed(2);
    
    console.log(`│    ${imgIdx + 1}    │ ${newMin.padStart(8)} │ ${newMax.padStart(8)} │ ${oldMin.padStart(8)} │ ${oldMax.padStart(8)} │`);
  }
  console.log("└────────────────────────────────────────────────┘");
  console.log();
}

run();
