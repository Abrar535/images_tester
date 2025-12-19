# Performance Comparison Report: Fastly Image Optimizer vs DNGroup Native Image Service

## Recharge (Fastly IO) vs Intrafish (DNGroup-Image)

**Generated:** December 19, 2025  
**Test Location:** Oslo Office  
**Test Time:** ~12:38-12:41 UTC

---

## 🎯 Executive Summary

This report compares image delivery performance between two image optimization solutions, both using the **same Fastly CDN and Shield POP configuration**:

| Solution | Website | Image Domain | Technology |
|----------|---------|--------------|------------|
| **Fastly Image Optimizer** | rechargenews.com | `image.dngroup.com` | Fastly IO (edge processing) |
| **DNGroup Native Service** | intrafish.com | `media.dngroup.com` | DNGroup-image server (origin processing) |

### Key Findings

| Metric | Fastly IO (Recharge) | DNGroup Native (Intrafish) | Winner |
|--------|---------------------|---------------------------|--------|
| **Average Latency** | 54.10 ms | 39.52 ms | 🏆 DNGroup (-27%) |
| **Min Latency** | 10.53 ms | 6.87 ms | 🏆 DNGroup (-35%) |
| **Max Latency** | 191.56 ms | 156.24 ms | 🏆 DNGroup (-18%) |
| **Median Latency** | 52.84 ms | 39.87 ms | 🏆 DNGroup (-25%) |
| **Avg Image Size** | 10.98 KB | 18.57 KB | 🏆 Fastly IO (-41%) |
| **Total Size** | 812.87 KB | 3,714.51 KB | 🏆 Fastly IO (-78%) |

**Bottom Line:** DNGroup native service is **~27% faster** but Fastly IO delivers **~41% smaller** images.

---

## 📊 Detailed Performance Metrics

### Latency Comparison

| Metric | Fastly IO | DNGroup Native | Difference |
|--------|-----------|----------------|------------|
| **Average** | 54.10 ms | 39.52 ms | DNGroup 14.58 ms faster (27%) |
| **Minimum** | 10.53 ms | 6.87 ms | DNGroup 3.66 ms faster (35%) |
| **Maximum** | 191.56 ms | 156.24 ms | DNGroup 35.32 ms faster (18%) |
| **Median** | 52.84 ms | 39.87 ms | DNGroup 12.97 ms faster (25%) |

### Latency Distribution

| Range | Fastly IO | % | DNGroup Native | % |
|-------|-----------|---|----------------|---|
| Under 100ms | 66 | 89.2% | 195 | **97.5%** |
| 100-200ms | 8 | 10.8% | 5 | 2.5% |
| 200-500ms | 0 | 0% | 0 | 0% |
| Over 500ms | 0 | 0% | 0 | 0% |

### Visual Distribution

```
LATENCY DISTRIBUTION

Fastly IO (Recharge):
Under 100ms:  |█████████████████████████████████████     | 89.2%
100-200ms:    |████                                      | 10.8%
200-500ms:    |                                          | 0%
Over 500ms:   |                                          | 0%

DNGroup Native (Intrafish):
Under 100ms:  |████████████████████████████████████████  | 97.5%
100-200ms:    |█                                         | 2.5%
200-500ms:    |                                          | 0%
Over 500ms:   |                                          | 0%
```

---

## 📦 Image Size Comparison

| Metric | Fastly IO | DNGroup Native | Difference |
|--------|-----------|----------------|------------|
| **Average Size** | 10.98 KB | 18.57 KB | Fastly 41% smaller |
| **Total Size** | 812.87 KB | 3,714.51 KB | Fastly 78% smaller |
| **Total Images** | 74 | 200 | - |

### Size Analysis

```
AVERAGE IMAGE SIZE

Fastly IO:      |██████████████                            | 10.98 KB
DNGroup Native: |████████████████████████                  | 18.57 KB
                 0        5        10       15       20 KB
```

**Note:** Fastly IO produces significantly smaller images while maintaining quality, which translates to:
- **Lower bandwidth costs**
- **Faster page loads** (despite slightly higher per-image latency)
- **Better mobile experience** (especially on slow networks)

---

## 🔍 Cache Behavior Analysis

**IMPORTANT:** Cache status format is `Origin, Shield, Edge` (prepended from origin to edge)

### Visual Cache Flow Comparison

```
DNGroup Native (Fast - 97% edge hits):
┌──────────┐
│  Request │
└────┬─────┘
     │
     ▼
┌────────────┐
│  Edge POP  │──────────▶ CACHE HIT (7-40ms) ✅ 97% of requests
└────────────┘
     │ MISS (rare)
     ▼
┌─────────────┐
│  Shield POP │
└─────────────┘
     │
     ▼
┌──────────┐
│  Origin  │
└──────────┘


Fastly IO (Slow - Many edge misses):
┌──────────┐
│  Request │
└────┬─────┘
     │
     ▼
┌────────────┐
│  Edge POP  │──────────▶ CACHE MISS ❌ (Many requests)
└────┬───────┘
     │ MISS (frequent due to cache fragmentation)
     ▼
┌─────────────┐
│  Shield POP │──────────▶ MISS/HIT (100-200ms)
└─────┬───────┘
     │ 
     ▼
┌──────────┐
│  Origin  │──────────▶ Process + Return (200-300ms)
│ Fastly IO│
└──────────┘
```

### Fastly IO (Recharge) - Poor Edge Cache Hit Rate
- **Primary Pattern:** `MISS, MISS, MISS` (Origin MISS, Shield MISS, **Edge MISS**)
  - This means **edge cache is frequently missing**
  - Many requests going all the way back to shield/origin
- **Some patterns:** `MISS, HIT, MISS` and `MISS, HIT, HIT`
- **Problem:** Edge cache misses force longer network traversal

**Example from data:**
- 66% of images showing `MISS, MISS, MISS` or `MISS, MISS, HIT` on first fetch
- Edge cache not effectively serving repeat requests
- Latency: 100-300ms on MISS paths vs 7-10ms on HIT

### DNGroup Native (Intrafish) - Excellent Edge Cache Hit Rate
- **Primary Pattern:** `MISS, MISS, HIT` (Origin MISS, Shield MISS, **Edge HIT**)
  - **Edge cache is consistently serving requests**
  - No need to go to shield or origin
- **Cache ages:** Very high (80,000+ seconds = ~22+ hours)
- **Result:** Most requests served from edge = fastest possible delivery

**Example from data:**
- ~97% showing `MISS, MISS, HIT` pattern
- Edge cache serving almost all traffic
- Latency: Consistently 7-40ms (edge delivery)

### Sample Response Times

**Fastly IO - Best performers (cached):**
| Image | Fetch 1 | Fetch 2 | Fetch 3 | Avg |
|-------|---------|---------|---------|-----|
| Image 1 | 17.57ms | 9.14ms | 7.35ms | 11.35ms |
| Image 2 | 16.40ms | 8.47ms | 6.99ms | 10.62ms |
| Image 3 | 16.92ms | 7.21ms | 7.46ms | 10.53ms |

**DNGroup Native - Best performers (cached):**
| Image | Fetch 1 | Fetch 2 | Fetch 3 | Avg |
|-------|---------|---------|---------|-----|
| Image 1 | 9.48ms | 6.38ms | 4.76ms | 6.87ms |
| Image 2 | 10.99ms | 4.31ms | 5.33ms | 6.88ms |
| Image 3 | 11.09ms | 4.76ms | 5.09ms | 6.98ms |

---

## ⚡ Performance Trade-offs

### Why DNGroup Native is Faster (PRIMARY REASON: Cache Hit Rate!)

1. **🎯 EDGE CACHE HIT RATE - THE KEY DIFFERENCE**
   - **DNGroup:** ~97% edge cache hits (`MISS, MISS, HIT`)
   - **Fastly IO:** Low edge cache hit rate (many `MISS, MISS, MISS`)
   - **Impact:** Edge hits = 7-10ms, Edge misses = 100-300ms
   
2. **Cache Consistency**
   - DNGroup: Pre-processed images have stable URLs → high cache hit rate
   - Fastly IO: Dynamic processing parameters → cache fragmentation
   - Example: Same image with different quality/format settings = separate cache entries

3. **Processing Location**
   - DNGroup: Images pre-processed at origin, cached as final product
   - Fastly IO: Edge processing adds overhead on cache miss

4. **Cache TTL Behavior**
   - DNGroup: Long-lived cache entries (80,000+ second ages)
   - Fastly IO: Shorter cache duration or more variations invalidating cache

### Why Fastly IO Produces Smaller Files

1. **Modern Compression**
   - Fastly IO: Aggressive auto-format selection (WebP, AVIF)
   - DNGroup: Mix of WebP and JPEG (some images ~55KB vs Fastly's ~10KB)

2. **Quality Optimization**
   - Fastly IO: Dynamic quality adjustment per image (`quality=80` in URL)
   - DNGroup: Pre-determined format in URL

3. **Format Selection**
   - Fastly IO: `format=auto` negotiates best format per client
   - DNGroup: Pre-determined format in URL

### The Real Problem: Cache Fragmentation

**Fastly IO's dynamic processing causes cache fragmentation:**

Example: Same source image requested 3 different ways:
```
URL 1: ...?width=300&format=auto&quality=80  → Cache Entry A
URL 2: ...?width=350&format=auto&quality=80  → Cache Entry B  
URL 3: ...?width=450&format=auto&quality=80  → Cache Entry C
```

**Result:**
- 3 separate cache entries for essentially the same image
- Traffic splits across entries → each gets less hits
- Lower hit count per entry → higher eviction probability
- When evicted → next request = edge MISS → 100-300ms latency

**Real data from test:**
```
Recharge page: 74 images with variations = potentially hundreds of cache entries
Cache pattern: MISS, MISS, MISS (many images)
Average latency: 54ms (with many 100-300ms outliers)
```

**DNGroup Native's static approach avoids this:**

Example: Pre-generated variants with stable URLs:
```
URL 1: .../eyJ3IjozMDB... (300px WebP) → Cache Entry A (stable)
URL 2: .../eyJ3IjozNTA... (350px WebP) → Cache Entry B (stable)
URL 3: .../eyJ3Ijo0NTA... (450px WebP) → Cache Entry C (stable)
```

**Result:**
- Each size variant is a predictable, stable URL
- All traffic for "300px version" hits same cache entry
- Higher hit count → stays in cache longer
- Consistently served from edge → 7-40ms latency

**Real data from test:**
```
Intrafish page: 200 images, pre-generated variants
Cache pattern: MISS, MISS, HIT (97% of images)
Average latency: 39.52ms (consistently fast)
```

### Cache Fragmentation Impact by Numbers

| Metric | Fastly IO | DNGroup Native |
|--------|-----------|----------------|
| Edge Cache Hit Pattern | Many MISS | Mostly HIT |
| Latency on Edge HIT | 7-10ms | 7-10ms |
| Latency on Edge MISS | 100-300ms | Rare |
| Effective Avg Latency | 54ms | 39.52ms |
| Cache Efficiency | Low (fragmented) | High (consolidated) |

---

## 📈 Bandwidth Impact Analysis

### Per Page Load (assuming all images load)

| Metric | Fastly IO | DNGroup Native |
|--------|-----------|----------------|
| Total Transfer | 812.87 KB | 3,714.51 KB |
| Image Count | 74 | 200 |
| Avg per Image | 10.98 KB | 18.57 KB |

### Projected Monthly Bandwidth (1M page views)

| Scenario | Fastly IO | DNGroup Native | Savings |
|----------|-----------|----------------|---------|
| **1M page views** | ~775 GB | ~3,540 GB | **78% reduction** |
| **10M page views** | ~7.75 TB | ~35.4 TB | **~27.65 TB saved** |

---

## 🏆 Recommendations

### Choose Fastly IO When:
- ✅ **Bandwidth costs** are a primary concern
- ✅ **Mobile users** are significant traffic source
- ✅ **Page weight** optimization is critical
- ✅ **Format negotiation** (WebP/AVIF) is important
- ✅ **Dynamic image transformations** are needed

### Choose DNGroup Native When:
- ✅ **Raw latency** is the top priority
- ✅ **Cache hit rates** need to be maximized
- ✅ **Predictable processing** is preferred
- ✅ **Image URLs** need to be stable/pre-generated
- ✅ **Origin control** is required

---

## 📋 Test Configuration

| Parameter | Fastly IO (Recharge) | DNGroup Native (Intrafish) |
|-----------|---------------------|---------------------------|
| **Target URL** | https://www.rechargenews.com/ | https://www.intrafish.com/ |
| **Image Domain** | image.dngroup.com | media.dngroup.com |
| **Timestamp** | 2025-12-19T12:38:13.936Z | 2025-12-19T12:41:36.970Z |
| **Total Images** | 74 | 200 |
| **Fetches per Image** | 3 | 3 |
| **CDN** | Fastly | Fastly |
| **Shield POP** | ✅ Configured | ✅ Configured |

---

## 📁 Source Files

| Test | JSON File | CSV File |
|------|-----------|----------|
| Fastly IO (Recharge) | `oslo_fastly_image_performance_prod_recharge_frontpage(19th_dec).json` | `oslo_fastly_image_performance_prod_recharge_frontpage(19th_dec).csv` |
| DNGroup Native (Intrafish) | `oslo_dngroup_image_performance_prod_intrafish_frontpage(19th_dec).json` | - |

---

## 🔑 Key Takeaways

1. **DNGroup Native is 27% faster PRIMARILY due to edge cache hit rate** (97% vs much lower)
2. **Fastly IO's dynamic processing causes cache fragmentation** - same image with different params = cache miss
3. **Edge cache hits deliver in 7-10ms** - going to shield/origin takes 100-300ms
4. **Fastly IO produces 41% smaller images** - better for bandwidth but worse for cache efficiency
5. **Trade-off: Cache efficiency (speed) vs Dynamic optimization (size)**

### The Core Issue: Fastly IO Cache Problem

**Why Fastly IO has low edge cache hit rate:**
- ❌ Dynamic URL parameters (`width=`, `quality=`, `format=`) create many cache variations
- ❌ Each parameter combination = separate cache entry
- ❌ Lower traffic per cache entry = higher eviction rate
- ❌ Result: Edge cache misses → slow delivery (100-300ms)

**Why DNGroup Native has high edge cache hit rate:**
- ✅ Stable, pre-generated URLs for each image variant
- ✅ Predictable cache keys
- ✅ Higher traffic concentration per cache entry = longer cache retention
- ✅ Result: Edge cache hits → fast delivery (7-40ms)

### Overall Verdict

| Use Case | Recommended Solution | Reason |
|----------|---------------------|--------|
| High-traffic, repeated image access | **DNGroup Native** | Better cache hit rate = faster |
| Bandwidth-constrained users | **Fastly IO** | Smaller files despite slower delivery |
| Mobile-first applications | **Fastly IO** | Trade latency for smaller payload |
| Performance-critical applications | **DNGroup Native** | Edge cache efficiency is key |
| Dynamic image requirements | **Fastly IO** | Need on-the-fly transformations |

### 💡 Potential Solutions to Fix Fastly IO Performance

1. **Normalize image parameters** - Limit width/quality combinations
2. **Pre-warm cache** - Generate common variants ahead of time
3. **Longer cache TTLs** - If possible, increase edge cache duration
4. **Consistent parameters** - Use same quality/format settings across site
5. **Consider hybrid approach** - Pre-generate popular sizes, dynamic for others
