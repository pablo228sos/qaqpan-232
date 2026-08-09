import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("browser model has aligned weights and honest metadata", () => {
  const model = JSON.parse(fs.readFileSync("public/model.json", "utf8"));
  assert.equal(model.model_type, "character TF-IDF + logistic regression");
  assert.equal(model.vocabulary.length, model.idf.length);
  assert.equal(model.vocabulary.length, model.coefficients.length);
  assert.ok(model.vocabulary.length > 1000);
  assert.ok(model.metrics.hybrid_f1 > 0.7);
  assert.match(model.metrics.limitation, /synthetic/i);
});
