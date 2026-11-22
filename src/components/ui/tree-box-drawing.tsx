// Tree Box Drawing by nikolas-sapa (Nikolas Sapalidis), @ns-ui library: https://21st.dev/@nikolas-sapa/components/tree-box-drawing (MIT, Copyright (c) 2026 Nikolas Sapalidis)
// Modified by Dorian Acosta for WGU Study Buddy (MIT)
"use client";

// A file/directory tree drawn with real box-drawing connectors (├── └── │),
// the way `tree` prints. Unlike a tree whose indent guides are static
// per-level border rules, expanding or collapsing a folder here rewrites the
// connector glyphs themselves: collapsing a folder retracts its visible
// descendant rows one at a time, bottom row first, and the instant a direct
// child's own row disappears, its previous still-visible sibling's connector
// flips from "├── " to "└── " — it has just become the new last child on
// screen, so the glyph above it has to say so. Expanding reveals rows top to
// bottom into their final, already-correct connectors — there is no
// transitional glyph to fix up on the way in, only removal creates a moving
// "which child is last" target.
//
// The retraction/reveal sequencing is a single rAF loop per toggle, stepping
// through a snapshot of the affected rows at a fixed cadence and writing
// opacity/maxHeight directly to each row's DOM node (and, on the one collapse
// step where a sibling becomes the new last child, its connector textContent)
// via a ref map — no per-frame React state. React only commits the settled
// expanded/collapsed set once the sequence finishes.
//
// WAI-ARIA tree pattern: role=tree/treeitem/group, roving tabindex,
// ArrowDown/Up move, ArrowRight opens (or dives into an already-open node's
// first child), ArrowLeft closes (or climbs to the parent), Home/End jump to
// the first/last visible row. prefers-reduced-motion renders the settled
// state immediately, with no retraction/reveal sequence at all.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";

export type BoughNode = {
  id: string;
  label: string;
  children?: BoughNode[];
  /** written as the row button's data-focus-key (the app's router puts focus back on it after Back) */
  focusKey?: string;
};

export interface BoughIndexProps {
  /** Accessible name for the tree, e.g. "Project files". */
  label: string;
  /** root-level nodes of the tree */
  nodes: BoughNode[];
  /** Node ids expanded on first render, statically — no reveal sequence for these. */
  defaultExpandedIds?: string[];
  /** extra classes merged onto the rendered root element */
  className?: string;
  /** Controls the selection (the app's active course); without it the tree keeps its own, as shipped. */
  selectedId?: string;
  /**
   * called with the clicked node, after the internal select and toggle; `event` is the click (absent for Enter and
   * Space), so a modified click can open a new tab
   */
  onSelect?: (node: BoughNode, event?: ReactMouseEvent<HTMLButtonElement>) => void;
  /** called when a group opens or closes, by click or by key */
  onToggle?: (node: BoughNode) => void;
}

type Row = {
  node: BoughNode;
  parent: BoughNode | null;
  depth: number;
  /** one flag per ancestor level (root-first): true = that ancestor was its parent's last child */
  ancestorLast: boolean[];
  /** ids of every ancestor, root-first, same order as ancestorLast */
  ancestorIds: string[];
  isLast: boolean;
};

const STEP_MS = 42;
const ROW_H = 24;

function flattenVisible(nodes: BoughNode[], expandedIds: Set<string>): Row[] {
  const out: Row[] = [];
  const walk = (
    list: BoughNode[],
    parent: BoughNode | null,
    depth: number,
    ancestorLast: boolean[],
    ancestorIds: string[],
  ) => {
    list.forEach((node, i) => {
      const isLast = i === list.length - 1;
      out.push({ node, parent, depth, ancestorLast, ancestorIds, isLast });
      if (node.children?.length && expandedIds.has(node.id)) {
        walk(
          node.children,
          node,
          depth + 1,
          [...ancestorLast, isLast],
          [...ancestorIds, node.id],
        );
      }
    });
  };
  walk(nodes, null, 0, [], []);
  return out;
}

function connectorPrefix(ancestorLast: boolean[]): string {
  // skip the root level (depth-0 rows carry no ancestor prefix, only their own connector)
  return ancestorLast
    .slice(1)
    .map((last) => (last ? "    " : "│   "))
    .join("");
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function BoughIndex({
  label,
  nodes,
  defaultExpandedIds = [],
  className = "",
  selectedId,
  onSelect,
  onToggle,
}: BoughIndexProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(defaultExpandedIds),
  );
  // node ids currently mid-toggle; rows inside them are animating in or out
  const [collapsingIds, setCollapsingIds] = useState<Set<string>>(new Set());
  const [expandingIds, setExpandingIds] = useState<Set<string>>(new Set());
  const [ownSelectedId, setOwnSelectedId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string>(() => nodes[0]?.id ?? "");
  const reduced = usePrefersReducedMotion();

  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const connectorRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
  const rafRef = useRef<number | undefined>(undefined);
  const treeRef = useRef<HTMLDivElement>(null);

  // shape actually rendered: expanded ids plus anything mid-collapse (its old
  // rows stay mounted so the retract sequence has something to animate)
  const renderExpandedIds = useMemo(() => {
    const s = new Set(expandedIds);
    collapsingIds.forEach((id) => s.add(id));
    return s;
  }, [expandedIds, collapsingIds]);

  const visible = useMemo(
    () => flattenVisible(nodes, renderExpandedIds),
    [nodes, renderExpandedIds],
  );
  const steadyVisible = useMemo(
    () => flattenVisible(nodes, expandedIds),
    [nodes, expandedIds],
  );

  const runSequence = useCallback(
    (rows: Row[], mode: "expand" | "collapse", onDone: () => void) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (reduced || rows.length === 0) {
        onDone();
        return;
      }
      const ordered = mode === "collapse" ? [...rows].reverse() : rows;
      const start = performance.now();
      let appliedThrough = -1;

      const applyStep = (i: number) => {
        const row = ordered[i];
        const el = rowRefs.current.get(row.node.id);
        if (el) {
          el.style.maxHeight = mode === "expand" ? `${ROW_H}px` : "0px";
          el.style.opacity = mode === "expand" ? "1" : "0";
        }
        // collapse only: this row's own line just vanished. if it's a direct
        // child (has a parent) and not first among its siblings, the previous
        // sibling — still mounted — is now the visible last child.
        if (mode === "collapse" && row.parent) {
          const siblings = row.parent.children ?? [];
          const idx = siblings.findIndex((n) => n.id === row.node.id);
          if (idx > 0) {
            const span = connectorRefs.current.get(siblings[idx - 1].id);
            if (span) span.textContent = "└── ";
          }
        }
      };

      const tick = (now: number) => {
        const elapsed = now - start;
        const through = Math.min(
          ordered.length,
          Math.floor(elapsed / STEP_MS) + 1,
        );
        for (let i = appliedThrough + 1; i < through; i++) applyStep(i);
        appliedThrough = through - 1;
        if (through < ordered.length) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          rafRef.current = undefined;
          onDone();
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [reduced],
  );

  const subtreeRows = useCallback(
    (node: BoughNode, expanded: Set<string>): Row[] => {
      if (!node.children?.length) return [];
      return flattenVisible(node.children, expanded).map((r) => ({
        ...r,
        depth: r.depth + 1,
        ancestorLast: [true, ...r.ancestorLast],
        ancestorIds: [node.id, ...r.ancestorIds],
      }));
    },
    [],
  );

  const toggle = useCallback(
    (nodeId: string, node: BoughNode) => {
      onToggle?.(node);
      const isOpen = expandedIds.has(nodeId);
      if (isOpen) {
        setCollapsingIds((prev) => new Set(prev).add(nodeId));
        const rows = subtreeRows(node, expandedIds);
        runSequence(rows, "collapse", () => {
          setExpandedIds((prev) => {
            const next = new Set(prev);
            next.delete(nodeId);
            return next;
          });
          setCollapsingIds((prev) => {
            const next = new Set(prev);
            next.delete(nodeId);
            return next;
          });
        });
      } else {
        const nextExpanded = new Set(expandedIds).add(nodeId);
        setExpandedIds(nextExpanded);
        setExpandingIds((prev) => new Set(prev).add(nodeId));
        const rows = subtreeRows(node, nextExpanded);
        // mount first, then run the reveal on the following frame
        requestAnimationFrame(() => {
          runSequence(rows, "expand", () => {
            setExpandingIds((prev) => {
              const next = new Set(prev);
              next.delete(nodeId);
              return next;
            });
          });
        });
      }
    },
    [expandedIds, nodes, runSequence, subtreeRows, onToggle],
  );

  const select = useCallback((nodeId: string) => {
    setOwnSelectedId(nodeId);
    setFocusedId(nodeId);
  }, []);

  const focusItem = useCallback((nodeId: string) => {
    setFocusedId(nodeId);
    rowRefs.current
      .get(nodeId)
      ?.querySelector<HTMLElement>("[data-bough-focusable]")
      ?.focus();
  }, []);

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const list = steadyVisible;
    const i = list.findIndex((v) => v.node.id === focusedId);
    if (i === -1) return;
    const { node, parent } = list[i];
    const hasChildren = !!node.children?.length;
    let handled = true;
    switch (e.key) {
      case "ArrowDown":
        if (i < list.length - 1) focusItem(list[i + 1].node.id);
        break;
      case "ArrowUp":
        if (i > 0) focusItem(list[i - 1].node.id);
        break;
      case "ArrowRight":
        if (hasChildren) {
          if (!expandedIds.has(node.id)) toggle(node.id, node);
          else if (node.children![0]) focusItem(node.children![0].id);
        }
        break;
      case "ArrowLeft":
        if (hasChildren && expandedIds.has(node.id)) toggle(node.id, node);
        else if (parent) focusItem(parent.id);
        break;
      case "Home":
        if (list.length) focusItem(list[0].node.id);
        break;
      case "End":
        if (list.length) focusItem(list[list.length - 1].node.id);
        break;
      case "Enter":
      case " ":
        if (hasChildren) toggle(node.id, node);
        select(node.id);
        onSelect?.(node);
        break;
      default:
        handled = false;
    }
    if (handled) e.preventDefault();
  };

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  return (
    <div
      ref={treeRef}
      role="tree"
      aria-label={label}
      className={`select-none font-mono text-sm leading-6 text-foreground ${className}`}
      onKeyDown={onKeyDown}
    >
      <style>{`
.ns-bi-focusable{outline:none}
.ns-bi-focusable:focus-visible{outline:2px solid var(--ring);outline-offset:-2px}
.ns-bi-line{transition:opacity 140ms ease,max-height 140ms ease}
@media (prefers-reduced-motion: reduce){.ns-bi-line{transition:none !important}}
`}</style>
      {visible.map((row) => {
        const { node, parent, depth, ancestorLast, ancestorIds, isLast } = row;
        const hasChildren = !!node.children?.length;
        const isOpen = expandedIds.has(node.id);
        const isSelected = (selectedId ?? ownSelectedId) === node.id;
        const isFocused = focusedId === node.id;

        // rows inside a subtree mid-expand mount hidden, then the rAF sequence
        // reveals them; rows mid-collapse mount at their steady (shown) state
        // and the sequence animates them OUT via direct ref writes — no state
        // gate needed for that direction here.
        const expandingAncestor = ancestorIds.some((id) =>
          expandingIds.has(id),
        );

        const connector = depth === 0 ? "" : isLast ? "└── " : "├── ";
        const prefix = connectorPrefix(ancestorLast);

        const startHidden = expandingAncestor && !reduced;

        return (
          <div
            key={node.id}
            ref={(el) => {
              if (el) rowRefs.current.set(node.id, el);
              else rowRefs.current.delete(node.id);
            }}
            role="none"
            className="ns-bi-row"
          >
            <div
              role="none"
              className="ns-bi-line flex items-center overflow-hidden whitespace-pre"
              style={{
                maxHeight: reduced || !startHidden ? ROW_H : 0,
                opacity: reduced || !startHidden ? 1 : 0,
              }}
            >
              <span aria-hidden className="text-muted-foreground">
                {prefix}
                <span
                  ref={(el) => {
                    if (el) connectorRefs.current.set(node.id, el);
                    else connectorRefs.current.delete(node.id);
                  }}
                >
                  {connector}
                </span>
              </span>
              <button
                type="button"
                role="treeitem"
                aria-expanded={hasChildren ? isOpen : undefined}
                aria-selected={isSelected}
                aria-level={depth + 1}
                data-bough-focusable
                data-bough-row={node.id}
                data-focus-key={node.focusKey}
                tabIndex={isFocused ? 0 : -1}
                // focus that arrives from outside (the app's focus restore after Back) moves the roving
                // position too, so keys act on the row that has focus
                onFocus={() => setFocusedId(node.id)}
                onClick={(e) => {
                  select(node.id);
                  if (hasChildren) toggle(node.id, node);
                  onSelect?.(node, e);
                }}
                className={[
                  "ns-bi-focusable flex-1 truncate rounded-xs px-1 text-left transition-colors duration-150",
                  isSelected
                    ? "bg-accent text-foreground"
                    : "text-foreground hover:bg-accent",
                ].join(" ")}
              >
                <span aria-hidden>
                  {hasChildren ? (isOpen ? "- " : "+ ") : "· "}
                </span>
                {node.label}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default BoughIndex;
