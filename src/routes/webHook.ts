import { Router } from "express";
import { handleWebhook } from "src/controller/webHook";

const webHookRouter = Router()

webHookRouter.post('/create', handleWebhook)


export default  webHookRouter