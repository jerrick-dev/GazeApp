export type GazeLog = {
  date: string
  used: boolean
  note: string
  updatedAt: string
}

export type GazeLogs = Record<string, GazeLog>
