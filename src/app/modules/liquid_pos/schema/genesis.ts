import { utils } from 'klayr-sdk';
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

export const liquidPosGenesisStoreSchema = {
	$id: '/liquidPos/module/genesis',
	type: 'object',
	required: ['configSubstore'],
	properties: {
		configSubstore: {
			fieldNumber: 1,
			...genesisSchemaBuilder(governableConfigSchema, []),
		},
	},
};
