
export const TILE_SIZE = 32;
export const GRID_WIDTH = 30;
export const GRID_HEIGHT = 20;

export const BUILDING_TYPES = {
    CORE: { name: 'Command Core', size: 3, hp: 1000, cost: 0 },
    WALL: { name: 'Wall', size: 1, hp: 200, cost: 10 },
    CANNON: { name: 'Cannon', size: 2, hp: 300, cost: 100, range: 120, damage: 20, fireRate: 1000 },
    RAPID: { name: 'Rapid Turret', size: 2, hp: 250, cost: 150, range: 100, damage: 5, fireRate: 200 },
    SNIPER: { name: 'Sniper Tower', size: 2, hp: 200, cost: 200, range: 300, damage: 50, fireRate: 2000 },
};

export const ENEMY_TYPES = {
    RAIDER: { name: 'Raider', speed: 60, hp: 50, damage: 10, reward: 5 },
    TANK: { name: 'Tank', speed: 30, hp: 300, damage: 30, reward: 20 },
    SWARM: { name: 'Swarm', speed: 90, hp: 20, damage: 5, reward: 2 }
};
