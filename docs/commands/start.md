# `swaptoshi-core start`

Start Blockchain Node.

- [`swaptoshi-core start`](#swaptoshi-core-start)

## `swaptoshi-core start`

Start Blockchain Node.

```
USAGE
  $ swaptoshi-core start [-d <value>] [-n <value>] [-c <value>] [--overwrite-config] [-p <value>]
    [--api-ipc] [--api-ws] [--api-http] [--api-port <value>] [--api-host <value>] [-l trace|debug|info|warn|error|fatal]
    [--seed-peers <value>] [--enable-generator-plugin] [--monitor-plugin-port <value> --enable-monitor-plugin]
    [--monitor-plugin-whitelist <value> ] [--enable-report-misbehavior-plugin] [--faucet-plugin-port <value>
    --enable-faucet-plugin] [--dashboard-plugin-port <value> --enable-dashboard-plugin]
    [--enable-chain-connector-plugin]

FLAGS
  -c, --config=<value>                File path to a custom config. Environment variable "KLAYR_CONFIG_FILE" can also be
                                      used.
  -d, --data-path=<value>             Directory path to specify where node data is stored. Environment variable
                                      "KLAYR_DATA_PATH" can also be used.
  -l, --log=<option>                  Log level. Environment variable "KLAYR_LOG_LEVEL" can also be used.
                                      <options: trace|debug|info|warn|error|fatal>
  -n, --network=<value>               [default: default] Default network config to use. Environment variable
                                      "KLAYR_NETWORK" can also be used.
  -p, --port=<value>                  Open port for the peer to peer incoming connections. Environment variable
                                      "KLAYR_PORT" can also be used.
  --api-host=<value>                  Host to be used for api-client. Environment variable "KLAYR_API_HOST" can also be
                                      used.
  --api-http                          Enable HTTP communication for api-client. Environment variable "KLAYR_API_HTTP"
                                      can also be used.
  --api-ipc                           Enable IPC communication. This will load plugins as a child process and
                                      communicate over IPC. Environment variable "KLAYR_API_IPC" can also be used.
  --api-port=<value>                  Port to be used for api-client. Environment variable "KLAYR_API_PORT" can also be
                                      used.
  --api-ws                            Enable websocket communication for api-client. Environment variable "KLAYR_API_WS"
                                      can also be used.
  --dashboard-plugin-port=<value>     Port to be used for Dashboard Plugin. Environment variable
                                      "KLAYR_DASHBOARD_PLUGIN_PORT" can also be used.
  --enable-chain-connector-plugin     Enable ChainConnector Plugin. Environment variable
                                      "KLAYR_ENABLE_CHAIN_CONNECTOR_PLUGIN" can also be used.
  --enable-dashboard-plugin           Enable Dashboard Plugin. Environment variable "KLAYR_ENABLE_DASHBOARD_PLUGIN" can
                                      also be used.
  --enable-faucet-plugin              Enable Faucet Plugin. Environment variable "KLAYR_ENABLE_FAUCET_PLUGIN" can also
                                      be used.
  --enable-generator-plugin           Enable Forger Plugin. Environment variable "KLAYR_ENABLE_FORGER_PLUGIN" can also
                                      be used.
  --enable-monitor-plugin             Enable Monitor Plugin. Environment variable "KLAYR_ENABLE_MONITOR_PLUGIN" can also
                                      be used.
  --enable-report-misbehavior-plugin  Enable ReportMisbehavior Plugin. Environment variable
                                      "KLAYR_ENABLE_REPORT_MISBEHAVIOR_PLUGIN" can also be used.
  --faucet-plugin-port=<value>        Port to be used for Faucet Plugin. Environment variable "KLAYR_FAUCET_PLUGIN_PORT"
                                      can also be used.
  --monitor-plugin-port=<value>       Port to be used for Monitor Plugin. Environment variable
                                      "KLAYR_MONITOR_PLUGIN_PORT" can also be used.
  --monitor-plugin-whitelist=<value>  List of IPs in comma separated value to allow the connection. Environment variable
                                      "KLAYR_MONITOR_PLUGIN_WHITELIST" can also be used.
  --overwrite-config                  Overwrite network configs if they exist already
  --seed-peers=<value>                Seed peers to initially connect to in format of comma separated "ip:port". IP can
                                      be DNS name or IPV4 format. Environment variable "KLAYR_SEED_PEERS" can also be
                                      used.

DESCRIPTION
  Start Blockchain Node.

EXAMPLES
  start

  start --network devnet --data-path /path/to/data-dir --log debug

  start --network devnet --api-ws

  start --network devnet --api-ws --api-port 8888

  start --network devnet --port 9000

  start --network devnet --port 9002 --seed-peers 127.0.0.1:9001,127.0.0.1:9000

  start --network testnet --overwrite-config

  start --network testnet --config ~/my_custom_config.json
```

_See code: [dist/commands/start.ts](https://github.com/Swaptoshi/swaptoshi-core/blob/v1.0.0-alpha.0/dist/commands/start.ts)_
