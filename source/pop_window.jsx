import React, { useState, useEffect, useMemo } from 'react';

/**
 * FocusMate (formerly Clariva)
 * A dyslexia-friendly web extension frontend.
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

const App = () => {
  const [activeTab, setActiveTab] = useState('settings');
  const [config, setConfig] = useState(null);
  const [prefs, setPrefs] = useState(FALLBACK_CONFIG.user_preferences);

  const isExtension = typeof chrome !== 'undefined' && chrome.runtime && !!chrome.runtime.getURL;

  useEffect(() => {
    const loadConfig = async () => {
      try {
        let data = FALLBACK_CONFIG;
        if (isExtension) {
          try {
            const configUrl = chrome.runtime.getURL('dpref.json');
            const response = await fetch(configUrl);
            if (response.ok) data = await response.json();
          } catch (e) {
            console.warn("Using fallback config: dpref.json not found in extension root.");
          }
        }
        setConfig(data);

        if (isExtension && chrome.storage?.sync) {
          chrome.storage.sync.get(['focusMatePrefs'], (result) => {
            if (result.focusMatePrefs) setPrefs(result.focusMatePrefs);
            else setPrefs(data.user_preferences);
          });
        } else {
          const saved = localStorage.getItem('focusMatePrefs');
          if (saved) setPrefs(JSON.parse(saved));
          else setPrefs(data.user_preferences);
        }
      } catch (e) {
        setConfig(FALLBACK_CONFIG);
      }
    };
    loadConfig();
  }, [isExtension]);

  const savePrefs = (newPrefs) => {
    setPrefs(newPrefs);
    if (isExtension && chrome.storage?.sync) {
      chrome.storage.sync.set({ focusMatePrefs: newPrefs }, () => {
        chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs?.[0]) chrome.tabs.sendMessage(tabs[0].id, { action: "updateStyles", prefs: newPrefs });
        });
      });
    } else {
      localStorage.setItem('focusMatePrefs', JSON.stringify(newPrefs));
    }
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
            if (groups[key].includes(lower)) {
              groupKey = key;
              break;
            }
          }

          const isVowel = activeModes.includes('vowel_coloring') && 'aeiou'.includes(lower);

          if (groupKey) {
            const colorKey = config.letter_highlighting.default_highlight_colors[groupKey];
            const color = COLOR_VALUES[colorKey] || '#2563eb';
            return <span key={charIdx} style={{ color, borderBottom: `1px dashed ${color}` }}>{char}</span>;
          }

          if (isVowel) {
            return <span key={charIdx} style={{ color: vowelColor }}>{char}</span>;
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

  if (!config) return <div className="p-8 text-amber-900 font-medium text-center">Initializing FocusMate...</div>;

  return (
    <div className="w-[600px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-amber-50 font-sans mx-auto text-slate-800">
      {/* Dynamic Preview Section */}
      <section 
        className="p-8 border-b border-amber-50 transition-all duration-300"
        style={{ 
          backgroundColor: COLOR_VALUES[prefs.background_color] || '#FFFFFF',
          color: COLOR_VALUES[prefs.text_color] || '#000000'
        }}
      >
        <div className="mb-3 flex justify-between items-center opacity-40">
          <span className="text-[10px] font-black uppercase tracking-widest">Live Sample Preview</span>
          <div className="flex gap-2">
            {prefs.active_modes?.map(m => <span key={m} className="px-1.5 py-0.5 bg-amber-200 rounded text-[8px] font-bold text-amber-800 uppercase">{m.replace('_', ' ')}</span>)}
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
          className="transition-all duration-200"
        >
          {processedSampleText}
        </div>
      </section>

      {/* Tab Navigation */}
      <header className="px-8 pt-6 pb-0 flex items-center justify-between border-b border-amber-50 bg-amber-50/20">
        <div className="flex gap-8 items-center">
          {['settings', 'colors', 'highlights'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 border-b-4 font-bold text-[11px] tracking-widest uppercase transition-all ${
                activeTab === tab ? 'border-amber-500 text-amber-900' : 'border-transparent text-slate-400 hover:text-slate-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button 
          onClick={() => savePrefs(config.user_preferences)}
          className="pb-4 text-red-500 font-bold text-[11px] tracking-widest uppercase flex items-center gap-1 hover:text-red-700 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Reset
        </button>
      </header>

      <main className="p-8 h-[400px] overflow-y-auto">
        {/* Typography Settings */}
        {activeTab === 'settings' && (
          <div className="space-y-10">
            <div className="grid grid-cols-2 gap-3">
              {config.font.map((f) => (
                <button
                  key={f}
                  onClick={() => savePrefs({ ...prefs, font: f })}
                  style={{ fontFamily: f }}
                  className={`p-3 rounded-xl border-2 text-left text-sm transition-all ${
                    prefs.font === f ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold' : 'border-slate-50 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-10">
              <ControlSlider label="Font Size" value={prefs.font_size} min={config.font_size.min} max={config.font_size.max} unit="px" onChange={(v) => savePrefs({ ...prefs, font_size: v })} />
              <ControlSlider label="Line Spacing" value={prefs.line_spacing} min={config.line_spacing.min} max={config.line_spacing.max} step={0.1} onChange={(v) => savePrefs({ ...prefs, line_spacing: v })} />
              <ControlSlider label="Letter Spacing" value={prefs.letter_spacing} min={0} max={0.5} step={0.01} onChange={(v) => savePrefs({ ...prefs, letter_spacing: v })} />
              <ControlSlider label="Word Spacing" value={prefs.word_spacing} min={config.word_spacing.min} max={config.word_spacing.max} step={0.05} onChange={(v) => savePrefs({ ...prefs, word_spacing: v })} />
            </div>
          </div>
        )}

        {/* Color Palette */}
        {activeTab === 'colors' && (
          <div className="space-y-12">
            <section className="space-y-6">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Background Shades</label>
              <div className="flex gap-4">
                {config.background_color.map(c => (
                  <button
                    key={c}
                    onClick={() => savePrefs({ ...prefs, background_color: c })}
                    className={`w-14 h-14 rounded-2xl border-4 transition-all shadow-sm ${prefs.background_color === c ? 'border-amber-600 scale-110 shadow-lg' : 'border-white hover:border-slate-100'}`}
                    style={{ backgroundColor: COLOR_VALUES[c] }}
                  />
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Typography Color</label>
              <div className="flex gap-4">
                {config.foreground_color.map(c => (
                  <button
                    key={c}
                    onClick={() => savePrefs({ ...prefs, text_color: c })}
                    className={`w-14 h-14 rounded-2xl border-4 transition-all shadow-sm ${prefs.text_color === c ? 'border-amber-600 scale-110 shadow-lg' : 'border-white hover:border-slate-100'}`}
                    style={{ backgroundColor: COLOR_VALUES[c] }}
                  />
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Special Highlights */}
        {activeTab === 'highlights' && (
          <div className="space-y-10">
            <section className="space-y-6">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Modes</label>
              <div className="grid grid-cols-2 gap-4">
                {['vowel_coloring', 'bold_starts'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => savePrefs({ ...prefs, active_modes: toggleList(prefs.active_modes, mode) })}
                    className={`p-5 rounded-2xl border-2 font-bold text-left flex justify-between items-center transition-all ${
                      prefs.active_modes?.includes(mode) ? 'bg-amber-600 border-amber-600 text-white shadow-lg' : 'border-slate-50 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {mode.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    {prefs.active_modes?.includes(mode) && <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Confusing Letter Pairs</label>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(config.confusing_letter_groups).map(([key, letters]) => {
                  const isActive = prefs.active_letter_groups?.includes(key);
                  const colorKey = config.letter_highlighting.default_highlight_colors[key];
                  const hex = COLOR_VALUES[colorKey] || '#d97706';
                  
                  return (
                    <button
                      key={key}
                      onClick={() => savePrefs({ ...prefs, active_letter_groups: toggleList(prefs.active_letter_groups, key) })}
                      style={{ 
                        backgroundColor: isActive ? hex : 'white',
                        borderColor: isActive ? hex : '#f8fafc',
                        color: isActive ? 'white' : hex
                      }}
                      className={`p-4 rounded-2xl border-2 font-black text-lg transition-all flex items-center justify-center gap-2 shadow-sm ${!isActive && 'hover:bg-amber-50'}`}
                    >
                      {letters.join('')}
                      {isActive && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="px-8 pb-8 pt-2">
        <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 italic text-[10px] text-amber-800/50 text-center">
          FocusMate: Empowering reading through visual clarity.
        </div>
      </footer>
    </div>
  );
};

const ControlSlider = ({ label, value, min, max, step = 1, unit = '', onChange }) => (
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">{value}{unit}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-600"
    />
  </div>
);

export default App;