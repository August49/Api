import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
  createNewUser,
  currentUser,
  getUser,
  resendEmailVerification,
  resetPassword,
  sendPasswordResetLink,
  signIn,
  signOut,
  verifyEmail,
} from "../handlers/users";
import { asyncMiddleware } from "../middleware/asyncmiddleware";
import { auth, crsfAuth } from "../auth";
import { emailVerified } from "../util/emailVerified";

const router = Router();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      message: "Too many requests from this IP, please try again later.",
    });
  },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message:
    "Too many login attempts from this IP, please try again after 15 minutes",
});

router.post("/newUser", asyncMiddleware(createNewUser));
router.get("/verifyEmail/:token", asyncMiddleware(verifyEmail));
router.post(
  "/resendEmailVerification",
  limiter,
  asyncMiddleware(resendEmailVerification)
);

router.post("/signIn", loginLimiter, asyncMiddleware(signIn));
router.post("/me", auth, emailVerified, asyncMiddleware(currentUser));
router.post("/options", emailVerified, asyncMiddleware(getUser));
router.post("/signOut", auth, emailVerified, asyncMiddleware(signOut));
router.post(
  "/sendPasswordResetLink",
  emailVerified,
  asyncMiddleware(sendPasswordResetLink)
);
router.post(
  "/resetPassword/:token",
  emailVerified,
  asyncMiddleware(resetPassword)
);

export default router;
