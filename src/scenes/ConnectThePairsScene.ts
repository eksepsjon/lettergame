import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FONTS, PX } from '../constants';
import type { Category, WordPair } from '../types';
import wordsData from '../data/words.no.json';
import { pickRandom, shuffle } from '../utils/shuffle';
import { playCorrect, playWrong } from '../utils/audio';

interface Card {
  bg: Phaser.GameObjects.Rectangle;
  text: string;
  index: number;
  textMatch: string;
  matched: boolean;
}

const WORD_NORMAL = 0xffffff;
const WORD_SELECTED = 0xffd43b;
const MATCHED_BG = 0xb2f2bb;
const WRONG_BG = 0xffe3e3;
const STROKE_NORMAL = 0xdee2e6;
const STROKE_SELECTED = 0xf59f00;
const STROKE_MATCHED = 0x51cf66;
const STROKE_WRONG = 0xff6b6b;

const LAYOUT = {
  columnWidth: GAME_WIDTH * 0.3,
  columnMargin: GAME_WIDTH * 0.1,
  cardHeight: GAME_HEIGHT * 0.1,
  cardY: GAME_HEIGHT * 0.33,
  cardSpacing: GAME_HEIGHT * 0.01,
};

type GamePair = {
  left: string;
  right: string;
};

type GameConfig = {
  title: string;
  leftLabel: string;
  rightLabel: string;
  pairs: GamePair[];
};

const createWordPairGame = (): GameConfig => {
  const cats = (wordsData as { categories: Category[] }).categories;
  const category = cats[Math.floor(Math.random() * cats.length)];

  const pairs = shuffle(pickRandom(category.pairs, 5));

  return {
    title: `Koble ord med emoji!`,
    leftLabel: category.name,
    rightLabel: 'Emoji',
    pairs: pairs.map((p) => ({ left: p.word, right: p.emoji })),
  };
};

const createMathLowPlusGame = (): GameConfig => {
  const pairs: GamePair[] = [];
  for (let i = 0; i < 5; i++) {
    const a = Math.floor(Math.random() * 10);
    const b = Math.floor(Math.random() * 10);
    pairs.push({ left: `${a} + ${b}`, right: `${a + b}` });
  }
  return {
    title: `Koble regnestykker med svar!`,
    leftLabel: 'Regnestykke',
    rightLabel: 'Svar',
    pairs,
  };
};

type PairSceneData = {
  scene: 'ConnectThePairsScene';
  pairGenerator: 'mathLowPlus' | 'wordEmoji';
};

export class ConnectThePairsScene extends Phaser.Scene {
  private sceneData: PairSceneData = { scene: 'ConnectThePairsScene', pairGenerator: 'wordEmoji' };
  private gameConfig: GameConfig | undefined = undefined;
  private pairs: GamePair[] = [];
  private leftCards: Card[] = [];
  private rightCards: Card[] = [];

  private leftCard = -1;
  private rightCard = -1;

  private matchedCount = 0;
  private busy = false; // block input during animations

  constructor() {
    super({ key: 'ConnectThePairsScene' });
  }

  init(data: PairSceneData): void {
    console.log('Init:', data);
    this.sceneData = { ...data };
    if (data.pairGenerator === 'mathLowPlus') {
      this.gameConfig = createMathLowPlusGame();
    } else {
      this.gameConfig = createWordPairGame();
    }

    this.pairs = this.gameConfig.pairs;
  }

  create(): void {
    this.leftCard = -1;
    this.rightCard = -1;
    this.matchedCount = 0;
    this.busy = false;
    this.leftCards = [];
    this.rightCards = [];

    this.drawBackground(0xffc0fc);
    this.drawHeader(this.gameConfig!.title);
    this.drawColumnLabels();

    // Independent shuffled column orders
    const wordOrder = shuffle([0, 1, 2, 3, 4]);
    const emojiOrder = shuffle([0, 1, 2, 3, 4]);

    for (let slot = 0; slot < 5; slot++) {
      this.createPairCards(this.pairs[slot], wordOrder[slot], emojiOrder[slot]);
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
    g.fillRoundedRect(LAYOUT.columnMargin, LAYOUT.cardY, LAYOUT.columnWidth, GAME_HEIGHT - LAYOUT.cardY, PX(10));
    g.fillRoundedRect(
      GAME_WIDTH - LAYOUT.columnMargin - LAYOUT.columnWidth,
      LAYOUT.cardY,
      LAYOUT.columnWidth,
      GAME_HEIGHT - LAYOUT.cardY,
      PX(10),
    );
  }

  private drawHeader(title: string): void {
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.08, title, {
        fontSize: `${PX(28)}px`,
        fontFamily: FONTS.family,
        color: '#2d3436',
      })
      .setOrigin(0.5);
  }

  private drawColumnLabels(): void {
    const style = { fontSize: `${PX(18)}px`, fontFamily: FONTS.family, color: '#636e72' };
    this.add
      .text(
        LAYOUT.columnMargin + LAYOUT.columnWidth / 2,
        LAYOUT.cardY - PX(40),
        this.gameConfig?.leftLabel ?? 'Venstre',
        style,
      )
      .setOrigin(0.5);
    this.add
      .text(
        GAME_WIDTH - LAYOUT.columnMargin - LAYOUT.columnWidth / 2,
        LAYOUT.cardY - PX(40),
        this.gameConfig?.rightLabel ?? 'Høyre',
        style,
      )
      .setOrigin(0.5);
  }

  private addBackButton(): void {
    const btn = this.add
      .text(0, 0, '← Meny', {
        fontSize: `${PX(20)}px`,
        fontFamily: FONTS.family,
        color: '#636e72',
      })
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ color: '#2d3436' }));
    btn.on('pointerout', () => btn.setStyle({ color: '#636e72' }));
    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MainMenuScene'));
    });
  }

  // ─────────────────────── card creation ───────────────────────────────────

  private addCard(left: boolean, slot: number, text: string): Phaser.GameObjects.Rectangle {
    const x = left
      ? LAYOUT.columnMargin + LAYOUT.columnWidth / 2
      : GAME_WIDTH - LAYOUT.columnMargin - LAYOUT.columnWidth / 2;
    const y = LAYOUT.cardY + slot * (LAYOUT.cardSpacing + LAYOUT.cardHeight);
    const { columnWidth, cardHeight } = LAYOUT;

    const bg = this.add.rectangle(x, y, columnWidth, cardHeight, WORD_NORMAL);
    bg.setStrokeStyle(2, STROKE_NORMAL);
    bg.setInteractive({ useHandCursor: true });

    this.add
      .text(x, y, text, {
        fontSize: `${PX(30)}px`,
        fontFamily: FONTS.family,
        color: '#2d3436',
      })
      .setOrigin(0.5);

    return bg;
  }

  private createPairCards(pair: GamePair, wordSlot: number, emojiSlot: number): void {
    const left = this.addCard(true, wordSlot, pair.left);
    const right = this.addCard(false, emojiSlot, pair.right);

    const leftCard: Card = { bg: left, text: pair.left, textMatch: pair.right, index: wordSlot, matched: false };
    this.leftCards[wordSlot] = leftCard;

    const rightCard: Card = { bg: right, text: pair.right, textMatch: pair.left, index: emojiSlot, matched: false };
    this.rightCards[emojiSlot] = rightCard;

    left.on('pointerover', () => {
      if (!leftCard.matched && this.leftCard !== wordSlot) left.setFillStyle(0xf1f3f5);
    });
    left.on('pointerout', () => {
      if (!leftCard.matched && this.leftCard !== wordSlot) left.setFillStyle(WORD_NORMAL);
    });
    left.on('pointerdown', () => this.onWordClick(wordSlot));

    right.on('pointerover', () => {
      if (!rightCard.matched && this.rightCard !== emojiSlot) right.setFillStyle(0xf1f3f5);
    });
    right.on('pointerout', () => {
      if (!rightCard.matched && this.rightCard !== emojiSlot) right.setFillStyle(WORD_NORMAL);
    });
    right.on('pointerdown', () => this.onEmojiClick(emojiSlot));
  }

  // ─────────────────────── interaction ─────────────────────────────────────

  private determineMatch(): void {
    if (this.leftCard < 0 || this.rightCard < 0) {
      return; // no selection
    }
    console.log('Selected:', this.leftCards[this.leftCard].text, '<->', this.rightCards[this.rightCard].text);
    console.log(
      'Selected textMatch:',
      this.leftCards[this.leftCard].textMatch,
      '<->',
      this.rightCards[this.rightCard].textMatch,
    );
    if (
      this.leftCards[this.leftCard].text === this.rightCards[this.rightCard].textMatch ||
      this.leftCards[this.leftCard].textMatch === this.rightCards[this.rightCard].text
    ) {
      this.handleCorrectMatch(this.leftCards[this.leftCard], this.rightCards[this.rightCard]);
    } else {
      this.handleWrongMatch(this.leftCards[this.leftCard], this.rightCards[this.rightCard]);
    }
  }

  private onWordClick(slot: number): void {
    if (this.busy) return;
    const card = this.leftCards[slot];
    if (card.matched) return;

    // Deselect previous word card
    if (this.leftCard >= 0 && this.leftCard !== slot) {
      this.deselectWord(this.leftCard);
    }

    if (this.leftCard === slot) {
      // Toggle off
      this.deselectWord(slot);
      this.leftCard = -1;
    } else {
      // Select
      card.bg.setFillStyle(WORD_SELECTED);
      card.bg.setStrokeStyle(3, STROKE_SELECTED);
      this.tweens.add({
        targets: [card.bg],
        scaleX: 1.06,
        scaleY: 1.06,
        duration: 130,
        ease: 'Back.Out',
      });
      this.leftCard = slot;
    }

    this.determineMatch();
  }

  private onEmojiClick(slot: number): void {
    if (this.busy) return;
    const card = this.rightCards[slot];
    if (card.matched) return;

    // Deselect previous word card
    if (this.rightCard >= 0 && this.rightCard !== slot) {
      this.deselectEmoji(this.rightCard);
    }

    if (this.rightCard === slot) {
      // Toggle off
      this.deselectEmoji(slot);
      this.rightCard = -1;
    } else {
      // Select
      card.bg.setFillStyle(WORD_SELECTED);
      card.bg.setStrokeStyle(3, STROKE_SELECTED);
      this.tweens.add({
        targets: [card.bg],
        scaleX: 1.06,
        scaleY: 1.06,
        duration: 130,
        ease: 'Back.Out',
      });
      this.rightCard = slot;
    }

    this.determineMatch();
  }

  private handleCorrectMatch(wordCard: Card, emojiCard: Card): void {
    this.busy = true;
    playCorrect();

    // Reset selection scale first
    this.tweens.add({ targets: [wordCard.bg], scaleX: 1, scaleY: 1, duration: 80 });

    // Green colour on both cards
    wordCard.bg.setFillStyle(MATCHED_BG);
    wordCard.bg.setStrokeStyle(3, STROKE_MATCHED);
    emojiCard.bg.setFillStyle(MATCHED_BG);
    emojiCard.bg.setStrokeStyle(3, STROKE_MATCHED);

    // Bounce both pairs, then fade to matched state
    this.tweens.add({
      targets: [wordCard.bg, emojiCard.bg],
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
          targets: [wordCard.bg, emojiCard.bg],
          alpha: 0.45,
          duration: 280,
          onComplete: () => {
            this.matchedCount++;
            this.leftCard = -1;
            this.rightCard = -1;
            this.busy = false;
            if (this.matchedCount >= 5) {
              this.time.delayedCall(500, () => {
                this.cameras.main.fadeOut(300, 255, 255, 255);
                this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('WinScene', this.sceneData));
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
      targets: [emojiCard.bg],
      x: origX + 9,
      duration: 45,
      ease: 'Linear',
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        emojiCard.bg.x = origX;
        emojiCard.bg.setFillStyle(WORD_NORMAL);
        emojiCard.bg.setStrokeStyle(2, STROKE_NORMAL);
      },
    });

    // Deselect the word card after shake
    this.time.delayedCall(300, () => {
      if (this.leftCard >= 0) this.deselectWord(this.leftCard);
      if (this.rightCard >= 0) this.deselectEmoji(this.rightCard);
      this.leftCard = -1;
      this.rightCard = -1;
    });
  }

  private deselectWord(slot: number): void {
    const card = this.leftCards[slot];
    card.bg.setFillStyle(WORD_NORMAL);
    card.bg.setStrokeStyle(2, STROKE_NORMAL);
    this.tweens.add({ targets: [card.bg], scaleX: 1, scaleY: 1, duration: 100 });
  }

  private deselectEmoji(slot: number): void {
    const card = this.rightCards[slot];
    card.bg.setFillStyle(WORD_NORMAL);
    card.bg.setStrokeStyle(2, STROKE_NORMAL);
    this.tweens.add({ targets: [card.bg], scaleX: 1, scaleY: 1, duration: 100 });
  }
}
