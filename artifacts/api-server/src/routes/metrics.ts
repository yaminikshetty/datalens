import { Router } from "express";
import { db } from "@workspace/db";
import {
  metricsTable,
  activityTable,
} from "@workspace/db";
import { eq, desc, sql, count } from "drizzle-orm";
import {
  CreateMetricBody,
  UpdateMetricBody,
  UpdateMetricParams,
  DeleteMetricParams,
  GetMetricParams,
  ListMetricsQueryParams,
  GetMetricsTrendsQueryParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/metrics", async (req, res) => {
  try {
    const query = ListMetricsQueryParams.safeParse(req.query);
    const metrics = await db
      .select()
      .from(metricsTable)
      .orderBy(desc(metricsTable.createdAt))
      .limit(query.success && query.data.limit ? Number(query.data.limit) : 100);

    const filtered = query.success && query.data.category
      ? metrics.filter((m) => m.category === query.data.category)
      : metrics;

    res.json(
      filtered.map((m) => ({
        ...m,
        value: Number(m.value),
        previousValue: m.previousValue != null ? Number(m.previousValue) : null,
        date: m.date.toISOString(),
        createdAt: m.createdAt.toISOString(),
      })),
    );
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/metrics/summary", async (req, res) => {
  try {
    const metrics = await db.select().from(metricsTable);
    const cats = [...new Set(metrics.map((m) => m.category))];
    const up = metrics.filter((m) => m.trend === "up").length;
    const down = metrics.filter((m) => m.trend === "down").length;
    const flat = metrics.filter((m) => m.trend === "flat").length;
    const avg =
      metrics.length > 0
        ? metrics.reduce((s, m) => s + Number(m.value), 0) / metrics.length
        : 0;

    const catCounts = cats.map((c) => ({
      cat: c,
      n: metrics.filter((m) => m.category === c).length,
    }));
    catCounts.sort((a, b) => b.n - a.n);

    res.json({
      totalMetrics: metrics.length,
      categoriesCount: cats.length,
      avgValue: Math.round(avg * 100) / 100,
      upTrendCount: up,
      downTrendCount: down,
      flatTrendCount: flat,
      topCategory: catCounts[0]?.cat ?? "",
    });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/metrics/trends", async (req, res) => {
  try {
    const params = GetMetricsTrendsQueryParams.safeParse(req.query);
    const days = params.success && params.data.days ? Number(params.data.days) : 30;

    const rows = await db
      .select({
        date: sql<string>`DATE(${metricsTable.date})::text`,
        category: metricsTable.category,
        value: sql<string>`AVG(${metricsTable.value}::numeric)`,
        count: count(),
      })
      .from(metricsTable)
      .where(sql`${metricsTable.date} >= NOW() - INTERVAL '${sql.raw(String(days))} days'`)
      .groupBy(sql`DATE(${metricsTable.date})`, metricsTable.category)
      .orderBy(sql`DATE(${metricsTable.date})`);

    const filtered =
      params.success && params.data.category
        ? rows.filter((r) => r.category === params.data.category)
        : rows;

    res.json(
      filtered.map((r) => ({
        date: r.date,
        category: r.category,
        value: Math.round(Number(r.value) * 100) / 100,
        count: Number(r.count),
      })),
    );
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/metrics/by-category", async (req, res) => {
  try {
    const metrics = await db.select().from(metricsTable);
    const cats = [...new Set(metrics.map((m) => m.category))];
    const result = cats.map((cat) => {
      const catMetrics = metrics.filter((m) => m.category === cat);
      const total = catMetrics.reduce((s, m) => s + Number(m.value), 0);
      return {
        category: cat,
        count: catMetrics.length,
        total: Math.round(total * 100) / 100,
        avg: Math.round((total / catMetrics.length) * 100) / 100,
        upCount: catMetrics.filter((m) => m.trend === "up").length,
        downCount: catMetrics.filter((m) => m.trend === "down").length,
      };
    });
    res.json(result);
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/metrics/:id", async (req, res) => {
  try {
    const params = GetMetricParams.parse({ id: Number(req.params.id) });
    const [metric] = await db
      .select()
      .from(metricsTable)
      .where(eq(metricsTable.id, params.id));
    if (!metric) { res.status(404).json({ error: "Not found" }); return; }
    res.json({
      ...metric,
      value: Number(metric.value),
      previousValue: metric.previousValue != null ? Number(metric.previousValue) : null,
      date: metric.date.toISOString(),
      createdAt: metric.createdAt.toISOString(),
    });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/metrics", async (req, res) => {
  try {
    const body = CreateMetricBody.parse(req.body);
    const [metric] = await db
      .insert(metricsTable)
      .values({
        name: body.name,
        value: String(body.value),
        previousValue: body.previousValue != null ? String(body.previousValue) : null,
        unit: body.unit,
        category: body.category,
        trend: body.trend,
        date: body.date ? new Date(body.date) : new Date(),
      })
      .returning();

    await db.insert(activityTable).values({
      type: "created",
      entityType: "metric",
      entityId: metric.id,
      description: `Created metric "${metric.name}"`,
    });

    res.status(201).json({
      ...metric,
      value: Number(metric.value),
      previousValue: metric.previousValue != null ? Number(metric.previousValue) : null,
      date: metric.date.toISOString(),
      createdAt: metric.createdAt.toISOString(),
    });
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid request" });
  }
});

router.patch("/metrics/:id", async (req, res) => {
  try {
    UpdateMetricParams.parse({ id: Number(req.params.id) });
    const body = UpdateMetricBody.parse(req.body);
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.value !== undefined) updates.value = String(body.value);
    if (body.previousValue !== undefined) updates.previousValue = body.previousValue != null ? String(body.previousValue) : null;
    if (body.unit !== undefined) updates.unit = body.unit;
    if (body.category !== undefined) updates.category = body.category;
    if (body.trend !== undefined) updates.trend = body.trend;
    if (body.date !== undefined) updates.date = new Date(body.date);

    const [metric] = await db
      .update(metricsTable)
      .set(updates)
      .where(eq(metricsTable.id, Number(req.params.id)))
      .returning();
    if (!metric) { res.status(404).json({ error: "Not found" }); return; }

    res.json({
      ...metric,
      value: Number(metric.value),
      previousValue: metric.previousValue != null ? Number(metric.previousValue) : null,
      date: metric.date.toISOString(),
      createdAt: metric.createdAt.toISOString(),
    });
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid request" });
  }
});

router.delete("/metrics/:id", async (req, res) => {
  try {
    DeleteMetricParams.parse({ id: Number(req.params.id) });
    await db.delete(metricsTable).where(eq(metricsTable.id, Number(req.params.id)));
    res.status(204).send();
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
