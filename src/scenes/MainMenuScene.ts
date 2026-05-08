import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FONTS, PX } from '../constants';

type TileData = {
  icon: string;
  label: string;
  color: number;
  active: boolean;
  scene?: string;
  sceneData?: Record<string, unknown>;
};

const TILES: TileData[] = [
  {
    icon: '🔤',
    label: 'Ord og Emoji',
    color: 0x74c0fc,
    active: true,
    scene: 'ConnectThePairsScene',
    sceneData: { pairGenerator: 'wordEmoji' },
  },
  {
    icon: '🔢',
    label: 'Pluss (0-10)',
    color: 0xd0bfff,
    active: true,
    scene: 'ConnectThePairsScene',
    sceneData: { pairGenerator: 'mathLowPlus' },
  },
  // { icon: '🔡', label: 'Bokstaver', color: 0xb2f2bb, active: false },
];

const TILE_W = PX(250);
const TILE_H = PX(150);
const TILE_GAP = PX(30);
const TOTAL_W = TILES.length * TILE_W + (TILES.length - 1) * TILE_GAP;
const START_X = (GAME_WIDTH - TOTAL_W) / 2 + TILE_W / 2;

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    // Warm gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xffeaa7, 0xffeaa7, 0xfdcb6e, 0xfdcb6e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Title
    this.add
      .text(GAME_WIDTH / 2, PX(50), '🎮 Lærings-spill', {
        fontSize: `${PX(52)}px`,
        fontFamily: FONTS.family,
        color: '#2d3436',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, PX(120), 'Velg et spill:', {
        fontSize: `${PX(26)}px`,
        fontFamily: FONTS.family,
        color: '#636e72',
      })
      .setOrigin(0.5);

    // Game tiles
    TILES.forEach((tile, i) => {
      const x = START_X + i * (TILE_W + TILE_GAP);
      const y = GAME_HEIGHT / 2 + PX(50);
      this.createTile(x, y, tile);
    });
  }

  private createTile(x: number, y: number, tile: TileData): void {
    const { icon, label, color, active, scene } = tile;
    // Background rect
    const bg = this.add.rectangle(x, y, TILE_W, TILE_H, color, active ? 1 : 0.35);
    bg.setStrokeStyle(3, active ? 0x339af0 : 0xadb5bd);

    // Icon
    this.add.text(x, y - PX(24), icon, { fontSize: `${PX(72)}px`, fontFamily: FONTS.emoji }).setOrigin(0.5);

    // Label
    this.add
      .text(x, y + PX(48), label, {
        fontSize: `${PX(22)}px`,
        fontFamily: FONTS.family,
        color: active ? '#1a1a2e' : '#868e96',
      })
      .setOrigin(0.5);

    if (!active) {
      this.add
        .text(x, y + PX(24), 'Snart!', {
          fontSize: `${PX(20)}px`,
          fontFamily: FONTS.family,
          color: '#adb5bd',
        })
        .setOrigin(0.5);
      return;
    }

    // Interactivity for active tile
    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerover', () => {
      this.tweens.add({ targets: bg, scaleX: 1.04, scaleY: 1.04, duration: 120, ease: 'Back.Out' });
    });
    bg.on('pointerout', () => {
      this.tweens.add({ targets: bg, scaleX: 1, scaleY: 1, duration: 120 });
    });
    bg.on('pointerdown', () => {
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        if (scene) {
          this.scene.start(scene, tile.sceneData);
        }
      });
    });
  }
}
