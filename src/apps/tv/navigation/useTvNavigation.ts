import { type RefObject, useEffect } from 'react';

import { getKeyName } from 'scripts/keyboardNavigation';

/**
 * Remote control (D-pad) navigation for the Netflix-style TV pages.
 *
 * Pages mark up their focus targets instead of relying on Jellyfin's geometric focus search, which wanders between
 * rows that slide sideways:
 * - `data-tv-rail`: the side menu; Left from the first tile of a row opens it, Right leaves it.
 * - `data-tv-row`: a horizontal row. Up and Down move between rows, and each row remembers its position.
 * - `data-tv-track`: the sliding part of a row, moved so the focused tile sits at the left edge, like Netflix.
 * - `data-tv-item`: a focusable tile or button inside a row or the rail. `data-tv-default` marks the one to start on,
 *   and `data-tv-start` the one a row is first entered on.
 * - `data-tv-stage`: the column of rows, slid up so the focused row sits at the top of it.
 */

const RAIL = '[data-tv-rail]';
const ROW = '[data-tv-row]';
const TRACK = '[data-tv-track]';
const ITEM = '[data-tv-item]';
const STAGE = '[data-tv-stage]';

export interface TvNavigationOptions {
    /** Identifies the page so it can restore the focused tile when the viewer comes back to it. */
    memoryKey?: string
    /**
     * How far the stage slides up for a row, given the row's distance from the top of the stage (the default).
     * Return 0 to keep a row in place.
     */
    stageOffset?: (row: HTMLElement, top: number) => number
    /** Back from a lower row returns to the first row before leaving the page, like Netflix's home. */
    backToFirstRow?: boolean
}

/** Remembered positions: the focused row and each row's focused tile. */
interface Position {
    row: number
    columns: number[]
}

const positions = new Map<string, Position>();

const isVisible = (elem: Element) => (elem as HTMLElement).offsetParent !== null;

const itemsOf = (container: Element) => Array.from(container.querySelectorAll<HTMLElement>(ITEM)).filter(isVisible);

const rowsOf = (root: Element) => Array.from(root.querySelectorAll<HTMLElement>(ROW))
    .filter(row => !row.closest(RAIL) && isVisible(row) && itemsOf(row).length > 0);

export const useTvNavigation = (rootRef: RefObject<HTMLElement | null>, options: TvNavigationOptions = {}) => {
    const { memoryKey, stageOffset, backToFirstRow } = options;

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;

        const columns = new WeakMap<HTMLElement, number>();
        let lastRow: HTMLElement | undefined;
        let restored = !memoryKey || !positions.has(memoryKey);
        // Until the viewer moves, focus follows rows that load above the first one
        let hasMoved = false;
        let isRestoredPosition = false;

        const slideRow = (row: HTMLElement, item: HTMLElement) => {
            const track = row.querySelector<HTMLElement>(TRACK);
            if (!track?.parentElement) return;
            // Keep the focused tile at the left edge, without sliding past the end of the row
            const maxShift = Math.max(0, track.scrollWidth - track.parentElement.clientWidth);
            track.style.transform = `translateX(${-Math.min(item.offsetLeft, maxShift)}px)`;
        };

        const slideStage = (row: HTMLElement) => {
            const stage = root.querySelector<HTMLElement>(STAGE);
            if (!stage?.contains(row)) return;
            // Both move with the stage, so the difference doesn't depend on how far it has slid
            const top = row.getBoundingClientRect().top - stage.getBoundingClientRect().top;
            const offset = stageOffset ? stageOffset(row, top) : top;
            stage.style.transform = `translateY(${-Math.max(0, offset)}px)`;
        };

        const remember = () => {
            if (!memoryKey) return;
            const rows = rowsOf(root);
            positions.set(memoryKey, {
                row: lastRow ? rows.indexOf(lastRow) : 0,
                columns: rows.map(row => columns.get(row) ?? 0)
            });
        };

        const focusItem = (item: HTMLElement) => {
            item.focus({ preventScroll: true });
            const row = item.closest<HTMLElement>(ROW);
            if (!row || row.closest(RAIL)) return;
            columns.set(row, itemsOf(row).indexOf(item));
            lastRow = row;
            slideRow(row, item);
            slideStage(row);
            remember();
        };

        const focusRow = (row: HTMLElement) => {
            const items = itemsOf(row);
            // A row is first entered on its `data-tv-start` tile, if it has one
            const start = Math.max(0, items.findIndex(item => item.dataset.tvStart !== undefined));
            const item = items[Math.min(columns.get(row) ?? start, items.length - 1)];
            if (item) focusItem(item);
        };

        const focusDefault = () => {
            const rows = rowsOf(root);
            const saved = memoryKey ? positions.get(memoryKey) : undefined;
            if (!restored && saved) {
                // Wait until the remembered row has loaded
                if (rows.length <= saved.row) return false;
                restored = true;
                isRestoredPosition = true;
                rows.forEach((row, index) => {
                    columns.set(row, saved.columns[index] ?? 0);
                });
                focusRow(rows[saved.row]);
                return true;
            }

            const preferred = root.querySelector<HTMLElement>('[data-tv-default]');
            if (preferred && isVisible(preferred)) {
                focusItem(preferred);
                return true;
            }
            if (rows[0]) {
                focusRow(rows[0]);
                return true;
            }
            return false;
        };

        const isFocusLost = () => document.activeElement === document.body || !document.activeElement;

        // Focus the first tile (or the remembered one) as soon as the rows render
        const observer = new MutationObserver(() => {
            if (isFocusLost() || (!hasMoved && !isRestoredPosition && restored)) {
                focusDefault();
            } else if (lastRow?.isConnected) {
                // Rows that load above the focused one push it down; keep it in place
                slideStage(lastRow);
            }
        });
        observer.observe(root, { childList: true, subtree: true });
        if (isFocusLost()) focusDefault();
        // If the remembered row never loads (the rows changed), settle for the first one
        const restoreTimeout = window.setTimeout(() => {
            restored = true;
            if (isFocusLost()) focusDefault();
        }, 2000);

        const backToContent = () => {
            const rows = rowsOf(root);
            const row = lastRow && rows.includes(lastRow) ? lastRow : rows[0];
            if (row) focusRow(row);
        };

        const moveInRail = (rail: HTMLElement, item: HTMLElement, key: string) => {
            const railItems = itemsOf(rail);
            const index = railItems.indexOf(item);
            if (key === 'ArrowRight') {
                backToContent();
            } else {
                const target = railItems[index + (key === 'ArrowUp' ? -1 : 1)];
                if (key !== 'ArrowLeft') target?.focus({ preventScroll: true });
            }
        };

        const openRail = (rail: HTMLElement, row: HTMLElement) => {
            lastRow = row;
            // The menu opens on the page being shown
            (rail.querySelector<HTMLElement>('[data-tv-current]') ?? itemsOf(rail)[0])?.focus({ preventScroll: true });
        };

        const moveInRow = (row: HTMLElement, item: HTMLElement, key: string) => {
            const rows = rowsOf(root);
            const items = itemsOf(row);
            const index = items.indexOf(item);
            const rail = root.querySelector<HTMLElement>(RAIL);

            if (key === 'ArrowLeft' && index === 0) {
                if (rail) openRail(rail, row);
                return;
            }
            if (key === 'ArrowLeft' || key === 'ArrowRight') {
                const target = items[index + (key === 'ArrowLeft' ? -1 : 1)];
                if (target) focusItem(target);
                return;
            }
            const target = rows[rows.indexOf(row) + (key === 'ArrowUp' ? -1 : 1)];
            if (target) focusRow(target);
        };

        /** Returns false when there was nothing to move, so the app's own handling can take over. */
        const move = (key: string) => {
            const item = document.activeElement?.closest<HTMLElement>(ITEM);
            if (!item || !root.contains(item)) return focusDefault();

            const rail = root.querySelector<HTMLElement>(RAIL);
            if (rail?.contains(item)) {
                moveInRail(rail, item, key);
                return true;
            }

            const row = item.closest<HTMLElement>(ROW);
            if (!row) return false;
            moveInRow(row, item, key);
            return true;
        };

        /** Returns true when Back was handled on the page. */
        const back = () => {
            const active = document.activeElement;
            if (active?.closest(RAIL)) {
                // Back closes the menu first
                backToContent();
                return true;
            }
            const rows = rowsOf(root);
            const row = active?.closest<HTMLElement>(ROW);
            if (!backToFirstRow || !row || row === rows[0] || !rows.includes(row)) return false;
            columns.set(rows[0], 0);
            focusRow(rows[0]);
            return true;
        };

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.defaultPrevented || e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return;

            // Leave dialogs, menus and text fields opened over the page alone
            const active = document.activeElement;
            if (active && !isFocusLost() && !root.contains(active)) return;
            if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;

            const key = getKeyName(e);
            hasMoved = true;
            let handled = false;
            if ([ 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight' ].includes(key)) {
                handled = move(key);
            } else if (key === 'Back' || key === 'Escape') {
                handled = back();
            }

            if (handled) {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        // LG's Magic Remote has a pointer: tiles under it take focus, without sliding the rows under the pointer.
        // Only real movement counts; browsers also report the pointer "moving" when the page slides under it.
        let lastPointer = '';
        const onPointerMove = (e: PointerEvent) => {
            const position = `${e.screenX},${e.screenY}`;
            if (position === lastPointer) return;
            const isFirstMove = !lastPointer;
            lastPointer = position;
            if (isFirstMove) return;
            hasMoved = true;
            const item = (e.target as Element | null)?.closest<HTMLElement>(ITEM);
            if (item && item !== document.activeElement && root.contains(item)) item.focus({ preventScroll: true });
        };
        root.addEventListener('pointermove', onPointerMove);

        // The page only ever slides; undo any native scrolling, e.g. a browser scrolling a focused tile into view
        const onScroll = (e: Event) => {
            const target = e.target as HTMLElement;
            if (target.scrollTop || target.scrollLeft) {
                target.scrollTop = 0;
                target.scrollLeft = 0;
            }
        };
        root.addEventListener('scroll', onScroll, true);

        // Capture, so these run before the app's own key handling
        window.addEventListener('keydown', onKeyDown, true);
        return () => {
            observer.disconnect();
            window.clearTimeout(restoreTimeout);
            root.removeEventListener('pointermove', onPointerMove);
            root.removeEventListener('scroll', onScroll, true);
            window.removeEventListener('keydown', onKeyDown, true);
        };
    }, [ rootRef, memoryKey, stageOffset, backToFirstRow ]);
};

