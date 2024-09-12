# `swaptoshi-core hash-onion`

Create hash onions to be used by the forger.

- [`swaptoshi-core hash-onion`](#swaptoshi-core-hash-onion)

## `swaptoshi-core hash-onion`

Create hash onions to be used by the forger.

```
USAGE
  $ swaptoshi-core hash-onion [-o <value>] [-c <value>] [-d <value>] [--pretty]

FLAGS
  -c, --count=<value>     [default: 1000000] Total number of hashes to produce
  -d, --distance=<value>  [default: 1000] Distance between each hash
  -o, --output=<value>    Output file path
  --pretty                Prints JSON in pretty format rather than condensed.

DESCRIPTION
  Create hash onions to be used by the forger.

EXAMPLES
  hash-onion --count=1000000 --distance=2000 --pretty

  hash-onion --count=1000000 --distance=2000 --output ~/my_onion.json
```

_See code: [dist/commands/hash-onion.ts](https://github.com/Swaptoshi/swaptoshi-core/blob/v1.0.0-alpha.0/dist/commands/hash-onion.ts)_
