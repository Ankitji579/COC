
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
        // Generate placeholder textures
        const g = this.add.graphics();
        
        // Core
        g.fillStyle(0x00aaff, 1);
        g.fillRect(0, 0, TILE_SIZE*3, TILE_SIZE*3);
        g.generateTexture('tex_CORE', TILE_SIZE*3, TILE_SIZE*3);
        g.clear();
        
        // Wall
        g.fillStyle(0x888888, 1);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.generateTexture('tex_WALL', TILE_SIZE, TILE_SIZE);
        g.clear();
        
        // Cannon
        g.fillStyle(0xffaa00, 1);
        g.fillCircle(TILE_SIZE, TILE_SIZE, TILE_SIZE);
        g.generateTexture('tex_CANNON', TILE_SIZE*2, TILE_SIZE*2);
        g.clear();
        
        // Rapid
        g.fillStyle(0xfff000, 1);
        g.fillCircle(TILE_SIZE, TILE_SIZE, TILE_SIZE*0.8);
        g.generateTexture('tex_RAPID', TILE_SIZE*2, TILE_SIZE*2);
        g.clear();
        
        // Sniper
        g.fillStyle(0xdd00ff, 1);
        g.fillRect(TILE_SIZE/2, 0, TILE_SIZE, TILE_SIZE*2);
        g.generateTexture('tex_SNIPER', TILE_SIZE*2, TILE_SIZE*2);
        g.clear();
        
        // Raider
        g.fillStyle(0xff0000, 1);
        g.fillTriangle(TILE_SIZE/2, 0, TILE_SIZE, TILE_SIZE, 0, TILE_SIZE);
        g.generateTexture('tex_RAIDER', TILE_SIZE, TILE_SIZE);
        g.clear();
        
        // Tank
        g.fillStyle(0xaa0000, 1);
        g.fillRect(0, 0, TILE_SIZE*1.5, TILE_SIZE*1.5);
        g.generateTexture('tex_TANK', TILE_SIZE*1.5, TILE_SIZE*1.5);
        g.clear();
        
        // Swarm
        g.fillStyle(0xff5555, 1);
        g.fillCircle(TILE_SIZE/3, TILE_SIZE/3, TILE_SIZE/3);
        g.generateTexture('tex_SWARM', TILE_SIZE/1.5, TILE_SIZE/1.5);
        g.clear();

        // Projectile
        g.fillStyle(0xffffff, 1);
        g.fillCircle(4, 4, 4);
        g.generateTexture('tex_bullet', 8, 8);
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
        
        // Place Core
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
        // this.easystar.disableCornerCutting();
    }

    updateGridMap() {
        // Reset grid
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                this.gridMap[y][x] = 0;
            }
        }
        
        // Mark buildings
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
        this.gridGraphics.lineStyle(1, 0x444444, 0.5);
        
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
        
        if (useGameStore.getState().gold < bInfo.cost) {
            console.log("Not enough gold");
            return; // Not enough gold
        }
        
        const gx = Math.floor(pointer.x / TILE_SIZE);
        const gy = Math.floor(pointer.y / TILE_SIZE);
        
        // Check bounds
        if (gx < 0 || gy < 0 || gx + bInfo.size > GRID_WIDTH || gy + bInfo.size > GRID_HEIGHT) return;
        
        // Check collision
        let collision = false;
        for(let i=0; i<bInfo.size; i++) {
            for(let j=0; j<bInfo.size; j++) {
                if (this.gridMap[gy+j][gx+i] === 1) collision = true;
            }
        }
        
        if (collision) return;
        
        // Ensure path to core from edges still exists? 
        // For simplicity, we just place it. If path blocked, enemies might attack walls.
        
        useGameStore.getState().setGold(useGameStore.getState().gold - bInfo.cost);
        
        const b = this.add.sprite(gx * TILE_SIZE, gy * TILE_SIZE, 'tex_' + type).setOrigin(0, 0);
        (b as any).bType = type;
        (b as any).bSize = bInfo.size;
        (b as any).hp = bInfo.hp;
        (b as any).maxHp = bInfo.hp;
        (b as any).lastFired = 0;
        
        // Add health bar
        const hpBarBg = this.add.graphics();
        const hpBar = this.add.graphics();
        (b as any).hpBarBg = hpBarBg;
        (b as any).hpBar = hpBar;
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
        
        this.enemiesToSpawn = 5 + this.currentWave * 2;
        this.nextSpawnTime = this.time.now + 1000;
        
        // Determine wave type
        if (this.currentWave % 5 === 0) this.currentWaveType = 'TANK';
        else if (this.currentWave % 3 === 0) this.currentWaveType = 'SWARM';
        else this.currentWaveType = 'RAIDER';
    }

    spawnEnemy() {
        // Spawn from random edge
        let ex = 0, ey = 0;
        if (Math.random() < 0.5) {
            ex = Math.random() < 0.5 ? 0 : GRID_WIDTH * TILE_SIZE;
            ey = Math.random() * GRID_HEIGHT * TILE_SIZE;
        } else {
            ex = Math.random() * GRID_WIDTH * TILE_SIZE;
            ey = Math.random() < 0.5 ? 0 : GRID_HEIGHT * TILE_SIZE;
        }
        
        const type = this.currentWaveType;
        const eInfo = ENEMY_TYPES[type];
        
        const e = this.add.sprite(ex, ey, 'tex_' + type);
        (e as any).eType = type;
        (e as any).hp = eInfo.hp * (1 + this.currentWave * 0.1); // Scale hp
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
        
        // Spawn enemies
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
        
        // Check win/loss
        if (this.enemiesToSpawn === 0 && this.enemiesGroup.getLength() === 0) {
            // Wave cleared
            this.isPreparation = true;
            useGameStore.getState().setWave(this.currentWave + 1);
            useGameStore.getState().setGameState('PREPARATION');
            
            // Reward for clearing wave
            useGameStore.getState().setGold(useGameStore.getState().gold + 100 + this.currentWave * 20);
        }
    }

    updateEnemies(delta: number) {
        const enemies = this.enemiesGroup.getChildren() as any[];
        
        enemies.forEach(e => {
            // Update hp bar
            e.hpBar.clear();
            const p = Math.max(0, e.hp / e.maxHp);
            e.hpBar.fillStyle(p > 0.5 ? 0x00ff00 : 0xff0000, 1);
            e.hpBar.fillRect(e.x - 10, e.y - 20, 20 * p, 4);
        
            // Find target (simple: closest building)
            if (!e.targetBuilding || !e.targetBuilding.active) {
                let closest = null;
                let minDist = Infinity;
                this.buildingsGroup.getChildren().forEach((b: any) => {
                    const dist = Phaser.Math.Distance.Between(e.x, e.y, b.x + (b.bSize*TILE_SIZE)/2, b.y + (b.bSize*TILE_SIZE)/2);
                    // Tanks prefer walls/defenses? For now just closest
                    if (dist < minDist) {
                        minDist = dist;
                        closest = b;
                    }
                });
                
                // If core rush strategy, prioritize core
                if (e.eType === 'RAIDER') {
                    closest = this.coreBuilding;
                }
                
                e.targetBuilding = closest;
                
                // Calculate path
                if (e.targetBuilding) {
                    const ex = Math.floor(e.x / TILE_SIZE);
                    const ey = Math.floor(e.y / TILE_SIZE);
                    const bx = Math.floor(e.targetBuilding.x / TILE_SIZE);
                    const by = Math.floor(e.targetBuilding.y / TILE_SIZE);
                    
                    // Temp allow walking on walls to find path to core, then attack walls?
                    // For simplicity, we just move directly towards target for now if A* fails
                    // Pathfinding
                    if (!e.pathRequested) {
                        e.pathRequested = true;
                        this.easystar.findPath(ex, ey, bx, by, (path) => {
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
                        }
                    } else if (e.path === null) {
                        const tx = e.targetBuilding.x + (e.targetBuilding.bSize*TILE_SIZE)/2;
                        const ty = e.targetBuilding.y + (e.targetBuilding.bSize*TILE_SIZE)/2;
                        const angle = Phaser.Math.Angle.Between(e.x, e.y, tx, ty);
                        e.body.setVelocity(Math.cos(angle) * e.speed, Math.sin(angle) * e.speed);
                    }
                } else {
                    e.body.setVelocity(0, 0);
                }
            } else {
                // Have target, perform attack if close
                const tx = e.targetBuilding.x + (e.targetBuilding.bSize*TILE_SIZE)/2;
                const ty = e.targetBuilding.y + (e.targetBuilding.bSize*TILE_SIZE)/2;
                const dist = Phaser.Math.Distance.Between(e.x, e.y, tx, ty);
                
                // If close enough, deal damage
                const reachDist = (e.targetBuilding.bSize * TILE_SIZE) / 2 + 10;
                if (dist < reachDist) {
                    e.body.setVelocity(0, 0);
                    // Attack
                    e.targetBuilding.hp -= e.damage * (delta/1000);
                    this.updateHealthBar(e.targetBuilding);
                    
                    if (e.targetBuilding.bType === 'CORE') {
                        useGameStore.getState().setBaseHp(Math.floor(e.targetBuilding.hp));
                    }
                    
                    if (e.targetBuilding.hp <= 0) {
                        this.destroyBuilding(e.targetBuilding);
                        e.targetBuilding = null;
                    }
                }
            }
            
            // Check death
            if (e.hp <= 0) {
                useGameStore.getState().setGold(useGameStore.getState().gold + e.reward);
                e.hpBar.destroy();
                e.destroy();
            }
        });
    }

    destroyBuilding(b: any) {
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
            
            if (time > (b.lastFired || 0) + bInfo.fireRate) {
                // Find target
                let closest = null;
                let minDist = bInfo.range;
                
                const bx = b.x + (b.bSize*TILE_SIZE)/2;
                const by = b.y + (b.bSize*TILE_SIZE)/2;
                
                this.enemiesGroup.getChildren().forEach((e: any) => {
                    const dist = Phaser.Math.Distance.Between(bx, by, e.x, e.y);
                    if (dist < minDist) {
                        minDist = dist;
                        closest = e;
                    }
                });
                
                if (closest) {
                    this.fireProjectile(bx, by, closest, bInfo.damage);
                    b.lastFired = time;
                }
            }
        });
    }

    fireProjectile(x: number, y: number, target: any, damage: number) {
        const p = this.add.sprite(x, y, 'tex_bullet');
        this.physics.add.existing(p);
        (p as any).target = target;
        (p as any).damage = damage;
        (p as any).speed = 300;
        
        this.projectilesGroup.add(p);
    }
    
    updateProjectiles(delta: number) {
        this.projectilesGroup.getChildren().forEach((p: any) => {
            if (!p.target || !p.target.active) {
                p.destroy();
                return;
            }
            
            const dist = Phaser.Math.Distance.Between(p.x, p.y, p.target.x, p.target.y);
            if (dist < 10) {
                p.target.hp -= p.damage;
                p.destroy();
            } else {
                const angle = Phaser.Math.Angle.Between(p.x, p.y, p.target.x, p.target.y);
                p.body.setVelocity(Math.cos(angle) * p.speed, Math.sin(angle) * p.speed);
            }
        });
    }
}
