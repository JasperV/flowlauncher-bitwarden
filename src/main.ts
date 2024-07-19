import { Flow } from "./lib/flow"
import { z } from "zod"
import { exec } from 'child_process'
import childProcess from "child_process"
import logger from './lib/logger'

const events = ["copy"] as const
type Events = (typeof events)[number]

const flow = new Flow<Events>("assets/bitwarden.png")

// bw login <email> "<password>" --method 0 --code <totp-code> --raw

flow.on("query", (params) => {
  const [query] = z.array(z.string()).parse(params)

  if (query.length < 2) return flow.showResult({
    title: "Searching...",
    method: "copy"
  })

  exec(`bw list items --search "${query}" --session "${flow.settings.sessionKey}"`, function (error, stdout, stderr) {
    const results = JSON.parse(stdout).map((result: any) => {
      return {
        title: result.name,
        subtitle: result.login.username,
        method: "copy",
        parameters: [result.login.password],
        context: { id: result.id, session: flow.settings.sessionKey }
      }
    })

    flow.showResult(...results)
  })
})

flow.on("context_menu", (params) => {
  const [options] = z.array(z.object({ id: z.string(), session: z.string() })).parse(params)

  exec(`bw get totp "${options.id}" --session "${options.session}"`, function (error, stdout, stderr) {
    flow.showResult({
      title: 'Copy TOTP',
      subtitle: stdout,
      method: "copy",
      parameters: [stdout],
    })
  })
})

flow.on("copy", (params) => {
  const [password] = z.array(z.string()).parse(params)

  childProcess.spawn("clip").stdin?.end(password)
})

flow.run()
