import Product from "../models/Products.js";

// List all products
export const listProducts = async (req, res, next) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (e) {
    next(e);
  }
};

// Get single product with reviews
export const getProduct = async (req, res, next) => {
  try {
    const p = await Product.findById(req.params.id).populate("reviews.userId", "name email");
    if (!p) return res.status(404).json({ error: "Not found" });
    res.json(p);
  } catch (e) {
    next(e);
  }
};

// Create new product
export const createProduct = async (req, res, next) => {
  try {
    const created = await Product.create(req.body);
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
};

// Update product
export const updateProduct = async (req, res, next) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (e) {
    next(e);
  }
};

// Delete product
export const deleteProduct = async (req, res, next) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};

// --- Reviews ---
export const addReview = async (req, res, next) => {
  try {
    const { rating, comment, imageUrls } = req.body;
    const userId = req.user?.userId; // assumes auth middleware sets req.user

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ message: "Rating 1-5 required" });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.reviews.unshift({ userId, rating, comment, imageUrls });
    await product.save();

    const populated = await Product.findById(req.params.id).populate("reviews.userId", "name email");
    res.status(201).json(populated);
  } catch (e) {
    next(e);
  }
};

// Get all reviews by current user
export const getMyReviews = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const products = await Product.find({ "reviews.userId": userId })
      .select("name reviews")
      .populate("reviews.userId", "name email");

    // flatten reviews
    const myReviews = [];
    products.forEach((p) => {
      p.reviews.forEach((r) => {
        if (String(r.userId?._id) === String(userId)) {
          myReviews.push({
            productId: p._id,
            productName: p.name,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt,
          });
        }
      });
    });

    res.json(myReviews);
  } catch (e) {
    next(e);
  }
};

