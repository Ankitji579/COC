
import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';

const PhaserGame: React.FC = () => {
    const gameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (gameRef.current) return;

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            width: 960,
            height: 640,
            parent: 'phaser-container',
            backgroundColor: '#2d2d2d',
            scene: [GameScene],
            physics: {
                default: 'arcade',
                arcade: {
                    debug: false
                }
            }
        };

        gameRef.current = new Phaser.Game(config);

        return () => {
            gameRef.current?.destroy(true);
            gameRef.current = null;
        };
    }, []);

    return <div id="phaser-container" style={{ width: '100%', height: '100%' }} />;
};

export default PhaserGame;
