const EMAIL = /[^\s@<>()]+@[^\s@<>()]+\.[a-z]{2,}/gi;

// Logs and events keep content without contact details (path-to-production.md).
export const redactContacts = (text: string) => text.replace(EMAIL, "[email]");
