/* eslint-disable import/no-cycle */
import { utils } from 'klayr-sdk';
import {
	observationStoreSchema,
	poolStoreSchema,
	positionInfoStoreSchema,
	positionManagerStoreSchema,
	supportedTokenStoreSchema,
	tickBitmapStoreSchema,
	tickInfoStoreSchema,
	tokenSymbolStoreSchema,
} from './stores';
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

export const dexGenesisStoreSchema = {
	$id: '/dex/module/genesis',
	type: 'object',
	required: [
		'observationSubstore',
		'poolSubstore',
		'positionInfoSubstore',
		'positionManagerSubstore',
		'supportedTokenSubstore',
		'tickBitmapSubstore',
		'tickInfoSubstore',
		'tokenSymbolSubstore',
		'configSubstore',
	],
	properties: {
		observationSubstore: {
			fieldNumber: 1,
			type: 'array',
			items: genesisSchemaBuilder(observationStoreSchema, [
				{ key: 'poolAddress', dataType: 'bytes', format: 'klayr32' },
				{ key: 'index', dataType: 'string' },
			]),
		},
		poolSubstore: {
			fieldNumber: 2,
			type: 'array',
			items: genesisSchemaBuilder(poolStoreSchema, []),
		},
		positionInfoSubstore: {
			fieldNumber: 3,
			type: 'array',
			items: genesisSchemaBuilder(positionInfoStoreSchema, [
				{ key: 'poolAddress', dataType: 'bytes', format: 'klayr32' },
				{ key: 'key', dataType: 'bytes' },
			]),
		},
		positionManagerSubstore: {
			fieldNumber: 4,
			type: 'array',
			items: genesisSchemaBuilder(positionManagerStoreSchema, []),
		},
		supportedTokenSubstore: {
			fieldNumber: 5,
			type: 'array',
			items: genesisSchemaBuilder(supportedTokenStoreSchema, []),
		},
		tickBitmapSubstore: {
			fieldNumber: 6,
			type: 'array',
			items: genesisSchemaBuilder(tickBitmapStoreSchema, [
				{ key: 'poolAddress', dataType: 'bytes', format: 'klayr32' },
				{ key: 'index', dataType: 'string' },
			]),
		},
		tickInfoSubstore: {
			fieldNumber: 7,
			type: 'array',
			items: genesisSchemaBuilder(tickInfoStoreSchema, [
				{ key: 'poolAddress', dataType: 'bytes', format: 'klayr32' },
				{ key: 'tick', dataType: 'string' },
			]),
		},
		tokenSymbolSubstore: {
			fieldNumber: 8,
			type: 'array',
			items: genesisSchemaBuilder(tokenSymbolStoreSchema, [{ key: 'tokenID', dataType: 'bytes' }]),
		},
		configSubstore: {
			fieldNumber: 9,
			...genesisSchemaBuilder(governableConfigSchema, []),
		},
	},
};
