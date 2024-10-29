import { utils } from 'klayr-sdk';
import { airdropStoreSchema, factoryStoreSchema, icoStoreSchema, nextAvailableTokenIdStoreSchema, vestingUnlockStoreSchema } from './stores';
import { governableConfigSchema } from '../../governance/schema';

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

export const tokenFactoryGenesisStoreSchema = {
	$id: '/tokenFactory/module/genesis',
	type: 'object',
	required: ['airdropSubstore', 'factorySubstore', 'icoSubstore', 'nextAvailableTokenIdSubstore', 'vestingUnlockSubstore', 'configSubstore'],
	properties: {
		airdropSubstore: {
			fieldNumber: 1,
			type: 'array',
			items: genesisSchemaBuilder(airdropStoreSchema, [
				{ key: 'tokenId', dataType: 'bytes' },
				{ key: 'providerAddress', dataType: 'bytes', format: 'klayr32' },
			]),
		},
		factorySubstore: {
			fieldNumber: 2,
			type: 'array',
			items: genesisSchemaBuilder(factoryStoreSchema, [{ key: 'tokenId', dataType: 'bytes' }]),
		},
		icoSubstore: {
			fieldNumber: 3,
			type: 'array',
			items: genesisSchemaBuilder(icoStoreSchema, [{ key: 'poolAddress', dataType: 'bytes', format: 'klayr32' }]),
		},
		nextAvailableTokenIdSubstore: {
			fieldNumber: 4,
			...genesisSchemaBuilder(nextAvailableTokenIdStoreSchema, []),
		},
		vestingUnlockSubstore: {
			fieldNumber: 5,
			type: 'array',
			items: genesisSchemaBuilder(vestingUnlockStoreSchema, [{ key: 'height', dataType: 'uint32' }]),
		},
		configSubstore: {
			fieldNumber: 6,
			...genesisSchemaBuilder(governableConfigSchema, []),
		},
	},
};
