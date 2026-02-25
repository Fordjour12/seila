import { ConvexError } from "convex/values";
import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

export async function assertNoTaskDependencyCycle(
  ctx: MutationCtx,
  args: {
    taskId: Id<"tasks">;
    blockedByTaskId?: Id<"tasks">;
  },
) {
  const { taskId, blockedByTaskId } = args;
  if (!blockedByTaskId) return;
  if (taskId === blockedByTaskId) {
    throw new ConvexError("Task cannot be blocked by itself");
  }

  const visited = new Set<string>([String(taskId)]);
  let cursor: Id<"tasks"> | undefined = blockedByTaskId;
  for (let i = 0; i < 20 && cursor; i += 1) {
    const key = String(cursor);
    if (visited.has(key)) {
      throw new ConvexError("Dependency cycle detected");
    }
    visited.add(key);
    const doc = await ctx.db.get(cursor);
    if (!doc) break;
    cursor = doc.blockedByTaskId;
  }
}
