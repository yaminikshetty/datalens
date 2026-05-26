import { Router } from "express";
import { db } from "@workspace/db";
import { kpiTargetsTable, activityTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreateKpiTargetBody,
  UpdateKpiTargetBody,
  UpdateKpiTargetParams,
  DeleteKpiTargetParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/kpi-targets", async (req, res) => {
  try {
    const rows = await db.select().from(kpiTargetsTable).orderBy(desc(kpiTargetsTable.createdAt));
    res.json(
      rows.map((r) => ({
        ...r,
        target: Number(r.target),
        current: Number(r.current),
        createdAt: r.createdAt.toISOString(),
      })),
    );
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/kpi-targets", async (req, res) => {
  try {
    const body = CreateKpiTargetBody.parse(req.body);
    const [kpi] = await db
      .insert(kpiTargetsTable)
      .values({
        name: body.name,
        target: String(body.target),
        current: String(body.current),
        unit: body.unit,
        category: body.category,
        status: body.status,
      })
      .returning();

    await db.insert(activityTable).values({
      type: "created",
      entityType: "kpi_target",
      entityId: kpi.id,
      description: `Created KPI target "${kpi.name}"`,
    });

    res.status(201).json({
      ...kpi,
      target: Number(kpi.target),
      current: Number(kpi.current),
      createdAt: kpi.createdAt.toISOString(),
    });
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid request" });
  }
});

router.patch("/kpi-targets/:id", async (req, res) => {
  try {
    UpdateKpiTargetParams.parse({ id: Number(req.params.id) });
    const body = UpdateKpiTargetBody.parse(req.body);
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.target !== undefined) updates.target = String(body.target);
    if (body.current !== undefined) updates.current = String(body.current);
    if (body.unit !== undefined) updates.unit = body.unit;
    if (body.category !== undefined) updates.category = body.category;
    if (body.status !== undefined) updates.status = body.status;

    const [kpi] = await db
      .update(kpiTargetsTable)
      .set(updates)
      .where(eq(kpiTargetsTable.id, Number(req.params.id)))
      .returning();
    if (!kpi) { res.status(404).json({ error: "Not found" }); return; }
    res.json({
      ...kpi,
      target: Number(kpi.target),
      current: Number(kpi.current),
      createdAt: kpi.createdAt.toISOString(),
    });
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid request" });
  }
});

router.delete("/kpi-targets/:id", async (req, res) => {
  try {
    DeleteKpiTargetParams.parse({ id: Number(req.params.id) });
    await db.delete(kpiTargetsTable).where(eq(kpiTargetsTable.id, Number(req.params.id)));
    res.status(204).send();
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
