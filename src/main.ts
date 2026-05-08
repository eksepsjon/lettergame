import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, ASPECT_RATIO } from './constants';
import { BootScene } from './scenes/BootScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { ConnectThePairsScene } from './scenes/ConnectThePairsScene';
import { WinScene } from './scenes/WinScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scene: [BootScene, MainMenuScene, ConnectThePairsScene, WinScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
};

new Phaser.Game(config);
