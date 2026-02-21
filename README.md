## README.md

# FocusMate

**Dyslexia-Friendly Reading Assistant**

FocusMate is a specialized reading tool designed to empower individuals with dyslexia by enhancing visual clarity through customizable text rendering. By providing anchors for the eyes and reducing visual stress, it helps users read with greater focus and less fatigue.

---

## 🚀 Tech Stack

* 
**Frontend:** React.js / Next.js (Tailwind CSS) 


* 
**State Management:** React Context API / Hooks 


* 
**Deployment:** Vercel 



---

## ✨ Features

* 
**Vowel Coloring:** Highlights vowels to help distinguish word structures.


* 
**Bold Starts:** Bolds the beginning of words to act as "anchors" for eye tracking.


* 
**Letter Pair Highlighting:** Specifically targets commonly confused letters like b/d, p/q, and m/n.


* 
**Customizable Typography:** Adjustable font sizing, line spacing, and specialized fonts like OpenDyslexic.


* 
**Color Overlays:** Change page background and text colors to reduce "visual snow" and glare.



---

## 📸 Screenshots

### 1. Font and Spacing Controls

Adjust font families, size, letter gaps, and word spacing for a personalized reading experience.
link: settings.png


### 2. Visual Overlays

Select from various background themes like Cream, Yellow, or Peach to improve readability.
link: colors.png


### 3. Dyslexia-Specific Highlights

Toggle specific letter-pair highlights to prevent letter flipping and confusion.
link: highlights.png

---

## 🎥 Demo Video

Watch the assistant in action here: https://drive.google.com/file/d/1hVymnEfqBAHgw7KGFhrqPQfT4GNXIRFW/view?usp=sharing 

---

## 🛠️ Installation & Setup

**Installation Commands:**

```bash
npm install
[cite_start]``` [cite: 14]

**Run Commands:**
```bash
npm run dev
[cite_start]``` [cite: 15]

---

## 🏗️ Architecture
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

---

## 👥 Team Members
* Pavithra L Kumar
* Rose Maria Benny

---

## 📄 License
[cite_start]This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details[cite: 21].

---

[cite_start]**Would you like me to generate a `LICENSE` file or a `.gitignore` to complete your project root requirements?** [cite: 5, 7]

```
