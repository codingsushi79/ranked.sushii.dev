import { config } from "dotenv";

config({ path: ".env.local" });

import {
  countRankedData,
  resetAllRankedData,
} from "../src/lib/reset-ranked-data";

async function main() {
  const before = await countRankedData();
  console.log("Before reset:", before);

  const result = await resetAllRankedData();
  const after = await countRankedData();

  console.log("Reset complete:", result);
  console.log("After reset:", after);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
