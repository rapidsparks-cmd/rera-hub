import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const SBI_HISTORICAL =
  'https://sbi.bank.in/web/interest-rates/interest-rates/mclr-historical-data'
const SBI_CURRENT = 'https://sbi.bank.in/web/interest-rates/interest-rates/mclr'

function sbiMclrProxyPlugin() {
  return {
    name: 'sbi-mclr-proxy',
    configureServer(server) {
      server.middlewares.use('/api/sbi-mclr/historical', async (_req, res) => {
        try {
          const upstream = await fetch(SBI_HISTORICAL, {
            headers: { 'User-Agent': 'rera-hub-mclr-refresh/1.0' },
          })
          const text = await upstream.text()
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.statusCode = upstream.status
          res.end(text)
        } catch (err) {
          res.statusCode = 502
          res.end(`Upstream MCLR fetch failed: ${err.message}`)
        }
      })
      server.middlewares.use('/api/sbi-mclr/current', async (_req, res) => {
        try {
          const upstream = await fetch(SBI_CURRENT, {
            headers: { 'User-Agent': 'rera-hub-mclr-refresh/1.0' },
          })
          const text = await upstream.text()
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.statusCode = upstream.status
          res.end(text)
        } catch (err) {
          res.statusCode = 502
          res.end(`Upstream MCLR fetch failed: ${err.message}`)
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), sbiMclrProxyPlugin()],
})
