
import Phaser from 'phaser';
import { useGameStore } from '../../store/useGameStore';
import { EventBus } from '../events/EventBus';
import { TILE_SIZE, GRID_WIDTH, GRID_HEIGHT, BUILDING_TYPES, ENEMY_TYPES } from '../utils/constants';
import * as EasyStar from 'easystarjs';

export class GameScene extends Phaser.Scene {
    private gridGraphics!: Phaser.GameObjects.Graphics;
    private buildingsGroup!: Phaser.GameObjects.Group;
    private enemiesGroup!: Phaser.GameObjects.Group;
    private projectilesGroup!: Phaser.GameObjects.Group;
    
    
    private easystar!: EasyStar.js;
    private gridMap: number[][] = [];
    
    private isPreparation = true;
    private currentWave = 1;
    
    private coreBuilding: any = null;
    
    private nextSpawnTime = 0;
    private enemiesToSpawn = 0;
    private currentWaveType: 'RAIDER' | 'TANK' | 'SWARM' = 'RAIDER';

    constructor() {
        super('GameScene');
    }

    preload() {
        const g = this.add.graphics();
        
        // --- CORE ---
        // A high-tech structure with a glowing center
        g.lineStyle(2, 0x00ffff, 1);
        g.fillStyle(0x112233, 1);
        g.fillRoundedRect(4, 4, TILE_SIZE*3 - 8, TILE_SIZE*3 - 8, 16);
        g.strokeRoundedRect(4, 4, TILE_SIZE*3 - 8, TILE_SIZE*3 - 8, 16);
        g.fillStyle(0x00aaff, 1);
        g.fillCircle(TILE_SIZE*1.5, TILE_SIZE*1.5, TILE_SIZE*0.8);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(TILE_SIZE*1.5, TILE_SIZE*1.5, TILE_SIZE*0.3);
        g.generateTexture('tex_CORE', TILE_SIZE*3, TILE_SIZE*3);
        g.clear();
        
        // --- WALL ---
        // Armored block
        g.fillStyle(0x333333, 1);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.lineStyle(2, 0x555555, 1);
        g.strokeRect(2, 2, TILE_SIZE-4, TILE_SIZE-4);
        g.fillStyle(0x444444, 1);
        g.fillRect(8, 8, TILE_SIZE-16, TILE_SIZE-16);
        g.generateTexture('tex_WALL', TILE_SIZE, TILE_SIZE);
        g.clear();
        
        // --- TURRET BASES ---
        g.fillStyle(0x222222, 1);
        g.fillCircle(TILE_SIZE, TILE_SIZE, TILE_SIZE - 4);
        g.lineStyle(2, 0x555555, 1);
        g.strokeCircle(TILE_SIZE, TILE_SIZE, TILE_SIZE - 4);
        g.generateTexture('tex_BASE_2x2', TILE_SIZE*2, TILE_SIZE*2);
        g.clear();
        
        // --- CANNON GUN ---
        g.fillStyle(0x777777, 1);
        g.fillCircle(TILE_SIZE, TILE_SIZE, TILE_SIZE*0.5);
        g.fillStyle(0x555555, 1);
        g.fillRect(TILE_SIZE, TILE_SIZE - 6, TILE_SIZE*0.9, 12); // Barrel pointing right
        g.generateTexture('tex_CANNON_GUN', TILE_SIZE*2, TILE_SIZE*2);
        g.clear();
        
        // --- RAPID GUN ---
        g.fillStyle(0x887722, 1);
        g.fillCircle(TILE_SIZE, TILE_SIZE, TILE_SIZE*0.4);
        g.fillStyle(0xaa9933, 1);
        g.fillRect(TILE_SIZE, TILE_SIZE - 10, TILE_SIZE*0.7, 6);
        g.fillRect(TILE_SIZE, TILE_SIZE + 4, TILE_SIZE*0.7, 6);
        g.generateTexture('tex_RAPID_GUN', TILE_SIZE*2, TILE_SIZE*2);
        g.clear();
        
        // --- SNIPER GUN ---
        g.fillStyle(0x333388, 1);
        g.fillRect(TILE_SIZE - 8, TILE_SIZE - 8, 16, 16);
        g.fillStyle(0x4444aa, 1);
        g.fillRect(TILE_SIZE, TILE_SIZE - 3, TILE_SIZE*1.2, 6);
        g.generateTexture('tex_SNIPER_GUN', TILE_SIZE*2, TILE_SIZE*2);
        g.clear();
        
        // --- RAIDER (Speeder) ---
        g.fillStyle(0xcc2222, 1);
        g.beginPath();
        g.moveTo(TILE_SIZE, TILE_SIZE/2);
        g.lineTo(0, TILE_SIZE);
        g.lineTo(0, 0);
        g.closePath();
        g.fillPath();
        g.fillStyle(0xffaa00, 1);
        g.fillRect(2, TILE_SIZE/2 - 4, 8, 8); // cockpit
        g.generateTexture('tex_RAIDER', TILE_SIZE, TILE_SIZE);
        g.clear();
        
        // --- TANK ---
        g.fillStyle(0x555555, 1); // Tracks
        g.fillRect(0, 0, TILE_SIZE*1.5, 8);
        g.fillRect(0, TILE_SIZE*1.5 - 8, TILE_SIZE*1.5, 8);
        g.fillStyle(0x882222, 1); // Body
        g.fillRect(4, 8, TILE_SIZE*1.5 - 8, TILE_SIZE*1.5 - 16);
        g.fillStyle(0x333333, 1); // Gun
        g.fillRect(TILE_SIZE*1.5/2, TILE_SIZE*1.5/2 - 4, TILE_SIZE*0.8, 8);
        g.fillStyle(0x551111, 1);
        g.fillCircle(TILE_SIZE*1.5/2, TILE_SIZE*1.5/2, 12);
        g.generateTexture('tex_TANK', TILE_SIZE*1.5, TILE_SIZE*1.5);
        g.clear();
        
        // --- SWARM (Bug) ---
        g.fillStyle(0xaa00aa, 1);
        g.fillCircle(TILE_SIZE/2, TILE_SIZE/2, TILE_SIZE/3);
        g.fillStyle(0xff00ff, 1);
        g.fillCircle(TILE_SIZE/2 + 4, TILE_SIZE/2 - 4, 3);
        g.fillCircle(TILE_SIZE/2 + 4, TILE_SIZE/2 + 4, 3);
        g.generateTexture('tex_SWARM', TILE_SIZE, TILE_SIZE);
        g.clear();

        // Projectile
        g.fillStyle(0xffff00, 1);
        g.fillRect(0, 0, 12, 4);
        g.generateTexture('tex_bullet', 12, 4);
        g.clear();
        
        // Hit effect
        g.fillStyle(0xffffff, 1);
        g.fillCircle(4, 4, 4);
        g.generateTexture('tex_spark', 8, 8);
        g.clear();
    }

    create() {
        this.buildingsGroup = this.add.group();
        this.enemiesGroup = this.add.group();
        this.projectilesGroup = this.add.group();

        this.drawGrid();
        
        this.input.on('pointerdown', this.handlePointerDown, this);
        
        EventBus.on('START_WAVE', this.startWave, this);
        
        this.initGridMap();
        this.placeCore();
    }

    initGridMap() {
        this.gridMap = [];
        for (let y = 0; y < GRID_HEIGHT; y++) {
            let row = [];
            for (let x = 0; x < GRID_WIDTH; x++) {
                row.push(0);
            }
            this.gridMap.push(row);
        }
        
        this.easystar = new EasyStar.js();
        this.easystar.setGrid(this.gridMap);
        this.easystar.setAcceptableTiles([0]);
        this.easystar.enableDiagonals();
    }

    updateGridMap() {
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                this.gridMap[y][x] = 0;
            }
        }
        
        this.buildingsGroup.getChildren().forEach((b: any) => {
            const bx = Math.floor(b.x / TILE_SIZE);
            const by = Math.floor(b.y / TILE_SIZE);
            const s = b.bSize;
            for(let i=0; i<s; i++) {
                for(let j=0; j<s; j++) {
                    if(by+j < GRID_HEIGHT && bx+i < GRID_WIDTH) {
                        this.gridMap[by+j][bx+i] = 1;
                    }
                }
            }
        });
        this.easystar.setGrid(this.gridMap);
    }

    drawGrid() {
        this.gridGraphics = this.add.graphics();
        // A nice space/tech grid
        this.gridGraphics.lineStyle(1, 0x1a2b3c, 0.8);
        
        for (let i = 0; i <= GRID_WIDTH; i++) {
            this.gridGraphics.moveTo(i * TILE_SIZE, 0);
            this.gridGraphics.lineTo(i * TILE_SIZE, GRID_HEIGHT * TILE_SIZE);
        }
        for (let i = 0; i <= GRID_HEIGHT; i++) {
            this.gridGraphics.moveTo(0, i * TILE_SIZE);
            this.gridGraphics.lineTo(GRID_WIDTH * TILE_SIZE, i * TILE_SIZE);
        }
        this.gridGraphics.strokePath();
    }
    
    placeCore() {
        const cx = Math.floor(GRID_WIDTH / 2) - 1;
        const cy = Math.floor(GRID_HEIGHT / 2) - 1;
        
        const core = this.add.sprite(cx * TILE_SIZE, cy * TILE_SIZE, 'tex_CORE').setOrigin(0, 0);
        (core as any).bType = 'CORE';
        (core as any).bSize = 3;
        (core as any).hp = BUILDING_TYPES.CORE.hp;
        (core as any).maxHp = BUILDING_TYPES.CORE.hp;
        
        // Add a slow rotation effect to core visually?
        this.tweens.add({
            targets: core,
            alpha: 0.8,
            yoyo: true,
            repeat: -1,
            duration: 1500
        });
        
        this.buildingsGroup.add(core);
        this.coreBuilding = core;
        this.updateGridMap();
        
        useGameStore.getState().setBaseHp(BUILDING_TYPES.CORE.hp, BUILDING_TYPES.CORE.hp);
        useGameStore.getState().setGameState('PREPARATION');
    }

    handlePointerDown(pointer: Phaser.Input.Pointer) {
        if (!this.isPreparation) return;
        
        const type = useGameStore.getState().selectedBuilding;
        if (!type) return;
        
        const bInfo = BUILDING_TYPES[type as keyof typeof BUILDING_TYPES];
        if (!bInfo) return;
        
        if (useGameStore.getState().gold < bInfo.cost) return;
        
        const gx = Math.floor(pointer.x / TILE_SIZE);
        const gy = Math.floor(pointer.y / TILE_SIZE);
        
        if (gx < 0 || gy < 0 || gx + bInfo.size > GRID_WIDTH || gy + bInfo.size > GRID_HEIGHT) return;
        
        let collision = false;
        for(let i=0; i<bInfo.size; i++) {
            for(let j=0; j<bInfo.size; j++) {
                if (this.gridMap[gy+j][gx+i] === 1) collision = true;
            }
        }
        if (collision) return;
        
        useGameStore.getState().setGold(useGameStore.getState().gold - bInfo.cost);
        
        let b: any;
        
        if (type === 'WALL') {
            b = this.add.sprite(gx * TILE_SIZE, gy * TILE_SIZE, 'tex_WALL').setOrigin(0, 0);
        } else {
            // It's a turret. Create a base and a gun
            b = this.add.container(gx * TILE_SIZE, gy * TILE_SIZE);
            const base = this.add.sprite(0, 0, 'tex_BASE_2x2').setOrigin(0, 0);
            const gun = this.add.sprite(TILE_SIZE, TILE_SIZE, 'tex_' + type + '_GUN').setOrigin(0.5, 0.5);
            b.add([base, gun]);
            b.gunSprite = gun;
        }

        b.bType = type;
        b.bSize = bInfo.size;
        b.hp = bInfo.hp;
        b.maxHp = bInfo.hp;
        b.lastFired = 0;
        
        // Ensure x,y are correct for container and sprite
        b.x = gx * TILE_SIZE;
        b.y = gy * TILE_SIZE;
        
        const hpBarBg = this.add.graphics();
        const hpBar = this.add.graphics();
        b.hpBarBg = hpBarBg;
        b.hpBar = hpBar;
        this.updateHealthBar(b);
        
        this.buildingsGroup.add(b);
        this.updateGridMap();
    }
    
    updateHealthBar(b: any) {
        b.hpBarBg.clear();
        b.hpBarBg.fillStyle(0x000000, 0.8);
        b.hpBarBg.fillRect(b.x, b.y - 10, b.bSize * TILE_SIZE, 6);
        
        b.hpBar.clear();
        const p = Math.max(0, b.hp / b.maxHp);
        b.hpBar.fillStyle(p > 0.5 ? 0x00ff00 : p > 0.2 ? 0xffff00 : 0xff0000, 1);
        b.hpBar.fillRect(b.x + 1, b.y - 9, (b.bSize * TILE_SIZE - 2) * p, 4);
    }

    startWave() {
        this.isPreparation = false;
        useGameStore.getState().setGameState('COMBAT');
        this.currentWave = useGameStore.getState().wave;
        
        this.enemiesToSpawn = 5 + this.currentWave * 3;
        this.nextSpawnTime = this.time.now + 1000;
        
        if (this.currentWave % 5 === 0) this.currentWaveType = 'TANK';
        else if (this.currentWave % 3 === 0) this.currentWaveType = 'SWARM';
        else this.currentWaveType = 'RAIDER';
    }

    spawnEnemy() {
        let ex = 0, ey = 0;
        if (Math.random() < 0.5) {
            ex = Math.random() < 0.5 ? 0 : (GRID_WIDTH - 1) * TILE_SIZE;
            ey = Math.random() * (GRID_HEIGHT - 1) * TILE_SIZE;
        } else {
            ex = Math.random() * (GRID_WIDTH - 1) * TILE_SIZE;
            ey = Math.random() < 0.5 ? 0 : (GRID_HEIGHT - 1) * TILE_SIZE;
        }
        
        const type = this.currentWaveType;
        const eInfo = ENEMY_TYPES[type];
        
        const e = this.add.sprite(ex, ey, 'tex_' + type);
        
        (e as any).eType = type;
        (e as any).hp = eInfo.hp * (1 + this.currentWave * 0.1);
        (e as any).maxHp = (e as any).hp;
        (e as any).speed = eInfo.speed;
        (e as any).damage = eInfo.damage * (1 + this.currentWave * 0.1);
        (e as any).reward = eInfo.reward;
        (e as any).targetBuilding = null;
        (e as any).path = [];
        (e as any).pathRequested = false;
        
        const hpBar = this.add.graphics();
        (e as any).hpBar = hpBar;
        
        this.physics.add.existing(e);
        this.enemiesGroup.add(e);
    }

    update(time: number, delta: number) {
        if (this.isPreparation) return;
        
        if (this.enemiesToSpawn > 0 && time > this.nextSpawnTime) {
            this.spawnEnemy();
            this.enemiesToSpawn--;
            
            let delay = 1000;
            if (this.currentWaveType === 'SWARM') delay = 300;
            if (this.currentWaveType === 'TANK') delay = 2000;
            this.nextSpawnTime = time + delay;
        }
        
        this.easystar.calculate();
        
        this.updateEnemies(delta);
        this.updateDefenses(time);
        this.updateProjectiles(delta);
        
        if (this.enemiesToSpawn === 0 && this.enemiesGroup.getLength() === 0) {
            this.isPreparation = true;
            useGameStore.getState().setWave(this.currentWave + 1);
            useGameStore.getState().setGameState('PREPARATION');
            useGameStore.getState().setGold(useGameStore.getState().gold + 100 + this.currentWave * 20);
        }
    }

    updateEnemies(delta: number) {
        const enemies = this.enemiesGroup.getChildren() as any[];
        
        enemies.forEach(e => {
            e.hpBar.clear();
            const p = Math.max(0, e.hp / e.maxHp);
            e.hpBar.fillStyle(p > 0.5 ? 0x00ff00 : 0xff0000, 1);
            e.hpBar.fillRect(e.x - 10, e.y - 20, 20 * p, 4);
        
            if (!e.targetBuilding || !e.targetBuilding.active) {
                let closest: any = null;
                let minDist = Infinity;
                this.buildingsGroup.getChildren().forEach((b: any) => {
                    const dist = Phaser.Math.Distance.Between(e.x, e.y, b.x + (b.bSize*TILE_SIZE)/2, b.y + (b.bSize*TILE_SIZE)/2);
                    if (dist < minDist) {
                        minDist = dist;
                        closest = b;
                    }
                });
                
                if (e.eType === 'RAIDER') {
                    closest = this.coreBuilding;
                }
                
                e.targetBuilding = closest;
                
                if (e.targetBuilding) {
                    const gridEx = Phaser.Math.Clamp(Math.floor(e.x / TILE_SIZE), 0, GRID_WIDTH - 1);
                    const gridEy = Phaser.Math.Clamp(Math.floor(e.y / TILE_SIZE), 0, GRID_HEIGHT - 1);
                    const gridBx = Phaser.Math.Clamp(Math.floor(e.targetBuilding.x / TILE_SIZE), 0, GRID_WIDTH - 1);
                    const gridBy = Phaser.Math.Clamp(Math.floor(e.targetBuilding.y / TILE_SIZE), 0, GRID_HEIGHT - 1);
                    
                    if (!e.pathRequested) {
                        e.pathRequested = true;
                        this.easystar.findPath(gridEx, gridEy, gridBx, gridBy, (path) => {
                            e.pathRequested = false;
                            if (path && path.length > 0) {
                                e.path = path;
                                e.pathIndex = 1;
                            } else {
                                e.path = null;
                            }
                        });
                    }

                    if (e.path && e.pathIndex < e.path.length) {
                        const nextNode = e.path[e.pathIndex];
                        const nx = nextNode.x * TILE_SIZE + TILE_SIZE/2;
                        const ny = nextNode.y * TILE_SIZE + TILE_SIZE/2;
                        const d = Phaser.Math.Distance.Between(e.x, e.y, nx, ny);
                        
                        if (d < 5) {
                            e.pathIndex++;
                        } else {
                            const angle = Phaser.Math.Angle.Between(e.x, e.y, nx, ny);
                            e.body.setVelocity(Math.cos(angle) * e.speed, Math.sin(angle) * e.speed);
                            e.rotation = angle;
                        }
                    } else if (e.path === null) {
                        const tx = e.targetBuilding.x + (e.targetBuilding.bSize*TILE_SIZE)/2;
                        const ty = e.targetBuilding.y + (e.targetBuilding.bSize*TILE_SIZE)/2;
                        const angle = Phaser.Math.Angle.Between(e.x, e.y, tx, ty);
                        e.body.setVelocity(Math.cos(angle) * e.speed, Math.sin(angle) * e.speed);
                        e.rotation = angle;
                    }
                } else {
                    e.body.setVelocity(0, 0);
                }
            } else {
                const tx = e.targetBuilding.x + (e.targetBuilding.bSize*TILE_SIZE)/2;
                const ty = e.targetBuilding.y + (e.targetBuilding.bSize*TILE_SIZE)/2;
                const dist = Phaser.Math.Distance.Between(e.x, e.y, tx, ty);
                
                const reachDist = (e.targetBuilding.bSize * TILE_SIZE) / 2 + 15;
                if (dist < reachDist) {
                    e.body.setVelocity(0, 0);
                    e.targetBuilding.hp -= e.damage * (delta/1000);
                    this.updateHealthBar(e.targetBuilding);
                    
                    if (e.targetBuilding.bType === 'CORE') {
                        useGameStore.getState().setBaseHp(Math.floor(e.targetBuilding.hp));
                    }
                    
                    if (e.targetBuilding.hp <= 0) {
                        this.destroyBuilding(e.targetBuilding);
                        e.targetBuilding = null;
                    }
                } else {
                    const angle = Phaser.Math.Angle.Between(e.x, e.y, tx, ty);
                    e.body.setVelocity(Math.cos(angle) * e.speed, Math.sin(angle) * e.speed);
                    e.rotation = angle;
                }
            }
            
            if (e.hp <= 0) {
                this.spawnExplosion(e.x, e.y, 0xffaa00);
                useGameStore.getState().setGold(useGameStore.getState().gold + e.reward);
                e.hpBar.destroy();
                e.destroy();
            }
        });
    }

    spawnExplosion(x: number, y: number, color: number) {
        const emitter = this.add.particles(x, y, 'tex_spark', {
            speed: { min: 50, max: 150 },
            scale: { start: 1, end: 0 },
            lifespan: 300,
            blendMode: 'ADD',
            tint: color,
            quantity: 10,
        });
        emitter.explode();
        this.time.delayedCall(500, () => emitter.destroy());
    }

    destroyBuilding(b: any) {
        this.spawnExplosion(b.x + (b.bSize*TILE_SIZE)/2, b.y + (b.bSize*TILE_SIZE)/2, 0xff0000);
        if (b.bType === 'CORE') {
            useGameStore.getState().setGameState('GAMEOVER');
            this.scene.pause();
        }
        b.hpBar.destroy();
        b.hpBarBg.destroy();
        b.destroy();
        this.updateGridMap();
    }

    updateDefenses(time: number) {
        this.buildingsGroup.getChildren().forEach((b: any) => {
            if (b.bType === 'CORE' || b.bType === 'WALL') return;
            
            const bInfo = BUILDING_TYPES[b.bType as keyof typeof BUILDING_TYPES] as any;
            if (!bInfo.range) return;
            
            const bx = b.x + (b.bSize*TILE_SIZE)/2;
            const by = b.y + (b.bSize*TILE_SIZE)/2;
            
            // Find target
            let closest: any = null;
            let minDist = bInfo.range;
            
            this.enemiesGroup.getChildren().forEach((e: any) => {
                const dist = Phaser.Math.Distance.Between(bx, by, e.x, e.y);
                if (dist < minDist) {
                    minDist = dist;
                    closest = e;
                }
            });
            
            if (closest) {
                // Rotate gun towards target
                const angle = Phaser.Math.Angle.Between(bx, by, closest.x, closest.y);
                if (b.gunSprite) {
                    // Smooth rotation could be added, but instant is fine for now
                    b.gunSprite.rotation = angle;
                }
                
                if (time > (b.lastFired || 0) + bInfo.fireRate) {
                    this.fireProjectile(bx, by, angle, closest, bInfo.damage);
                    b.lastFired = time;
                }
            }
        });
    }

    fireProjectile(x: number, y: number, angle: number, target: any, damage: number) {
        // Offset starting position slightly to barrel end
        const px = x + Math.cos(angle) * 20;
        const py = y + Math.sin(angle) * 20;
        
        const p = this.add.sprite(px, py, 'tex_bullet');
        p.rotation = angle;
        this.physics.add.existing(p);
        (p as any).target = target;
        (p as any).damage = damage;
        (p as any).speed = 500;
        
        this.projectilesGroup.add(p);
    }
    
    updateProjectiles(delta: number) {
        this.projectilesGroup.getChildren().forEach((p: any) => {
            if (!p.target || !p.target.active) {
                p.destroy();
                return;
            }
            
            const dist = Phaser.Math.Distance.Between(p.x, p.y, p.target.x, p.target.y);
            if (dist < 15) {
                p.target.hp -= p.damage;
                p.destroy();
            } else {
                const angle = Phaser.Math.Angle.Between(p.x, p.y, p.target.x, p.target.y);
                p.rotation = angle;
                p.body.setVelocity(Math.cos(angle) * p.speed, Math.sin(angle) * p.speed);
            }
        });
    }
}
