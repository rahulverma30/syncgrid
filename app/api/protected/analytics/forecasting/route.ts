import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AnalyticsSnapshot } from '@/models';
import { analyticsCache } from '@/lib/cache/analyticsCache';

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const body = await request.json();

    const {
      metricName = 'revenue',
      timelineMonths = 6,
      confidenceInterval = 95,
      forecastMethod = 'holt-winters', // 'ols' | 'holt-winters'
    } = body;

    // 1. Enterprise Cache Retrieval Lookup
    const cacheQueryObj = { metricName, timelineMonths, confidenceInterval, forecastMethod };
    const cachedForecast = await analyticsCache.get<any>(companyId, 'forecasting', cacheQueryObj);

    if (cachedForecast) {
      console.log(
        `[OBSERVABILITY] Cache HIT for mathematical predictive forecasting - Tenant: ${companyId}`
      );
      return NextResponse.json({
        success: true,
        data: cachedForecast.data,
        meta: cachedForecast.meta,
      });
    }

    console.log(
      `[OBSERVABILITY] Cache MISS for predictive forecasting. Recalculating equations - Tenant: ${companyId}`
    );

    // Fetch the past 6 months of consolidated snapshots to construct baseline progression
    const snapshots = await AnalyticsSnapshot.find({ companyId })
      .sort({ snapshotDate: 1 })
      .limit(6);

    const baselineData: any[] = [];
    let seedRevenue = 32000;
    let seedHours = 480;

    // Seed mock baseline historical coordinates if snapshot db is still unpopulated
    if (snapshots.length === 0) {
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        baselineData.push({
          label: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
          value: metricName === 'revenue' ? seedRevenue : seedHours,
          isForecast: false,
        });
        seedRevenue += 2000 + Math.floor(Math.random() * 3000);
        seedHours += 20 + Math.floor(Math.random() * 35);
      }
    } else {
      snapshots.forEach((snap) => {
        const monthLabel = new Date(snap.snapshotDate).toLocaleString('default', {
          month: 'short',
          year: 'numeric',
        });
        baselineData.push({
          label: monthLabel,
          value: metricName === 'revenue' ? snap.revenueTotal : snap.billableHours,
          isForecast: false,
        });
      });
    }

    const n = baselineData.length;

    // 2. Anomaly Detection Pipeline (Flag coordinates further than 2 standard deviations)
    const values = baselineData.map((d) => d.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const sqDiffSum = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
    const stdDevVal = Math.sqrt(sqDiffSum / n) || 1;

    baselineData.forEach((d) => {
      // Flag as anomaly if deviation exceeds 2.0x standard error boundaries
      const deviation = Math.abs(d.value - mean);
      if (deviation > 2.0 * stdDevVal) {
        d.isAnomaly = true;
        console.warn(
          `[OBSERVABILITY] Anomaly detected in historical baseline snapshots. Metric: ${metricName}, Value: ${d.value}, Deviation: ${(deviation / stdDevVal).toFixed(2)}x`
        );
      } else {
        d.isAnomaly = false;
      }
    });

    const forecasts: any[] = [];
    let growthRate = 0;
    const lastHistoricalVal = baselineData[n - 1].value;
    const now = new Date();

    const zScore = confidenceInterval === 99 ? 2.576 : confidenceInterval === 95 ? 1.96 : 1.645;
    const stdDev = metricName === 'revenue' ? 1800 : 35; // baseline standard errors

    // CASE A: Holt-Winters Double Exponential Smoothing Strategy
    if (forecastMethod === 'holt-winters') {
      const alpha = 0.5; // level factor
      const beta = 0.3; // trend factor

      let L = baselineData[0].value;
      let T = baselineData[1].value - baselineData[0].value;

      // Recursive smoothing through baseline series
      for (let i = 1; i < n; i++) {
        const Y = baselineData[i].value;
        const prevL = L;
        L = alpha * Y + (1 - alpha) * (L + T);
        T = beta * (L - prevL) + (1 - beta) * T;
      }

      // Generate future smoothed projections
      for (let i = 1; i <= timelineMonths; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const label = date.toLocaleString('default', { month: 'short', year: 'numeric' });

        // Forecast equation: F_{t+k} = L_t + k * T_t
        const predictedValue = Math.max(0, L + i * T);
        const intervalBand = zScore * stdDev * Math.sqrt(i);
        const upperConfidence = predictedValue + intervalBand;
        const lowerConfidence = Math.max(0, predictedValue - intervalBand);

        forecasts.push({
          label,
          value: Number(predictedValue.toFixed(0)),
          lowerBound: Number(lowerConfidence.toFixed(0)),
          upperBound: Number(upperConfidence.toFixed(0)),
          isForecast: true,
        });
      }
      growthRate = Number(((T / lastHistoricalVal) * 100).toFixed(2));
    }
    // CASE B: Standard Ordinary Least Squares (OLS) Linear Regression Strategy
    else {
      let sumX = 0;
      let sumY = 0;
      let sumXY = 0;
      let sumXX = 0;

      for (let i = 0; i < n; i++) {
        const y = baselineData[i].value;
        sumX += i;
        sumY += y;
        sumXY += i * y;
        sumXX += i * i;
      }

      const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) || 500;
      const c = (sumY - m * sumX) / n || baselineData[n - 1].value;

      for (let i = 1; i <= timelineMonths; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const label = date.toLocaleString('default', { month: 'short', year: 'numeric' });

        const predictedValue = Math.max(0, m * (n + i - 1) + c);
        const intervalBand = zScore * stdDev * Math.sqrt(i);
        const upperConfidence = predictedValue + intervalBand;
        const lowerConfidence = Math.max(0, predictedValue - intervalBand);

        forecasts.push({
          label,
          value: Number(predictedValue.toFixed(0)),
          lowerBound: Number(lowerConfidence.toFixed(0)),
          upperBound: Number(upperConfidence.toFixed(0)),
          isForecast: true,
        });
      }
      growthRate = Number(((m / lastHistoricalVal) * 100).toFixed(2));
    }

    // Combine historical timelines and forecasted timelines
    const combinedTimelines = [
      ...baselineData.map((item) => ({
        label: item.label,
        actual: item.value,
        isForecast: false,
        isAnomaly: item.isAnomaly,
      })),
      ...forecasts.map((item) => ({
        label: item.label,
        projected: item.value,
        lower: item.lowerBound,
        upper: item.upperBound,
        isForecast: true,
      })),
    ];

    const meta = {
      metricName,
      timelineMonths,
      confidenceInterval,
      forecastMethod,
      growthRate,
    };

    // Store in caching layer for 10 minutes
    await analyticsCache.set(
      companyId,
      'forecasting',
      cacheQueryObj,
      { data: combinedTimelines, meta },
      600
    );

    return NextResponse.json({
      success: true,
      data: combinedTimelines,
      meta,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'FORECAST_FAILED', message: error.message },
      { status: 500 }
    );
  }
});
