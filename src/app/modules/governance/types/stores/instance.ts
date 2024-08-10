/* eslint-disable @typescript-eslint/no-explicit-any */
import { Schema } from 'klayr-sdk';

interface Named {
	name: string;
	key: Buffer;
	schema: Schema;
}

export type Constructor = new (...args: any) => Named;

export type StoreInstance<T> = Omit<
	T,
	'addMutableDependencies' | 'addImmutableDependencies' | 'addDependencies'
>;
