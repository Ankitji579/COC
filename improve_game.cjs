const fs = require('fs');
const path = require('path');

// Update Constants
const constPath = path.join(__dirname, 'src/game/utils/constants.ts');
let constants = fs.readFileSync(constPath, 'utf8');

if (!constants.includes('BOSS')) {
    constants = constants.replace(
        "SWARM: { name: 'Swarm', speed: 90, hp: 20, damage: 5, reward: 2 }",
        "SWARM: { name: 'Swarm', speed: 90, hp: 20, damage: 5, reward: 2 },\n    BOSS: { name: 'Titan Mech', speed: 20, hp: 3000, damage: 50, reward: 500 }"
    );
    constants = constants.replace(
        "WALL: { name: 'Wall', size: 1, hp: 200, cost: 10 },",
        "WALL: { name: 'Wall', size: 1, hp: 200, cost: 10 },\n    BOMB: { name: 'Mine Trap', size: 1, hp: 10, cost: 50, range: 60, damage: 200, trap: true },"
    );
    fs.writeFileSync(constPath, constants);
}

// Update App.tsx for the new BOMB trap
const appPath = path.join(__dirname, 'src/App.tsx');
let app = fs.readFileSync(appPath, 'utf8');
if (!app.includes('BOMB')) {
    app = app.replace(
        `<button onClick={() => handleBuild('WALL')} style={{ padding: '10px', background: selectedBuilding === 'WALL' ? '#66f' : '#444', color: '#fff', border: '1px solid #fff' }}>Wall (10G)</button>`,
        `<button onClick={() => handleBuild('WALL')} style={{ padding: '10px', background: selectedBuilding === 'WALL' ? '#66f' : '#444', color: '#fff', border: '1px solid #fff' }}>Wall (10G)</button>\n                        <button onClick={() => handleBuild('BOMB')} style={{ padding: '10px', background: selectedBuilding === 'BOMB' ? '#66f' : '#444', color: '#fff', border: '1px solid #fff' }}>Mine (50G)</button>`
    );
    fs.writeFileSync(appPath, app);
}

// Update GameScene
const scenePath = path.join(__dirname, 'src/game/scenes/GameScene.ts');
let scene = fs.readFileSync(scenePath, 'utf8');

// Improve Preload Graphics
const newPreload = `    preload() {
        const g = this.add.graphics();
        
        // --- CORE ---
        g.fillStyle(0x0f172a, 1);
        g.fillRoundedRect(0, 0, TILE_SIZE*3, TILE_SIZE*3, 16);
        g.lineStyle(4, 0x0ea5e9, 1);
        g.strokeRoundedRect(2, 2, TILE_SIZE*3 - 4, TILE_SIZE*3 - 4, 16);
        g.fillStyle(0x38bdf8, 0.2);
        g.fillCircle(TILE_SIZE*1.5, TILE_SIZE*1.5, TILE_SIZE*1.2);
        g.fillStyle(0x0284c7, 1);
        g.fillCircle(TILE_SIZE*1.5, TILE_SIZE*1.5, TILE_SIZE*0.7);
        g.fillStyle(0xe0f2fe, 1);
        g.fillCircle(TILE_SIZE*1.5, TILE_SIZE*1.5, TILE_SIZE*0.3);
        g.generateTexture('tex_CORE', TILE_SIZE*3, TILE_SIZE*3);
        g.clear();
        
        // --- WALL ---
        g.fillStyle(0x1e293b, 1);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.lineStyle(2, 0x475569, 1);
        g.strokeRect(1, 1, TILE_SIZE-2, TILE_SIZE-2);
        g.fillStyle(0x334155, 1);
        g.fillRect(6, 6, TILE_SIZE-12, TILE_SIZE-12);
        g.fillStyle(0x64748b, 1);
        g.fillRect(10, 10, TILE_SIZE-20, TILE_SIZE-20);
        g.generateTexture('tex_WALL', TILE_SIZE, TILE_SIZE);
        g.clear();
        
        // --- BOMB (Mine) ---
        g.fillStyle(0x1e293b, 1);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.fillStyle(0xef4444, 1);
        g.fillCircle(TILE_SIZE/2, TILE_SIZE/2, TILE_SIZE/3);
        g.fillStyle(0xfca5a5, 1);
        g.fillCircle(TILE_SIZE/2, TILE_SIZE/2, 4);
        g.generateTexture('tex_BOMB', TILE_SIZE, TILE_SIZE);
        g.clear();

        // --- TURRET BASES ---
        g.fillStyle(0x0f172a, 1);
        g.fillRect(0, 0, TILE_SIZE*2, TILE_SIZE*2);
        g.fillStyle(0x1e293b, 1);
        g.fillCircle(TILE_SIZE, TILE_SIZE, TILE_SIZE - 2);
        g.lineStyle(4, 0x475569, 1);
        g.strokeCircle(TILE_SIZE, TILE_SIZE, TILE_SIZE - 2);
        g.generateTexture('tex_BASE_2x2', TILE_SIZE*2, TILE_SIZE*2);
        g.clear();
        
        // --- CANNON GUN ---
        g.fillStyle(0x94a3b8, 1);
        g.fillCircle(TILE_SIZE, TILE_SIZE, TILE_SIZE*0.6);
        g.fillStyle(0x64748b, 1);
        g.fillRect(TILE_SIZE, TILE_SIZE - 8, TILE_SIZE, 16); 
        g.fillStyle(0x0f172a, 1);
        g.fillRect(TILE_SIZE*2 - 4, TILE_SIZE - 6, 4, 12);
        g.generateTexture('tex_CANNON_GUN', TILE_SIZE*2, TILE_SIZE*2);
        g.clear();
        
        // --- RAPID GUN ---
        g.fillStyle(0xd97706, 1);
        g.fillCircle(TILE_SIZE, TILE_SIZE, TILE_SIZE*0.5);
        g.fillStyle(0xf59e0b, 1);
        g.fillRect(TILE_SIZE, TILE_SIZE - 12, TILE_SIZE*0.8, 6);
        g.fillRect(TILE_SIZE, TILE_SIZE + 6, TILE_SIZE*0.8, 6);
        g.generateTexture('tex_RAPID_GUN', TILE_SIZE*2, TILE_SIZE*2);
        g.clear();
        
        // --- SNIPER GUN ---
        g.fillStyle(0x4f46e5, 1);
        g.fillRect(TILE_SIZE - 10, TILE_SIZE - 10, 20, 20);
        g.fillStyle(0x6366f1, 1);
        g.fillRect(TILE_SIZE, TILE_SIZE - 3, TILE_SIZE*1.4, 6);
        g.generateTexture('tex_SNIPER_GUN', TILE_SIZE*2, TILE_SIZE*2);
        g.clear();
        
        // --- RAIDER (Speeder) ---
        g.fillStyle(0xdc2626, 1);
        g.beginPath();
        g.moveTo(TILE_SIZE, TILE_SIZE/2);
        g.lineTo(0, TILE_SIZE - 4);
        g.lineTo(4, TILE_SIZE/2);
        g.lineTo(0, 4);
        g.closePath();
        g.fillPath();
        g.fillStyle(0xfef08a, 1);
        g.fillCircle(TILE_SIZE/2 + 4, TILE_SIZE/2, 4);
        g.generateTexture('tex_RAIDER', TILE_SIZE, TILE_SIZE);
        g.clear();
        
        // --- TANK ---
        g.fillStyle(0x334155, 1); 
        g.fillRect(2, 2, TILE_SIZE*1.5 - 4, TILE_SIZE*1.5 - 4);
        g.fillStyle(0xb91c1c, 1); 
        g.fillRect(8, 8, TILE_SIZE*1.5 - 16, TILE_SIZE*1.5 - 16);
        g.fillStyle(0x0f172a, 1); 
        g.fillRect(TILE_SIZE*1.5/2, TILE_SIZE*1.5/2 - 6, TILE_SIZE*0.8, 12);
        g.fillStyle(0x7f1d1d, 1);
        g.fillCircle(TILE_SIZE*1.5/2, TILE_SIZE*1.5/2, 14);
        g.generateTexture('tex_TANK', TILE_SIZE*1.5, TILE_SIZE*1.5);
        g.clear();
        
        // --- SWARM (Bug) ---
        g.fillStyle(0x7e22ce, 1);
        g.fillCircle(TILE_SIZE/2, TILE_SIZE/2, TILE_SIZE/3);
        g.fillStyle(0xd8b4fe, 1);
        g.fillCircle(TILE_SIZE/2 + 4, TILE_SIZE/2 - 5, 4);
        g.fillCircle(TILE_SIZE/2 + 4, TILE_SIZE/2 + 5, 4);
        g.generateTexture('tex_SWARM', TILE_SIZE, TILE_SIZE);
        g.clear();

        // --- BOSS (Titan) ---
        g.fillStyle(0x1e1b4b, 1);
        g.fillCircle(TILE_SIZE*1.5, TILE_SIZE*1.5, TILE_SIZE*1.4);
        g.lineStyle(6, 0x4338ca, 1);
        g.strokeCircle(TILE_SIZE*1.5, TILE_SIZE*1.5, TILE_SIZE*1.4);
        g.fillStyle(0x312e81, 1);
        g.fillCircle(TILE_SIZE*1.5, TILE_SIZE*1.5, TILE_SIZE*0.8);
        g.fillStyle(0xf43f5e, 1);
        g.fillCircle(TILE_SIZE*1.5, TILE_SIZE*1.5, TILE_SIZE*0.4);
        g.fillStyle(0x4338ca, 1);
        g.fillRect(TILE_SIZE*1.5, TILE_SIZE*1.5 - 10, TILE_SIZE*1.5, 20); // Massive gun
        g.generateTexture('tex_BOSS', TILE_SIZE*3, TILE_SIZE*3);
        g.clear();

        // Projectile
        g.fillStyle(0xfde047, 1);
        g.fillRect(0, 0, 16, 6);
        g.generateTexture('tex_bullet', 16, 6);
        g.clear();
        
        // Hit effect
        g.fillStyle(0xffffff, 1);
        g.fillCircle(6, 6, 6);
        g.generateTexture('tex_spark', 12, 12);
        g.clear();
    }`;

scene = scene.replace(/    preload\(\) \{[\s\S]*?(?=    create\(\) \{)/, newPreload + '\n');

// Add Boss wave logic and Trap placement logic
scene = scene.replace(
    /if \(this.currentWave % 5 === 0\) this.currentWaveType = 'TANK';/,
    `if (this.currentWave % 5 === 0) this.currentWaveType = 'BOSS';\n        else if (this.currentWave % 3 === 0) this.currentWaveType = 'TANK';`
);

// Allow placing BOMB
scene = scene.replace(
    /if \(type === 'WALL'\) \{[\s\S]*?\} else \{/,
    `if (type === 'WALL' || type === 'BOMB') {
            b = this.add.sprite(gx * TILE_SIZE, gy * TILE_SIZE, 'tex_' + type).setOrigin(0, 0);
        } else {`
);

// Trap explosion logic in updateDefenses
const trapLogic = `
            if (b.bType === 'BOMB') {
                let triggered = false;
                this.enemiesGroup.getChildren().forEach((e: any) => {
                    const dist = Phaser.Math.Distance.Between(bx, by, e.x, e.y);
                    if (dist < bInfo.range) {
                        triggered = true;
                    }
                });
                
                if (triggered) {
                    this.spawnExplosion(bx, by, 0xff0000); // Big explosion
                    this.enemiesGroup.getChildren().forEach((e: any) => {
                        const dist = Phaser.Math.Distance.Between(bx, by, e.x, e.y);
                        if (dist < bInfo.range) {
                            e.hp -= bInfo.damage;
                            if (e.hp <= 0) {
                                this.spawnExplosion(e.x, e.y, 0xffaa00);
                                useGameStore.getState().setGold(useGameStore.getState().gold + e.reward);
                                e.hpBar.destroy();
                                e.destroy();
                            }
                        }
                    });
                    b.hp = 0;
                    this.destroyBuilding(b);
                }
                return;
            }
`;

scene = scene.replace(
    /if \(!bInfo.range\) return;/,
    `if (!bInfo.range) return;${trapLogic}`
);

fs.writeFileSync(scenePath, scene);
console.log("Game improved");
