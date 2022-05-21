import { NS } from '@ns'
import { getAvailableThreads, scriptDistribution } from 'lib/utils'
import { ActiveServers, ServerInfo, WeakenServerInfo } from 'types'

const WEAK_STEP = 0.05
const PRINT_TEXT = 'WEAKING SERVER'

const getServersToWeak = (
  ns: NS,
  serverList: ServerInfo[],
  maxThreads: number,
  activeServersList: ActiveServers
): WeakenServerInfo[] => {
  let threadsUsed = 0

  return serverList
    .filter(
      (server) => server.canStillBeWeaken && !activeServersList[server.name]
    )
    .map((server) => {
      const threadsRequired = Math.ceil(
        (server.securityLevel - server.minSecurityLevel) / WEAK_STEP
      )
      return { ...server, threadsRequired }
    })
    .sort((a, b) => {
      if (a.threadsRequired < maxThreads && b.threadsRequired < maxThreads)
        return -1
      return a.threadsRequired - b.threadsRequired
    })
    .reduce((acc: WeakenServerInfo[], server) => {
      // Doesnt need more calculations if there aren't enough threads available anymore
      if (threadsUsed === maxThreads) return acc

      const threadsNeeded =
        threadsUsed + server.threadsRequired > maxThreads
          ? maxThreads - threadsUsed
          : server.threadsRequired

      threadsUsed += threadsNeeded

      acc.push({ serverName: server.name, threadsNeeded } as WeakenServerInfo)

      return acc
    }, [])
}

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
  const serversToWeak = getServersToWeak(
    ns,
    hackableServers,
    maxThreadsForScript,
    activeServersList
  )

  await scriptDistribution(
    ns,
    script,
    rootedServers,
    serversToWeak,
    activeServersList,
    PRINT_TEXT,
    debug
  )
}
