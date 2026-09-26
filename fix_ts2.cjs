const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src/game/scenes/GameScene.ts');

let scene = fs.readFileSync(p, 'utf8');

// The file currently has duplicate bx, by definitions or they are in the wrong place.
// Let's completely rewrite updateDefenses to ensure it is correct.
const newDefenses = `    updateDefenses(time: number) {
        this.buildingsGroup.getChildren().forEach((b: any) => {
            if (b.bType === 'CORE' || b.bType === 'WALL') return;
            
            const bInfo = BUILDING_TYPES[b.bType as keyof typeof BUILDING_TYPES] as any;
            if (!bInfo) return;
            if (!bInfo.range) return;

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
                
                if (triggered) {
                    this.spawnExplosion(bx, by, 0xff0000); 
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

            // Turret logic
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
                const angle = Phaser.Math.Angle.Between(bx, by, closest.x, closest.y);
                if (b.gunSprite) {
                    b.gunSprite.rotation = angle;
                }
                
                if (time > (b.lastFired || 0) + bInfo.fireRate) {
                    this.fireProjectile(bx, by, angle, closest, bInfo.damage);
                    b.lastFired = time;
                }
            }
        });
    }`;

const regex = /    updateDefenses\(time: number\) \{[\s\S]*?(?=    fireProjectile)/;
scene = scene.replace(regex, newDefenses + '\n\n');
fs.writeFileSync(p, scene);
