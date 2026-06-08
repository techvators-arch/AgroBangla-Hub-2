import { Router, type IRouter } from "express";
import healthRouter from "./health";
import statsRouter from "./stats";
import diseaseRouter from "./disease";
import diseaseImageRouter from "./disease-image";
import qaRouter from "./qa";
import fertilizerRouter from "./fertilizer";
import consultancyRouter from "./consultancy";
import cropsRouter from "./crops";
import marketplaceRouter from "./marketplace";
import krishokCardRouter from "./krishok_card";
import ordersRouter from "./orders";
import aiAssistantRouter from "./ai-assistant";
import iotRouter from "./iot";
import coldStorageRouter from "./cold-storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(statsRouter);
router.use(diseaseRouter);
router.use(diseaseImageRouter);
router.use(qaRouter);
router.use(fertilizerRouter);
router.use(consultancyRouter);
router.use(cropsRouter);
router.use(marketplaceRouter);
router.use(krishokCardRouter);
router.use(ordersRouter);
router.use(aiAssistantRouter);
router.use(iotRouter);
router.use(coldStorageRouter);

export default router;
