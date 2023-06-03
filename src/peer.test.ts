import { PageUrl } from './.test'
import { Peer } from './peer'

describe('Vanguard', () => {
	test('close-ack', async () => {
		page.on('console', consoleObject => {
			console.log(consoleObject.text())
		})
		await page.goto(PageUrl, { waitUntil: 'load' })
		const disconnected = await page.evaluate(async () => {
			const vg = window.vanguard

			const [c1, c2] = vg.duplex()
			const pc1 = new RTCPeerConnection()
			const pc2 = new RTCPeerConnection()
			const [peer1, peer2] = await Promise.all([
				vg.offer(pc1, c1),
				vg.answer(pc2, c2),
			])

			let disconnected = false

			const until_closed = new Promise<void>(resolve => {
				peer2.once('close', () => {
					resolve()
				})
			})
			peer2.conn.addEventListener('connectionstatechange', () => {
				if (peer2.conn.connectionState === 'disconnected') {
					disconnected = true
				}
			})

			await peer1.close()
			await until_closed

			return disconnected
		})

		expect(disconnected).toBe(false)
	})
})
