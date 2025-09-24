import Cart from "../models/Cart.js";
import Order from "../models/Order.js";

/* ---------------- Admin/Service: create order for any user (optional) ---------------- */
export const createOrder = async (req, res) => {
  try {
    const order = await Order.create(req.body);
    if (req.body?.userId) {
      await Cart.deleteOne({ userId: String(req.body.userId) });
    }
    res.status(201).json(order);
  } catch (err) {
    console.error("CREATE_ORDER_ERROR:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

/* ---------------- Admin/Service: list orders of a specific user (optional) ----------- */
export const getOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ userId: String(userId) })
      .sort({ createdAt: -1 })
      .populate("items.productId", "name price category");
    res.status(200).json(orders);
  } catch (err) {
    console.error("GET_ORDERS_ERROR:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

/* ---------------- Authenticated: create order for current user ---------------------- */
export const createMyOrder = async (req, res) => {
  try {
    const me = req.user?.userId;
    if (!me) return res.status(401).json({ message: "Unauthorized" });

    const order = await Order.create({ ...req.body, userId: String(me) });
    await Cart.deleteOne({ userId: String(me) });

    res.status(201).json(order);
  } catch (err) {
    console.error("CREATE_MY_ORDER_ERROR:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

/* ---------------- Authenticated: list my orders ------------------------------------- */
export const getMyOrders = async (req, res) => {
  try {
    const me = req.user?.userId;
    if (!me) return res.status(401).json({ message: "Unauthorized" });

    const orders = await Order.find({ userId: String(me) })
      .sort({ createdAt: -1 })
      .populate("items.productId", "name price category");
    res.status(200).json(orders);
  } catch (err) {
    console.error("GET_MY_ORDERS_ERROR:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

/* ---------------- Deliveries list (admin/driver/user) --------------------------------
   Filters:
   ?status=pending|assigned|in-transit|completed|cancelled
   ?type=pickup|in-house|third-party  (if you store deliveryType)
   ?driverId=<id>                      (if you store driverId)
   ?mine=1                             (only current user's orders)
   ?from=YYYY-MM-DD&to=YYYY-MM-DD      (createdAt range)
--------------------------------------------------------------------------------------- */
export const listDelivery = async (req, res) => {
  try {
    const { status, type, driverId, mine, from, to } = req.query;

    const q = {};
    if (status) q.status = status;
    if (type) q.deliveryType = type;
    if (driverId) q.driverId = String(driverId);
    if (mine === "1" && req.user?.userId) q.userId = String(req.user.userId);

    if (from || to) {
      q.createdAt = {};
      if (from) q.createdAt.$gte = new Date(from);
      if (to) q.createdAt.$lte = new Date(to);
    }

    const deliveries = await Order.find(q)
      .sort({ createdAt: -1 })
      .select("userId items total address status deliveryType driverId createdAt")
      .lean();

    res.status(200).json(deliveries);
  } catch (err) {
    console.error("LIST_DELIVERY_ERROR:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

/* ---------------- Aliases to match route imports ------------------------------------ */
export { getMyOrders as listMyOrders, getOrders as listOrders };

