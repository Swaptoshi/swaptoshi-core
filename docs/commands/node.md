# `swaptoshi-core node`

Get node information from a running application.

- [`swaptoshi-core node info`](#swaptoshi-core-node-info)
- [`swaptoshi-core node metadata`](#swaptoshi-core-node-metadata)

## `swaptoshi-core node info`

Get node information from a running application.

```
USAGE
  $ swaptoshi-core node info [-d <value>] [--pretty]

FLAGS
  -d, --data-path=<value>  Directory path to specify where node data is stored. Environment variable "KLAYR_DATA_PATH"
                           can also be used.
  --pretty                 Prints JSON in pretty format rather than condensed.

DESCRIPTION
  Get node information from a running application.

EXAMPLES
  system:node-info

  system:node-info --data-path ./klayr
```

## `swaptoshi-core node metadata`

Get node metadata from a running application.

```
USAGE
  $ swaptoshi-core node metadata [-d <value>] [--pretty]

FLAGS
  -d, --data-path=<value>  Directory path to specify where node data is stored. Environment variable "KLAYR_DATA_PATH"
                           can also be used.
  --pretty                 Prints JSON in pretty format rather than condensed.

DESCRIPTION
  Get node metadata from a running application.

EXAMPLES
  system:metadata

  system:metadata --data-path ./klayr
```
