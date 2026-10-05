export function propagateIdentity(req, res, next) {
  req.headers["x-owner-id"] = req.owner;
  next();
}
