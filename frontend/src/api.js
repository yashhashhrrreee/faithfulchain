/**
 * Axios wrapper for all FaithfulChain backend calls.
 * Components must never import axios directly.
 */
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

const api = axios.create({ baseURL: BASE_URL })

/** POST /api/reason — returns { session_id, steps, answer } */
export async function postReason(question, domain) {
  const { data } = await api.post('/api/reason', { question, domain })
  return data
}

/** POST /api/audit — returns { session_id, audits } */
export async function postAudit(session_id, steps) {
  const { data } = await api.post('/api/audit', { session_id, steps })
  return data
}

/** POST /api/verdict — returns { ok: true } */
export async function postVerdict(payload) {
  const { data } = await api.post('/api/verdict', payload)
  return data
}

/** GET /api/stats/{session_id} — returns StatsResponse */
export async function getStats(session_id) {
  const { data } = await api.get(`/api/stats/${session_id}`)
  return data
}

/** GET /api/log — returns all JSONL records */
export async function getLog() {
  const { data } = await api.get('/api/log')
  return data
}
