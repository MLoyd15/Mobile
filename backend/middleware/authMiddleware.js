import jwt from "jsonwebtoken";

/**
 * Middleware to protect routes using JWT
 * Attaches normalized req.user with _id, id, userId, email, and role
 */
export function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Normalize user ID (controllers check for _id or id)
    const uid = decoded.id || decoded._id || decoded.sub || decoded.userId;

    req.user = {
      _id: uid,             // Mongoose-style
      id: uid,              // generic id
      userId: uid,          // legacy field
      email: decoded.email, // if your token includes it
      role: decoded.role || "user", // default to "user"
    };

    next();
  } catch (err) {
    console.error("AUTH_ERROR:", err.message);
    return res.status(401).json({ message: "Unauthorized" });
  }
}

/**
 * Optional role-based guard
 * Usage: router.get("/admin-only", authMiddleware, allowRoles("admin"), handler)
 */
export function allowRoles(...roles) {
  return (req, res, next) => {
    const role = String(req.user?.role || "").toLowerCase();
    if (!roles.map(r => String(r).toLowerCase()).includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}