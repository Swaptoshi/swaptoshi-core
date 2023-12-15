import {
	CommandExecuteContext,
	ImmutableMethodContext,
	MethodContext,
	TransactionExecuteContext,
} from 'lisk-sdk';

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

export type ImmutableContext = ImmutableMethodContext;

export type MutableContext = TransactionExecuteContext | CommandExecuteContext | MethodContext;
