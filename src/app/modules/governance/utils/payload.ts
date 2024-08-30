import { codec, Schema } from 'klayr-sdk';
import { ConfigActionPayload, ConfigPathKeys, ConfigPathType } from '../types';
import { getSchemaByPath, removeProperty } from './object';
import { configActionPayloadSchema } from '../schema';

interface ConfigProposalPayloadValue<T> {
	value: T;
}

function buildConfigPayloadValueSchema(schema: Schema, path: string) {
	const configValueSchema = {
		$id: `configProposalPayload_${schema.$id}_${path}`,
		type: 'object',
		properties: { value: { ...getSchemaByPath(schema, path), fieldNumber: 1 } },
	};
	return configValueSchema;
}

export function encodeConfigProposalValue<T extends object, P extends ConfigPathKeys<T>>(configSchema: Schema, path: P, value: ConfigPathType<T, P>) {
	const configValueSchema = buildConfigPayloadValueSchema(configSchema, path);
	return codec.encode(removeProperty(configValueSchema, ['governable']) as Schema, { value });
}

export function decodeConfigProposalValue<T extends object, P extends ConfigPathKeys<T>>(configSchema: Schema, payload: ConfigActionPayload): ConfigPathType<T, P> {
	const configValueSchema = buildConfigPayloadValueSchema(configSchema, payload.paramPath);
	const configObject = codec.decode<ConfigProposalPayloadValue<ConfigPathType<T, P>>>(removeProperty(configValueSchema, ['governable']) as Schema, payload.value);
	return configObject.value;
}

export function encodeConfigProposalPayload<T extends object, P extends ConfigPathKeys<T>>(configSchema: Schema, moduleName: string, paramPath: P, configValue: ConfigPathType<T, P>) {
	const configPayload = {
		moduleName,
		paramPath,
		value: encodeConfigProposalValue(configSchema, paramPath as never, configValue),
	};
	return codec.encode(configActionPayloadSchema, configPayload);
}

export function decodeConfigProposalPayload(encodedPayload: Buffer): ConfigActionPayload {
	const decodedPayload = codec.decode<ConfigActionPayload>(configActionPayloadSchema, encodedPayload);
	return decodedPayload;
}
