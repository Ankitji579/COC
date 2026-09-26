const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src/game/scenes/GameScene.ts');

let scene = fs.readFileSync(p, 'utf8');

// Fix type
scene = scene.replace(
    /currentWaveType: 'RAIDER' \| 'TANK' \| 'SWARM' = 'RAIDER';/,
    `currentWaveType: 'RAIDER' | 'TANK' | 'SWARM' | 'BOSS' = 'RAIDER';`
);

// Fix bx, by
scene = scene.replace(
    /if \(\!bInfo\.range\) return;[\s\S]*?if \(triggered\) \{/g,
    `if (!bInfo.range) return;
            
            const bx = b.x + (b.bSize*TILE_SIZE)/2;
            const by = b.y + (b.bSize*TILE_SIZE)/2;

            if (b.bType === 'BOMB') {
                let triggered = false;
                this.enemiesGroup.getChildren().forEach((e: any) => {
                    const dist = Phaser.Math.Distance.Between(bx, by, e.x, e.y);
                    if (dist < bInfo.range) {
                        triggered = true;
                    }
                });
                
                if (triggered) {`
);

// Remove the old declaration of bx, by which is now below trapLogic
scene = scene.replace(
    /\n            const bx = b\.x \+ \(b\.bSize\*TILE_SIZE\)\/2;\n            const by = b\.y \+ \(b\.bSize\*TILE_SIZE\)\/2;/,
    ''
);

fs.writeFileSync(p, scene);
