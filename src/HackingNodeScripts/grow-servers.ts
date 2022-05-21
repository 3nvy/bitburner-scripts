import { NS } from '@ns'
import { ActiveServers, ServerInfo, GrowableServerInfo } from 'types'
import { getAvailableThreads, scriptDistribution } from 'lib/utils'

const SECURITY_INCREASE_STEP = 0.004
const PRINT_TEXT = 'GROWING SERVER'

const getServersToGrow = (
  ns: NS,
  serverList: ServerInfo[],
  maxThreads: number,
  activeServersList: ActiveServers
): GrowableServerInfo[] => {
  let threadsUsed = 0

  return serverList
    .filter(
      (server) =>
        server.canStillGrow &&
        !server.canStillBeWeaken &&
        !activeServersList[server.name]
    )
    .map((server) => {
      const growthAmountToMax = server.maxMoney / server.availableMoney
      const threadsRequired = Math.ceil(
        ns.growthAnalyze(server.name, growthAmountToMax)
      )
      return { ...server, threadsRequired }
    })
    .sort((a, b) => {
      if (a.threadsRequired < maxThreads && b.threadsRequired < maxThreads)
        return -1
      return a.threadsRequired - b.threadsRequired
    })
    .reduce((acc: GrowableServerInfo[], server) => {
      // Doesnt need more calculations if there aren't enough threads available anymore
      if (threadsUsed === maxThreads) return acc

      const threadsNeeded =
        threadsUsed + server.threadsRequired > maxThreads
          ? maxThreads - threadsUsed
          : server.threadsRequired

      const serverSecurityGrowAmount = SECURITY_INCREASE_STEP * threadsNeeded

      threadsUsed += threadsNeeded

      acc.push({
        serverName: server.name,
        threadsNeeded,
        serverSecurityGrowAmount,
      } as GrowableServerInfo)

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

  const serversToGrow = getServersToGrow(
    ns,
    hackableServers,
    maxThreadsForScript,
    activeServersList
  )

  await scriptDistribution(
    ns,
    script,
    rootedServers,
    serversToGrow,
    activeServersList,
    PRINT_TEXT,
    debug
  )
}
