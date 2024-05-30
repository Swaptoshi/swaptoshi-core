/* eslint-disable import/no-extraneous-dependencies */
/*
 * Copyright © 2023 Lisk Foundation
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Unless otherwise agreed in a custom licensing agreement with the Lisk Foundation,
 * no part of this software, including this file, may be copied, modified,
 * propagated, or distributed except according to the terms contained in the
 * LICENSE file.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

import { utils } from '@klayr/cryptography';
import { PrefixedStateReadWriter } from 'klayr-framework/dist-node/state_machine/prefixed_state_read_writer';
import { InMemoryPrefixedStateDB } from 'klayr-framework/dist-node/testing';
import { createStoreGetter } from 'klayr-framework/dist-node/testing/utils';
import { CHAIN_ID_LENGTH, StoreGetter } from 'klayr-sdk';
import { SupportedNFTsStore } from '../../../../../src/app/modules/nft/stores/supported_nfts';
import {
	LENGTH_CHAIN_ID,
	LENGTH_COLLECTION_ID,
} from '../../../../../src/app/modules/nft/constants';

describe('NFTStore', () => {
	let store: SupportedNFTsStore;
	let context: StoreGetter;

	beforeEach(() => {
		store = new SupportedNFTsStore('NFT', 5);

		const db = new InMemoryPrefixedStateDB();
		const stateStore = new PrefixedStateReadWriter(db);

		context = createStoreGetter(stateStore);
	});

	describe('save', () => {
		it('should order supported NFT collection of a chain', async () => {
			const chainID = Buffer.alloc(CHAIN_ID_LENGTH, 0);

			const unsortedSupportedCollections = [
				{
					collectionID: Buffer.alloc(LENGTH_COLLECTION_ID, 1),
				},
				{
					collectionID: Buffer.alloc(LENGTH_COLLECTION_ID, 0),
				},
				{
					collectionID: Buffer.from([0, 1, 1, 0]),
				},
			];

			const sortedSupportedCollections = unsortedSupportedCollections.sort((a, b) =>
				a.collectionID.compare(b.collectionID),
			);

			const data = {
				supportedCollectionIDArray: unsortedSupportedCollections,
			};
			await store.save(context, chainID, data);

			await expect(store.get(context, chainID)).resolves.toEqual({
				supportedCollectionIDArray: sortedSupportedCollections,
			});
		});
	});

	describe('getAll', () => {
		it('should retrieve all NFTs with key between 0 and maximum value for Buffer of length LENGTH_CHAIN_ID', async () => {
			await store.save(context, Buffer.alloc(LENGTH_CHAIN_ID, 0), {
				supportedCollectionIDArray: [],
			});

			await store.save(context, Buffer.alloc(LENGTH_CHAIN_ID, 1), {
				supportedCollectionIDArray: [],
			});

			await store.save(context, utils.getRandomBytes(LENGTH_CHAIN_ID), {
				supportedCollectionIDArray: [],
			});

			const allSupportedNFTs = await store.getAll(context);

			expect([...allSupportedNFTs.keys()]).toHaveLength(3);
		});
	});
});
