/**
 * Synthetic user message sent only to /api/chat for the Buddy's first turn.
 * Never persisted to the database; the model treats it as "user has not typed yet".
 */
export const BUDDY_OPENING_USER_MESSAGE = "__BUDDY_OPENING__"
