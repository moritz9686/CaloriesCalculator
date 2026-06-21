import jwt from "jsonwebtoken";

export default function auth(request, _response, next) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const error = new Error("Authentication required.");
    error.status = 401;
    return next(error);
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "development-secret");
    request.user = payload;
    return next();
  } catch (_error) {
    const error = new Error("Invalid or expired token.");
    error.status = 401;
    return next(error);
  }
}
