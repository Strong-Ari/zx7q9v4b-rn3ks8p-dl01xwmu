import * as fs from "node:fs";
import { render } from "@react-email/render";
import TikTokReport from "../src/email/TikTokReport";

async function preview() {
  const html = await render(
    TikTokReport({
      status: "Success",
      statusEmoji: "✅",
      workflow: "TikTok Workflow",
      repo: "my-repo",
      actor: "Ariel",
      sha: "abcd1234",
      runUrl: "https://github.com/my-repo/actions/runs/123456789",
    }),
  );

  fs.writeFileSync("preview.html", html);
  console.log("✅ preview.html généré !");
}

preview();
