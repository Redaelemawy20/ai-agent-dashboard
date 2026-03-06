import { getSandboxStatus } from "@/lib/sandbox/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sandboxId = searchParams.get("sandboxId");

  if (!sandboxId) {
    return Response.json(
      { error: "sandboxId required" },
      { status: 400 }
    );
  }

  const result = await getSandboxStatus(sandboxId);
  if (!result) {
    return Response.json({ status: "not_found" });
  }
  return Response.json(result);
}
