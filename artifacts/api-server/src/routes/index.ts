import { Router, type IRouter } from "express";
import healthRouter from "./health";
import metricsRouter from "./metrics";
import dashboardsRouter from "./dashboards";
import reportsRouter from "./reports";
import kpiTargetsRouter from "./kpi_targets";
import activityRouter from "./activity";
import openaiChatRouter from "./openai_chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use(metricsRouter);
router.use(dashboardsRouter);
router.use(reportsRouter);
router.use(kpiTargetsRouter);
router.use(activityRouter);
router.use(openaiChatRouter);

export default router;
