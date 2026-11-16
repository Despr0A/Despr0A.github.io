import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

// Run the component's actual game loop with a deterministic clock and minimal DOM.
const component = readFileSync(new URL('../src/components/SpaceInvaders.astro', import.meta.url), 'utf8');
const source = stripTypeScriptTypes(component.match(/<script>([\s\S]*?)<\/script>/)[1]).replace(
	'spawnWave(); draw();',
	`spawnWave(); draw();
	this.game = {
		update, setPaused, player, keys, pointers,
		get snapshot() { return { state, score, wave, enemies, shots }; },
		setScenario(value) {
			if (value.enemies) enemies = value.enemies;
			if (value.shots) shots = value.shots;
		}
	};`,
);

function setup() {
	const nodes = new Map();
	const frames = new Map();
	let frameId = 0, now = 0;
	let gameClass;
	class Element extends EventTarget {
		textContent = ''; disabled = false; hidden = false;
		querySelector(selector) {
			if (!nodes.has(selector)) nodes.set(selector, new Element());
			return nodes.get(selector);
		}
		querySelectorAll() { return []; }
		getContext() { return { fillRect() {}, beginPath() {}, arc() {}, fill() {}, moveTo() {}, lineTo() {}, closePath() {}, stroke() {} }; }
		focus() {}
		contains() { return false; }
	}
	const window = new EventTarget();
	const document = new EventTarget();
	runInNewContext(source, {
		HTMLElement: Element, customElements: { define(name, value) { gameClass = value; } },
		window, document, AbortController, performance: { now: () => now },
		requestAnimationFrame(callback) { frames.set(++frameId, callback); return frameId; },
		cancelAnimationFrame(id) { frames.delete(id); },
		IntersectionObserver: class { observe() {} disconnect() {} },
	});
	const element = new gameClass();
	element.connectedCallback();
	const start = () => nodes.get('[data-start]').dispatchEvent(new Event('click'));
	const step = () => {
		now += 16;
		const callbacks = [...frames.values()]; frames.clear();
		callbacks.forEach(callback => callback(now));
	};
	return { element, game: element.game, nodes, start, window, document, frames, step };
}

test('starts on demand with a fresh score and wave', () => {
	const { game, start } = setup();
	assert.equal(game.snapshot.state, 'ready');
	start();
	assert.equal(game.snapshot.state, 'playing');
	assert.equal(game.snapshot.wave, 1);
	assert.equal(game.snapshot.score, 0);
});

test('movement stays in bounds and holding fire respects its cooldown', () => {
	const { game, start } = setup(); start();
	game.keys.add('left'); game.update(2);
	assert.equal(game.player.x, 12);
	game.keys.clear(); game.keys.add('right'); game.update(3);
	assert.equal(game.player.x, 600);
	game.keys.clear(); game.keys.add('fire'); game.update(0);
	assert.equal(game.snapshot.shots.length, 1);
	game.update(0.1); assert.equal(game.snapshot.shots.length, 1);
	game.update(0.14); assert.equal(game.snapshot.shots.length, 2);
});

test('hits award points once and waves continue past the original limit', () => {
	const { game, start } = setup(); start();
	for (let wave = 1; wave <= 10; wave++) {
		assert.equal(game.snapshot.wave, wave);
		const enemy = { x: 100, y: 100, w: 24, h: 24, row: 0 };
		game.setScenario({ enemies: [enemy], shots: [{ ...enemy }, { ...enemy }] });
		game.update(0);
		assert.equal(game.snapshot.score, wave * 30);
	}
	assert.equal(game.snapshot.state, 'playing');
	assert.equal(game.snapshot.wave, 11);
});

test('escaped enemies cost exactly their hit value, once, without ending play', () => {
	const { game, start, nodes } = setup(); start();
	for (let row = 0; row < 3; row++) {
		const enemy = { x: 100, y: 100, w: 24, h: 24, row };
		game.setScenario({ enemies: [enemy], shots: [{ ...enemy }] }); game.update(0);
		assert.equal(game.snapshot.score, (3 - row) * 10);
		game.setScenario({ enemies: [{ ...enemy, y: 396 }], shots: [] }); game.update(0);
		assert.equal(game.snapshot.score, 0);
		game.update(0); assert.equal(game.snapshot.score, 0);
	}
	game.setScenario({ enemies: [{ x: 100, y: 396, w: 24, h: 24, row: 0 }] }); game.update(0);
	assert.equal(game.snapshot.score, -30);
	assert.equal(nodes.get('[data-score]').textContent, '-0030');
	assert.equal(game.snapshot.state, 'playing');
	assert.equal(game.snapshot.enemies.length, 24);
});

test('enemy formation descends at an edge and only disappears at the bottom', () => {
	const { game, start } = setup(); start();
	game.setScenario({ enemies: [{ x: 604, y: 340, w: 24, h: 24, row: 0 }] });
	game.update(0.02);
	assert.equal(game.snapshot.enemies[0].y, 356);
	assert.equal(game.snapshot.state, 'playing');
	assert.equal(game.snapshot.score, 0);
});

test('pause clears held inputs and resume preserves progress', () => {
	const { game, start, window, nodes } = setup(); start();
	game.keys.add('fire'); game.pointers.set(1, 'left');
	window.dispatchEvent(new Event('blur'));
	assert.equal(game.snapshot.state, 'paused');
	assert.equal(game.keys.size, 0); assert.equal(game.pointers.size, 0);
	assert.equal(nodes.get('.overlay').hidden, false);
	start(); assert.equal(game.snapshot.state, 'playing');
	assert.equal(game.snapshot.enemies.length, 24);
	assert.equal(nodes.get('.overlay').hidden, true);
});

for (const paused of [false, true]) {
	test(`restart resets progress and held controls ${paused ? 'while paused' : 'while playing'}`, () => {
		const { game, start, nodes, frames, step } = setup(); start();
		game.setScenario({ enemies: [{ x: 100, y: 396, w: 24, h: 24, row: 0 }] }); game.update(0);
		assert.equal(game.snapshot.score, -30);
		assert.equal(game.snapshot.wave, 2);
		game.keys.add('right'); game.keys.add('fire'); game.update(0.04);
		assert.equal(game.snapshot.shots.length, 1);
		if (paused) game.setPaused();
		game.pointers.set(1, 'left');
		assert.ok(nodes.get('[data-restart]'), 'A restart button must be wired up');
		nodes.get('[data-restart]').dispatchEvent(new Event('click'));
		assert.equal(game.snapshot.score, 0); assert.equal(game.snapshot.wave, 1);
		assert.equal(game.snapshot.enemies.length, 24); assert.equal(game.snapshot.shots.length, 0);
		assert.equal(game.player.x, 306);
		assert.equal(game.keys.size, 0); assert.equal(game.pointers.size, 0);
		assert.equal(game.snapshot.state, 'playing');
		assert.equal(nodes.get('.overlay').hidden, true); assert.equal(nodes.get('[data-pause]').disabled, false);
		assert.equal(nodes.get('[data-score]').textContent, '0000'); assert.equal(nodes.get('[data-wave]').textContent, '1');
		for (let i = 0; i < 5; i++) nodes.get('[data-restart]').dispatchEvent(new Event('click'));
		assert.equal(frames.size, 1);
		const x = game.snapshot.enemies[0].x; step();
		assert.ok(Math.abs(game.snapshot.enemies[0].x - x - 0.48) < 0.000001);
		assert.equal(frames.size, 1);
	});
}
