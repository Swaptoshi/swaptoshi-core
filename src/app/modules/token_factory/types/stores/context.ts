import { StateMachine, Types } from 'klayr-sdk';

export interface ImmutableFactoryContext<T = unknown> {
	context: ImmutableContext & T;
	senderAddress: Buffer;
	timestamp: string;
	height: number;
}

export interface MutableFactoryContext<T = unknown> {
	context: MutableContext & T;
	senderAddress: Buffer;
	timestamp: string;
	height: number;
}

export type MutableContext = StateMachine.TransactionExecuteContext | StateMachine.CommandExecuteContext | StateMachine.MethodContext;

export type ImmutableContext = StateMachine.ImmutableMethodContext | StateMachine.TransactionVerifyContext | Types.ModuleEndpointContext;
