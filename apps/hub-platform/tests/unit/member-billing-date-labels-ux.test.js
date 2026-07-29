import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("member billing records render explicit date labels", () => {
  const billingSource = readFileSync(
    new URL("../../src/components/patterns/member-payments-workspace/MemberPaymentsWorkspace.jsx", import.meta.url),
    "utf8"
  );
  const adminHistorySource = readFileSync(
    new URL("../../src/components/patterns/admin-member-detail-workspace/MemberPaymentHistorySection.jsx", import.meta.url),
    "utf8"
  );

  assert.match(billingSource, /item\.dateLabelPrefix/);
  assert.match(billingSource, /`\$\{item\.dateLabelPrefix\}: `/);
  assert.match(adminHistorySource, /item\.dateLabelPrefix \|\| "Recorded date"/);
});
