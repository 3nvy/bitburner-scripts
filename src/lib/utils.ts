import { NS } from '@ns'
import {
  ActiveServers,
  ServerInfo,
  HackableServerInfo,
  GrowableServerInfo,
  WeakenServerInfo,
} from 'types'

const getServerInfo =
  (ns: NS) =>
  (server: string): ServerInfo => ({
    name: server,
    securityLevel: ns.getServerSecurityLevel(server),
    minSecurityLevel: ns.getServerMinSecurityLevel(server),
    availableMoney: ns.getServerMoneyAvailable(server),
    maxMoney: ns.getServerMaxMoney(server),
    canStillGrow:
      ns.getServerMaxMoney(server) - ns.getServerMoneyAvailable(server) >
      ns.getServerMaxMoney(server) * 0.05,
    canStillBeWeaken:
      ns.getServerSecurityLevel(server) - ns.getServerMinSecurityLevel(server) >
      1,
    hackingLevel: ns.getServerRequiredHackingLevel(server),
    maxRam: ns.getServerMaxRam(server),
  })

export const getServers = (ns: NS): ServerInfo[] => {
  const servers = new Set(ns.scan('home'))

  for (const server of servers) {
    ns.scan(server).forEach(
      (newServer) => newServer !== 'home' && servers.add(newServer)
    )
  }

  return [...servers].map(getServerInfo(ns))
}

export const getRootedServers = (
  ns: NS,
  serverList?: ServerInfo[]
): ServerInfo[] => {
  const servers = serverList || getServers(ns)

  return servers.filter((server) => ns.hasRootAccess(server.name))
}

export const getHackableServers = (
  ns: NS,
  serverList: ServerInfo[]
): ServerInfo[] => {
  const servers = serverList || getRootedServers(ns)

  return servers.filter(
    (server) =>
      ns.getHackingLevel() >= server.hackingLevel && server.availableMoney
  )
}

export const getAvailableThreads = (
  ns: NS,
  script: string,
  serverList: ServerInfo[]
): number => {
  const servers = serverList || getRootedServers(ns)
  const scriptCost = ns.getScriptRam(script)

  return servers.reduce((acc, server) => {
    const serverAvailableRam =
      ns.getServerMaxRam(server.name) - ns.getServerUsedRam(server.name)
    const maxNumThreadsOnServer = Math.floor(serverAvailableRam / scriptCost)
    return acc + maxNumThreadsOnServer
  }, 0)
}

export const scriptDistribution = async (
  ns: NS,
  script: string,
  rootedServers: ServerInfo[],
  hackableServers:
    | HackableServerInfo[]
    | GrowableServerInfo[]
    | WeakenServerInfo[],
  activeServersList: ActiveServers,
  printText: string,
  debug: boolean
): Promise<void> => {
  const scriptRamRequired = ns.getScriptRam(script)

  for (const server of rootedServers) {
    let threadsRunning = 0

    const serverAvailableRam =
      ns.getServerMaxRam(server.name) - ns.getServerUsedRam(server.name)
    const maxNumThreads = Math.floor(serverAvailableRam / scriptRamRequired)

    for (const _server of hackableServers) {
      if (threadsRunning === maxNumThreads) break

      const { serverName, threadsNeeded, availableMoney = 0 } = _server

      if (!threadsNeeded || activeServersList[serverName]) continue

      const numThreads =
        threadsRunning + threadsNeeded > maxNumThreads
          ? maxNumThreads - threadsRunning
          : threadsNeeded

      threadsRunning += numThreads
      _server.threadsNeeded -= numThreads

      if (!_server.threadsNeeded) {
        activeServersList[serverName] = true
        if (debug) ns.tprint(`${printText}: ${serverName}`)
      }

      await ns.scp(script, server.name)
      await ns.exec(
        script,
        server.name,
        numThreads,
        serverName,
        !_server.threadsNeeded,
        availableMoney
      )
    }
  }
}

export const emulateTerminalAction = (input: string): void => {
  const terminalEl = eval('document').querySelector('#terminal-input')
  const propsKey = Object.keys(terminalEl)[1]

  terminalEl[propsKey].onChange({ target: { value: input } })
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  terminalEl[propsKey].onKeyDown({ keyCode: 13, preventDefault: () => {} })
}

export const parseNumber = (x: number): string => {
  const parts = x.toString().split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return parts.join(',')
}
