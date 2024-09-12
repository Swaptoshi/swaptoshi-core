# `swaptoshi-core console`

swaptoshi-core interactive REPL session to run commands.

- [`swaptoshi-core console`](#swaptoshi-core-console)

## `swaptoshi-core console`

Klayr interactive REPL session to run commands.

```
USAGE
  $ swaptoshi-core console [--api-ipc <value> | --api-ws <value>]

FLAGS
  --api-ipc=<value>  Enable api-client with IPC communication.
  --api-ws=<value>   Enable api-client with Websocket communication.

DESCRIPTION
  Klayr interactive REPL session to run commands.

EXAMPLES
  console

  console --api-ws=ws://localhost:8080

  console --api-ipc=/path/to/server
```

_See code: [dist/commands/console.ts](https://github.com/Swaptoshi/swaptoshi-core/blob/v1.0.0-alpha.0/dist/commands/console.ts)_
