
import React, { useEffect, useRef, useState } from 'react';
import PhaserGame from './game/PhaserGame';
import { useGameStore } from './store/useGameStore';
import { EventBus } from './game/events/EventBus';

function App() {
    const gameState = useGameStore(state => state.gameState);
    const gold = useGameStore(state => state.gold);
    const wave = useGameStore(state => state.wave);
    const baseHp = useGameStore(state => state.baseHp);
    const maxBaseHp = useGameStore(state => state.maxBaseHp);
    const selectedBuilding = useGameStore(state => state.selectedBuilding);
    const setSelectedBuilding = useGameStore(state => state.setSelectedBuilding);

    const handleStartWave = () => {
        EventBus.emit('START_WAVE');
    };

    const handleBuild = (type: string) => {
        setSelectedBuilding(type);
        EventBus.emit('SELECT_BUILDING', type);
    };

    return (
        <div style={{ position: 'relative', width: '960px', height: '640px', margin: '0 auto', background: '#222' }}>
            <PhaserGame />
            
            {/* UI Overlay */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                
                {/* HUD */}
                {gameState !== 'MENU' && (
                    <div style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', color: '#fff', textShadow: '1px 1px 2px #000' }}>
                        <div>
                            <div>Gold: {gold}</div>
                            <div>Wave: {wave}</div>
                            <div>Base HP: {baseHp} / {maxBaseHp}</div>
                        </div>
                        <div>
                            State: {gameState}
                        </div>
                    </div>
                )}

                {/* Preparation UI */}
                {gameState === 'PREPARATION' && (
                    <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', pointerEvents: 'auto' }}>
                        <button onClick={() => handleBuild('WALL')} style={{ padding: '10px', background: selectedBuilding === 'WALL' ? '#66f' : '#444', color: '#fff', border: '1px solid #fff' }}>Wall (10G)</button>
                        <button onClick={() => handleBuild('CANNON')} style={{ padding: '10px', background: selectedBuilding === 'CANNON' ? '#66f' : '#444', color: '#fff', border: '1px solid #fff' }}>Cannon (100G)</button>
                        <button onClick={() => handleBuild('RAPID')} style={{ padding: '10px', background: selectedBuilding === 'RAPID' ? '#66f' : '#444', color: '#fff', border: '1px solid #fff' }}>Rapid (150G)</button>
                        <button onClick={() => handleBuild('SNIPER')} style={{ padding: '10px', background: selectedBuilding === 'SNIPER' ? '#66f' : '#444', color: '#fff', border: '1px solid #fff' }}>Sniper (200G)</button>
                        <button onClick={handleStartWave} style={{ padding: '10px', background: '#d33', color: '#fff', border: '1px solid #fff', fontWeight: 'bold' }}>START WAVE</button>
                    </div>
                )}

                {/* Game Over / Victory */}
                {gameState === 'GAMEOVER' && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.8)', padding: '20px', color: '#f55', textAlign: 'center', pointerEvents: 'auto' }}>
                        <h1>DEFENSE FAILED</h1>
                        <p>Your Command Core was destroyed.</p>
                        <button onClick={() => window.location.reload()}>Restart</button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
