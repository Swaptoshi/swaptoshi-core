/* eslint-disable import/no-cycle */
import { utils } from 'klayr-sdk';
import { governableConfigSchema } from './governable_config';
import {
	boostedAccountStoreSchema,
	castedVoteStoreSchema,
	delegatedVoteStoreSchema,
	nextAvailableProposalIdStoreSchema,
	proposalQueueStoreSchema,
	proposalStoreSchema,
	proposalVoterStoreSchema,
	voteScoreStoreSchema,
} from './stores';

const genesisSchemaBuilder = (
	schema: { $id: string; type: string; required: string[]; properties: Record<string, object> },
	keys: {
		key: string;
		dataType: 'string' | 'bytes' | 'uint32' | 'uint64' | 'sint32' | 'sint64' | 'boolean';
		format?: 'hex' | 'klayr32';
	}[],
) => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	const { $id, ...rest } = utils.objects.cloneDeep(schema) as typeof schema;
	const initialLength = Object.keys(schema.properties).length;

	for (let i = 0; i < keys.length; i += 1) {
		rest.required.push(keys[i].key);

		const properties: Record<string, unknown> = {
			fieldNumber: initialLength + 1 + i,
			dataType: keys[i].dataType,
		};

		if (keys[i].format) {
			properties.format = keys[i].format;
		}

		rest.properties[keys[i].key] = properties;
	}

	return rest;
};

export const governanceGenesisStoreSchema = {
	$id: '/governance/module/genesis',
	type: 'object',
	required: [
		'boostedAccountSubstore',
		'castedVoteSubstore',
		'delegatedVoteSubstore',
		'nextAvailableProposalIdSubstore',
		'proposalVoterSubstore',
		'proposalSubstore',
		'queueSubstore',
		'voteScoreSubstore',
		'configSubstore',
	],
	properties: {
		boostedAccountSubstore: {
			fieldNumber: 1,
			type: 'array',
			items: genesisSchemaBuilder(boostedAccountStoreSchema, [{ key: 'address', dataType: 'bytes', format: 'klayr32' }]),
		},
		castedVoteSubstore: {
			fieldNumber: 2,
			type: 'array',
			items: genesisSchemaBuilder(castedVoteStoreSchema, [{ key: 'address', dataType: 'bytes', format: 'klayr32' }]),
		},
		delegatedVoteSubstore: {
			fieldNumber: 3,
			type: 'array',
			items: genesisSchemaBuilder(delegatedVoteStoreSchema, [{ key: 'address', dataType: 'bytes', format: 'klayr32' }]),
		},
		nextAvailableProposalIdSubstore: {
			fieldNumber: 4,
			...genesisSchemaBuilder(nextAvailableProposalIdStoreSchema, []),
		},
		proposalVoterSubstore: {
			fieldNumber: 5,
			type: 'array',
			items: genesisSchemaBuilder(proposalVoterStoreSchema, [{ key: 'proposalId', dataType: 'uint32' }]),
		},
		proposalSubstore: {
			fieldNumber: 6,
			type: 'array',
			items: genesisSchemaBuilder(proposalStoreSchema, [{ key: 'proposalId', dataType: 'uint32' }]),
		},
		queueSubstore: {
			fieldNumber: 7,
			type: 'array',
			items: genesisSchemaBuilder(proposalQueueStoreSchema, [{ key: 'height', dataType: 'uint32' }]),
		},
		voteScoreSubstore: {
			fieldNumber: 8,
			type: 'array',
			items: genesisSchemaBuilder(voteScoreStoreSchema, [{ key: 'address', dataType: 'bytes', format: 'klayr32' }]),
		},
		configSubstore: {
			fieldNumber: 9,
			...genesisSchemaBuilder(governableConfigSchema, []),
		},
	},
};
