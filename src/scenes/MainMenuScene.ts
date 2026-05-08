import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FONTS } from '../constants';

const TILES: { icon: string; label: string; color: number; active: boolean }[] = [
  { icon: '🔤', label: 'Ord og Emoji', color: 0x74c0fc, active: true },
  { icon: '🔢', label: 'Tall og Figur', color: 0xd0bfff, active: false },
  { icon: '🔡', label: 'Bokstaver',     color: 0xb2f2bb, active: false },
];

const TILE_W = 200;
const TILE_H = 210;
const TILE_GAP = 30;
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
      .text(GAME_WIDTH / 2, 90, '🎮 Lærings-spill', {
        fontSize: '52px',
        fontFamily: FONTS.family,
        color: '#2d3436',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 158, 'Velg et spill:', {
        fontSize: '26px',
        fontFamily: FONTS.family,
        color: '#636e72',
      })
      .setOrigin(0.5);

    // Game tiles
    TILES.forEach((tile, i) => {
      const x = START_X + i * (TILE_W + TILE_GAP);
      const y = GAME_HEIGHT / 2 + 50;
      this.createTile(x, y, tile.icon, tile.label, tile.color, tile.active);
    });
  }

  private createTile(
    x: number,
    y: number,
    icon: string,
    label: string,
    color: number,
    active: boolean,
  ): void {
    // Background rect
    const bg = this.add.rectangle(x, y, TILE_W, TILE_H, color, active ? 1 : 0.35);
    bg.setStrokeStyle(3, active ? 0x339af0 : 0xadb5bd);

    // Icon
    this.add
      .text(x, y - 52, icon, { fontSize: '72px', fontFamily: FONTS.emoji })
      .setOrigin(0.5);

    // Label
    this.add
      .text(x, y + 64, label, {
        fontSize: '22px',
        fontFamily: FONTS.family,
        color: active ? '#1a1a2e' : '#868e96',
      })
      .setOrigin(0.5);

    if (!active) {
      this.add
        .text(x, y + 10, 'Snart!', {
          fontSize: '20px',
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
        this.scene.start('WordMatchScene');
      });
    });
  }
}
