import { execFileSync, spawn } from 'node:child_process'

const binaryPath = '/home/aprog/Documents/works/tech_fix_pro/dist-electron/cam/linux-unpacked/tech-fix-pro-edition-cam'
const currentPid = process.pid
const parentPid = process.ppid

function listMatchingPids() {
  const output = execFileSync('ps', ['-eo', 'pid=,args='], { encoding: 'utf8' })

  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const firstSpace = line.indexOf(' ')
      if (firstSpace === -1) return null

      const pid = Number(line.slice(0, firstSpace).trim())
      const args = line.slice(firstSpace + 1)

      if (!Number.isInteger(pid)) return null
      if (pid === currentPid || pid === parentPid) return null
      if (!args.startsWith(binaryPath)) return null

      return pid
    })
    .filter((pid) => pid !== null)
}

for (const pid of listMatchingPids()) {
  try {
    process.kill(pid, 'SIGTERM')
  } catch {
    // Ignore races: process may already be gone.
  }
}

const child = spawn(binaryPath, ['--no-sandbox'], {
  stdio: 'inherit',
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})
