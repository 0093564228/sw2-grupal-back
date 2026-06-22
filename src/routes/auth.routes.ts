import { Router } from "express";
import { authController, authMiddleware, roleMiddleware } from "../container";

const router = Router();

router.post(
  "/register",
  authMiddleware.authenticate,
  roleMiddleware.require("Admin"),
  authController.register,
);
router.post("/login", authController.login);

export default router;
