# `swaptoshi-core endpoint`

Commands relating to swaptoshi-core endpoint.

- [`swaptoshi-core endpoint invoke ENDPOINT [PARAMS]`](#swaptoshi-core-endpoint-invoke-endpoint-params)

## `swaptoshi-core endpoint invoke ENDPOINT [PARAMS]`

Invokes the provided endpoint.

```
USAGE
  $ swaptoshi-core endpoint invoke [ENDPOINT] [PARAMS] [-d <value>] [--pretty] [-f <value>]

ARGUMENTS
  ENDPOINT  Endpoint to invoke
  PARAMS    Endpoint parameters (Optional)

FLAGS
  -d, --data-path=<value>  Directory path to specify where node data is stored. Environment variable "KLAYR_DATA_PATH"
                           can also be used.
  -f, --file=<value>       Input file.
  --pretty                 Prints JSON in pretty format rather than condensed.

DESCRIPTION
  Invokes the provided endpoint.

EXAMPLES
  endpoint:invoke {endpoint} {parameters}

  endpoint:invoke --data-path --file

  endpoint:invoke generator_getAllKeys

  endpoint:invoke consensus_getBFTParameters '{"height": 2}' -d ~/.klayr/pos-mainchain --pretty

  endpoint:invoke consensus_getBFTParameters -f ./input.json
```
