import { NS } from '@ns'

export default async function main(ns: NS, maxNodes = 0): Promise<void> {
  // const moneyThreshold = 100000;
  let currentMoneyAvailable = ns.getServerMoneyAvailable('home')
  let continueToUpgrade = true

  while (maxNodes && continueToUpgrade) {
    const availableNodes = ns.hacknet.numNodes()

    if (availableNodes) {
      //Logic
      const nodesToInspect = Math.min(availableNodes, maxNodes)

      for (let i = 0; i < nodesToInspect; i++) {
        const costToLevelUp = ns.hacknet.getLevelUpgradeCost(i, 1)
        if (currentMoneyAvailable >= costToLevelUp) {
          await ns.hacknet.upgradeLevel(i, 1)
          currentMoneyAvailable -= costToLevelUp
          break
        }

        const costToUpgradeCores = ns.hacknet.getCoreUpgradeCost(i, 1)
        if (currentMoneyAvailable >= costToUpgradeCores) {
          await ns.hacknet.upgradeCore(i, 1)
          currentMoneyAvailable -= costToUpgradeCores
          break
        }

        const costToUpgradeRam = ns.hacknet.getRamUpgradeCost(i, 1)
        if (currentMoneyAvailable >= costToUpgradeRam) {
          await ns.hacknet.upgradeRam(i, 1)
          currentMoneyAvailable -= costToUpgradeRam
          break
        }

        if (i + 1 === nodesToInspect) {
          continueToUpgrade = false
        }
      }
    } else {
      continueToUpgrade = false
    }

    if (!continueToUpgrade) {
      // Buy Node
      const priceToBuyNode = ns.hacknet.getPurchaseNodeCost()
      if (
        availableNodes + 1 <= maxNodes &&
        currentMoneyAvailable >= priceToBuyNode
      ) {
        await ns.hacknet.purchaseNode()
        continueToUpgrade = true
      }
    }
  }
}
