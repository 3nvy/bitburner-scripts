import { NS } from '@ns'
import { getServers } from 'lib/utils.js'

export default async function main(ns: NS): Promise<void> {
  const hackingPrograms = [
    'BruteSSH',
    'FTPCrack',
    'relaySMTP',
    'HTTPWorm',
    'SQLInject',
  ].filter((prog) => ns.fileExists(`${prog}.exe`))

  const servers = getServers(ns)

  for (const server of servers) {
    if (!ns.hasRootAccess(server.name)) {
      const serverNumPortsRequired = ns.getServerNumPortsRequired(server.name)

      for (const program of hackingPrograms) {
        // @ts-expect-error: Assumes program string always references a valid method inside ns
        await ns[program.toLowerCase()](server.name)
      }

      if (serverNumPortsRequired <= hackingPrograms.length) {
        await ns.nuke(server.name)
        ns.tprint(`ROOT ACCESS GAINED AT: ${server.name}`)
      }
    }
  }
}
