import { messageRules } from "./config.js";
import { showMessage } from "./effects.js";
import { state } from "./state.js";

export function checkMessages() {
  for (const rule of messageRules) {
    if (state.seenMessages.includes(rule.id) || !rule.test(state)) continue;
    state.seenMessages.push(rule.id);
    showMessage(rule.text);
    break;
  }
}
