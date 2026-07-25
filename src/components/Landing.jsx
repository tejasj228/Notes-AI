'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, LayoutGrid, FolderOpen, MousePointerClick, RotateCcw, ImagePlus, ArrowRight } from 'lucide-react';

// Mock note stickers for the hero collage
const HERO_NOTES = [
  { title: 'Web Development', color: '#B7A2FF', tags: ['React', 'CSS'], rot: -4, text: 'Component architecture + responsive design.' },
  { title: 'Project Ideas', color: '#FFD23F', tags: ['AI', 'ML'], rot: 3, text: 'AI note-taking, content suggestions, automations.' },
  { title: 'Travel', color: '#5EEAD4', tags: ['Paris'], rot: 5, text: 'Eiffel Tower → Louvre → Versailles day trip.' },
  { title: 'Workout Plan', color: '#FF7A7A', tags: ['Fitness'], rot: -6, text: 'Mon chest · Wed back · Fri legs.' },
];

const FEATURES = [
  { icon: LayoutGrid, color: '#B7A2FF', title: 'Bento grid', body: 'Small, medium and large blocks pack together into a wall of colour you can actually scan.' },
  { icon: Sparkles, color: '#FFD23F', title: 'AI companion', body: 'Open any note beside a chat and ask the AI to summarise, expand, or rework it.' },
  { icon: MousePointerClick, color: '#5EEAD4', title: 'Drag to reorder', body: 'Grab a card and drop it anywhere. Drag it onto Trash to throw it out.' },
  { icon: FolderOpen, color: '#8FE388', title: 'Folders', body: 'Group notes into up to ten colour-coded folders and jump between them fast.' },
  { icon: ImagePlus, color: '#FF9F45', title: 'Rich notes', body: 'Bold, lists, and inline images — paste a screenshot straight into a note.' },
  { icon: RotateCcw, color: '#9B9CFF', title: 'Safe trash', body: 'Deleted by mistake? Restore anything from the trash before it’s gone for good.' },
];

const MARQUEE = ['IDEAS', 'LISTS', 'RECIPES', 'PLANS', 'NOTES', 'SKETCHES', 'GOALS', 'DUMPS', 'DRAFTS'];

const NoteSticker = ({ note, className = '' }) => (
  <div
    className={`border-3 border-ink shadow-brutal p-3 ${className}`}
    style={{ background: note.color, transform: `rotate(${note.rot}deg)` }}
  >
    <h3 className="font-display font-extrabold text-base leading-tight mb-1">{note.title}</h3>
    <p className="text-[11px] text-ink/80 leading-snug mb-2">{note.text}</p>
    <div className="flex gap-1 flex-wrap">
      {note.tags.map((t) => (
        <span key={t} className="border-2 border-ink bg-white/70 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase">
          {t}
        </span>
      ))}
    </div>
  </div>
);

const Landing = () => {
  const router = useRouter();
  const start = () => router.push('/auth');

  return (
    <div className="min-h-[100dvh]">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-paper border-b-3 border-ink">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 md:px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="inline-block bg-brand text-white border-3 border-ink px-2 py-0.5 font-display font-extrabold leading-none shadow-brutal-sm">
              N
            </span>
            <span className="font-display font-extrabold text-lg">NOTES·AI</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="brutal-btn bg-white text-ink px-3 md:px-4 py-2 text-xs" onClick={start}>
              Sign in
            </button>
            <button className="brutal-btn bg-brand text-white px-3 md:px-4 py-2 text-xs" onClick={start}>
              Get started
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-12 md:pt-20 pb-10">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="brutal-eyebrow inline-block border-3 border-ink bg-note-yellow px-3 py-1 shadow-brutal-sm mb-6">
              notes + AI, in colour
            </span>
            <h1 className="font-display font-extrabold leading-[0.95] text-5xl md:text-7xl tracking-tight">
              Think loud.
              <br />
              <span className="text-brand">In colour.</span>
            </h1>
            <p className="text-base md:text-lg text-ink/75 mt-5 max-w-md">
              A bold bento notebook where every idea gets its own coloured block — and an AI that reads your notes and
              thinks alongside you.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-7">
              <button className="brutal-btn bg-brand text-white px-6 py-3 text-sm" onClick={start}>
                Start writing <ArrowRight size={16} strokeWidth={2.75} />
              </button>
              <button className="brutal-btn bg-white text-ink px-6 py-3 text-sm" onClick={start}>
                Sign in
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-8">
              {['Free to try', 'Drag & drop', 'AI built in'].map((chip) => (
                <span key={chip} className="border-3 border-ink bg-white px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide shadow-brutal-sm">
                  {chip}
                </span>
              ))}
            </div>
          </div>

          {/* Hero collage — the signature */}
          <div className="relative min-h-[340px] md:min-h-[420px]">
            <div className="absolute inset-0 grid grid-cols-2 gap-4 content-center">
              <NoteSticker note={HERO_NOTES[0]} className="mt-6" />
              <NoteSticker note={HERO_NOTES[1]} />
              <NoteSticker note={HERO_NOTES[2]} />
              <NoteSticker note={HERO_NOTES[3]} className="-mt-4" />
            </div>
            {/* AI badge floating over the collage */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 border-3 border-ink bg-ink text-paper shadow-brutal px-4 py-2 flex items-center gap-2 rotate-[-2deg]">
              <Sparkles size={16} strokeWidth={2.5} className="text-note-yellow" />
              <span className="font-mono text-xs font-bold uppercase tracking-wide">Ask AI about any note</span>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee strip */}
      <section className="border-y-3 border-ink bg-ink overflow-hidden py-3">
        <div className="flex whitespace-nowrap animate-marquee">
          {[...MARQUEE, ...MARQUEE].map((word, i) => (
            <span key={i} className="font-display font-extrabold text-2xl text-paper mx-6 flex items-center gap-6">
              {word}
              <span className="text-brand">✦</span>
            </span>
          ))}
        </div>
      </section>

      {/* Features bento */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-14 md:py-20">
        <div className="mb-8">
          <span className="brutal-eyebrow text-ink/60">Everything in one wall</span>
          <h2 className="font-display font-extrabold text-3xl md:text-4xl mt-2">Built for people who dump ideas fast.</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, color, title, body }) => (
            <div key={title} className="brutal-card bg-white p-5">
              <div className="w-11 h-11 border-3 border-ink flex items-center justify-center mb-4" style={{ background: color }}>
                <Icon size={20} strokeWidth={2.5} />
              </div>
              <h3 className="font-display font-extrabold text-xl mb-1.5">{title}</h3>
              <p className="text-sm text-ink/70 leading-snug">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-16">
        <div className="border-3 border-ink bg-brand text-white shadow-brutal-xl p-8 md:p-12 text-center">
          <h2 className="font-display font-extrabold text-3xl md:text-5xl leading-tight">
            Your next idea deserves a block.
          </h2>
          <p className="text-white/85 mt-3 max-w-lg mx-auto">
            Sign up in seconds and start a wall of colourful notes with an AI that actually reads them.
          </p>
          <button className="brutal-btn bg-note-yellow text-ink px-8 py-3.5 text-sm mt-7" onClick={start}>
            Get started free <ArrowRight size={16} strokeWidth={2.75} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-3 border-ink">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-block bg-brand text-white border-2 border-ink px-1.5 py-0.5 font-display font-extrabold text-sm leading-none">
              N
            </span>
            <span className="font-mono text-xs font-bold uppercase tracking-wide">Notes·AI</span>
          </div>
          <p className="font-mono text-[11px] text-ink/60 uppercase tracking-wide">Think loud. In colour.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
