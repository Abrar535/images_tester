# 📊 Image Server Performance Comparison Report (2)

## DNGroup Image Server vs Fastly Image Optimizer
**Date:** December 18, 2025  
**Test Environment:** Stage Recharge News Frontpage (stage.rechargenews.com)  
**Measurement Method:** 3 fetches per image with 100ms delay

---

## 🎯 Executive Summary

| Metric | DNGroup (media-stage) | Fastly IO (image-stage) | Difference | Winner |
|--------|----------------------|-------------------------|------------|--------|
| **Average Latency** | 290.26 ms | 244.34 ms | -45.92 ms (-15.8%) | 🏆 **Fastly** |
| **Median Latency** | 275.23 ms | 225.27 ms | -49.96 ms (-18.2%) | 🏆 **Fastly** |
| **Min Latency** | 227.35 ms | 209.11 ms | -18.24 ms (-8.0%) | 🏆 **Fastly** |
| **Max Latency** | 521.24 ms | 474.42 ms | -46.82 ms (-9.0%) | 🏆 **Fastly** |
| **Avg Image Size** | 12.40 KB | 16.67 KB | +4.27 KB (+34%) | 🏆 DNGroup |
| **Total Size** | 929.86 KB | 1,250.18 KB | +320.32 KB (+34%) | 🏆 DNGroup |
| **Total Images** | 75 | 75 | 0 | Tie |

---

## 🔥 KEY FINDING: Fastly is Significantly Faster!

In this test run, **Fastly IO outperforms DNGroup in latency by 15-18%** while DNGroup maintains its advantage in image compression (34% smaller files).

---

## 📈 Performance Analysis

### Latency Comparison (Visual)

```
                    Average Latency Comparison
                    
DNGroup:  ██████████████████████████████████████████████ 290.26 ms
Fastly:   ████████████████████████████████████████ 244.34 ms
                                                   
          0        100       200       300       400 ms
```

```
                    Median Latency Comparison
                    
DNGroup:  ████████████████████████████████████████████ 275.23 ms
Fastly:   ████████████████████████████████████ 225.27 ms
                                                   
          0        100       200       300       400 ms
```

```
                    Min/Max Latency Range
                    
DNGroup:  |-------[================================]-----| 227-521 ms
Fastly:   |-----[============================]----------| 209-474 ms
          
          0        200       400       600       800 ms
```

### Key Observations

1. **Latency Performance:** Fastly is significantly faster
   - **15.8% faster average latency** (244.34 ms vs 290.26 ms)
   - **18.2% faster median latency** (225.27 ms vs 275.23 ms)
   - **8% faster minimum latency** (209.11 ms vs 227.35 ms)
   - **9% faster maximum latency** (474.42 ms vs 521.24 ms)

2. **Image Size:** DNGroup produces smaller images
   - **34% smaller average file size** (12.40 KB vs 16.67 KB)
   - **320 KB less total data transfer** for the same 75 images

---

## 📊 Latency Distribution

| Latency Range | DNGroup | Fastly | Notes |
|---------------|---------|--------|-------|
| < 100ms | 0 | 0 | No fast responses |
| 100-200ms | 0 | 0 | No responses in this range |
| 200-500ms | 74 (98.7%) | 75 (100%) | Majority of images |
| > 500ms | 1 (1.3%) | 0 (0%) | DNGroup has one slow outlier |

**Interpretation:** Fastly has all images in the 200-500ms range with no outliers, while DNGroup has one slow image exceeding 500ms.

---

## 🚀 Fastest Images Comparison

### Top 5 Fastest - DNGroup
| Rank | Latency | Size | Performance |
|------|---------|------|-------------|
| 1 | 227.35 ms | 2.57 KB | ⚡ Very Good |
| 2 | 230.15 ms | 3.30 KB | ⚡ Very Good |
| 3 | 235.79 ms | 6.73 KB | ⚡ Good |
| 4 | 239.06 ms | 6.58 KB | ⚡ Good |
| 5 | 241.35 ms | 6.12 KB | ⚡ Good |

### Top 5 Fastest - Fastly
| Rank | Latency | Size | Performance |
|------|---------|------|-------------|
| 1 | 209.11 ms | 5.10 KB | ⚡ **Excellent** |
| 2 | 209.30 ms | 6.28 KB | ⚡ **Excellent** |
| 3 | 211.25 ms | 8.73 KB | ⚡ **Excellent** |
| 4 | 212.75 ms | 10.38 KB | ⚡ **Excellent** |
| 5 | 213.16 ms | 9.62 KB | ⚡ **Excellent** |

**Analysis:**
- Fastly's fastest images are **~18ms quicker** (209ms vs 227ms)
- DNGroup's fastest images are **~2x smaller** (2.57 KB vs 5.10 KB)
- Fastly achieves sub-215ms consistently for its fastest images

---

## 🐌 Slowest Images Comparison

### Top 5 Slowest - DNGroup
| Rank | Latency | Size | Issue |
|------|---------|------|-------|
| 1 | 521.24 ms | 19.21 KB | ⚠️ Significant delay |
| 2 | 488.74 ms | 47.88 KB | ⚠️ Large image |
| 3 | 447.23 ms | 53.83 KB | ⚠️ Large image |
| 4 | 385.96 ms | 29.59 KB | ⚠️ Medium |
| 5 | 373.05 ms | 29.06 KB | ⚠️ Medium |

### Top 5 Slowest - Fastly
| Rank | Latency | Size | Issue |
|------|---------|------|-------|
| 1 | 474.42 ms | 29.39 KB | ⚠️ First image cold start |
| 2 | 324.56 ms | 12.38 KB | ⚠️ Minor delay |
| 3 | 307.84 ms | 10.62 KB | ⚠️ Minor delay |
| 4 | 298.83 ms | 7.78 KB | ✅ Acceptable |
| 5 | 298.50 ms | 50.01 KB | ✅ Large but fast |

**Analysis:**
- DNGroup's worst case (521ms) is 47ms slower than Fastly's worst (474ms)
- DNGroup has 3 images over 400ms vs only 1 for Fastly
- Fastly's slowest images (except #1) are under 325ms
- DNGroup struggles more with large images

---

## 🔄 Cache Behavior Analysis

### DNGroup (media-stage.dngroup.com)
**Cache Pattern:** `MISS, MISS, HIT` (consistent)
```
All 3 fetches: MISS, MISS, HIT
```
- ✅ Consistent pattern across all images
- ⚠️ Edge AND Shield both miss
- ✅ Only origin layer hits

### Fastly IO (image-stage.dngroup.com)
**Cache Patterns (based on previous test):**
- `MISS, MISS, MISS` → `MISS, MISS, HIT` (cold start warming)
- `MISS, HIT, HIT` (shield cached)

**Cache Consistency:**
| Behavior | DNGroup | Fastly |
|----------|---------|--------|
| Consistent pattern | ✅ Yes | ⚠️ Variable |
| Edge cache hits | ❌ No | ❌ No |
| Shield cache hits | ❌ No | ⚠️ Some |

---

## 📦 Size Efficiency Analysis

### Compression Comparison
| Metric | DNGroup | Fastly | Savings |
|--------|---------|--------|---------|
| Average Size | 12.40 KB | 16.67 KB | **34% smaller** |
| Total Transfer | 929.86 KB | 1,250.18 KB | **320 KB saved** |
| Smallest Image | 2.57 KB | 5.10 KB | **50% smaller** |
| Largest Image | 53.83 KB | 50.01 KB | 7.6% larger |

### Size vs Latency Trade-off
```
                    Size vs Latency Trade-off
                    
           Latency (ms)
           |
    300    |  ● DNGroup (290ms, 12.4KB)
           |
    250    |                    ● Fastly (244ms, 16.7KB)
           |
    200    |
           |___________________________________
              10KB      15KB      20KB     Size
              
    DNGroup: Slower but smaller files
    Fastly:  Faster but larger files
```

---

## 📊 Statistical Summary

### Performance Metrics Table

| Statistic | DNGroup | Fastly | Delta | % Change |
|-----------|---------|--------|-------|----------|
| Mean Latency | 290.26 ms | 244.34 ms | **-45.92 ms** | **-15.8%** |
| Median Latency | 275.23 ms | 225.27 ms | **-49.96 ms** | **-18.2%** |
| Min Latency | 227.35 ms | 209.11 ms | -18.24 ms | -8.0% |
| Max Latency | 521.24 ms | 474.42 ms | -46.82 ms | -9.0% |
| Mean Size | 12.40 KB | 16.67 KB | **+4.27 KB** | **+34.4%** |
| Total Size | 929.86 KB | 1250.18 KB | +320.32 KB | +34.4% |
| Images > 500ms | 1 | 0 | -1 | -100% |

---

## 🏆 Final Verdict

### Performance Score Card

| Category | DNGroup | Fastly | Winner |
|----------|---------|--------|--------|
| Average Latency | 290.26 ms | 244.34 ms | 🏆 **Fastly (+15.8%)** |
| Median Latency | 275.23 ms | 225.27 ms | 🏆 **Fastly (+18.2%)** |
| Best Case (Min) | 227.35 ms | 209.11 ms | 🏆 **Fastly (+8.0%)** |
| Worst Case (Max) | 521.24 ms | 474.42 ms | 🏆 **Fastly (+9.0%)** |
| **Image Size** | 12.40 KB | 16.67 KB | 🏆 **DNGroup (+34%)** |
| Consistency | ⚠️ 1 outlier | ✅ No outliers | 🏆 Fastly |
| Latency Variance | Higher | Lower | 🏆 Fastly |

### Overall Winner: 🏆 **Fastly IO**

**Reasoning:**
1. **15-18% faster latency** - Significant performance improvement
2. **No outliers** - All images under 500ms
3. **More consistent performance** - Lower variance in response times
4. **Trade-off:** 34% larger files, but still acceptable sizes

---

## 📈 Comparison with Previous Test

| Metric | Test 1 (localhost) | Test 2 (stage) | Change |
|--------|-------------------|----------------|--------|
| DNGroup Avg | 290.26 ms | 290.26 ms | Same |
| Fastly Avg | 286.21 ms | 244.34 ms | **-41.87 ms (15% faster)** |
| Latency Winner | ~Tie | **Fastly** | Fastly improved |
| Size Winner | DNGroup | DNGroup | Consistent |

**Key Insight:** Fastly's performance improved significantly in the second test, likely due to:
- Warmer cache (previous test warmed the cache)
- Different network conditions
- Reduced cold-start issues

---

## 📋 Recommendations

### For DNGroup Team:
1. ⚠️ **Investigate latency gap** - Now 46ms slower than Fastly
2. ⚠️ **Address the 521ms outlier** - Impacts user experience
3. ✅ **Compression is excellent** - 34% smaller files is significant
4. 🔍 **Consider cache optimization** - `MISS, MISS, HIT` pattern indicates issues

### For Fastly Migration:
1. ✅ **Latency is now superior** - 15-18% faster than DNGroup
2. ✅ **No outliers** - Consistent sub-500ms performance
3. ⚠️ **Optimize image compression** - 34% larger files increase bandwidth
4. ✅ **Ready for production consideration** - Performance is strong

---

## 🎯 Business Impact Analysis

### Latency Impact (per page load with 75 images)
| Metric | DNGroup | Fastly | Savings |
|--------|---------|--------|---------|
| Total Latency | 21,770 ms | 18,326 ms | **3,444 ms faster** |
| User Perceived | Slower | Faster | Better UX |

### Bandwidth Impact (per page load with 75 images)
| Metric | DNGroup | Fastly | Cost |
|--------|---------|--------|------|
| Total Size | 929.86 KB | 1,250.18 KB | **+320 KB** |
| Monthly (1M views) | ~929 GB | ~1,250 GB | +321 GB |

### Trade-off Decision:
- **Choose Fastly if:** Speed is priority, bandwidth cost is acceptable
- **Choose DNGroup if:** Bandwidth cost is critical, can accept slower loads

---

## 📁 Data Sources

- **DNGroup Results:** `dngroup_image_performance_stage_recharge_frontpage(18th_dec).json`
- **Fastly Results:** `(2)fastly_image_performance_stage_recharge_frontpage(18th_dec).json`
- **Test URL:** `https://stage.rechargenews.com/` (Stage Environment)
- **Measurement Method:** Node.js HTTPS module with `performance.now()`
- **Fetch Count:** 3 requests per image with 100ms delay

---

*Report Generated: December 18, 2025*  
*Tool: Image Latency Measurement Tool v1.0*  
*Test Run: #2 (Stage Environment)*
