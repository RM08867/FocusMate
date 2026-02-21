import React, { useState, useEffect, useMemo } from 'react';

/**
 * FocusMate
 * A dyslexia-friendly reading assistant with customizable settings.
 * Tabbed interface: Settings, Colors, Highlights.
 * Features: Live Preview, Bold Starts, Vowel Coloring, Letter Pair Highlighting.
 */

const COLOR_VALUES = {
  'soft-cream': '#FEF9E7',
  'off-white': '#FAF9F6',
  'pastel-yellow': '#FFEE8C',
  'light-blue': '#EBF5FB',
  'light-peach': '#FDF2E9',
  'black': '#1A1A1A',
  'dark-blue': '#00008B',
  'dark-brown': '#5D4037',
  'muted-green': '#2D6A4F',
  'warm-brown': '#A44A3F',
  'soft-purple': '#6D597A',
  'soft-blue': '#4E9FD1'
};

const COLOR_LABELS = {
  'soft-cream': 'Cream',
  'off-white': 'Off-White',
  'pastel-yellow': 'Yellow',
  'light-blue': 'Blue',
  'light-peach': 'Peach',
  'black': 'Black',
  'dark-blue': 'Navy',
  'dark-brown': 'Brown'
};

const FALLBACK_CONFIG = {
  "font": ["Arial", "Verdana", "Tahoma", "Century Gothic", "Trebuchet MS", "Calibri", "Open Sans", "Comic Sans MS", "OpenDyslexic", "Lexend"],
  "font_size": { "min": 12, "recommended": 16, "max": 26 },
  "letter_spacing": { "min": 0, "recommended": 0.1, "max": 0.5 },
  "word_spacing": { "min": 0, "recommended": 0.2, "max": 1.0 },
  "line_spacing": { "min": 1.0, "recommended": 1.5, "max": 3.0 },
  "background_color": ["soft-cream", "off-white", "pastel-yellow", "light-blue", "light-peach"],
  "foreground_color": ["black", "dark-blue", "dark-brown"],
  "letter_highlighting": {
    "default_highlight_colors": {
      "vowels": "soft-blue",
      "mirror_letters1": "muted-green",
      "mirror_letters2": "warm-brown",
      "similar_shapes1": "soft-purple",
      "similar_shapes2": "soft-blue",
      "similar_shapes3": "muted-green",
      "thin_vertical1": "warm-brown",
      "thin_vertical2": "soft-purple",
      "tail_letters": "soft-blue",
      "similar_numbers": "muted-green"
    }
  },
  "confusing_letter_groups": {
    "mirror_letters1": ["b", "d"],
    "mirror_letters2": ["p", "q"],
    "similar_shapes1": ["m", "n"],
    "similar_shapes2": ["o", "u"],
    "similar_shapes3": ["c", "e"],
    "thin_vertical1": ["i", "j"],
    "thin_vertical2": ["l", "t"],
    "tail_letters": ["g", "y"],
    "similar_numbers": ["6", "9"]
  },
  "user_preferences": {
    "font": "Open Sans",
    "font_size": 16,
    "line_spacing": 1.5,
    "letter_spacing": 0.1,
    "word_spacing": 0.2,
    "background_color": "soft-cream",
    "text_color": "black",
    "active_modes": ["bold_starts"],
    "active_letter_groups": ["mirror_letters1"]
  }
};

const GROUP_LABELS = {
  mirror_letters1: { label: 'Mirrors', desc: 'b ↔ d' },
  mirror_letters2: { label: 'Mirrors', desc: 'p ↔ q' },
  similar_shapes1: { label: 'Similar', desc: 'm ↔ n' },
  similar_shapes2: { label: 'Similar', desc: 'o ↔ u' },
  similar_shapes3: { label: 'Similar', desc: 'c ↔ e' },
  thin_vertical1: { label: 'Thin', desc: 'i ↔ j' },
  thin_vertical2: { label: 'Thin', desc: 'l ↔ t' },
  tail_letters: { label: 'Tail', desc: 'g ↔ y' },
  similar_numbers: { label: 'Numbers', desc: '6 ↔ 9' }
};

const App = () => {
  const [activeTab, setActiveTab] = useState('settings');
  const [config, setConfig] = useState(null);
  const [prefs, setPrefs] = useState(FALLBACK_CONFIG.user_preferences);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        let data = FALLBACK_CONFIG;
        try {
          const response = await fetch('/dpref.json');
          if (response.ok) data = await response.json();
        } catch {
          console.warn("Using fallback config.");
        }
        setConfig(data);

        const saved = localStorage.getItem('focusMatePrefs');
        if (saved) setPrefs(JSON.parse(saved));
        else setPrefs(data.user_preferences);
      } catch {
        setConfig(FALLBACK_CONFIG);
      }
    };
    loadConfig();
  }, []);

  const savePrefs = (newPrefs) => {
    setPrefs(newPrefs);
    localStorage.setItem('focusMatePrefs', JSON.stringify(newPrefs));
  };

  const toggleList = (currentList = [], item) => {
    const list = [...currentList];
    const index = list.indexOf(item);
    if (index > -1) list.splice(index, 1);
    else list.push(item);
    return list;
  };

  const processedSampleText = useMemo(() => {
    if (!config) return "";
    const sample = "FocusMate helps you read with clarity. Notice how b and d are highlighted, or how the vowels a, e, i, o, u can be colored. Bold anchors help your eyes stay on track.";

    const activeModes = prefs.active_modes || [];
    const activeGroups = prefs.active_letter_groups || [];
    const groups = config.confusing_letter_groups;
    const vowelColor = COLOR_VALUES[config.letter_highlighting.default_highlight_colors.vowels] || COLOR_VALUES['soft-blue'];

    return sample.split(/(\s+)/).map((word, wordIdx) => {
      if (/^\s+$/.test(word)) return word;

      const processChars = (segment, isBold = false) => {
        const chars = segment.split('').map((char, charIdx) => {
          const lower = char.toLowerCase();

          let groupKey = "";
          for (const key of activeGroups) {
            if (groups[key]?.includes(lower)) {
              groupKey = key;
              break;
            }
          }

          const isVowel = activeModes.includes('vowel_coloring') && 'aeiou'.includes(lower);

          if (groupKey) {
            const colorKey = config.letter_highlighting.default_highlight_colors[groupKey];
            const color = COLOR_VALUES[colorKey] || '#2563eb';
            return <span key={charIdx} style={{ color, borderBottom: `2px dashed ${color}`, fontWeight: 700 }}>{char}</span>;
          }

          if (isVowel) {
            return <span key={charIdx} style={{ color: vowelColor, fontWeight: 600 }}>{char}</span>;
          }

          return char;
        });

        return isBold ? <b key="bold-part">{chars}</b> : <span key="normal-part">{chars}</span>;
      };

      if (activeModes.includes('bold_starts') && word.length > 1) {
        const mid = Math.ceil(word.length / 2);
        return <span key={wordIdx}>{processChars(word.slice(0, mid), true)}{processChars(word.slice(mid), false)}</span>;
      }

      return <span key={wordIdx}>{processChars(word, false)}</span>;
    });
  }, [config, prefs.active_letter_groups, prefs.active_modes]);

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-amber-800 font-semibold text-lg animate-pulse">Initializing FocusMate...</div>
      </div>
    );
  }

  const tabs = [
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'colors', label: 'Colors', icon: '🎨' },
    { id: 'highlights', label: 'Highlights', icon: '✨' }
  ];

  return (
    <div className="w-full max-w-[640px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-amber-100/50 font-[Inter,sans-serif] mx-auto text-slate-800"
      style={{ boxShadow: '0 25px 60px -12px rgba(139, 92, 42, 0.15), 0 0 0 1px rgba(255, 248, 235, 0.5)' }}>

      {/* ── Header ── */}
      <div className="px-8 pt-7 pb-4 bg-gradient-to-br from-amber-50 to-orange-50/30">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-lg shadow-md">
            F
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-amber-900 tracking-tight leading-tight">FocusMate</h1>
            <p className="text-[10px] text-amber-600/70 font-medium tracking-wide uppercase">Dyslexia-Friendly Reading Assistant</p>
          </div>
        </div>
      </div>

      {/* ── Live Preview ── */}
      <section
        className="px-8 py-6 border-y border-amber-100/60 transition-all duration-300"
        style={{
          backgroundColor: COLOR_VALUES[prefs.background_color] || '#FFFFFF',
          color: COLOR_VALUES[prefs.text_color] || '#000000'
        }}
      >
        <div className="mb-3 flex justify-between items-center">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Live Preview</span>
          <div className="flex gap-1.5">
            {prefs.active_modes?.map(m => (
              <span key={m} className="px-2 py-0.5 bg-amber-500/15 rounded-full text-[8px] font-bold text-amber-700 uppercase tracking-wider">
                {m.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
        <div
          style={{
            fontFamily: prefs.font,
            fontSize: `${prefs.font_size}px`,
            lineHeight: prefs.line_spacing,
            letterSpacing: `${prefs.letter_spacing}em`,
            wordSpacing: `${prefs.word_spacing}em`
          }}
          className="transition-all duration-200 leading-relaxed"
        >
          {processedSampleText}
        </div>
      </section>

      {/* ── Tab Navigation ── */}
      <header className="px-8 pt-5 pb-0 flex items-center justify-between border-b border-amber-100/40">
        <div className="flex gap-6 items-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3.5 border-b-[3px] font-bold text-[11px] tracking-widest uppercase transition-all flex items-center gap-1.5 ${activeTab === tab.id
                  ? 'border-amber-500 text-amber-900'
                  : 'border-transparent text-slate-400 hover:text-slate-500'
                }`}
            >
              <span className="text-sm">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        <button
          id="reset-btn"
          onClick={() => savePrefs(config.user_preferences)}
          className="pb-3.5 text-red-400 font-bold text-[10px] tracking-widest uppercase flex items-center gap-1 hover:text-red-600 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Reset
        </button>
      </header>

      {/* ── Main Content ── */}
      <main className="p-8 h-[420px] overflow-y-auto">

        {/* Typography Settings */}
        {activeTab === 'settings' && (
          <div className="space-y-10">
            <section>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Font Family</label>
              <div className="grid grid-cols-2 gap-2.5">
                {config.font.map((f) => (
                  <button
                    key={f}
                    id={`font-${f.replace(/\s+/g, '-').toLowerCase()}`}
                    onClick={() => savePrefs({ ...prefs, font: f })}
                    style={{ fontFamily: f }}
                    className={`p-3.5 rounded-xl border-2 text-left text-sm transition-all duration-200 ${prefs.font === f
                        ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold shadow-sm shadow-amber-100'
                        : 'border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50/50'
                      }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5">Spacing Controls</label>
              <div className="grid grid-cols-2 gap-x-10 gap-y-8">
                <ControlSlider label="Font Size" value={prefs.font_size} min={config.font_size.min} max={config.font_size.max} unit="px" onChange={(v) => savePrefs({ ...prefs, font_size: v })} />
                <ControlSlider label="Line Spacing" value={prefs.line_spacing} min={config.line_spacing.min} max={config.line_spacing.max} step={0.1} onChange={(v) => savePrefs({ ...prefs, line_spacing: v })} />
                <ControlSlider label="Letter Gap" value={prefs.letter_spacing} min={0} max={0.5} step={0.01} onChange={(v) => savePrefs({ ...prefs, letter_spacing: v })} />
                <ControlSlider label="Word Gap" value={prefs.word_spacing} min={config.word_spacing.min} max={config.word_spacing.max} step={0.05} onChange={(v) => savePrefs({ ...prefs, word_spacing: v })} />
              </div>
            </section>
          </div>
        )}

        {/* Color Palette */}
        {activeTab === 'colors' && (
          <div className="space-y-12">
            <section>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5">Page Background</label>
              <div className="flex gap-4 flex-wrap">
                {config.background_color.map(c => (
                  <button
                    key={c}
                    id={`bg-${c}`}
                    onClick={() => savePrefs({ ...prefs, background_color: c })}
                    className={`group flex flex-col items-center gap-2 transition-all duration-200 ${prefs.background_color === c ? 'scale-110' : 'hover:scale-105'
                      }`}
                  >
                    <div
                      className={`w-14 h-14 rounded-2xl border-[3px] transition-all shadow-sm ${prefs.background_color === c
                          ? 'border-amber-600 shadow-lg shadow-amber-200/50'
                          : 'border-slate-200/60 group-hover:border-slate-300'
                        }`}
                      style={{ backgroundColor: COLOR_VALUES[c] }}
                    />
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${prefs.background_color === c ? 'text-amber-700' : 'text-slate-400'
                      }`}>
                      {COLOR_LABELS[c] || c}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5">Text Color</label>
              <div className="flex gap-4 flex-wrap">
                {config.foreground_color.map(c => (
                  <button
                    key={c}
                    id={`text-${c}`}
                    onClick={() => savePrefs({ ...prefs, text_color: c })}
                    className={`group flex flex-col items-center gap-2 transition-all duration-200 ${prefs.text_color === c ? 'scale-110' : 'hover:scale-105'
                      }`}
                  >
                    <div
                      className={`w-14 h-14 rounded-2xl border-[3px] transition-all shadow-sm ${prefs.text_color === c
                          ? 'border-amber-600 shadow-lg shadow-amber-200/50'
                          : 'border-slate-200/60 group-hover:border-slate-300'
                        }`}
                      style={{ backgroundColor: COLOR_VALUES[c] }}
                    />
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${prefs.text_color === c ? 'text-amber-700' : 'text-slate-400'
                      }`}>
                      {COLOR_LABELS[c] || c}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Special Highlights */}
        {activeTab === 'highlights' && (
          <div className="space-y-10">
            <section>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Reading Modes</label>
              <div className="grid grid-cols-2 gap-3">
                {['vowel_coloring', 'bold_starts'].map(mode => (
                  <button
                    key={mode}
                    id={`mode-${mode}`}
                    onClick={() => savePrefs({ ...prefs, active_modes: toggleList(prefs.active_modes, mode) })}
                    className={`p-5 rounded-2xl border-2 font-bold text-left flex justify-between items-center transition-all duration-200 ${prefs.active_modes?.includes(mode)
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600 border-amber-600 text-white shadow-lg shadow-amber-200/40'
                        : 'border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-200'
                      }`}
                  >
                    <span>
                      {mode === 'vowel_coloring' ? '🔤 Vowel Coloring' : '🔠 Bold Starts'}
                    </span>
                    {prefs.active_modes?.includes(mode) && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Letter Pair Highlights</label>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(config.confusing_letter_groups).map(([key, letters]) => {
                  const isActive = prefs.active_letter_groups?.includes(key);
                  const colorKey = config.letter_highlighting.default_highlight_colors[key];
                  const hex = COLOR_VALUES[colorKey] || '#d97706';
                  const info = GROUP_LABELS[key] || { label: key, desc: letters.join(' ') };

                  return (
                    <button
                      key={key}
                      id={`group-${key}`}
                      onClick={() => savePrefs({ ...prefs, active_letter_groups: toggleList(prefs.active_letter_groups, key) })}
                      style={{
                        backgroundColor: isActive ? hex : 'white',
                        borderColor: isActive ? hex : '#f1f5f9',
                        color: isActive ? 'white' : hex
                      }}
                      className={`p-4 rounded-2xl border-2 font-black text-center transition-all duration-200 flex flex-col items-center justify-center gap-1 shadow-sm ${isActive ? 'shadow-lg scale-[1.02]' : 'hover:bg-amber-50/50 hover:scale-[1.01]'
                        }`}
                    >
                      <span className="text-lg tracking-wider">{letters.join('  ')}</span>
                      <span className={`text-[8px] font-medium uppercase tracking-wider ${isActive ? 'opacity-70' : 'opacity-50'}`}>
                        {info.desc}
                      </span>
                      {isActive && (
                        <svg className="w-3.5 h-3.5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="px-8 pb-6 pt-2">
        <div className="bg-gradient-to-r from-amber-50/60 to-orange-50/40 p-4 rounded-2xl border border-amber-100/50 text-center">
          <p className="text-[10px] text-amber-700/50 font-medium italic">
            FocusMate — Empowering reading through visual clarity
          </p>
        </div>
      </footer>
    </div>
  );
};

const ControlSlider = ({ label, value, min, max, step = 1, unit = '', onChange }) => (
  <div className="space-y-2.5">
    <div className="flex justify-between items-center">
      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{label}</label>
      <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-full tabular-nums">
        {value}{unit}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full"
    />
  </div>
);

export default App;
