// middleware/authMiddleware.js
import jwt from "jsonwebtoken";

export function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId: decoded.sub,
      email: decoded.email,
    };

    next();
  } catch (err) {
    console.error("AUTH_ERROR:", err.message);
    return res.status(401).json({ message: "Unauthorized" });
  }
}
