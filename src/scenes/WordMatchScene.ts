import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FONTS, LAYOUT } from '../constants';
import type { Category, WordPair } from '../types';
import wordsData from '../data/words.no.json';
import { pickRandom, shuffle } from '../utils/shuffle';
import { playCorrect, playWrong } from '../utils/audio';

interface Card {
  bg: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
  pairIndex: number;
  slot: number;
  matched: boolean;
}

const WORD_NORMAL   = 0xffffff;
const WORD_SELECTED = 0xffd43b;
const MATCHED_BG    = 0xb2f2bb;
const WRONG_BG      = 0xffe3e3;
const STROKE_NORMAL   = 0xdee2e6;
const STROKE_SELECTED = 0xf59f00;
const STROKE_MATCHED  = 0x51cf66;
const STROKE_WRONG    = 0xff6b6b;

export class WordMatchScene extends Phaser.Scene {
  private pairs: WordPair[] = [];
  private wordCards: Card[] = [];
  private emojiCards: Card[] = [];
  private selectedSlot = -1;
  private matchedCount = 0;
  private busy = false; // block input during animations

  constructor() {
    super({ key: 'WordMatchScene' });
  }

  create(): void {
    this.selectedSlot = -1;
    this.matchedCount = 0;
    this.busy = false;
    this.wordCards = [];
    this.emojiCards = [];

    // Pick category and 5 pairs
    const cats = (wordsData as { categories: Category[] }).categories;
    const category = cats[Math.floor(Math.random() * cats.length)];
    this.pairs = pickRandom(category.pairs, 5);

    // Independent shuffled column orders
    const wordOrder  = shuffle([0, 1, 2, 3, 4]);
    const emojiOrder = shuffle([0, 1, 2, 3, 4]);

    this.drawBackground(category.bgColor);
    this.drawHeader(category.name);
    this.drawColumnLabels();

    for (let slot = 0; slot < 5; slot++) {
      this.createWordCard(slot, wordOrder[slot]);
      this.createEmojiCard(slot, emojiOrder[slot]);
    }

    this.addBackButton();

    // Fade in
    this.cameras.main.fadeIn(250, 0, 0, 0);
  }

  // ─────────────────────── drawing helpers ─────────────────────────────────

  private drawBackground(categoryBgColor: number): void {
    const g = this.add.graphics();
    g.fillStyle(categoryBgColor, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Subtle column lanes
    g.fillStyle(0xffffff, 0.35);
    g.fillRoundedRect(
      LAYOUT.wordColumnX  - LAYOUT.wordCardW  / 2 - 12,
      80,
      LAYOUT.wordCardW  + 24,
      GAME_HEIGHT - 90,
      10,
    );
    g.fillRoundedRect(
      LAYOUT.emojiColumnX - LAYOUT.emojiCardW / 2 - 12,
      80,
      LAYOUT.emojiCardW + 24,
      GAME_HEIGHT - 90,
      10,
    );
  }

  private drawHeader(categoryName: string): void {
    this.add
      .text(GAME_WIDTH / 2, 40, `${categoryName} – koble ord med emoji!`, {
        fontSize: '26px',
        fontFamily: FONTS.family,
        color: '#2d3436',
      })
      .setOrigin(0.5);
  }

  private drawColumnLabels(): void {
    const style = { fontSize: '18px', fontFamily: FONTS.family, color: '#636e72' };
    this.add.text(LAYOUT.wordColumnX,  88, 'ORD',   style).setOrigin(0.5);
    this.add.text(LAYOUT.emojiColumnX, 88, 'EMOJI', style).setOrigin(0.5);
  }

  private addBackButton(): void {
    const btn = this.add
      .text(28, 28, '← Meny', {
        fontSize: '20px',
        fontFamily: FONTS.family,
        color: '#636e72',
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ color: '#2d3436' }));
    btn.on('pointerout',  () => btn.setStyle({ color: '#636e72' }));
    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () =>
        this.scene.start('MainMenuScene'),
      );
    });
  }

  // ─────────────────────── card creation ───────────────────────────────────

  private createWordCard(slot: number, pairIndex: number): void {
    const x = LAYOUT.wordColumnX;
    const y = LAYOUT.firstCardY + slot * LAYOUT.cardSpacing;
    const { wordCardW, wordCardH } = LAYOUT;

    const bg = this.add.rectangle(x, y, wordCardW, wordCardH, WORD_NORMAL);
    bg.setStrokeStyle(2, STROKE_NORMAL);
    bg.setInteractive({ useHandCursor: true });

    const text = this.add
      .text(x, y, this.pairs[pairIndex].word, {
        fontSize: '30px',
        fontFamily: FONTS.family,
        color: '#2d3436',
      })
      .setOrigin(0.5);

    const card: Card = { bg, text, pairIndex, slot, matched: false };
    this.wordCards[slot] = card;

    bg.on('pointerover', () => {
      if (!card.matched && this.selectedSlot !== slot) bg.setFillStyle(0xf1f3f5);
    });
    bg.on('pointerout', () => {
      if (!card.matched && this.selectedSlot !== slot) bg.setFillStyle(WORD_NORMAL);
    });
    bg.on('pointerdown', () => this.onWordClick(slot));
  }

  private createEmojiCard(slot: number, pairIndex: number): void {
    const x = LAYOUT.emojiColumnX;
    const y = LAYOUT.firstCardY + slot * LAYOUT.cardSpacing;
    const { emojiCardW, emojiCardH } = LAYOUT;

    const bg = this.add.rectangle(x, y, emojiCardW, emojiCardH, WORD_NORMAL);
    bg.setStrokeStyle(2, STROKE_NORMAL);
    bg.setInteractive({ useHandCursor: true });

    const text = this.add
      .text(x, y, this.pairs[pairIndex].emoji, {
        fontSize: '46px',
        fontFamily: FONTS.emoji,
      })
      .setOrigin(0.5);

    const card: Card = { bg, text, pairIndex, slot, matched: false };
    this.emojiCards[slot] = card;

    bg.on('pointerover', () => { if (!card.matched) bg.setFillStyle(0xf1f3f5); });
    bg.on('pointerout',  () => { if (!card.matched) bg.setFillStyle(WORD_NORMAL); });
    bg.on('pointerdown', () => this.onEmojiClick(slot));
  }

  // ─────────────────────── interaction ─────────────────────────────────────

  private onWordClick(slot: number): void {
    if (this.busy) return;
    const card = this.wordCards[slot];
    if (card.matched) return;

    // Deselect previous word card
    if (this.selectedSlot >= 0 && this.selectedSlot !== slot) {
      this.deselectWord(this.selectedSlot);
    }

    if (this.selectedSlot === slot) {
      // Toggle off
      this.deselectWord(slot);
      this.selectedSlot = -1;
    } else {
      // Select
      card.bg.setFillStyle(WORD_SELECTED);
      card.bg.setStrokeStyle(3, STROKE_SELECTED);
      this.tweens.add({
        targets: [card.bg, card.text],
        scaleX: 1.06,
        scaleY: 1.06,
        duration: 130,
        ease: 'Back.Out',
      });
      this.selectedSlot = slot;
    }
  }

  private onEmojiClick(emojiSlot: number): void {
    if (this.busy || this.selectedSlot < 0) return;

    const wordCard  = this.wordCards[this.selectedSlot];
    const emojiCard = this.emojiCards[emojiSlot];

    if (emojiCard.matched) return;

    if (emojiCard.pairIndex === wordCard.pairIndex) {
      this.handleCorrectMatch(wordCard, emojiCard);
    } else {
      this.handleWrongMatch(wordCard, emojiCard);
    }
  }

  private handleCorrectMatch(wordCard: Card, emojiCard: Card): void {
    this.busy = true;
    playCorrect();

    // Reset selection scale first
    this.tweens.add({ targets: [wordCard.bg, wordCard.text], scaleX: 1, scaleY: 1, duration: 80 });

    // Green colour on both cards
    wordCard.bg.setFillStyle(MATCHED_BG);
    wordCard.bg.setStrokeStyle(3, STROKE_MATCHED);
    emojiCard.bg.setFillStyle(MATCHED_BG);
    emojiCard.bg.setStrokeStyle(3, STROKE_MATCHED);

    // Bounce both pairs, then fade to matched state
    this.tweens.add({
      targets: [wordCard.bg, wordCard.text, emojiCard.bg, emojiCard.text],
      scaleX: 1.14,
      scaleY: 1.14,
      duration: 140,
      ease: 'Back.Out',
      yoyo: true,
      onComplete: () => {
        wordCard.matched = true;
        emojiCard.matched = true;
        wordCard.bg.disableInteractive();
        emojiCard.bg.disableInteractive();

        this.tweens.add({
          targets: [wordCard.bg, wordCard.text, emojiCard.bg, emojiCard.text],
          alpha: 0.45,
          duration: 280,
          onComplete: () => {
            this.matchedCount++;
            this.selectedSlot = -1;
            this.busy = false;
            if (this.matchedCount >= 5) {
              this.time.delayedCall(500, () => {
                this.cameras.main.fadeOut(300, 255, 255, 255);
                this.cameras.main.once('camerafadeoutcomplete', () =>
                  this.scene.start('WinScene'),
                );
              });
            }
          },
        });
      },
    });
  }

  private handleWrongMatch(wordCard: Card, emojiCard: Card): void {
    playWrong();

    // Red flash on the emoji card
    emojiCard.bg.setFillStyle(WRONG_BG);
    emojiCard.bg.setStrokeStyle(2, STROKE_WRONG);

    // Shake the emoji card
    const origX = emojiCard.bg.x;
    this.tweens.add({
      targets: [emojiCard.bg, emojiCard.text],
      x: origX + 9,
      duration: 45,
      ease: 'Linear',
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        emojiCard.bg.x = origX;
        emojiCard.text.x = origX;
        emojiCard.bg.setFillStyle(WORD_NORMAL);
        emojiCard.bg.setStrokeStyle(2, STROKE_NORMAL);
      },
    });

    // Deselect the word card after shake
    this.time.delayedCall(300, () => {
      this.deselectWord(wordCard.slot);
      this.selectedSlot = -1;
    });
  }

  private deselectWord(slot: number): void {
    const card = this.wordCards[slot];
    card.bg.setFillStyle(WORD_NORMAL);
    card.bg.setStrokeStyle(2, STROKE_NORMAL);
    this.tweens.add({ targets: [card.bg, card.text], scaleX: 1, scaleY: 1, duration: 100 });
  }
}
