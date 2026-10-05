export function propagatePolicy(req, res, next) {
  req.headers["x-policy"] = JSON.stringify(req.policy);
  next();
}
