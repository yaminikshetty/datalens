import { Router } from "express";
import { db } from "@workspace/db";
import {
  dashboardsTable,
  metricsTable,
  reportsTable,
  kpiTargetsTable,
  activityTable,
} from "@workspace/db";
import { eq, desc, gte, sql } from "drizzle-orm";
import {
  CreateDashboardBody,
  UpdateDashboardBody,
  UpdateDashboardParams,
  DeleteDashboardParams,
  GetDashboardParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/dashboards/overview", async (req, res) => {
  try {
    const [dashCount] = await db.select({ c: sql<number>`count(*)` }).from(dashboardsTable);
    const [metricCount] = await db.select({ c: sql<number>`count(*)` }).from(metricsTable);
    const [reportCount] = await db.select({ c: sql<number>`count(*)` }).from(reportsTable);
    const [kpiCount] = await db.select({ c: sql<number>`count(*)` }).from(kpiTargetsTable);

    const kpis = await db.select().from(kpiTargetsTable);
    const healthyKpis = kpis.filter((k) => k.status === "on_track" || k.status === "achieved").length;
    const kpiHealthPct = kpis.length > 0 ? Math.round((healthyKpis / kpis.length) * 100) : 0;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [recentMetrics] = await db
      .select({ c: sql<number>`count(*)` })
      .from(metricsTable)
      .where(gte(metricsTable.createdAt, sevenDaysAgo));

    const metrics = await db.select().from(metricsTable);
    const cats = [...new Set(metrics.map((m) => m.category))];
    const catCounts = cats.map((c) => ({
      cat: c,
      n: metrics.filter((m) => m.category === c).length,
    }));
    catCounts.sort((a, b) => b.n - a.n);

    res.json({
      totalDashboards: Number(dashCount.c),
      totalMetrics: Number(metricCount.c),
      totalReports: Number(reportCount.c),
      totalKpiTargets: Number(kpiCount.c),
      kpiHealthPct,
      recentMetricsCount: Number(recentMetrics.c),
      topPerformingCategory: catCounts[0]?.cat ?? "",
    });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboards", async (req, res) => {
  try {
    const rows = await db.select().from(dashboardsTable).orderBy(desc(dashboardsTable.createdAt));
    res.json(
      rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    );
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/dashboards", async (req, res) => {
  try {
    const body = CreateDashboardBody.parse(req.body);
    const [dashboard] = await db
      .insert(dashboardsTable)
      .values({ name: body.name, description: body.description })
      .returning();

    await db.insert(activityTable).values({
      type: "created",
      entityType: "dashboard",
      entityId: dashboard.id,
      description: `Created dashboard "${dashboard.name}"`,
    });

    res.status(201).json({
      ...dashboard,
      createdAt: dashboard.createdAt.toISOString(),
      updatedAt: dashboard.updatedAt.toISOString(),
    });
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid request" });
  }
});

router.get("/dashboards/:id", async (req, res) => {
  try {
    GetDashboardParams.parse({ id: Number(req.params.id) });
    const [dashboard] = await db
      .select()
      .from(dashboardsTable)
      .where(eq(dashboardsTable.id, Number(req.params.id)));
    if (!dashboard) { res.status(404).json({ error: "Not found" }); return; }
    res.json({
      ...dashboard,
      createdAt: dashboard.createdAt.toISOString(),
      updatedAt: dashboard.updatedAt.toISOString(),
    });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/dashboards/:id", async (req, res) => {
  try {
    UpdateDashboardParams.parse({ id: Number(req.params.id) });
    const body = UpdateDashboardBody.parse(req.body);
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;

    const [dashboard] = await db
      .update(dashboardsTable)
      .set(updates)
      .where(eq(dashboardsTable.id, Number(req.params.id)))
      .returning();
    if (!dashboard) { res.status(404).json({ error: "Not found" }); return; }
    res.json({
      ...dashboard,
      createdAt: dashboard.createdAt.toISOString(),
      updatedAt: dashboard.updatedAt.toISOString(),
    });
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid request" });
  }
});

router.delete("/dashboards/:id", async (req, res) => {
  try {
    DeleteDashboardParams.parse({ id: Number(req.params.id) });
    await db.delete(dashboardsTable).where(eq(dashboardsTable.id, Number(req.params.id)));
    res.status(204).send();
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
