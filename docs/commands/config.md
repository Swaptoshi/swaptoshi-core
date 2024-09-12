# `swaptoshi-core config`

Commands relating to swaptoshi-core node configuration.

- [`swaptoshi-core config create`](#swaptoshi-core-config-create)
- [`swaptoshi-core config show`](#swaptoshi-core-config-show)

## `swaptoshi-core config create`

Creates network configuration file.

```
USAGE
  $ swaptoshi-core config create -i <value> [-o <value>] [-l <value>]

FLAGS
  -i, --chain-id=<value>  (required) ChainID in hex format. For example, Klayr mainnet mainchain is 00000000
  -l, --label=<value>     [default: beta-sdk-app] App Label
  -o, --output=<value>    [default: /Users/aldhosutra/Documents/Swaptoshi/swaptoshi-core] Directory where the config
                          file is saved

DESCRIPTION
  Creates network configuration file.

EXAMPLES
  config:create --output mydir

  config:create --output mydir --label beta-sdk-app

  config:create --output mydir --label beta-sdk-app --community-identifier sdk
```

## `swaptoshi-core config show`

Show application config.

```
USAGE
  $ swaptoshi-core config show [-d <value>] [-c <value>] [--pretty]

FLAGS
  -c, --config=<value>     File path to a custom config. Environment variable "KLAYR_CONFIG_FILE" can also be used.
  -d, --data-path=<value>  Directory path to specify where node data is stored. Environment variable "KLAYR_DATA_PATH"
                           can also be used.
  --pretty                 Prints JSON in pretty format rather than condensed.

DESCRIPTION
  Show application config.

EXAMPLES
  config:show

  config:show --pretty

  config:show --config ./custom-config.json --data-path ./data
```
