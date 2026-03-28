# Mind Diary → AI Chat with Memory Decay

## Goal

Strip Mind Diary down to a single-purpose AI chat where every message is an AtomChip that decays over time. Use the existing composer and AtomChip UI. Connect to Gemini API for AI responses.

## What to Keep

- Composer input (chat-like message sending)
- AtomChip component (for both user and AI messages)
- Exponential decay math (forgetting curve)
- Strengthening on click (stability multiplier growth)
- Progress bar on AtomChips (existing lifetime bar)
- Basic layout/shell

## What to Remove

Remove everything else that isn't needed for this flow:
- Molecules (all molecule logic, UI, grouping)
- Stories
- Blur and dim effects — only use **opacity** for decay visualization
- Media atoms (photos, maps, audio, etc.) — text only
- Atom editing
- Any linking/graph features
- Any settings, onboarding, or secondary screens
- Log2 multiplier
- Any features not listed in "What to Keep"

Do a full sweep of the codebase and delete dead code, unused components, unused state, unused utils after removing the above.

## Core Flow

1. User types in composer and sends
2. User's message appears as an AtomChip with strength 1.0
3. **Before the API call:** remove all AtomChips with strength below 0.3 — they are permanently deleted
4. Show a brief notification/toast to the user: something like "X faded memories forgotten" (only if any were removed)
5. Collect remaining AtomChips (strength ≥ 0.3) as conversation context
6. Send to Gemini API
7. AI response appears as a new AtomChip with strength 1.0 (visually distinguish AI chips from user chips — different color, alignment, or subtle label)
8. All chips begin decaying immediately

## Decay Math

Keep the exponential decay formula:

```
strength = e^(-t / stability)
```

- `t` = time since last interaction (use real clock time, in seconds)
- `stability` = base value, grows with reinforcement
- Recalculate on a short interval (every 500ms–1s) so decay is visually smooth
- Tune time scale so an unreinforced chip reaches ~0.3 in about 5–8 minutes (this is a demo — needs to be observable)

## Visual Decay

- **Opacity only.** Map strength directly to opacity: `opacity = max(strength, 0.08)`
- No blur, no dim, no color desaturation, no size changes
- Chips below 0.3 are visually very faint but still visible until the next send deletes them
- Remove any existing blur/dim CSS or logic

## Strengthening

- Click/tap an AtomChip → strengthen it:
  - Reset `lastInteractionTime` to now
  - Multiply `stability`: 1st time ×1.5, 2nd ×1.8, 3rd+ ×2.0
  - Increment `reinforcementCount`
- Brief visual feedback on click (subtle pulse or quick brightness flash)
- That's the only interaction — no long press, no swipe, no context menu

## Deletion on Send

- Deletion happens ONLY when the user sends a new message
- NOT during scrolling, NOT on a timer, NOT continuously
- Chips with strength < 0.3 at the moment of send are permanently removed from state
- Show a toast/notification: "{count} faded memories forgotten" — keep it brief, auto-dismiss after 2-3 seconds
- If nothing was removed, show no notification

## Gemini API Integration

Install the official Google GenAI SDK for JavaScript:
bash
npm install @google/generative-ai
 
Google AI for Developers
Google AI for Developers
Store the API key securely. While a .env file can be used for development, it's exposed on the frontend in a web app. For production, use a backend proxy or a service like Vertex AI in Firebase for secure implementation. 
DEV Community
DEV Community
 +4
Create a .env file in the root directory (e.g., .env.local for Vite).
Add the API key to the file (e.g., VITE_GEMINI_API_KEY="YOUR_API_KEY").
Step 3: Integrate the API in a React Component 
Create a function within a component to handle the API call.
jsx
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useState } from 'react';

const GeminiAIComponent = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Access the environment variable
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const generateContent = async () => {
    setIsLoading(true);
    setResponse(''); // Clear previous response
    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      // Select an appropriate model, e.g., "gemini-1.5-flash"
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      setResponse(text);
    } catch (error) {
      console.error("Error generating content:", error);
      setResponse("Failed to generate response.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim()) {
      generateContent();
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt"
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Send'}
        </button>
      </form>
      {response && (
        <div>
          <h3>AI Response:</h3>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
};

export default GeminiAIComponent;

## What the Screen Looks Like

- Top: small API key input (hides after key is entered, show a small "change key" link)
- Middle: scrollable feed of AtomChips (user chips and AI chips interleaved chronologically)
- Bottom: composer input with send button
- Toast notifications appear briefly when memories are forgotten
- Nothing else

## Post-Implementation

1. Verify decay is smooth and visible — chips should noticeably fade over a few minutes
2. Verify clicking a faded chip makes it bright again and it decays slower afterward
3. Verify sending a message removes chips below 0.3 and shows the toast
4. Verify the AI doesn't know about deleted chips — ask it about something from a deleted chip and confirm it doesn't remember
5. Verify strengthening a nearly-faded chip and then sending keeps it in context — AI should reference it
6. Verify no dead code from removed features (molecules, stories, blur, media, etc.) remains
7. Performance is fine with 30+ chips decaying simultaneously
