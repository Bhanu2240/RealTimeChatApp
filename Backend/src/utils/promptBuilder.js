export const buildSmartReplyPrompt = (conversation) => {
  return `
You are generating Smart Reply suggestions for a messaging application.

The conversation below is ordered from oldest to newest.

The LAST message was sent by the Friend.

Your task is to generate exactly 3 replies that "Me" can send next.

Rules:
- Understand the entire conversation before replying.
- Reply ONLY to the last message.
- Keep replies short (2–10 words).
- Make them sound natural and human.
- Each reply should have a different tone:
  1. Friendly
  2. Casual
  3. Short/Quick
- Do NOT repeat the last message.
- Do NOT explain anything.
- Return ONLY a valid JSON array.

Conversation:
${conversation}

JSON:
`;
};