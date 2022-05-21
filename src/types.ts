export type ServerRamInfo = {
  name: string
  maxRam: number
}

export type ServerInfo = {
  name: string
  securityLevel: number
  minSecurityLevel: number
  availableMoney: number
  maxMoney: number
  canStillGrow: boolean
  canStillBeWeaken: boolean
  hackingLevel: number
  maxRam: number
}

export type ActiveServers = {
  [name: string]: boolean
}

export type HackableServerInfo = {
  serverName: string
  threadsNeeded: number
  availableMoney: number
}

export type GrowableServerInfo = {
  serverName: string
  threadsNeeded: number
  serverSecurityGrowAmount: number
  availableMoney: 0
}

export type WeakenServerInfo = {
  serverName: string
  threadsNeeded: number
  availableMoney: 0
}
