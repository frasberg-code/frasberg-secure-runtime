import app from "./app";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🎭 Frasberg Platform running on port ${PORT}`);
  console.log(`✓ Governance: enabled`);
  console.log(`✓ Identity: enabled`);
  console.log(`✓ Continuity: enabled`);
  console.log(`✓ Diagnostics: enabled`);
  console.log(`✓ Policy: enabled`);
  console.log(`✓ Multi-Region: ${process.env.AWS_REGION || 'local'}`);
});
