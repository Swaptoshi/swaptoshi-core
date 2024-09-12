# `swaptoshi-core transaction`

Commands relating to swaptoshi-core transactions.

- [`swaptoshi-core transaction create MODULE COMMAND FEE`](#swaptoshi-core-transaction-create-module-command-fee)
- [`swaptoshi-core transaction get ID`](#swaptoshi-core-transaction-get-id)
- [`swaptoshi-core transaction send TRANSACTION`](#swaptoshi-core-transaction-send-transaction)
- [`swaptoshi-core transaction sign TRANSACTION`](#swaptoshi-core-transaction-sign-transaction)

## `swaptoshi-core transaction create MODULE COMMAND FEE`

Create transaction which can be broadcasted to the network. Note: fee and amount should be in Beddows!!

```
USAGE
  $ swaptoshi-core transaction create [MODULE] [COMMAND] [FEE] [-p <value>] [-a <value>] [-j] [--send | [--offline
    --chain-id <value> --nonce <value>]] [--no-signature -s <value>] [-d <value>] [-k <value>] [--pretty] [-f <value>]

ARGUMENTS
  MODULE   Registered transaction module.
  COMMAND  Registered transaction command.
  FEE      Transaction fee in Beddows.

FLAGS
  -a, --params=<value>               Creates transaction with specific params information
  -d, --data-path=<value>            Directory path to specify where node data is stored. Environment variable
                                     "KLAYR_DATA_PATH" can also be used.
  -f, --file=<value>                 The file to upload.
                                     Example:
                                     --file=./myfile.json
  -j, --json                         Print the transaction in JSON format.
  -k, --key-derivation-path=<value>  [default: m/44'/134'/0'] Key derivation path to use to derive keypair from
                                     passphrase
  -p, --passphrase=<value>           Specifies a source for your secret passphrase. Command will prompt you for input if
                                     this option is not set.
                                     Examples:
                                     - --passphrase='my secret passphrase' (should only be used where security is not
                                     important)
  -s, --sender-public-key=<value>    Set a custom senderPublicKey property for the transaction, to be used when account
                                     address does not correspond to signer's private key
  --chain-id=<value>
  --no-signature                     Creates the transaction without a signature. Your passphrase will therefore not be
                                     required
  --nonce=<value>                    Nonce of the transaction.
  --offline                          Specify whether to connect to a local node or not.
  --pretty                           Prints JSON in pretty format rather than condensed.
  --send                             Create and immediately send transaction to a node

DESCRIPTION
  Create transaction which can be broadcasted to the network. Note: fee and amount should be in Beddows!!

EXAMPLES
  transaction:create token transfer 100000000 --params='{"amount":100000000,"tokenID":"0400000000000000","recipientAddress":"klyycz7hvr8yfu74bcwxy2n4mopfmjancgdvxq8xz","data":"send token"}'

  transaction:create token transfer 100000000 --params='{"amount":100000000,"tokenID":"0400000000000000","recipientAddress":"klyycz7hvr8yfu74bcwxy2n4mopfmjancgdvxq8xz","data":"send token"}' --json

  transaction:create token transfer 100000000 --offline --network mainnet --chain-id 10000000 --nonce 1 --params='{"amount":100000000,"tokenID":"0400000000000000","recipientAddress":"klyycz7hvr8yfu74bcwxy2n4mopfmjancgdvxq8xz","data":"send token"}'

  transaction:create token transfer 100000000 --file=/txn_params.json

  transaction:create token transfer 100000000 --file=/txn_params.json --json
```

## `swaptoshi-core transaction get ID`

Get transaction from local node by ID.

```
USAGE
  $ swaptoshi-core transaction get [ID] [-d <value>] [--pretty]

ARGUMENTS
  ID  Transaction ID in hex format.

FLAGS
  -d, --data-path=<value>  Directory path to specify where node data is stored. Environment variable "KLAYR_DATA_PATH"
                           can also be used.
  --pretty                 Prints JSON in pretty format rather than condensed.

DESCRIPTION
  Get transaction from local node by ID.

EXAMPLES
  transaction:get eab06c6a22e88bca7150e0347a7d976acd070cb9284423e6eabecd657acc1263
```

## `swaptoshi-core transaction send TRANSACTION`

Send transaction to the local node.

```
USAGE
  $ swaptoshi-core transaction send [TRANSACTION] [-d <value>] [--pretty]

ARGUMENTS
  TRANSACTION  A transaction to be sent to the node encoded as hex string

FLAGS
  -d, --data-path=<value>  Directory path to specify where node data is stored. Environment variable "KLAYR_DATA_PATH"
                           can also be used.
  --pretty                 Prints JSON in pretty format rather than condensed.

DESCRIPTION
  Send transaction to the local node.

EXAMPLES
  transaction:send 080810011880cab5ee012220fd061b9146691f3c56504be051175d5b76d1b1d0179c5c4370e18534c58821222a2408641214ab0041a7d3f7b2c290b5b834d46bdc7b7eb858151a0a73656e6420746f6b656e324028edd3601cdc35a41bb23415a0d9f3c3e9cf188d9971adf18742cea39d58aa84809aa87bcfe6feaac46211c80472ad9297fd87727709f5d7e7b4134caf106b02
```

## `swaptoshi-core transaction sign TRANSACTION`

Sign encoded transaction.

```
USAGE
  $ swaptoshi-core transaction sign [TRANSACTION] [-p <value>] [-j] [--offline --chain-id <value>] [--mandatory-keys
    <value>] [--optional-keys <value>] [-d <value>] [-k <value>] [--pretty]

ARGUMENTS
  TRANSACTION  The transaction to be signed encoded as hex string

FLAGS
  -d, --data-path=<value>            Directory path to specify where node data is stored. Environment variable
                                     "KLAYR_DATA_PATH" can also be used.
  -j, --json                         Print the transaction in JSON format.
  -k, --key-derivation-path=<value>  [default: m/44'/134'/0'] Key derivation path to use to derive keypair from
                                     passphrase
  -p, --passphrase=<value>           Specifies a source for your secret passphrase. Command will prompt you for input if
                                     this option is not set.
                                     Examples:
                                     - --passphrase='my secret passphrase' (should only be used where security is not
                                     important)
  --chain-id=<value>
  --mandatory-keys=<value>...        Mandatory publicKey string in hex format.
  --offline                          Specify whether to connect to a local node or not.
  --optional-keys=<value>...         Optional publicKey string in hex format.
  --pretty                           Prints JSON in pretty format rather than condensed.

DESCRIPTION
  Sign encoded transaction.

EXAMPLES
  transaction:sign <hex-encoded-binary-transaction>

  transaction:sign <hex-encoded-binary-transaction> --network testnet
```
