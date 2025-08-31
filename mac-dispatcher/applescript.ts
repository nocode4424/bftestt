// mac-dispatcher/applescript.ts
// AppleScript template for sending messages via Messages.app

export interface MessageTemplateParams {
  message: string;
  phoneNumber: string;
}

/**
 * Creates an AppleScript command to send a message via Messages.app
 * @param params - The message and phone number to send to
 * @returns Escaped AppleScript command string
 */
export function createMessagesScript(params: MessageTemplateParams): string {
  // Escape double-quotes and backslashes for AppleScript inline string
  const escapedMessage = params.message
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
  
  const escapedPhoneNumber = params.phoneNumber
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');

  // AppleScript template for sending messages
  const script = `tell application "Messages" to send "${escapedMessage}" to buddy "${escapedPhoneNumber}" of service "E:*"`;
  
  return script;
}

/**
 * Alternative script template for sending to a specific contact by name
 * @param params - The message and contact name to send to
 * @returns Escaped AppleScript command string
 */
export function createMessagesScriptByContact(params: { message: string; contactName: string }): string {
  const escapedMessage = params.message
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
  
  const escapedContactName = params.contactName
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');

  // AppleScript template for sending to a contact by name
  const script = `tell application "Messages" to send "${escapedMessage}" to buddy "${escapedContactName}" of service "E:*"`;
  
  return script;
}

/**
 * Executes an AppleScript command using osascript
 * @param script - The AppleScript command to execute
 * @returns Promise that resolves when the script completes
 */
export async function executeAppleScript(script: string): Promise<void> {
  const process = new Deno.Command("osascript", {
    args: ["-e", script],
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout, stderr } = await process.output();

  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr);
    throw new Error(errorText || `osascript exited with code ${code}`);
  }

  const outputText = new TextDecoder().decode(stdout).trim();
  if (outputText) {
    console.log(`[applescript] Output: ${outputText}`);
  }
}
