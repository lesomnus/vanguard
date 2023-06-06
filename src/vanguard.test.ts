import type { Peer } from './peer'
import { PageUrl } from './.test'

describe('Vanguard', () => {
	beforeEach(() => {
		page.on('console', consoleObject => {
			console.log(consoleObject.text())
		})
	})

	test('offer-answer', async () => {
		await page.goto(PageUrl, { waitUntil: 'load' })
		const label = await page.evaluate(async () => {
			const vg = window.vanguard

			const [c1, c2] = vg.duplex()
			const pc1 = new RTCPeerConnection()
			const pc2 = new RTCPeerConnection()

			// Initial connection using intra signalling channel.
			const [peer1, peer2] = await Promise.all([
				vg.offer(pc1, c1),
				vg.answer(pc2, c2),
			])

			const pc3 = new RTCPeerConnection()
			const pc4 = new RTCPeerConnection()

			// Sub connection using Vanguard channel.
			let offer_label = ''
			const answer = new Promise<Peer>((resolve, reject) => {
				peer2.once('offer', (c, label) => {
					offer_label = label
					vg.answer(pc4, c).then(resolve).catch(reject)
				})
			})
			const offer = peer1.offer(pc3, 'foo')

			await Promise.all([offer, answer])

			return offer_label
		})

		expect(label).toEqual('foo')
	})

	test('close-ack', async () => {
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
