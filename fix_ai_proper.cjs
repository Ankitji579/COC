const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src/game/scenes/GameScene.ts');

let content = fs.readFileSync(p, 'utf8');

const newUpdateEnemies = `    updateEnemies(delta: number) {
        const enemies = this.enemiesGroup.getChildren() as any[];
        
        enemies.forEach(e => {
            e.hpBar.clear();
            const p = Math.max(0, e.hp / e.maxHp);
            e.hpBar.fillStyle(p > 0.5 ? 0x00ff00 : 0xff0000, 1);
            e.hpBar.fillRect(e.x - 10, e.y - 20, 20 * p, 4);

            if (!e.targetBuilding || !e.targetBuilding.active || Math.random() < 0.01) {
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
                e.path = null;
            }
            
            if (e.targetBuilding) {
                const gridEx = Phaser.Math.Clamp(Math.floor(e.x / TILE_SIZE), 0, GRID_WIDTH - 1);
                const gridEy = Phaser.Math.Clamp(Math.floor(e.y / TILE_SIZE), 0, GRID_HEIGHT - 1);
                const gridBx = Phaser.Math.Clamp(Math.floor(e.targetBuilding.x / TILE_SIZE), 0, GRID_WIDTH - 1);
                const gridBy = Phaser.Math.Clamp(Math.floor(e.targetBuilding.y / TILE_SIZE), 0, GRID_HEIGHT - 1);
                
                if (!e.pathRequested && !e.path) {
                    e.pathRequested = true;
                    this.easystar.findPath(gridEx, gridEy, gridBx, gridBy, (path) => {
                        e.pathRequested = false;
                        if (path && path.length > 0) {
                            e.path = path;
                            e.pathIndex = 1;
                        } else {
                            let closestWall: any = null;
                            let minWallDist = Infinity;
                            this.buildingsGroup.getChildren().forEach((b: any) => {
                                if (b.bType === 'WALL') {
                                    const d = Phaser.Math.Distance.Between(e.x, e.y, b.x + (b.bSize*TILE_SIZE)/2, b.y + (b.bSize*TILE_SIZE)/2);
                                    if (d < minWallDist) {
                                        minWallDist = d;
                                        closestWall = b;
                                    }
                                }
                            });
                            if (closestWall && e.targetBuilding.bType !== 'WALL') {
                                e.targetBuilding = closestWall;
                            }
                            e.path = [];
                        }
                    });
                }

                if (e.path && e.path.length > 0 && e.pathIndex < e.path.length) {
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
                } else if (e.path !== null) {
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
                            e.path = null;
                        }
                    } else {
                        const angle = Phaser.Math.Angle.Between(e.x, e.y, tx, ty);
                        e.body.setVelocity(Math.cos(angle) * e.speed, Math.sin(angle) * e.speed);
                        e.rotation = angle;
                    }
                }
            } else {
                e.body.setVelocity(0, 0);
            }
            
            if (e.hp <= 0) {
                this.spawnExplosion(e.x, e.y, 0xffaa00);
                useGameStore.getState().setGold(useGameStore.getState().gold + e.reward);
                e.hpBar.destroy();
                e.destroy();
            }
        });
    }

    spawnExplosion(x: number, y: number, color: number) {`;

const regex = /    updateEnemies\(delta: number\) \{[\s\S]*?    spawnExplosion\(x: number, y: number, color: number\) \{/;
content = content.replace(regex, newUpdateEnemies);

fs.writeFileSync(p, content);
console.log("AI Fixed safely.");
