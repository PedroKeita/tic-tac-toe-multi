/**
 * Utilitário para parse seguro de payloads JSON do WebSocket.
 * Evita que mensagens malformadas quebrem a árvore de componentes da UI.
 */
export function safeParsePayload(payload, fallback = {}) {
  if (payload === null || payload === undefined) {
    return fallback;
  }
  if (typeof payload === 'object') {
    return payload;
  }
  try {
    return JSON.parse(payload);
  } catch (err) {
    console.warn('[safeParsePayload] Falha ao fazer parse de payload:', payload, err);
    return fallback;
  }
}

