/* eslint-disable @typescript-eslint/no-explicit-any */

export type ConfigPathKeys<T> = T extends object
	? {
			[K in keyof T]: K extends string
				? T[K] extends any[]
					? `${K}` | `${K}.${number}` | `${K}[${number}]` | `${K}.${number}.${ConfigPathKeys<T[K][number]>}` | `${K}[${number}].${ConfigPathKeys<T[K][number]>}`
					: T[K] extends object
					? `${K}` | `${K}.${ConfigPathKeys<T[K]>}`
					: `${K}`
				: never;
	  }[keyof T]
	: never;

export type ConfigPathType<T, P extends string> = P extends `${infer K}.${infer Rest}`
	? K extends keyof T
		? Rest extends `${infer N}.${infer SubRest}`
			? N extends `${number}`
				? T[K] extends any[]
					? ConfigPathType<T[K][number], SubRest>
					: never
				: ConfigPathType<T[K], Rest>
			: Rest extends `${number}`
			? T[K] extends any[]
				? T[K][number]
				: never
			: ConfigPathType<T[K], Rest>
		: never
	: P extends keyof T
	? T[P]
	: never;

export interface UpdatedProperty {
	path: string;
	old: string;
	new: string;
	type: string;
}
