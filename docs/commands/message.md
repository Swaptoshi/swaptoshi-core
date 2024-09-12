# `swaptoshi-core message`

Decrypts a previously encrypted message using your the password used to encrypt.

- [`swaptoshi-core message decrypt [MESSAGE]`](#swaptoshi-core-message-decrypt-message)
- [`swaptoshi-core message encrypt [MESSAGE]`](#swaptoshi-core-message-encrypt-message)
- [`swaptoshi-core message sign [MESSAGE]`](#swaptoshi-core-message-sign-message)
- [`swaptoshi-core message verify PUBLICKEY SIGNATURE [MESSAGE]`](#swaptoshi-core-message-verify-publickey-signature-message)

## `swaptoshi-core message decrypt [MESSAGE]`

Decrypts a previously encrypted message using your the password used to encrypt.

```
USAGE
  $ swaptoshi-core message decrypt [MESSAGE] [-w <value>] [-m <value>]

ARGUMENTS
  MESSAGE  Encrypted message.

FLAGS
  -m, --message=<value>
      Specifies a source for providing a message to the command. If a string is provided directly as an argument, this
      option will be ignored. The message must be provided via an argument or via this option. Sources must be one of
      `file` or `stdin`. In the case of `file`, a corresponding identifier must also be provided.
      Note: if both secret passphrase and message are passed via stdin, the passphrase must be the first line.
      	Examples:
      - --message=file:/path/to/my/message.txt
      - --message="hello world"

  -w, --password=<value>
      Specifies a source for your secret password. Command will prompt you for input if this option is not set.
      	Examples:
      - --password=pass:password123 (should only be used where security is not important)

DESCRIPTION

  Decrypts a previously encrypted message using your the password used to encrypt.


EXAMPLES
  message:decrypt
```

## `swaptoshi-core message encrypt [MESSAGE]`

Encrypts a message with a password provided.

```
USAGE
  $ swaptoshi-core message encrypt [MESSAGE] [-w <value>] [-m <value>] [--pretty] [-s]

ARGUMENTS
  MESSAGE  Message to encrypt.

FLAGS
  -m, --message=<value>
      Specifies a source for providing a message to the command. If a string is provided directly as an argument, this
      option will be ignored. The message must be provided via an argument or via this option. Sources must be one of
      `file` or `stdin`. In the case of `file`, a corresponding identifier must also be provided.
      Note: if both secret passphrase and message are passed via stdin, the passphrase must be the first line.
      	Examples:
      - --message=file:/path/to/my/message.txt
      - --message="hello world"

  -s, --stringify
      Display encrypted message in stringified format

  -w, --password=<value>
      Specifies a source for your secret password. Command will prompt you for input if this option is not set.
      	Examples:
      - --password=pass:password123 (should only be used where security is not important)

  --pretty
      Prints JSON in pretty format rather than condensed.

DESCRIPTION

  Encrypts a message with a password provided.


EXAMPLES
  message:encrypt "Hello world"
```

## `swaptoshi-core message sign [MESSAGE]`

Signs a message using your secret passphrase.

```
USAGE
  $ swaptoshi-core message sign [MESSAGE] [-j] [--pretty] [-p <value>] [-m <value>]

ARGUMENTS
  MESSAGE  Message to sign.

FLAGS
  -j, --[no-]json
      Prints output in JSON format. You can change the default behavior in your config.json file.

  -m, --message=<value>
      Specifies a source for providing a message to the command. If a string is provided directly as an argument, this
      option will be ignored. The message must be provided via an argument or via this option. Sources must be one of
      `file` or `stdin`. In the case of `file`, a corresponding identifier must also be provided.
      Note: if both secret passphrase and message are passed via stdin, the passphrase must be the first line.
      	Examples:
      - --message=file:/path/to/my/message.txt
      - --message="hello world"

  -p, --passphrase=<value>
      Specifies a source for your secret passphrase. Command will prompt you for input if this option is not set.
      	Examples:
      - --passphrase='my secret passphrase' (should only be used where security is not important)

  --[no-]pretty
      Prints JSON in pretty format rather than condensed. Has no effect if the output is set to table. You can change the
      default behavior in your config.json file.

DESCRIPTION

  Signs a message using your secret passphrase.


EXAMPLES
  message:sign "Hello world"
```

## `swaptoshi-core message verify PUBLICKEY SIGNATURE [MESSAGE]`

Verifies a signature for a message using the signer’s public key.

```
USAGE
  $ swaptoshi-core message verify [PUBLICKEY] [SIGNATURE] [MESSAGE] [-j] [--pretty] [-m <value>]

ARGUMENTS
  PUBLICKEY  Public key of the signer of the message.
  SIGNATURE  Signature to verify.
  MESSAGE    Message to verify.

FLAGS
  -j, --[no-]json
      Prints output in JSON format. You can change the default behavior in your config.json file.

  -m, --message=<value>
      Specifies a source for providing a message to the command. If a string is provided directly as an argument, this
      option will be ignored. The message must be provided via an argument or via this option. Sources must be one of
      `file` or `stdin`. In the case of `file`, a corresponding identifier must also be provided.
      Note: if both secret passphrase and message are passed via stdin, the passphrase must be the first line.
      	Examples:
      - --message=file:/path/to/my/message.txt
      - --message="hello world"

  --[no-]pretty
      Prints JSON in pretty format rather than condensed. Has no effect if the output is set to table. You can change the
      default behavior in your config.json file.

DESCRIPTION

  Verifies a signature for a message using the signer’s public key.


EXAMPLES
  message:verify 647aac1e2df8a5c870499d7ddc82236b1e10936977537a3844a6b05ea33f9ef6 2a3ca127efcf7b2bf62ac8c3b1f5acf6997cab62ba9fde3567d188edcbacbc5dc8177fb88d03a8691ce03348f569b121bca9e7a3c43bf5c056382f35ff843c09 "Hello world"
```
