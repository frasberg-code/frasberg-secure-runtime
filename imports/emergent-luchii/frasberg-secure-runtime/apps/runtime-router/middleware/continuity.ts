export function propagateContinuity(req, res, next) {
  req.headers["x-continuity-state"] = JSON.stringify(req.continuity);
  next();
}
