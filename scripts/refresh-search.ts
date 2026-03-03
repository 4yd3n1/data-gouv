import "dotenv/config";
import { prisma } from "../src/lib/db";

async function main() {
  console.log("Refreshing search index...");
  await prisma.$executeRaw`REFRESH MATERIALIZED VIEW search_index`;
  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
