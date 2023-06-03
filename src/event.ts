import { EventEmitter } from 'events'

type EventList<E> = { [K in keyof E]: (...args: any[]) => any }

export type Listenable<E extends EventList<E>> = {
	on<K extends keyof E>(eventName: K, listener: E[K]): void;
	once<K extends keyof E>(eventName: K, listener: E[K]): void;
	off<K extends keyof E>(eventName: K, listener: E[K]): void;
}

type DefaultEventList = Record<string, (...args: any[]) => any>

export class EventSource<E extends EventList<E> = DefaultEventList> implements Listenable<E> {
	#event: EventEmitter

	constructor(event?: EventEmitter) {
		this.#event = event ?? new EventEmitter()
	}

	on<K extends keyof E>(eventName: K, listener: E[K]): void {
		this.#event.on(eventName as string, listener)
	}

	once<K extends keyof E>(eventName: K, listener: E[K]): void {
		this.#event.once(eventName as string, listener)
	}

	off<K extends keyof E>(eventName: K, listener: E[K]): void {
		this.#event.off(eventName as string, listener)
	}

	protected emit<K extends keyof E>(eventName: K, ...args: Parameters<E[K]>): boolean {
		return this.#event.emit(eventName as string, ...args)
	}
}

export class TypedEventEmitter<E extends EventList<E> = DefaultEventList> extends EventSource<E> {
	public emit<K extends keyof E>(eventName: K, ...args: Parameters<E[K]>): boolean {
		return super.emit(eventName, ...args)
	}
}

