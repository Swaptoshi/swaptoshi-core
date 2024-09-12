# `swaptoshi-core blockchain`

Commands relating to swaptoshi-core blockchain data.

- [`swaptoshi-core blockchain export`](#swaptoshi-core-blockchain-export)
- [`swaptoshi-core blockchain hash`](#swaptoshi-core-blockchain-hash)
- [`swaptoshi-core blockchain import FILEPATH`](#swaptoshi-core-blockchain-import-filepath)
- [`swaptoshi-core blockchain reset`](#swaptoshi-core-blockchain-reset)

## `swaptoshi-core blockchain export`

Export to <FILE>.

```
USAGE
  $ swaptoshi-core blockchain export [-d <value>] [-o <value>]

FLAGS
  -d, --data-path=<value>  Directory path to specify where node data is stored. Environment variable "KLAYR_DATA_PATH"
                           can also be used.
  -o, --output=<value>     The output directory. Default will set to current working directory.

DESCRIPTION
  Export to <FILE>.

EXAMPLES
  blockchain:export

  blockchain:export --data-path ./data --output ./my/path/
```

## `swaptoshi-core blockchain hash`

Generate SHA256 hash from <PATH>.

```
USAGE
  $ swaptoshi-core blockchain hash [-d <value>]

FLAGS
  -d, --data-path=<value>  Directory path to specify where node data is stored. Environment variable "KLAYR_DATA_PATH"
                           can also be used.

DESCRIPTION
  Generate SHA256 hash from <PATH>.

EXAMPLES
  blockchain:hash

  blockchain:hash --data-path ./data
```

## `swaptoshi-core blockchain import FILEPATH`

Import from <FILE>.

```
USAGE
  $ swaptoshi-core blockchain import [FILEPATH] [-d <value>] [-f]

ARGUMENTS
  FILEPATH  Path to the gzipped blockchain data.

FLAGS
  -d, --data-path=<value>  Directory path to specify where node data is stored. Environment variable "KLAYR_DATA_PATH"
                           can also be used.
  -f, --force              Delete and overwrite existing blockchain data

DESCRIPTION
  Import from <FILE>.

EXAMPLES
  blockchain:import ./path/to/blockchain.tar.gz

  blockchain:import ./path/to/blockchain.tar.gz --data-path ./klayr/

  blockchain:import ./path/to/blockchain.tar.gz --data-path ./klayr/ --force
```

## `swaptoshi-core blockchain reset`

Reset the blockchain data.

```
USAGE
  $ swaptoshi-core blockchain reset [-d <value>] [-y]

FLAGS
  -d, --data-path=<value>  Directory path to specify where node data is stored. Environment variable "KLAYR_DATA_PATH"
                           can also be used.
  -y, --yes                Skip confirmation prompt.

DESCRIPTION
  Reset the blockchain data.

EXAMPLES
  blockchain:reset

  blockchain:reset --data-path ./klayr

  blockchain:reset --yes
```
