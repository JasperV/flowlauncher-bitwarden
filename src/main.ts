import { Flow } from "./lib/flow"
import { z } from "zod"
import { exec } from 'child_process'
import childProcess from "child_process"

const events = ["copy"] as const
type Events = (typeof events)[number]

const flow = new Flow<Events>("assets/bitwarden.png")

// bw login <email> "<password>" --method 0 --code <totp-code> --raw

flow.on("query", (params) => {
  const [query] = z.array(z.string()).parse(params)

  exec(`bw list items --search ${query} --session ${flow.settings.sessionKey}`, function (error, stdout, stderr) {
    const results = JSON.parse(stdout).map(result => {
      return {
        title: result.name,
        subtitle: result.login.username,
        method: "copy",
        parameters: [result.login.password]
      }
    })

    flow.showResult(...results)
  })
})

flow.on("copy", (params) => {
  const [password] = z.array(z.string()).parse(params)

  // exec(`bw get password --itemid ${itemId} --raw --session ${flow.settings.sessionKey}`, function (error, stdout, stderr) {
  childProcess.spawn("clip").stdin?.end(password)
  // }
})

flow.run()
