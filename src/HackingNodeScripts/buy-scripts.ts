import { NS } from '@ns'
import { emulateTerminalAction } from 'lib/utils'

export default async function main(ns: NS): Promise<void> {
  const hackingPrograms = [
    { price: 0, name: 'BruteSSH.exe' },
    { price: 1500000, name: 'FTPCrack.exe' },
    { price: 5000000, name: 'relaySMTP.exe' },
    { price: 30000000, name: 'HTTPWorm.exe' },
    { price: 250000000, name: 'SQLInject.exe' },
    { price: 500000, name: 'ServerProfiler.exe' },
    { price: 500000, name: 'DeepscanV1.exe' },
    { price: 25000000, name: 'DeepscanV2.exe' },
    { price: 1000000, name: 'AutoLink.exe' },
  ].filter((program) => !ns.fileExists(program.name))

  if (!hackingPrograms.length) return

  const servers = ns.scan('home')
  if (servers.includes('darkweb')) {
    let currentMoneyAvailable = ns.getServerMoneyAvailable('home')
    for (const program of hackingPrograms) {
      if (program.price <= currentMoneyAvailable) {
        emulateTerminalAction(`buy ${program.name}`)
        currentMoneyAvailable -= program.price
        ns.tprint(`BOUGHT SCRIPT: ${program.name}`)
      }
    }
  } else {
    try {
      await ns.singularity.purchaseTor()
      // eslint-disable-next-line no-empty
    } catch (err) {}
  }
}
