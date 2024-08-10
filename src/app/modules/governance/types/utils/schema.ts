export type TypedSchema<T> = { $id: string } & ObjectSchema<T>;

type ObjectSchema<T> = {
	type: 'object';
	required: (keyof T extends string ? keyof T : never)[];
	properties: SchemaProperties<T>;
};

type SchemaProperties<T> = {
	[K in keyof T]: K extends keyof T ? TypeScriptTypeToSchemaType<T[K]> & SchemaPropertiesFields : never;
};

type SchemaPropertiesFields = { fieldNumber: number; governable?: boolean; format?: string; minLength?: number; maxLength?: number; minimum?: number; maximum?: number };

type TypeScriptTypeToSchemaType<T> = T extends string
	? { dataType: 'string' }
	: T extends boolean
	? { dataType: 'boolean' }
	: T extends Buffer
	? { dataType: 'bytes' }
	: T extends number
	? { dataType: 'uint32' } | { dataType: 'sint32' }
	: T extends bigint
	? { dataType: 'uint64' } | { dataType: 'sint64' }
	: T extends unknown[]
	? ArraySchema<T>
	: T extends object
	? ObjectSchema<T>
	: unknown;

type ArraySchema<T> = {
	type: 'array';
	items: ArraySchemaItems<T>;
};

type ArraySchemaItems<T> = TypescriptArrayToSchemaType<T>;

type TypescriptArrayToSchemaType<T> = T extends string[]
	? { dataType: 'string' }
	: T extends boolean[]
	? { dataType: 'boolean' }
	: T extends Buffer[]
	? { dataType: 'bytes' }
	: T extends number[]
	? { dataType: 'uint32' } | { dataType: 'sint32' }
	: T extends bigint[]
	? { dataType: 'uint64' } | { dataType: 'sint64' }
	: T extends unknown[][]
	? ArraySchema<T[0]>
	: T extends object[]
	? ObjectSchema<T[0]>
	: unknown;
