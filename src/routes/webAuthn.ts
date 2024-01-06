import {
  registrationOptions,
  verifyRegistration,
  webauthLoginVerification,
  webauthloginOptions,
} from "../handlers/webAuthn";
import { asyncMiddleware } from "../middleware/asyncmiddleware";
import { Router } from "express";
const webauthnRouter = Router();

webauthnRouter.post(
  "/registration-options/:id",
  asyncMiddleware(registrationOptions)
);
webauthnRouter.post(
  "/verify-registration",
  asyncMiddleware(verifyRegistration)
);
webauthnRouter.post("/login-options/:id", asyncMiddleware(webauthloginOptions));
webauthnRouter.post(
  "/login-verification",
  asyncMiddleware(webauthLoginVerification)
);

export default webauthnRouter;
