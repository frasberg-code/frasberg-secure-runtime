export function injectIdentity(req, res, next) {
  const owner = req.headers["x-owner-id"];
  if (!owner) return res.status(400).json({ error: "Missing owner identity" });

  req.owner = owner;
  next();
}
