import { NS } from '@ns'
import { ServerRamInfo, ActiveServers } from 'types'
import { getRootedServers, getHackableServers, parseNumber } from 'lib/utils'
import GrowServers from '/HackingNodeScripts/grow-servers'
import WeakServers from '/HackingNodeScripts/weak-servers'
import HackServers from '/HackingNodeScripts/hack-servers'
import BuyServers from '/HackingNodeScripts/buy-servers'
// import BuyScripts from '/HackingNodeScripts/buy-scripts' // HEAVY RAM USAGE
import RootServers from '/HackingNodeScripts/root-servers'
import BuyHackNodes from '/HackingNodeScripts/buy-nodes'

/**
 * LIST OF SCRIPTS TO RUN FOR EACH HACKING STAGE
 *
 * Order: [LOCAL SCRIPT, REMOTE SCRIPT]
 */

const HACK_SCRIPT = 'hack.js'
const GROW_SCRIPT = 'grow.js'
const WEAK_SCRIPT = 'weak.js'

/**
 * HOW MANY NODES YOU WANT THE SCRIPT TO HANDLE (BUY/UPGRADE)
 */
const MAX_NODES_TO_HANDLE = 3

/**
 * RANGE OF SERVER MEMORY THE SCRIPT IS ALLOWED TO BUY
 */
const SERVER_BUY_RANGE: [number, number] = [32768, 64]

/**
 * LOGIC TO RUN BEFORE THE SCRIPT PURPOSE, LIKE TRYING TO GAIN ROOT ACCESS TO MORE SERVERS
 * @param {*} ns
 */
const PRERUNNING_PHASE = async (ns: NS) => {
  // ROOT SERVERS
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: Module may not exist as part of easy disabling the module called w/t spending extra RAM
  typeof RootServers !== 'undefined' && (await RootServers(ns))
}

/**
 * LOGIC FOR BYUING STUFF LIKE SERVERS AND NODES
 * @param {*} ns
 */
const BUYING_PHASE = async (ns: NS, disabledServersList: ServerRamInfo[]) => {
  // BUY SCRIPTS
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: Module may not exist as part of easy disabling the module called w/t spending extra RAM
  typeof BuyScripts !== 'undefined' && (await BuyScripts(ns))

  // BUY SERVERS
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: Module may not exist as part of easy disabling the module called w/t spending extra RAM
  typeof BuyServers !== 'undefined' &&
    (await BuyServers(ns, disabledServersList, SERVER_BUY_RANGE))

  // BUY NODES
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: Module may not exist as part of easy disabling the module called w/t spending extra RAM
  typeof BuyHackNodes !== 'undefined' &&
    (await BuyHackNodes(ns, MAX_NODES_TO_HANDLE))
}

/**
 * LOGIC FOR HACKING / GROWING / WEAKEN SERVERS
 * @param {*} ns
 */
const HAKING_PHASE = async (
  ns: NS,
  activeServersList: ActiveServers = {},
  disabledServersList: ServerRamInfo[],
  debug: boolean
) => {
  const rootedServers = await getRootedServers(ns)
  const hackableServers = await getHackableServers(ns, rootedServers)

  /**
   * PORT SCANNING TO CHECK WHICH SERVERS ARE STILL BEING USED
   */
  let continueScan = true
  while (continueScan) {
    const finishedServer: string = ns.readPort(1)
    if (finishedServer === 'NULL PORT DATA') continueScan = false
    else {
      const serverData = finishedServer.split(':')
      const serverName = serverData[0]
      const isHack = !!serverData[1]
      const availableMoneyAtTime = +serverData[2]

      if (isHack) {
        const hackedServer = rootedServers.find(
          (server) => server.name === serverName
        )!
        const moneyTaken = parseNumber(
          Math.floor(availableMoneyAtTime - hackedServer.availableMoney)
        )
        const percentage = Math.floor(
          ((hackedServer.maxMoney - hackedServer.availableMoney) * 100) /
            hackedServer.maxMoney
        )
        ns.tprint(`NICKED $${moneyTaken} (${percentage}%) from ${serverName}`)
      }
      activeServersList[serverName] = false
    }
  }

  const enabledRootedServers = rootedServers
    .filter(
      (server) => !disabledServersList.find((s) => s.name === server.name)
    )
    .sort((a, b) => b.maxRam - a.maxRam)

  // CHECK IF CAN BE HACKED
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: Module may not exist as part of easy disabling the module called w/t spending extra RAM
  typeof HackServers !== 'undefined' &&
    (await HackServers(
      ns,
      HACK_SCRIPT,
      enabledRootedServers,
      hackableServers,
      activeServersList,
      debug
    ))

  // CHECK IF CAN BE GROWN
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: Module may not exist as part of easy disabling the module called w/t spending extra RAM
  typeof GrowServers !== 'undefined' &&
    (await GrowServers(
      ns,
      GROW_SCRIPT,
      enabledRootedServers,
      hackableServers,
      activeServersList,
      debug
    ))

  // CHECK IF CAN BE WEAKENED
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: Module may not exist as part of easy disabling the module called w/t spending extra RAM
  typeof WeakServers !== 'undefined' &&
    (await WeakServers(
      ns,
      WEAK_SCRIPT,
      enabledRootedServers,
      hackableServers,
      activeServersList,
      debug
    ))
}

export async function main(ns: NS): Promise<void> {
  const [debug] = ns.args
  const activeServersList: ActiveServers = {}
  const disabledServersList: ServerRamInfo[] = []

  while (true) {
    await PRERUNNING_PHASE(ns)

    await BUYING_PHASE(ns, disabledServersList)

    await HAKING_PHASE(
      ns,
      activeServersList,
      disabledServersList,
      debug as boolean
    )

    await ns.sleep(1000)
  }
}
