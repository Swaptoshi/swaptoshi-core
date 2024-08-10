import { CommandExecuteContext, ImmutableMethodContext, MethodContext, ModuleEndpointContext, TransactionExecuteContext, TransactionVerifyContext } from 'klayr-sdk';

export interface ImmutableGovernanceContext<T = unknown> {
	context: ImmutableContext & T;
	senderAddress: Buffer;
	timestamp: string;
	height: number;
}

export interface MutableGovernanceContext<T = unknown> {
	context: MutableContext & T;
	senderAddress: Buffer;
	timestamp: string;
	height: number;
}

export type MutableContext = TransactionExecuteContext | CommandExecuteContext | MethodContext;

export type ImmutableContext = ImmutableMethodContext | TransactionVerifyContext | ModuleEndpointContext;
