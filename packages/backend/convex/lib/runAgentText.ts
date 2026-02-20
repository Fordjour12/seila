import type { Thread } from "@convex-dev/agent";
import type { ToolSet } from "ai";

type AgentTextResult = {
  text: string;
};

export async function runAgentText(
  thread: Thread<ToolSet>,
  prompt: string,
): Promise<AgentTextResult> {
  const generateText = thread.generateText as unknown as (args: { prompt: string }) => Promise<AgentTextResult>;
  return generateText({ prompt });
}
