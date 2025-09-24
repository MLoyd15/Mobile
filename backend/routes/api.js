const router = express.Router();

/**
 * Small helper: pick the first existing function name from a controller.
 * If none is found, respond with 500 so it's easy to see what's missing.
 */
/*const asHandler = (ctrl, ...names) => {
  const fn =
    (ctrl && names.map(n => ctrl[n]).find(f => typeof f === "function")) ||
    (ctrl?.default && names.map(n => ctrl.default[n]).find(f => typeof f === "function"));

  if (!fn) {
    const list = [
      ...Object.keys(ctrl || {}),
      ...(ctrl?.default ? Object.keys(ctrl.default) : []),
    ];
    return (_req, res) =>
      res.status(500).json({
        error:
          "Controller function not found. Tried: " +
          names.join(", ") +
          ". Available: " +
          list.join(", "),
      });
  }
  // Ensure standard Express signature
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
};

/* ---------- Auth ---------- */
// POST /api/register
/*router.post("/register", asHandler(auth, "register", "signup", "createUser"));
// POST /api/login
router.post("/login", asHandler(auth, "login", "signin", "authenticate"));

/* ---------- Products ---------- */
// GET /api/products
/*router.get(
  "/products",
  asHandler(productCtrl, "getProducts", "listProducts", "index")
);
// (optional) POST /api/products
router.post(
  "/products",
  asHandler(productCtrl, "createProduct", "create", "addProduct")
);

/* ---------- Cart ---------- */
// GET /api/cart/:userId
/*router.get(
  "/cart/:userId",
  asHandler(cartCtrl, "getCart", "readCart", "getUserCart")
);
// POST /api/cart  (body: { userId, items })
router.post(
  "/cart",
  asHandler(cartCtrl, "setCart", "updateCart", "saveCart")
);

/* ---------- Orders ---------- */
// GET /api/orders/:userId
/*router.get(
  "/orders/:userId",
  asHandler(orderCtrl, "getOrders", "listOrders", "getUserOrders")
);
// POST /api/orders
router.post(
  "/orders",
  asHandler(orderCtrl, "createOrder", "placeOrder", "create")
);

export default router;
*/ 