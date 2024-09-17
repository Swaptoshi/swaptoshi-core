import { StateMachine, Types } from 'klayr-sdk';

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

export type ImmutableContext = StateMachine.ImmutableMethodContext | StateMachine.TransactionVerifyContext | Types.ModuleEndpointContext;

export type MutableContext = StateMachine.TransactionExecuteContext | StateMachine.CommandExecuteContext | StateMachine.MethodContext;
