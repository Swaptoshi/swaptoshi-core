# `swaptoshi-core genesis-block`

Creates genesis block file.

- [`swaptoshi-core genesis-block create`](#swaptoshi-core-genesis-block-create)

## `swaptoshi-core genesis-block create`

Creates genesis block file.

```
USAGE
  $ swaptoshi-core genesis-block create -f <value> [-n <value>] [-c <value>] [-o <value>] [--export-json] [-h <value>] [-t
    <value>] [-p <value>]

FLAGS
  -c, --config=<value>             File path to a custom config. Environment variable "KLAYR_CONFIG_FILE" can also be
                                   used.
  -f, --assets-file=<value>        (required) Path to file which contains genesis block asset in JSON format
  -h, --height=<value>             Genesis block height
  -n, --network=<value>            [default: default] Default network config to use. Environment variable
                                   "KLAYR_NETWORK" can also be used.
  -o, --output=<value>             [default: config] Output folder path of the generated genesis block
  -p, --previous-block-id=<value>  Previous block id
  -t, --timestamp=<value>          Timestamp
  --export-json                    Export genesis block as JSON format along with blob

DESCRIPTION
  Creates genesis block file.

EXAMPLES
  genesis-block:create --output mydir

  genesis-block:create --output mydir --assets-file ./assets.json

  genesis-block:create --output mydir --assets-file ./assets.json --height 2 --timestamp 1592924699 --previous-block-id 085d7c9b7bddc8052be9eefe185f407682a495f1b4498677df1480026b74f2e9
```
