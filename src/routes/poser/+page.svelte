<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as THREE from 'three';
	import { GLTFLoader } from 'three-stdlib';
	import { OrbitControls } from 'three-stdlib';
	import { TransformControls } from 'three-stdlib';

	let canvas: HTMLCanvasElement;

	// UI state
	let selectedBone: THREE.Bone | null = null;
	let bones: THREE.Bone[] = [];
	let poseJSON = '';
	let mirrorLR = true; // toggle for mirror function

	// Three basics
	let renderer: THREE.WebGLRenderer;
	let scene: THREE.Scene;
	let camera: THREE.PerspectiveCamera;
	let orbit!: OrbitControls;
	let transform!: TransformControls;
	let raycaster = new THREE.Raycaster();
	const mouse = new THREE.Vector2();

	// Model
	let skeleton: THREE.Skeleton | null = null;
	let skinnedMesh: THREE.SkinnedMesh | null = null;

	// Clickable joint helpers (little spheres attached to bones)
	const jointHelpers: THREE.Mesh[] = [];

	function makeJointHelpers() {
		// remove old
		jointHelpers.forEach((m) => scene.remove(m));
		jointHelpers.length = 0;

		if (!skeleton) return;
		const geom = new THREE.SphereGeometry(0.01, 12, 12);
		const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });

		for (const b of skeleton.bones) {
			const s = new THREE.Mesh(geom, mat.clone());
			s.userData.type = 'joint';
			s.userData.bone = b;
			scene.add(s);
			jointHelpers.push(s);
		}
	}

	function updateJointHelpers() {
		if (!skeleton) return;
		for (const m of jointHelpers) {
			const b: THREE.Bone = m.userData.bone;
			// get world position of bone
			b.updateWorldMatrix(true, false);
			const pos = new THREE.Vector3();
			pos.setFromMatrixPosition(b.matrixWorld);
			m.position.copy(pos);
		}
	}

	function selectBone(b: THREE.Bone | null) {
		selectedBone = b;
		if (!transform) return;

		if (b) {
			transform.attach(b);
		} else {
			transform.detach();
		}
	}

	function savePose() {
		if (!skeleton) return;
		const out: Record<string, { x: number; y: number; z: number; w: number }> = {};
		for (const b of skeleton.bones) {
			// Store local-space quaternion (stable & gimbal-safe)
			out[b.name || `bone_${b.id}`] = b.quaternion.clone();
		}
		poseJSON = JSON.stringify(out, null, 2);
	}

	function loadPose() {
		if (!skeleton || !poseJSON.trim()) return;
		try {
			const data = JSON.parse(poseJSON) as Record<
				string,
				{ x: number; y: number; z: number; w: number }
			>;
			for (const b of skeleton.bones) {
				const key = b.name || `bone_${b.id}`;
				if (data[key]) {
					const q = data[key] as any;
					b.quaternion.set(q.x, q.y, q.z, q.w);
					b.updateMatrix();
				}
			}
		} catch (e) {
			alert('Invalid pose JSON');
		}
	}

	function resetPose() {
		if (!skeleton) return;
		for (const b of skeleton.bones) {
			b.rotation.set(0, 0, 0);
			b.updateMatrix();
		}
	}

	function mirrorPose() {
		if (!skeleton) return;

		// Simple name-swap mirroring: replace 'Left'/'Right' or 'L'/'R'
		const pairs: [THREE.Bone, THREE.Bone][] = [];
		const byName = new Map<string, THREE.Bone>();
		for (const b of skeleton.bones) byName.set(b.name, b);

		const findMirrorName = (name: string) => {
			const maps = mirrorLR
				? ([
						[/(^|[^a-z])Left([^a-z]|$)/i, '$1Right$2'],
						[/(^|[^a-z])Right([^a-z]|$)/i, '$1Left$2'],
						[/(^|[^a-z])L([^a-z]|$)/, '$1R$2'],
						[/(^|[^a-z])R([^a-z]|$)/, '$1L$2']
					] as const)
				: ([] as const);
			for (const [rx, rep] of maps) {
				const alt = name.replace(rx as any, rep as any);
				if (alt !== name && byName.has(alt)) return alt;
			}
			return null;
		};

		for (const b of skeleton.bones) {
			const other = findMirrorName(b.name);
			if (other) {
				const o = byName.get(other)!;
				if (b.id < o.id) pairs.push([b, o]); // avoid dup pairs
			}
		}

		// For each pair, swap local rotations and mirror X axis by negating X/Z on quaternion (approx)
		const mirrorQuat = (q: THREE.Quaternion) => new THREE.Quaternion(-q.x, q.y, -q.z, q.w);

		for (const [a, b] of pairs) {
			const qa = mirrorQuat(a.quaternion);
			const qb = mirrorQuat(b.quaternion);
			a.quaternion.copy(qb);
			b.quaternion.copy(qa);
			a.updateMatrix();
			b.updateMatrix();
		}
	}

	function onResize() {
		if (!renderer || !camera) return;
		const w = canvas.clientWidth;
		const h = canvas.clientHeight;
		renderer.setSize(w, h, false);
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
	}

	function animate() {
		updateJointHelpers();
		renderer.render(scene, camera);
		requestAnimationFrame(animate);
	}

	function onPointerDown(e: PointerEvent) {
		const rect = canvas.getBoundingClientRect();
		mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
		mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

		raycaster.setFromCamera(mouse, camera);
		const hits = raycaster.intersectObjects(jointHelpers, false);
		if (hits[0]) {
			const bone = hits[0].object.userData.bone as THREE.Bone;
			selectBone(bone);
		}
	}

	onMount(async () => {
		// Renderer
		renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
		renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
		renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

		// Scene & Camera
		scene = new THREE.Scene();
		scene.background = new THREE.Color('#1a1a1a');

		camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.01, 100);
		camera.position.set(0.6, 1.3, 2.2);

		// Lights
		const hemi = new THREE.HemisphereLight(0xffffff, 0x222233, 0.8);
		scene.add(hemi);
		const key = new THREE.DirectionalLight(0xffffff, 0.9);
		key.position.set(3, 5, 3);
		scene.add(key);

		// Grid + ground
		const grid = new THREE.GridHelper(10, 40);
		scene.add(grid);
		const floor = new THREE.Mesh(
			new THREE.CylinderGeometry(0.001, 2, 0.001, 8),
			new THREE.MeshBasicMaterial({ visible: false })
		);
		scene.add(floor);

		// Controls
		orbit = new OrbitControls(camera, canvas);
		orbit.enableDamping = true;

		transform = new TransformControls(camera, canvas);
		transform.setMode('rotate');
		transform.setSize(0.8);
		(transform as any).addEventListener('dragging-changed', (e: any) => {
			orbit.enabled = !e.value; // disable orbit while rotating a bone
		});
		scene.add(transform);

		// Load model
		const loader = new GLTFLoader();
		const gltf = await loader.loadAsync('/models/mannequin.glb');
		const root = gltf.scene;
		scene.add(root);

		// Find first SkinnedMesh + its skeleton
		root.traverse((obj) => {
			if ((obj as any).isSkinnedMesh && !skinnedMesh) {
				skinnedMesh = obj as THREE.SkinnedMesh;
			}
		});

		if (!skinnedMesh) {
			console.error('No SkinnedMesh found in model.');
			return;
		}

		const skeletonHelper = new THREE.SkeletonHelper(skinnedMesh);
		skeletonHelper.visible = false; // toggle true to debug
		scene.add(skeletonHelper);

		skeleton = (skinnedMesh.skeleton as THREE.Skeleton) || null;
		if (!skeleton) {
			console.error('No skeleton on SkinnedMesh.');
			return;
		}

		bones = skeleton.bones;
		makeJointHelpers();

		// Input
		canvas.addEventListener('pointerdown', onPointerDown);
		window.addEventListener('resize', onResize);

		// Keyboard helpers
		window.addEventListener('keydown', (e) => {
			if (e.key.toLowerCase() === 'r') transform.setMode('rotate');
			if (e.key.toLowerCase() === 't') transform.setMode('translate');
			if (e.key.toLowerCase() === 's') savePose();
			if (e.key.toLowerCase() === 'l') loadPose();
			if (e.key.toLowerCase() === 'm') mirrorPose();
			if (e.key.toLowerCase() === 'x') resetPose();
		});

		animate();
	});

	onDestroy(() => {
		window.removeEventListener('resize', onResize);
		if (renderer) renderer.dispose();
	});
</script>

<div class="wrap">
	<canvas bind:this={canvas} tabindex="0" />
	<aside>
		<h2>3D Poser</h2>
		<p>
			Click a joint sphere to select a bone. Use mouse to rotate the gizmo. Hotkeys: <code>R</code>
			rotate, <code>T</code> translate, <code>S</code> save, <code>L</code> load,
			<code>M</code> mirror, <code>X</code> reset.
		</p>

		<div style="margin: 8px 0;">
			<button on:click={savePose}>Save Pose</button>
			<button on:click={loadPose}>Load Pose</button>
			<button on:click={resetPose}>Reset</button>
			<button on:click={mirrorPose}>Mirror L↔R</button>
			<label style="margin-left:8px;">
				<input type="checkbox" bind:checked={mirrorLR} /> smart L/R names
			</label>
		</div>

		<h3>Bones</h3>
		<div class="bone-list">
			{#each bones as b}
				<div class="bone {selectedBone === b ? 'active' : ''}" on:click={() => selectBone(b)}>
					{b.name || `bone_${b.id}`}
				</div>
			{/each}
		</div>

		<h3>Pose JSON</h3>
		<textarea bind:value={poseJSON} spellcheck="false"></textarea>
	</aside>
</div>

<style>
	.wrap {
		display: grid;
		grid-template-columns: 1fr 320px;
		gap: 12px;
		height: 100dvh;
		padding: 12px;
		box-sizing: border-box;
	}
	canvas {
		width: 100%;
		height: 100%;
		outline: none;
		border-radius: 12px;
		background: #111;
	}
	aside {
		background: #0f0f12;
		color: #eaeaea;
		padding: 12px;
		border-radius: 12px;
		overflow: auto;
	}
	button {
		margin-right: 6px;
		margin-bottom: 6px;
	}
	.bone-list {
		max-height: 45vh;
		overflow: auto;
		margin-top: 8px;
	}
	.bone {
		cursor: pointer;
		padding: 4px 6px;
		border-radius: 6px;
	}
	.bone.active {
		background: #2a2f45;
	}
	textarea {
		width: 100%;
		height: 220px;
	}
</style>
