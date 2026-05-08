import * as Phaser from 'phaser';
import confetti from 'canvas-confetti';
import { GAME_WIDTH, GAME_HEIGHT, FONTS } from '../constants';
import { playWin } from '../utils/audio';

export class WinScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WinScene' });
  }

  create(): void {
    // White-ish overlay
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xfff9db);

    playWin();
    this.fireConfetti();

    // Big celebration text
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, '🎉 Bra jobba! 🎉', {
        fontSize: '52px',
        fontFamily: FONTS.family,
        color: '#2d3436',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 16, 'Du klarte alle 5!', {
        fontSize: '28px',
        fontFamily: FONTS.family,
        color: '#636e72',
      })
      .setOrigin(0.5);

    // Next round button
    this.createButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, 'Neste runde 🔄', 0x74c0fc, 0x339af0, () => {
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('ConnectThePairsScene'));
    });

    // Back to menu button
    this.createButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 160, '← Tilbake til meny', 0xadb5bd, 0x868e96, () => {
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MainMenuScene'));
    });

    this.cameras.main.fadeIn(200, 255, 249, 219);
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    colorNormal: number,
    colorHover: number,
    onClick: () => void,
  ): void {
    const bg = this.add.rectangle(x, y, 300, 64, colorNormal);
    bg.setStrokeStyle(2, 0xadb5bd);
    bg.setInteractive({ useHandCursor: true });

    this.add
      .text(x, y, label, {
        fontSize: '26px',
        fontFamily: FONTS.family,
        color: '#1a1a2e',
      })
      .setOrigin(0.5);

    bg.on('pointerover', () => {
      bg.setFillStyle(colorHover);
      this.tweens.add({ targets: bg, scaleX: 1.04, scaleY: 1.04, duration: 100, ease: 'Back.Out' });
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(colorNormal);
      this.tweens.add({ targets: bg, scaleX: 1, scaleY: 1, duration: 100 });
    });
    bg.on('pointerdown', onClick);
  }

  private fireConfetti(): void {
    // canvas-confetti creates its own full-screen overlay canvas
    const burst = (origin: { x: number; y: number }, angle: number) =>
      confetti({
        particleCount: 80,
        spread: 70,
        angle,
        origin,
        zIndex: 9999,
      });

    this.time.delayedCall(150, () => {
      burst({ x: 0.5, y: 0.45 }, 90);
    });
    this.time.delayedCall(600, () => {
      burst({ x: 0.1, y: 0.6 }, 60);
      burst({ x: 0.9, y: 0.6 }, 120);
    });
  }
}
