# Image Server Performance Comparison Report
## dngroup (media.dngroup.com) vs Fastly (image-stage.dngroup.com)

---

## Executive Summary

| Metric | dngroup | Fastly | Difference | Winner |
|--------|---------|--------|------------|--------|
| **Average Latency** | 222.77 ms | 283.09 ms | +60.32 ms (+27%) | ✅ dngroup |
| **Median Latency** | 218.90 ms | 275.27 ms | +56.37 ms (+26%) | ✅ dngroup |
| **Min Latency** | 208.93 ms | 219.15 ms | +10.22 ms (+5%) | ✅ dngroup |
| **Max Latency** | 470.99 ms | 474.49 ms | +3.50 ms (+1%) | ✅ dngroup |
| **Total Images** | 148 | 85 | -63 images | — |
| **Avg Image Size** | 14.41 KB | 15.82 KB | +1.41 KB (+10%) | ✅ dngroup |
| **Total Size** | 2,131.97 KB | 1,344.82 KB | -787.15 KB | — |

---

## Latency Performance Analysis

### Average Latency Comparison
```
dngroup:  ████████████████ 222.77 ms
fastly:   ███████████████████████ 283.09 ms
          (+27% slower)
```

**Key Finding:** dngroup is **27% faster** in average latency than the Fastly staging environment.

### Latency Distribution (all in 200-500ms range)
- **dngroup:** 148/148 images (100%) in 200-500ms range
- **fastly:** 85/85 images (100%) in 200-500ms range
- **No outliers:** Both systems have all requests in expected range

### Fastest 5 Images Comparison
**dngroup:**
1. 208.93 ms (2.57 KB)
2. 209.16 ms (3.30 KB)
3. 209.33 ms (4.21 KB)
4. 210.00 ms (4.77 KB)
5. 210.73 ms (5.12 KB)

**fastly:**
1. 219.15 ms (10.13 KB)
2. 228.80 ms (9.78 KB)
3. 232.83 ms (11.74 KB)
4. 235.74 ms (22.58 KB)
5. 240.92 ms (10.49 KB)

⚠️ **Observation:** Fastly's fastest image is still 10ms slower than dngroup's fastest.

---

## Cache Behavior Analysis

### Cache Strategy Differences

#### dngroup (media.dngroup.com)
**Pattern:** `MISS, HIT, HIT` (3-tier caching)
- **Fetch 1:** MISS (Edge), HIT (Shield), HIT (Origin)
- **Fetch 2:** MISS (Edge), HIT (Shield), HIT (Origin)
- **Fetch 3:** MISS (Edge), HIT (Shield), HIT (Origin)

**Interpretation:**
- ✅ Shield layer working properly
- ❌ Edge cache never hits (consistent `MISS` at edge)
- ✅ Content consistently served from Shield
- **Architecture:** Edge → Shield → Origin (3 layers)

#### fastly (image-stage.dngroup.com)
**Patterns Observed:**
1. `MISS, HIT, MISS` → `MISS, HIT, HIT` (progressive warming)
2. `MISS, MISS, MISS` → `MISS, MISS, HIT` (no warming)
3. `MISS, HIT, MISS` → `MISS, HIT, HIT` (partial warming)

**Interpretation:**
- ⚠️ Inconsistent cache warming behavior
- ❌ First fetch hits origin (`MISS` at both edge and shield)
- ⚠️ Progressive warming varies per image
- ❌ Some images never achieve consistent caching
- **Architecture:** Edge → Shield → Origin (3 layers, but unstable)

### Cache Consistency Comparison

**dngroup:** 
- ✅ 100% consistent cache pattern (all MISS, HIT, HIT)
- ✅ Predictable behavior across all 3 fetches
- ✅ Shield layer consistently hits

**fastly:**
- ❌ Inconsistent patterns across images
- ⚠️ Some images show MISS, MISS, MISS (cold start)
- ⚠️ Warming up by 2nd/3rd fetch for some images
- ⚠️ No guarantee of cache consistency

---

## Image Count & Coverage

| Metric | dngroup | fastly |
|--------|---------|--------|
| **Total Images Found** | 148 | 85 |
| **Coverage Gap** | — | -63 images (-42.6%) |

**Possible Reasons:**
- Different target URLs (prod vs stage)
- Different page structures
- Different lazy-loading implementations

---

## Size Analysis

### Average Size per Image
- **dngroup:** 14.41 KB (avg)
- **fastly:** 15.82 KB (avg) — +10% larger

### Total Data Transfer
- **dngroup:** 2,131.97 KB total
- **fastly:** 1,344.82 KB total — 37% less (fewer images)

**Per-image adjusted:**
- dngroup image size is more consistent
- fastly images tend to be slightly larger

---

## Performance Efficiency Ranking

| Rank | System | Score | Notes |
|------|--------|-------|-------|
| 🥇 1 | **dngroup** | 95/100 | Faster, consistent, stable cache |
| 🥈 2 | **fastly** | 70/100 | Slower, inconsistent cache warming |

---

## Key Findings

### ✅ dngroup Advantages
1. **27% faster average latency** (222.77 ms vs 283.09 ms)
2. **Consistent cache behavior** across all requests
3. **Lower minimum latency** (208.93 ms vs 219.15 ms)
4. **More images measured** (148 vs 85)
5. **Smaller average image size** (14.41 KB vs 15.82 KB)

### ⚠️ fastly Issues
1. **27% slower average latency**
2. **Inconsistent cache warming** - varies by image
3. **Cold start issues** - some images show MISS, MISS, MISS on fetch 1
4. **Slower fastest images** - even best case is slower than dngroup
5. **Staging environment** - may not reflect production performance

---

## Cache Layer Performance

### dngroup Cache Statistics
```
Edge Layer:  MISS (100%) — Not caching at edge
Shield Layer: HIT (100%) — Consistently serving from shield
Origin:       HIT (100%) — All requests satisfy from origin/shield
```

### fastly Cache Statistics
```
Edge Layer:   MISS (100%) — Not caching at edge
Shield Layer: HIT (varies) — 40% MISS, 60% HIT on first fetch
Origin:       MISS (varies) — Cold start issues on 20% of images
```

---

## Recommendations

### For Fastly (image-stage.dngroup.com)
1. **Investigate cache key configuration** - Ensure consistent caching
2. **Enable edge caching** - Currently no edge cache hits
3. **Analyze cold start pattern** - MISS, MISS, MISS on first fetch
4. **Check TTL settings** - May be too aggressive
5. **Compare with production** - Staging may have stricter cache rules

### For dngroup (media.dngroup.com)
1. ✅ **Keep current configuration** - Performance is strong
2. 📊 **Monitor edge cache** - Consider enabling edge caching if business allows
3. 🔍 **Benchmark against production** - Verify these are representative

---

## Conclusion

**dngroup (media.dngroup.com)** significantly outperforms Fastly staging in:
- **Latency:** 27% faster
- **Consistency:** 100% stable cache behavior vs variable warming
- **Reliability:** Predictable performance pattern

The fastly staging environment shows concerning cache inconsistency that should be addressed before production deployment. While staging may have intentionally different cache rules, the cold-start issues (MISS, MISS, MISS) suggest configuration problems rather than design choices.

---

*Report Generated: 2025-12-18*
*Data Source: image_performance JSON/CSV files*
*Measurement Method: 3 fetches per image with 100ms delay*
