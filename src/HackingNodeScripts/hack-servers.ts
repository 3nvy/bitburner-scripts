import { NS } from '@ns'
import { ActiveServers, ServerInfo, HackableServerInfo } from 'types'
import { getAvailableThreads, scriptDistribution } from 'lib/utils'

const PRINT_TEXT = 'HACKING SERVER'

const getServersToHack = (
  ns: NS,
  serverList: ServerInfo[],
  maxThreads: number,
  activeServersList: ActiveServers
): HackableServerInfo[] => {
  let threadsUsed = 0

  return serverList
    .filter(
      (server) =>
        !server.canStillGrow &&
        !server.canStillBeWeaken &&
        !activeServersList[server.name]
    )
    .map((server) => {
      const threadsRequired = ns.hackAnalyzeThreads(
        server.name,
        server.availableMoney - (server.maxMoney - server.maxMoney * 0.75)
      )
      return { ...server, threadsRequired }
    })
    .sort((a, b) => {
      if (a.threadsRequired < maxThreads && b.threadsRequired < maxThreads)
        return -1
      return a.threadsRequired - b.threadsRequired
    })
    .reduce((acc: HackableServerInfo[], server) => {
      // Doesnt need more calculations if there aren't enough threads available anymore
      if (threadsUsed === maxThreads) return acc

      const threadsNeeded =
        threadsUsed + server.threadsRequired > maxThreads
          ? maxThreads - threadsUsed
          : server.threadsRequired

      threadsUsed += threadsNeeded

      acc.push({
        serverName: server.name,
        threadsNeeded,
        availableMoney: server.availableMoney,
      } as HackableServerInfo)

      return acc
    }, [])
}

/** @param {NS} ns **/
export default async function main(
  ns: NS,
  script: string,
  rootedServers: ServerInfo[],
  hackableServers: ServerInfo[],
  activeServersList: ActiveServers,
  debug: boolean
): Promise<void> {
  const maxThreadsForScript = await getAvailableThreads(
    ns,
    script,
    rootedServers
  )
  const serversToHack = getServersToHack(
    ns,
    hackableServers,
    maxThreadsForScript,
    activeServersList
  )

  await scriptDistribution(
    ns,
    script,
    rootedServers,
    serversToHack,
    activeServersList,
    PRINT_TEXT,
    debug
  )
}
