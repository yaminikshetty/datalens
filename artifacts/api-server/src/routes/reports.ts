import { Router } from "express";
import { db } from "@workspace/db";
import { reportsTable, activityTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreateReportBody,
  UpdateReportBody,
  UpdateReportParams,
  DeleteReportParams,
  GetReportParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/reports", async (req, res) => {
  try {
    const rows = await db.select().from(reportsTable).orderBy(desc(reportsTable.createdAt));
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

router.post("/reports", async (req, res) => {
  try {
    const body = CreateReportBody.parse(req.body);
    const [report] = await db
      .insert(reportsTable)
      .values({
        title: body.title,
        description: body.description,
        type: body.type,
        category: body.category,
        data: body.data,
      })
      .returning();

    await db.insert(activityTable).values({
      type: "created",
      entityType: "report",
      entityId: report.id,
      description: `Created report "${report.title}"`,
    });

    res.status(201).json({
      ...report,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    });
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid request" });
  }
});

router.get("/reports/:id", async (req, res) => {
  try {
    GetReportParams.parse({ id: Number(req.params.id) });
    const [report] = await db
      .select()
      .from(reportsTable)
      .where(eq(reportsTable.id, Number(req.params.id)));
    if (!report) { res.status(404).json({ error: "Not found" }); return; }
    res.json({
      ...report,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/reports/:id", async (req, res) => {
  try {
    UpdateReportParams.parse({ id: Number(req.params.id) });
    const body = UpdateReportBody.parse(req.body);
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.type !== undefined) updates.type = body.type;
    if (body.category !== undefined) updates.category = body.category;
    if (body.data !== undefined) updates.data = body.data;

    const [report] = await db
      .update(reportsTable)
      .set(updates)
      .where(eq(reportsTable.id, Number(req.params.id)))
      .returning();
    if (!report) { res.status(404).json({ error: "Not found" }); return; }
    res.json({
      ...report,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    });
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid request" });
  }
});

router.delete("/reports/:id", async (req, res) => {
  try {
    DeleteReportParams.parse({ id: Number(req.params.id) });
    await db.delete(reportsTable).where(eq(reportsTable.id, Number(req.params.id)));
    res.status(204).send();
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
