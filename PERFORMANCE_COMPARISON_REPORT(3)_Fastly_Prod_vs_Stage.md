# Performance Comparison Report: Fastly Production vs Fastly Stage (with Shield POP)

**Test Date:** December 18, 2025  
**Test Environment:** Recharge News Frontpage  
**Purpose:** Evaluate the impact of adding Shield POP layer to Fastly Stage

---

## Executive Summary

This report compares the performance of **Fastly Production** (`image.dngroup.com`) with **2-tier architecture** against **Fastly Stage** (`image-stage.dngroup.com`) with the **newly configured 3-tier architecture (Shield POP added)**.

| Metric | Fastly Production (No Shield) | Fastly Stage (With Shield) | Winner |
|--------|-------------------------------|---------------------------|--------|
| **Avg Latency** | 238.29 ms | 244.34 ms | 🏆 Production (-2.5%) |
| **Median Latency** | 229.70 ms | 225.27 ms | 🏆 Stage (-1.9%) |
| **Min Latency** | 208.99 ms | 209.11 ms | ≈ Tie |
| **Max Latency** | 561.12 ms | 474.42 ms | 🏆 Stage (-15.5%) |
| **Avg Size** | 17.07 KB | 16.67 KB | 🏆 Stage (-2.3%) |
| **Cache Architecture** | 2-tier (Edge + Origin) | 3-tier (Edge + Shield + Origin) | Different |

**Result: Near Performance Parity** - Both architectures perform similarly, with trade-offs between consistency and average latency.

---

## Cache Architecture Comparison

### 🔴 Fastly Production: 2-Tier Architecture (No Shield)

```
┌──────────────┐     ┌──────────────┐
│   Client     │────▶│   Edge POP   │────▶ Origin
│  (Browser)   │     │   (Cache)    │
└──────────────┘     └──────────────┘
```

- **Cache Pattern:** `MISS, HIT` (consistent across all fetches)
- **Interpretation:** 
  - `MISS` = Edge POP cache miss
  - `HIT` = Content fetched from origin/upstream and served
- **Behavior:** Direct connection to origin on cache miss

### 🟢 Fastly Stage: 3-Tier Architecture (With Shield POP)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Client     │────▶│   Edge POP   │────▶│  Shield POP  │────▶ Origin
│  (Browser)   │     │   (Cache)    │     │   (Cache)    │
└──────────────┘     └──────────────┘     └──────────────┘
```

- **Cache Pattern:** `MISS, MISS, HIT` or `MISS, HIT, HIT` (varies)
- **Interpretation:**
  - 1st position: Edge POP status
  - 2nd position: Shield POP status  
  - 3rd position: Origin status
- **Behavior:** Shield POP acts as intermediate cache layer

---

## Test Configuration

| Parameter | Fastly Production | Fastly Stage |
|-----------|-------------------|--------------|
| **Image Domain** | `image.dngroup.com` | `image-stage.dngroup.com` |
| **Test Timestamp** | 2025-12-18T13:29:44 | 2025-12-18T13:09:02 |
| **Total Images** | 75 | 75 |
| **Fetch Count** | 3 per image | 3 per image |
| **Success Rate** | 100% (75/75) | 100% (75/75) |
| **Shield Configured** | ❌ No | ✅ Yes |

> **Note:** Both tests fetch from actual production/stage image servers. The localhost reference in Production test only indicates where the webpage was served from - the images are still fetched from `image.dngroup.com` production CDN.

---

## Latency Analysis

### Overall Statistics

| Metric | Fastly Production | Fastly Stage | Difference |
|--------|-------------------|--------------|------------|
| **Average** | 238.29 ms | 244.34 ms | +6.05 ms (+2.5%) |
| **Median** | 229.70 ms | 225.27 ms | -4.43 ms (-1.9%) |
| **Minimum** | 208.99 ms | 209.11 ms | +0.12 ms (≈0%) |
| **Maximum** | 561.12 ms | 474.42 ms | -86.70 ms (-15.5%) |

### Latency Distribution

| Range | Fastly Production | Fastly Stage |
|-------|-------------------|--------------|
| < 100ms | 0 (0%) | 0 (0%) |
| 100-200ms | 0 (0%) | 0 (0%) |
| 200-500ms | 74 (98.7%) | 75 (100%) |
| > 500ms | 1 (1.3%) | 0 (0%) |

### Analysis

- **Production wins on average latency** by ~6ms (238ms vs 244ms)
- **Stage wins on worst-case latency** by ~87ms (474ms vs 561ms)
- **Stage shows better consistency** - no images > 500ms
- The **Shield POP adds slight overhead** on average but **reduces outliers**

---

## Cache Behavior Deep Dive

### Production Cache Patterns (2-tier)

| Pattern | Meaning | Frequency |
|---------|---------|-----------|
| `MISS, HIT` | Edge miss, served from upstream | ~100% of requests |

**Observation:** All production images show consistent `MISS, HIT` pattern, indicating:
- Edge POP never has the content cached (fresh edge node)
- Content is being served from origin/backend directly
- High `age` values (e.g., 285,000+ seconds) suggest origin-level caching

### Stage Cache Patterns (3-tier with Shield)

| Pattern | Meaning | Frequency |
|---------|---------|-----------|
| `MISS, MISS, HIT` | Edge miss, Shield miss, Origin hit | Common (cold cache) |
| `MISS, HIT, HIT` | Edge miss, Shield hit | Some requests |
| `MISS, MISS, MISS` | Full miss (first request for new content) | Rare |

**Observation:** The 3-tier pattern shows:
- Edge POP typically misses (expected for first request)
- Shield POP sometimes hits (content cached at shield)
- Third position shows origin cache status

---

## Performance Variance Analysis

| Metric | Fastly Production | Fastly Stage |
|--------|-------------------|--------------|
| **Range (Max-Min)** | 352.13 ms | 265.31 ms |
| **Variance Ratio** | 2.68x | 2.27x |
| **Standard Deviation** | Higher | Lower |

**Key Finding:** The **Shield POP reduces performance variance**, providing more predictable response times even though it adds a small amount of average latency.

---

## Fastest & Slowest Images

### Fastest Images Comparison

| Rank | Production | Latency | Stage | Latency |
|------|------------|---------|-------|---------|
| 1 | `c2cf3e7409c40c71...` | 208.99 ms | `1617a234f9086381...` | 209.11 ms |
| 2 | `1617a234f9086381...` | 209.91 ms | `c2cf3e7409c40c71...` | 209.30 ms |
| 3 | `8e795e80f54d50a0...` | 212.52 ms | `fc0fee23fc526447...` | 211.25 ms |
| 4 | `702dda0e9f65e4b2...` | 212.52 ms | `5458031657f68401...` | 212.75 ms |
| 5 | `e33e51c5407286f2...` | 212.75 ms | `5534edd6f6cf18a6...` | 213.16 ms |

**Analysis:** Both environments have nearly **identical minimum latency** (~209ms), suggesting the same baseline network characteristics.

### Slowest Images Comparison

| Rank | Production | Latency | Stage | Latency |
|------|------------|---------|-------|---------|
| 1 | `07d6154be754b1d7...` | 561.12 ms | `bdf1090bc7d645d8...` | 474.42 ms |
| 2 | `04642ed458ad2ae9...` | 307.97 ms | `ef445a71a6b90086...` | 324.56 ms |
| 3 | `5969cd0bbf070426...` | 294.79 ms | `06c89fbfc72dcb7a...` | 307.84 ms |
| 4 | `be5ec46265da0966...` | 291.28 ms | `0aec000de7b09186...` | 298.83 ms |
| 5 | `cdabebbe809a063d...` | 289.58 ms | `dfffe72533057aec...` | 298.50 ms |

**Analysis:** Production's worst-case (561ms) is significantly higher than Stage's (474ms). The **Shield POP helps cap maximum latency**.

---

## Shield POP Impact Analysis

### Benefits of Shield POP (Stage)

1. **Reduced Tail Latency**
   - Max latency: 474ms (vs 561ms in Production)
   - **15.5% improvement** in worst-case scenarios
   - No images exceed 500ms threshold

2. **More Consistent Performance**
   - Tighter latency distribution
   - Lower variance ratio (2.27x vs 2.68x)
   - Better P99 performance expected

3. **Origin Protection**
   - Shield absorbs cache misses from multiple edge POPs
   - Reduces load on origin servers
   - Better for high-traffic scenarios

### Trade-offs of Shield POP (Stage)

1. **Slight Average Latency Increase**
   - Average: 244ms (vs 238ms in Production)
   - **+2.5% overhead** for the additional hop

2. **Additional Network Hop**
   - Request path: Client → Edge → Shield → Origin
   - Extra latency on cold cache scenarios

3. **Cache Complexity**
   - Three cache layers to manage
   - More complex debugging/troubleshooting

---

## Key Findings

### 1. Shield POP Trade-off is Favorable

| Aspect | Without Shield (Prod) | With Shield (Stage) |
|--------|----------------------|---------------------|
| **Average Latency** | 238.29 ms ✅ | 244.34 ms |
| **Max Latency** | 561.12 ms | 474.42 ms ✅ |
| **Consistency** | Lower | Higher ✅ |
| **Origin Protection** | None | Protected ✅ |

The **~6ms average overhead is acceptable** given the **~87ms improvement in worst-case latency** and better consistency.

### 2. Cache Architecture Difference is Clear

- **Production:** Simple 2-tier with `MISS, HIT` pattern
- **Stage:** Full 3-tier with `MISS, MISS, HIT` / `MISS, HIT, HIT` patterns
- Shield POP successfully added and functioning

### 3. Both Architectures Have Similar Floor Performance

- Minimum latency nearly identical (~209ms)
- Base network characteristics are the same
- Differences emerge in cache behavior and tail latency

---

## Recommendations

### For Production Environment

1. **Consider Adding Shield POP**
   - Would reduce maximum latency spikes
   - Better user experience consistency
   - Worth the ~6ms average overhead

2. **Monitor Tail Latency (P95, P99)**
   - Current architecture has higher outlier risk
   - Shield would cap these outliers

### For Stage Environment

1. **Shield POP is Working Correctly**
   - 3-tier cache pattern confirmed (`MISS, MISS, HIT`)
   - Performance trade-off is acceptable
   - Ready for production deployment

2. **Consider This Configuration for Production**
   - The slight average latency increase is negligible
   - Consistency benefits are significant

---

## Conclusion

| Criteria | Winner | Analysis |
|----------|--------|----------|
| **Average Latency** | 🏆 Production | 238ms vs 244ms (+2.5% for Stage) |
| **Consistency** | 🏆 Stage | No outliers > 500ms |
| **Worst-Case** | 🏆 Stage | 474ms vs 561ms (-15.5%) |
| **Architecture** | 🏆 Stage | 3-tier with Shield is more robust |

**Final Verdict:** The **Shield POP configuration (Stage) is recommended** for production deployment. The ~6ms average latency overhead is a worthwhile trade-off for:
- **15.5% better worst-case latency**
- **Elimination of 500ms+ outliers**
- **More consistent user experience**
- **Origin server protection**

The 3-tier architecture with Shield POP provides a more resilient and consistent CDN configuration suitable for production workloads.

---

*Report generated from test data collected on December 18, 2025*  
*Production test: 13:29 UTC | Stage test: 13:09 UTC*
