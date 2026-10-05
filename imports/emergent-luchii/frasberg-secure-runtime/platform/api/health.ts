export function health(req, res) {
  res.json({
    status: "ok",
    version: "v1",
    region: process.env.AWS_REGION
  });
}
