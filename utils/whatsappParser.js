const systemPatterns = [
  /^<media omitted>$/i,
  /^this message was deleted$/i,
  /messages and calls are end-to-end encrypted/i,
  /^you (created|added|changed|left)/i,
];

const bracket = /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s+[APap][Mm])?)\]\s+([^:]+):\s*(.*)$/;
const dash = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s+[APap][Mm])?)\s+-\s+([^:]+):\s*(.*)$/;

const normalize = (value = "") => value.replace(/[\u202f\u00a0]/g, " ").replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
const isSystemMessage = (text) => systemPatterns.some((pattern) => pattern.test(text.trim()));

export const parseWhatsAppChat = (rawText) => {
  const messages = [];
  for (const rawLine of rawText.replace(/\r\n?/g, "\n").split("\n")) {
    const line = normalize(rawLine);
    const match = line.match(bracket) || line.match(dash);
    if (match) {
      const [, date, time, sender, text] = match;
      if (!isSystemMessage(text)) messages.push({ date, time, sender: normalize(sender), text: text.trim() });
    } else if (messages.length && line) {
      messages[messages.length - 1].text += `\n${line}`;
    }
  }
  const participants = Object.values(messages.reduce((all, { sender }) => {
    all[sender] = (all[sender] || 0) + 1;
    return all;
  }, {})).length;
  const senderCounts = Object.entries(messages.reduce((all, { sender }) => ({ ...all, [sender]: (all[sender] || 0) + 1 }), {}))
    .map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  return { messages, participants: senderCounts, messageCount: messages.length, participantCount: participants };
};

export const buildPersonaChunks = (messages, targetSender) => {
  const turns = [];
  for (const message of messages) {
    const previous = turns[turns.length - 1];
    if (previous?.sender === message.sender) previous.text += `\n${message.text}`;
    else turns.push({ ...message });
  }
  return turns.flatMap((turn, index) => {
    if (turn.sender !== targetSender || !turn.text.trim()) return [];
    const context = turns.slice(Math.max(0, index - 3), index)
      .map((item) => `${item.sender}: ${item.text}`).join("\n");
    return [{ id: `${index}`, text: `Context:\n${context || "(conversation starts)"}\n\n${targetSender}: ${turn.text}`, response: turn.text }];
  });
};
