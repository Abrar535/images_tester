import https from 'https';
import fs from 'fs';
import { performance } from 'perf_hooks';

// Configuration
const BASE_URL = 'https://image.dngroup.com/global/nhst/binary/f5223451eeb0cd828d08f16561020404?crop=1600%2C899%2Cx0%2Cy0%2Csafe&width={WIDTH}&format=auto&quality=80';
const MIN_WIDTH = 50;
const MAX_WIDTH = 2000;
const INCREMENT = 50;
const FETCH_COUNT = 3; // Number of times to fetch each width
const DELAY_BETWEEN_FETCHES = 100; // ms delay between fetches

// Calculate all widths to test
function getWidthsToTest(min, max, increment) {
    const widths = [];
    for (let width = min; width <= max; width += increment) {
        widths.push(width);
    }
    return widths;
}

// Fetch a single image and measure latency
function fetchImage(url) {
    return new Promise((resolve, reject) => {
        const startTime = performance.now();
        
        const req = https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Cache-Control': 'no-cache, no-store',
                'Pragma': 'no-cache'
            }
        }, (res) => {
            let data = [];
            
            res.on('data', (chunk) => {
                data.push(chunk);
            });
            
            res.on('end', () => {
                const endTime = performance.now();
                const latency = endTime - startTime;
                const buffer = Buffer.concat(data);
                
                resolve({
                    latency: latency,
                    sizeKB: buffer.length / 1024,
                    status: res.statusCode,
                    cacheStatus: res.headers['x-cache'] || 'N/A',
                    age: res.headers['age'] || 'N/A',
                    contentType: res.headers['content-type'] || 'N/A'
                });
            });
        });
        
        req.on('error', (err) => {
            reject(err);
        });
        
        req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

// Delay helper
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Measure latency for a specific width
async function measureWidth(width) {
    const url = BASE_URL.replace('{WIDTH}', width);
    const results = {
        width: width,
        url: url,
        latencies: [],
        cacheStatuses: [],
        ages: [],
        sizeKB: 0,
        status: 0,
        error: null
    };
    
    try {
        for (let i = 0; i < FETCH_COUNT; i++) {
            const result = await fetchImage(url);
            results.latencies.push(parseFloat(result.latency.toFixed(2)));
            results.cacheStatuses.push(result.cacheStatus);
            results.ages.push(result.age);
            results.sizeKB = parseFloat(result.sizeKB.toFixed(2));
            results.status = result.status;
            
            if (i < FETCH_COUNT - 1) {
                await delay(DELAY_BETWEEN_FETCHES);
            }
        }
        
        results.avgLatency = parseFloat((results.latencies.reduce((a, b) => a + b, 0) / results.latencies.length).toFixed(2));
        results.minLatency = parseFloat(Math.min(...results.latencies).toFixed(2));
        results.maxLatency = parseFloat(Math.max(...results.latencies).toFixed(2));
        
    } catch (err) {
        results.error = err.message;
    }
    
    return results;
}

// Main function
async function main() {
    console.log('='.repeat(70));
    console.log('IMAGE WIDTH LATENCY MEASUREMENT');
    console.log('='.repeat(70));
    console.log(`Min Width: ${MIN_WIDTH}px`);
    console.log(`Max Width: ${MAX_WIDTH}px`);
    console.log(`Increment: ${INCREMENT}px`);
    console.log(`Fetches per width: ${FETCH_COUNT}`);
    console.log('='.repeat(70));
    
    const widths = getWidthsToTest(MIN_WIDTH, MAX_WIDTH, INCREMENT);
    console.log(`\nTotal widths to test: ${widths.length}`);
    console.log(`Width range: ${widths[0]}px to ${widths[widths.length - 1]}px\n`);
    
    const results = [];
    const startTime = new Date();
    
    for (let i = 0; i < widths.length; i++) {
        const width = widths[i];
        process.stdout.write(`[${i + 1}/${widths.length}] Testing width ${width}px... `);
        
        const result = await measureWidth(width);
        results.push(result);
        
        if (result.error) {
            console.log(`❌ Error: ${result.error}`);
        } else {
            console.log(`✓ Avg: ${result.avgLatency}ms | Size: ${result.sizeKB}KB | Cache: ${result.cacheStatuses[0]}`);
        }
        
        // Small delay between different widths
        if (i < widths.length - 1) {
            await delay(50);
        }
    }
    
    const endTime = new Date();
    const totalTime = (endTime - startTime) / 1000;
    
    // Calculate summary statistics
    const successfulResults = results.filter(r => !r.error);
    const allLatencies = successfulResults.map(r => r.avgLatency);
    const allSizes = successfulResults.map(r => r.sizeKB);
    
    const summary = {
        totalWidthsTested: widths.length,
        successfulMeasurements: successfulResults.length,
        failedMeasurements: results.filter(r => r.error).length,
        latencyStats: {
            average: parseFloat((allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length).toFixed(2)),
            min: parseFloat(Math.min(...allLatencies).toFixed(2)),
            max: parseFloat(Math.max(...allLatencies).toFixed(2)),
            median: parseFloat(allLatencies.sort((a, b) => a - b)[Math.floor(allLatencies.length / 2)].toFixed(2))
        },
        sizeStats: {
            min: parseFloat(Math.min(...allSizes).toFixed(2)),
            max: parseFloat(Math.max(...allSizes).toFixed(2)),
            average: parseFloat((allSizes.reduce((a, b) => a + b, 0) / allSizes.length).toFixed(2))
        },
        totalExecutionTime: `${totalTime.toFixed(2)} seconds`
    };
    
    // Find fastest and slowest widths
    const sortedByLatency = [...successfulResults].sort((a, b) => a.avgLatency - b.avgLatency);
    summary.fastest5 = sortedByLatency.slice(0, 5).map(r => ({
        width: r.width,
        avgLatency: r.avgLatency,
        sizeKB: r.sizeKB
    }));
    summary.slowest5 = sortedByLatency.slice(-5).reverse().map(r => ({
        width: r.width,
        avgLatency: r.avgLatency,
        sizeKB: r.sizeKB
    }));
    
    // Prepare output data
    const outputData = {
        timestamp: new Date().toISOString(),
        configuration: {
            baseUrl: BASE_URL,
            minWidth: MIN_WIDTH,
            maxWidth: MAX_WIDTH,
            increment: INCREMENT,
            fetchCount: FETCH_COUNT
        },
        summary: summary,
        results: results
    };
    
    // Save JSON
    const timestamp = new Date().toISOString().split('T')[0];
    const jsonFilename = `image_width_performance_${timestamp}.json`;
    fs.writeFileSync(jsonFilename, JSON.stringify(outputData, null, 2));
    
    // Save CSV
    const csvFilename = `image_width_performance_${timestamp}.csv`;
    const csvHeader = 'Width,AvgLatency,MinLatency,MaxLatency,SizeKB,Status,CacheStatus1,CacheStatus2,CacheStatus3,Latency1,Latency2,Latency3\n';
    const csvRows = results.map(r => {
        return [
            r.width,
            r.avgLatency || '',
            r.minLatency || '',
            r.maxLatency || '',
            r.sizeKB || '',
            r.status || '',
            r.cacheStatuses[0] || '',
            r.cacheStatuses[1] || '',
            r.cacheStatuses[2] || '',
            r.latencies[0] || '',
            r.latencies[1] || '',
            r.latencies[2] || ''
        ].join(',');
    }).join('\n');
    fs.writeFileSync(csvFilename, csvHeader + csvRows);
    
    // Print summary
    console.log('\n' + '='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total widths tested: ${summary.totalWidthsTested}`);
    console.log(`Successful: ${summary.successfulMeasurements} | Failed: ${summary.failedMeasurements}`);
    console.log(`Total execution time: ${summary.totalExecutionTime}`);
    console.log('\nLatency Statistics:');
    console.log(`  Average: ${summary.latencyStats.average}ms`);
    console.log(`  Min: ${summary.latencyStats.min}ms`);
    console.log(`  Max: ${summary.latencyStats.max}ms`);
    console.log(`  Median: ${summary.latencyStats.median}ms`);
    console.log('\nSize Statistics:');
    console.log(`  Min: ${summary.sizeStats.min}KB`);
    console.log(`  Max: ${summary.sizeStats.max}KB`);
    console.log(`  Average: ${summary.sizeStats.average}KB`);
    console.log('\nFastest 5 widths:');
    summary.fastest5.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.width}px - ${r.avgLatency}ms (${r.sizeKB}KB)`);
    });
    console.log('\nSlowest 5 widths:');
    summary.slowest5.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.width}px - ${r.avgLatency}ms (${r.sizeKB}KB)`);
    });
    console.log('\n' + '='.repeat(70));
    console.log(`Results saved to: ${jsonFilename}`);
    console.log(`CSV saved to: ${csvFilename}`);
    console.log('='.repeat(70));
}

// Run
main().catch(console.error);
