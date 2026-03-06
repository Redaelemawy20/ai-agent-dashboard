export async function killDesktopApi(sandboxId: string): Promise<void> {
  try {
    await fetch(
      `/api/kill-desktop?sandboxId=${encodeURIComponent(sandboxId)}`,
      { method: "POST" }
    );
  } catch (e) {
    console.error("Failed to kill desktop:", e);
  }
}

export async function getSandboxStatusApi(
  sandboxId: string
): Promise<{ status: string } | null> {
  try {
    const res = await fetch(
      `/api/sandbox-status?sandboxId=${encodeURIComponent(sandboxId)}`
    );
    if (!res.ok) return null;
    return (await res.json()) as { status: string };
  } catch {
    return null;
  }
}
