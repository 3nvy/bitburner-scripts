import { NS } from '@ns'
import { ServerRamInfo } from 'types'

export default async function main(
  ns: NS,
  disabledServersList: ServerRamInfo[],
  [maxRam = 0, minRam = 0] = [32768, 256]
): Promise<void> {
  let loopCount = 0
  let enableDisableList = false
  let currentRam = maxRam
  let currentMoneyAvailable = ns.getServerMoneyAvailable('home')
  const maxServerOwnable = ns.getPurchasedServerLimit()
  const ownedServers: ServerRamInfo[] = ns
    .getPurchasedServers()
    .map((sn) => ({ name: sn, maxRam: ns.getServerMaxRam(sn) }))
    .sort((a, b) => a.maxRam - b.maxRam)

  let servers = ns.getPurchasedServers().length
  const tmpDisabledServersList: ServerRamInfo[] = []

  while (currentRam >= minRam) {
    const serverCost = ns.getPurchasedServerCost(currentRam)
    const canAffordServer = serverCost <= currentMoneyAvailable

    if (canAffordServer) {
      // If I reach the max amount of servers I can have
      if (servers + 1 > maxServerOwnable) {
        const serverToRemove = disabledServersList.length
          ? disabledServersList.shift()
          : ownedServers.find((s) => s.maxRam < currentRam)
        if (serverToRemove) {
          const removedServer = await ns.deleteServer(serverToRemove.name)
          if (removedServer) {
            await ns.purchaseServer(
              `pserv-${Date.now()}${loopCount}`,
              currentRam
            )

            ns.tprint('# # # # # # # # #')
            ns.tprint(
              `Buy Server ${currentRam} -> Remove ${serverToRemove.maxRam}`
            )
            ns.tprint('# # # # # # # # #')
            ns.tprint('')
          } else {
            // Add to list of protected servers to remove next time they have no scripts running
            enableDisableList = true
            tmpDisabledServersList.push(serverToRemove)
          }

          const indexOfServer = ownedServers.findIndex(
            (bs) => bs.name === serverToRemove.name
          )
          ownedServers.splice(indexOfServer, 1)
          currentMoneyAvailable -= serverCost
        } else {
          currentRam /= 2
        }
      }
      // Else Buy Server
      else {
        await ns.purchaseServer(`pserv-${Date.now()}${loopCount}`, currentRam)
        currentMoneyAvailable -= serverCost
        servers++
      }
    } else {
      currentRam /= 2
    }

    loopCount++
  }

  disabledServersList.push(...tmpDisabledServersList)
  disabledServersList.sort((a, b) => a.maxRam - b.maxRam)

  // Povided no new item was added to the disabledList, and we went trough it, now that we have no more money, remove the list
  if (!enableDisableList)
    disabledServersList.splice(0, disabledServersList.length)
}
