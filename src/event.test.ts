import { TypedEventEmitter } from './event'

describe('EventEmitter', () => {
	test('on-off', () => {
		let cnt = 0
		const listener = (d: number) => {
			cnt += d
		}

		const event = new TypedEventEmitter()
		event.on('foo', listener)

		event.emit('foo', 2)
		expect(cnt).toBe(2)

		event.emit('foo', 3)
		expect(cnt).toBe(5)

		event.off('foo', listener)
		event.emit('foo', 4)
		expect(cnt).toBe(5)
	})

	test('once', () => {
		let cnt = 0
		const listener = (d: number) => {
			cnt += d
		}

		const event = new TypedEventEmitter()
		event.once('foo', listener)

		event.emit('foo', 2)
		expect(cnt).toBe(2)

		event.emit('foo', 3)
		expect(cnt).toBe(2)
	})
})
