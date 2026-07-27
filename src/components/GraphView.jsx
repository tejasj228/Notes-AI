'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { RefreshCw, X } from 'lucide-react';
import { graphAPI } from '@/api/graph';

// react-force-graph-2d touches window — load it client-only.
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

const TYPE_COLORS = {
  person: '#FF7A7A',
  place: '#5EEAD4',
  org: '#7CA0FF',
  concept: '#B7A2FF',
  date: '#FFD23F',
  event: '#FF9F45',
  thing: '#8FE388',
  other: '#9B9CFF',
};

const GraphView = () => {
  const router = useRouter();
  const wrapRef = useRef(null);
  const fgRef = useRef(null);
  const [data, setData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);
  const [selected, setSelected] = useState(null);
  const [dims, setDims] = useState({ w: 800, h: 600 });
  const [error, setError] = useState(null);

  // Track the current ink colour so canvas labels/links follow the theme.
  const inkRef = useRef('#141210');
  const inkRgbRef = useRef('20 18 16');
  useEffect(() => {
    const read = () => {
      const s = getComputedStyle(document.documentElement);
      inkRef.current = s.getPropertyValue('--ink').trim() || '#141210';
      inkRgbRef.current = s.getPropertyValue('--ink-rgb').trim() || '20 18 16';
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);
  const inkAlpha = (a) => `rgba(${inkRgbRef.current.split(/\s+/).join(',')}, ${a})`;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await graphAPI.getGraph();
      setData({ nodes: res.data.nodes || [], links: res.data.links || [] });
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Track container size for the canvas.
  useEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;
    const update = () => setDims({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [loading]);

  const rebuild = async () => {
    setRebuilding(true);
    try {
      await graphAPI.rebuild(true);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setRebuilding(false);
    }
  };

  // Facts (links) touching the selected node.
  const selectedFacts = useMemo(() => {
    if (!selected) return [];
    return data.links.filter(
      (l) =>
        (typeof l.source === 'object' ? l.source.id : l.source) === selected.id ||
        (typeof l.target === 'object' ? l.target.id : l.target) === selected.id
    );
  }, [selected, data.links]);

  const neighborIds = useMemo(() => {
    const set = new Set();
    if (selected) {
      set.add(selected.id);
      selectedFacts.forEach((l) => {
        set.add(typeof l.source === 'object' ? l.source.id : l.source);
        set.add(typeof l.target === 'object' ? l.target.id : l.target);
      });
    }
    return set;
  }, [selected, selectedFacts]);

  const paintNode = (node, ctx, globalScale) => {
    const r = 3 + Math.sqrt(node.val || 1) * 2.2;
    const dim = selected && !neighborIds.has(node.id);
    ctx.globalAlpha = dim ? 0.25 : 1;
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
    ctx.fillStyle = TYPE_COLORS[node.type] || TYPE_COLORS.other;
    ctx.fill();
    ctx.lineWidth = 1.5 / globalScale;
    ctx.strokeStyle = '#141210';
    ctx.stroke();
    if (globalScale > 1.2 || (node.val || 1) > 2) {
      const fontSize = Math.max(3, 11 / globalScale);
      ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui`;
      ctx.fillStyle = inkRef.current;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(node.name, node.x, node.y + r + 1);
    }
    ctx.globalAlpha = 1;
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 h-full">
      {/* Graph canvas */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h1 className="font-display font-extrabold text-2xl md:text-3xl leading-none">Knowledge Graph</h1>
            <p className="brutal-eyebrow text-ink/60 mt-1">
              {data.nodes.length} entities · {data.links.length} facts
            </p>
          </div>
          <button className="brutal-btn bg-brand text-white px-4 py-2 text-xs" onClick={rebuild} disabled={rebuilding}>
            <RefreshCw size={15} strokeWidth={2.75} className={rebuilding ? 'animate-spin' : ''} />
            {rebuilding ? 'Rebuilding…' : 'Rebuild graph'}
          </button>
        </div>

        <div ref={wrapRef} className="relative flex-1 min-h-[420px] border-3 border-ink bg-card shadow-brutal overflow-hidden">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block w-8 h-8 border-3 border-ink border-t-transparent rounded-full animate-spin mb-2" />
                <p className="font-mono text-sm">Loading graph…</p>
              </div>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
              <p className="font-mono text-sm text-ink/70">{error}</p>
            </div>
          ) : data.nodes.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="text-center max-w-sm">
                <div className="text-4xl mb-3">🕸️</div>
                <p className="font-display font-extrabold text-xl mb-1">No graph yet</p>
                <p className="text-sm text-ink/70 mb-4">
                  Create or edit some notes (they get indexed automatically), or rebuild now.
                </p>
                <button className="brutal-btn bg-brand text-white px-4 py-2 text-xs" onClick={rebuild} disabled={rebuilding}>
                  <RefreshCw size={15} strokeWidth={2.75} className={rebuilding ? 'animate-spin' : ''} />
                  {rebuilding ? 'Rebuilding…' : 'Build graph from my notes'}
                </button>
              </div>
            </div>
          ) : (
            <ForceGraph2D
              ref={fgRef}
              graphData={data}
              width={dims.w}
              height={dims.h}
              backgroundColor="rgba(0,0,0,0)"
              nodeId="id"
              nodeVal="val"
              nodeLabel={(n) => `${n.name} (${n.type})`}
              linkLabel={(l) => l.relation}
              linkColor={(l) => {
                if (!selected) return inkAlpha(0.35);
                const s = typeof l.source === 'object' ? l.source.id : l.source;
                const t = typeof l.target === 'object' ? l.target.id : l.target;
                return s === selected.id || t === selected.id ? '#7C5CFF' : inkAlpha(0.1);
              }}
              linkWidth={(l) => {
                if (!selected) return 1;
                const s = typeof l.source === 'object' ? l.source.id : l.source;
                const t = typeof l.target === 'object' ? l.target.id : l.target;
                return s === selected.id || t === selected.id ? 2.5 : 1;
              }}
              linkDirectionalArrowLength={3}
              linkDirectionalArrowRelPos={1}
              nodeCanvasObject={paintNode}
              nodePointerAreaPaint={(node, color, ctx) => {
                const r = 3 + Math.sqrt(node.val || 1) * 2.2 + 2;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
                ctx.fill();
              }}
              onNodeClick={(node) => setSelected(node)}
              onBackgroundClick={() => setSelected(null)}
              cooldownTicks={120}
            />
          )}

          {/* Legend */}
          {!loading && data.nodes.length > 0 && (
            <div className="absolute bottom-2 left-2 bg-paper border-2 border-ink shadow-brutal-sm px-2 py-1.5 flex flex-wrap gap-x-3 gap-y-1 max-w-[92%]">
              {Object.entries(TYPE_COLORS).map(([type, color]) => (
                <span key={type} className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase">
                  <span className="w-2.5 h-2.5 border border-ink" style={{ background: color }} />
                  {type}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="md:w-80 flex-shrink-0 border-3 border-ink bg-card shadow-brutal p-4 overflow-y-auto max-h-[80vh]">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h2 className="font-display font-extrabold text-xl leading-tight break-words">{selected.name}</h2>
            <button className="brutal-btn bg-card text-ink p-1.5" onClick={() => setSelected(null)}>
              <X size={14} strokeWidth={2.75} />
            </button>
          </div>
          <span
            className="inline-block border-2 border-ink px-2 py-0.5 font-mono text-[10px] font-bold uppercase mb-3"
            style={{ background: TYPE_COLORS[selected.type] || TYPE_COLORS.other }}
          >
            {selected.type}
          </span>
          <div className="brutal-eyebrow text-ink/60 mb-2">{selectedFacts.length} connected facts</div>
          <div className="space-y-2">
            {selectedFacts.map((l) => (
              <button
                key={l.id}
                onClick={() => router.push(`/ai-chat/${l.noteId}`)}
                className="block w-full text-left border-2 border-ink bg-paper hover:bg-note-yellow transition-colors p-2 text-sm"
                title="Open the source note with AI"
              >
                {l.fact}
                {l.time ? <span className="block brutal-eyebrow text-ink/50 mt-1">🕑 {l.time}</span> : null}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphView;
