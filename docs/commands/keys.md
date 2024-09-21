# `swaptoshi-core keys`

Commands relating to swaptoshi-core key generation.

- [`swaptoshi-core keys create`](#swaptoshi-core-keys-create)
- [`swaptoshi-core keys encrypt`](#swaptoshi-core-keys-encrypt)
- [`swaptoshi-core keys export`](#swaptoshi-core-keys-export)
- [`swaptoshi-core keys import`](#swaptoshi-core-keys-import)

## `swaptoshi-core keys create`

Return keys corresponding to the given passphrase.

```
USAGE
  $ swaptoshi-core keys create [-o <value>] [-p <value>] [-n] [-w <value>] [-c <value>] [-f <value>] [-i <value>]
    [--add-legacy]

FLAGS
  -c, --count=<value>       [default: 1] Number of keys to create
  -f, --offset=<value>      Offset for the key derivation path
  -i, --chainid=<value>     Chain id
  -n, --no-encrypt          No encrypted message object to be created
  -o, --output=<value>      The output directory. Default will set to current working directory.
  -p, --passphrase=<value>  Specifies a source for your secret passphrase. Command will prompt you for input if this
                            option is not set.
                            Examples:
                            - --passphrase='my secret passphrase' (should only be used where security is not important)
  -w, --password=<value>    Specifies a source for your secret password. Command will prompt you for input if this
                            option is not set.
                            Examples:
                            - --password=pass:password123 (should only be used where security is not important)
  --add-legacy              Add legacy key derivation path to the result

DESCRIPTION
  Return keys corresponding to the given passphrase.

EXAMPLES
  keys:create

  keys:create --passphrase your-passphrase

  keys:create --passphrase your-passphrase --no-encrypt

  keys:create --passphrase your-passphrase --password your-password

  keys:create --passphrase your-passphrase --password your-password --count 2

  keys:create --passphrase your-passphrase --no-encrypt --count 2 --offset 1

  keys:create --passphrase your-passphrase --no-encrypt --count 2 --offset 1 --chainid 1

  keys:create --passphrase your-passphrase --password your-password --count 2 --offset 1 --chainid 1 --output /mypath/keys.json
```

## `swaptoshi-core keys encrypt`

Encrypt keys from a file and overwrite the file

```
USAGE
  $ swaptoshi-core keys encrypt -f <value> [-w <value>]

FLAGS
  -f, --file-path=<value>  (required) Path of the file to encrypt from
  -w, --password=<value>   Specifies a source for your secret password. Command will prompt you for input if this option
                           is not set.
                           Examples:
                           - --password=pass:password123 (should only be used where security is not important)

DESCRIPTION
  Encrypt keys from a file and overwrite the file

EXAMPLES
  keys:encrypt --file-path ./my/path/keys.json

  keys:encrypt --file-path ./my/path/keys.json --password mypass
```

## `swaptoshi-core keys export`

Export to <FILE>.

```
USAGE
  $ swaptoshi-core keys export [-d <value>] [--pretty] [-o <value>]

FLAGS
  -d, --data-path=<value>  Directory path to specify where node data is stored. Environment variable "KLAYR_DATA_PATH"
                           can also be used.
  -o, --output=<value>     The output directory. Default will set to current working directory.
  --pretty                 Prints JSON in pretty format rather than condensed.

DESCRIPTION
  Export to <FILE>.

EXAMPLES
  keys:export --output /mypath/keys.json

  keys:export --output /mypath/keys.json --data-path ./data
```

## `swaptoshi-core keys import`

Import from <FILE>.

```
USAGE
  $ swaptoshi-core keys import -f <value> [-d <value>] [--pretty]

FLAGS
  -d, --data-path=<value>  Directory path to specify where node data is stored. Environment variable "KLAYR_DATA_PATH"
                           can also be used.
  -f, --file-path=<value>  (required) Path of the file to import from
  --pretty                 Prints JSON in pretty format rather than condensed.

DESCRIPTION
  Import from <FILE>.

EXAMPLES
  keys:import --file-path ./my/path/keys.json

  keys:import --file-path ./my/path/keys.json --data-path ./data
```
