import { Router } from "express";
import {
  addReview,
  createProduct,
  deleteProduct,
  getMyReviews,
  getProduct,
  listProducts,
  updateProduct,
} from "../controllers/productController.js";
import { authMiddleware } from "../middleware/authMiddleware.js"; // you need to have this

const router = Router();

router.get("/", listProducts);
router.get("/:id", getProduct);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);
router.get("/my/reviews", authMiddleware, getMyReviews);

// Reviews
router.post("/:id/reviews", authMiddleware, addReview);

export default router;

