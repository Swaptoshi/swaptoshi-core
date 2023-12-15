![Logo](./docs/assets/banner_core.png)

# Swaptoshi Core

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](http://www.apache.org/licenses/LICENSE-2.0)
![GitHub repo size](https://img.shields.io/github/repo-size/swaptoshi/swaptoshi-core)

Swaptoshi is a Fair-Launched, Community-Driven, Lisk Decentralized Exchange Protocol.

Swaptoshi Core is the program that implements the Swaptoshi Protocol. In other words, Swaptoshi Core is what every machine needs to set-up to run a node that allows for participation in the Swaptoshi network.

Swaptoshi Core was bootstrapped with Lisk SDK v6.1. You can learn more in Lisk's official [documentation](https://lisk.com/documentation/lisk-sdk/index.html).

## Installation

### Dependencies

The following dependencies need to be installed in order to run Swaptoshi Core, which created with the Lisk SDK:

| Dependencies             | Version |
| ------------------------ | ------- |
| NodeJS                   | 18.16   |
| Python (for development) | 2.7.18  |

You can find further details on installing these dependencies in [Lisk SDK pre-installation setup guide](https://lisk.com/documentation/lisk-core/setup/source.html#source-pre-install).

Clone the Swaptoshi Core repository using Git and initialize the modules.

### From Source

```bash
git clone https://github.com/swaptoshi/swaptoshi-core.git
cd swaptoshi-core
npm install
npm run build
./bin/run --help
```

## Managing Swaptoshi Node

### System requirements

The following system requirements are recommended for validator nodes:

#### Memory

- Machines with a minimum of 8 GB RAM for the Mainnet.
- Machines with a minimum of 8 GB RAM for the Testnet.

#### Storage

- Machines with a minimum of 40 GB HDD.

#### OS

- Ubuntu 22
- Ubuntu 20
- MacOS 13

## License

Copyright 2024 Swaptoshi Labs

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

[lisk documentation site]: https://lisk.com/documentation/lisk-core/
