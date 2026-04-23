import { useEffect, useRef, useState } from 'react';
import type { WorkflowEvent } from '@shannon/shared';

/**
 * Subscribe to a workflow's live event stream via Server-Sent Events.
 *
 * - Buffers up to `maxEvents` most-recent events (FIFO).
 * - Auto-reconnects with exponential backoff on transient errors.
 * - Stops cleanly when the workflow finishes (kind: 'finished').
 */
export function useWorkflowEvents(
  workflowId: string | undefined,
  opts: { enabled?: boolean; maxEvents?: number } = {}
) {
  const { enabled = true, maxEvents = 500 } = opts;

  const [events, setEvents] = useState<WorkflowEvent[]>([]);
  const [status, setStatus] = useState<
    'idle' | 'connecting' | 'open' | 'closed' | 'error'
  >('idle');
  const [finished, setFinished] = useState(false);

  // Track attempts for backoff. Reset on every successful open.
  const attemptsRef = useRef(0);
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !workflowId) {
      setStatus('idle');
      return;
    }

    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      setStatus('connecting');
      const es = new EventSource(`/api/workflows/${workflowId}/events`, {
        withCredentials: true,
      });
      esRef.current = es;

      es.onopen = () => {
        if (cancelled) return;
        attemptsRef.current = 0;
        setStatus('open');
      };

      es.onerror = () => {
        if (cancelled) return;
        es.close();
        esRef.current = null;
        // If we already saw the terminal `finished` event, don't try again.
        if (finishedRef.current) {
          setStatus('closed');
          return;
        }
        setStatus('error');
        const attempt = ++attemptsRef.current;
        const delay = Math.min(30_000, 500 * 2 ** Math.min(attempt, 6));
        reconnectTimer.current = setTimeout(connect, delay);
      };

      es.onmessage = (e) => handleFrame(e.data);

      // Our server also tags each frame with `event: <kind>` so browsers
      // dispatch per-kind handlers; a single onmessage covers the generic
      // case above, but we also listen explicitly in case the server emits
      // a kind without a `data:` line (defense in depth).
      es.addEventListener('finished', (e) => handleFrame((e as MessageEvent).data));
    };

    const finishedRef = { current: false } as { current: boolean };

    const handleFrame = (raw: string) => {
      try {
        const ev = JSON.parse(raw) as WorkflowEvent;
        setEvents((prev) => {
          const next = prev.length >= maxEvents ? prev.slice(-(maxEvents - 1)) : prev;
          return [...next, ev];
        });
        if (ev.kind === 'finished') {
          finishedRef.current = true;
          setFinished(true);
          esRef.current?.close();
          esRef.current = null;
          setStatus('closed');
        }
      } catch {
        // Drop malformed frames — the server shouldn't send them.
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      esRef.current?.close();
      esRef.current = null;
    };
  }, [workflowId, enabled, maxEvents]);

  return { events, status, finished };
}
