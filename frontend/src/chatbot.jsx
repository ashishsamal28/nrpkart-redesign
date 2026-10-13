
import { useState } from "react";
import "./Chatbot.css";

export default function Chatbot({ products = [], categories = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hi! 👋 Welcome to nRp Kart. How can I help you today?",
    },
  ]);

  function getReply(question) {
    const q = question.toLowerCase();

    if (
      q.includes("hello") ||
      q.includes("hi") ||
      q.includes("hey")
    ) {
      return "Hello! 😊 Welcome to nRp Kart. Ask me about notebooks, prices, categories, or availability.";
    }

    if (q.includes("category") || q.includes("categories")) {
      const names = categories.map((c) => c.name);
      return names.length
        ? `Our available categories are: ${names.join(", ")}. Visit the Shop section to explore them!`
        : "Visit our Shop section to explore notebook categories.";
    }

    if (q.includes("contact") || q.includes("support")) {
      return "You can visit the Contact section at the bottom of our website for more information.";
    }

    if (
      q.includes("stock") ||
      q.includes("available") ||
      q.includes("availability")
    ) {
      const available = products.filter((p) => Number(p.stock) > 0);
      return available.length
        ? `We currently have ${available.length} product(s) in stock. Check the Availability filter in the Shop section.`
        : "I couldn't find current stock information. Please check the Shop section.";
    }

    if (
      q.includes("cheap") ||
      q.includes("price") ||
      q.includes("cost") ||
      q.includes("budget")
    ) {
      const sorted = [...products].sort(
        (a, b) => Number(a.price) - Number(b.price)
      );

      if (!sorted.length) {
        return "Prices will be available once the product collection loads. Please check the Shop section.";
      }

      return `Our lowest-priced option is ${sorted[0].name} at ₹${sorted[0].price}. Browse the Shop section to compare prices.`;
    }

    if (
      q.includes("college") ||
      q.includes("exam") ||
      q.includes("study") ||
      q.includes("notebook") ||
      q.includes("product")
    ) {
      const matches = products.filter((p) =>
        `${p.name} ${p.category}`.toLowerCase().includes(
          q.includes("college") || q.includes("exam") || q.includes("study")
            ? "notebook"
            : q
        )
      );

      if (matches.length) {
        return `You might like ${matches
          .slice(0, 3)
          .map((p) => `${p.name} (₹${p.price})`)
          .join(", ")}. Visit the Shop section to explore.`;
      }

      return "We have different notebook options for everyday writing and study. Visit the Shop section and use the category and price filters to find your match.";
    }

    return "I can help you explore notebook categories, check prices, find products, and check stock. Try asking 'What are your prices?' or 'Show categories'.";
  }

  function sendMessage(text = input) {
    const question = text.trim();
    if (!question) return;

    const reply = getReply(question);

    setMessages((previous) => [
      ...previous,
      { sender: "user", text: question },
      { sender: "bot", text: reply },
    ]);

    setInput("");
  }

  return (
    <div className="chatbot">
      {isOpen && (
        <section className="chat-window">
          <header className="chat-header">
            <div className="chat-avatar">n</div>
            <div className="chat-heading">
              <strong>nRp Assistant</strong>
              <span>Shopping help · Online</span>
            </div>
            <button
              className="chat-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chatbot"
            >
              ×
            </button>
          </header>

          <div className="chat-messages" aria-live="polite">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`chat-message ${message.sender}`}
              >
                {message.text}
              </div>
            ))}
          </div>

          <div className="chat-suggestions">
            {["Show categories", "Check prices", "Check stock"].map(
              (suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                >
                  {suggestion}
                </button>
              )
            )}
          </div>

          <form
            className="chat-input-area"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about notebooks..."
              aria-label="Ask nRp Assistant"
            />
            <button type="submit" aria-label="Send message">
              ➤
            </button>
          </form>
        </section>
      )}

      <button
        className="chat-toggle"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? "×" : "✦"}
        {!isOpen && <span>Need help?</span>}
      </button>
    </div>
  );
}
