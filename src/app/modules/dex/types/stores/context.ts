import {
	CommandExecuteContext,
	ImmutableMethodContext,
	MethodContext,
	ModuleEndpointContext,
	TransactionExecuteContext,
	TransactionVerifyContext,
} from 'klayr-sdk';

export interface ImmutableSwapContext<T = unknown> {
	context: ImmutableContext & T;
	senderAddress: Buffer;
	timestamp: string;
}

export interface MutableSwapContext<T = unknown> {
	context: MutableContext & T;
	senderAddress: Buffer;
	timestamp: string;
}

export type ImmutableContext =
	| ImmutableMethodContext
	| TransactionVerifyContext
	| ModuleEndpointContext;

export type MutableContext = TransactionExecuteContext | CommandExecuteContext | MethodContext;
