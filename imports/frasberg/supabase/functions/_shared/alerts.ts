// Alert and monitoring utilities for Supabase Edge Functions

/**
 * Send alert notification for errors
 */
export async function sendAlert(
  functionName: string,
  error: string,
  context?: Record<string, any>
): Promise<void> {
  const webhook = Deno.env.get("ALERT_WEBHOOK");
  
  if (!webhook) {
    console.error(`[${functionName}] Alert webhook not configured. Error:`, error);
    return;
  }

  try {
    await fetch(webhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        function: functionName,
        error,
        context,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (alertError) {
    console.error(`[${functionName}] Failed to send alert:`, alertError);
  }
}

/**
 * Log error to console and send alert
 */
export async function logAndAlert(
  functionName: string,
  error: Error | string,
  context?: Record<string, any>
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error(`[${functionName}] Error:`, errorMessage);
  if (errorStack) {
    console.error(`[${functionName}] Stack:`, errorStack);
  }

  await sendAlert(functionName, errorMessage, {
    ...context,
    stack: errorStack,
  });
}
