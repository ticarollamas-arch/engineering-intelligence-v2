import { aiConfig, send } from './_shared.js';
import { VERSION } from '../lib/engine.js';

export default function handler(req, res) {
  const cfg = aiConfig();
  send(res, 200, { ok: true, versao: VERSION, ia: cfg ? { ativa: true, provedor: cfg.provider, modelo: cfg.model } : { ativa: false } });
}
