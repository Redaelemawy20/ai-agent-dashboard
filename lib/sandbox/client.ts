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
