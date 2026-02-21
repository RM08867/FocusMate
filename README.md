# FocusMate 🧠

**A dyslexia-friendly reading assistant** that helps users customize their reading experience with adjustable fonts, spacing, colors, and letter highlighting.

Built for a hackathon to empower people with dyslexia to read more comfortably.

## ✨ Features

- **Font Customization** — Choose from 10 dyslexia-friendly fonts (including OpenDyslexic & Lexend)
- **Spacing Controls** — Adjustable font size, line spacing, letter spacing, and word spacing
- **Background & Text Colors** — Soft, warm color palettes designed for comfortable reading
- **Bold Starts** — Bolds the first half of each word to help anchor the eye
- **Vowel Coloring** — Highlights vowels to aid letter recognition
- **Confusing Letter Highlighting** — Color-codes easily confused letter pairs (b/d, p/q, m/n, etc.)
- **Live Preview** — All settings update in real-time

## 🛠 Tech Stack

- **React** + **Vite**
- **Tailwind CSS v4**
- **localStorage** for preference persistence

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📁 Project Structure

```
├── public/
│   └── dpref.json        # Default configuration & letter groups
├── source/               # Original source files
├── src/
│   ├── App.jsx           # Main FocusMate component
│   ├── index.css          # Tailwind + custom styles
│   └── main.jsx          # React entry point
├── index.html
├── vite.config.js
└── package.json
```

## 📝 License

MIT
