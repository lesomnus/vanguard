import { duplex } from './signaling'

describe('IntraSigChan', () => {
	test('send-recv', async () => {
		const [c1, c2] = duplex()

		const on_c2 = new Promise(resolve => {
			c2.once('abort', v => {
				resolve(v)
			})
		})

		c1.send({ kind: 'abort', reason: 'foo' })

		const message = await on_c2
		expect(message).toMatchObject({ reason: 'foo' })
	})

	test('closed', () => {
		const [c1, c2] = duplex()

		expect(c1.closed).toBe(false)
		expect(c2.closed).toBe(false)

		c1.close()
		expect(c1.closed).toBe(true)
		expect(c2.closed).toBe(false)

		c2.close()
		expect(c2.closed).toBe(true)
	})
})
