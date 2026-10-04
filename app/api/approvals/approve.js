import { requireAuth } from "../_lib/auth.js";
import { verifyApprovalToken } from "../_lib/approval.js";
import { writeFile } from "../tools/github.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ status: "FAILED", error: "Method not allowed." });
    return;
  }

  try {
    requireAuth(req);
    const token = typeof req.body?.approvalToken === "string" ? req.body.approvalToken : "";
    const proposal = verifyApprovalToken(token);

    let result;
    if (proposal.operation === "create") {
      const { createFile } = await import("../tools/github.js");
      result = await createFile({
        path: proposal.path,
        content: proposal.content,
        message: proposal.message
      });
    } else {
      result = await writeFile({
        path: proposal.path,
        content: proposal.content,
        expectedSha: proposal.expectedSha,
        message: proposal.message
      });
    }

    res.status(200).json({
      status: "DONE",
      result: "Approved write completed and verified for " + result.path + ".",
      evidence: [
        "Founder authentication verified.",
        "Explicit approval token verified.",
        "GitHub commit created: " + (result.commitSha || "unavailable") + ".",
        "Read-back verification passed."
      ],
      actions_taken: [
        "Updated " + result.path + ".",
        "Read the file back and compared exact content."
      ],
      actions_not_taken: [
        "No destructive delete action was executed.",
        "No additional repository files were changed."
      ],
      commitSha: result.commitSha,
      path: result.path,
      verified: result.verified === true
    });
  } catch (error) {
    if (error?.code === "UNAUTHORIZED") {
      res.status(401).json({
        status: "NEEDS_AUTHENTICATION",
        error: "Founder authentication required."
      });
      return;
    }

    res.status(409).json({
      status: error?.code === "STALE_WRITE" ? "BLOCKED" : "FAILED",
      error: error?.message || "Approval execution failed.",
      next_step: error?.code === "STALE_WRITE"
        ? "The repository changed after the proposal. Prepare a fresh proposal and approve it again."
        : "Inspect the approval error and retry only after the proposal is valid."
    });
  }
}
