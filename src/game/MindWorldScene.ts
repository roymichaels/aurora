import Phaser from "phaser";

// Keep this local to avoid coupling game layer to React components
export type OverlayId = "mentor" | "library" | "garden" | "focus";

interface Bridge {
  input: { x: number; y: number };
  actionTick: number;
  onEnter: (id: OverlayId) => void;
}

export default class MindWorldScene extends Phaser.Scene {
  declare bridge: Bridge; // injected by PhaserGame

  private player!: Phaser.Physics.Arcade.Sprite;
  private ground!: Phaser.GameObjects.Rectangle;
  private portals: { x: number; id: OverlayId; obj: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text }[] = [];
  private lastActionTick = 0;

  private WORLD_WIDTH = 3600;

  constructor() {
    super("MindWorldScene");
  }

  preload() {
    // Build simple textures at runtime (no external assets needed)
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(0, 0, 32, 48, 6);
    g.generateTexture("playerTex", 32, 48);
    g.clear();

    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 36, 96);
    g.generateTexture("portalTex", 36, 96);
    g.destroy();
  }

  create() {
    const w = Math.max(this.scale.width, 640);
    const h = Math.max(this.scale.height, 360);

    // World bounds & camera
    this.physics.world.setBounds(0, 0, this.WORLD_WIDTH, h);
    this.cameras.main.setBounds(0, 0, this.WORLD_WIDTH, h);

    // Sky background (tint reacts nicely to app theme overlay)
    this.add.rectangle(this.WORLD_WIDTH / 2, h / 2, this.WORLD_WIDTH, h, 0x000000, 0).setDepth(-10);

    // Ground (invisible physics body + visible strip)
    this.ground = this.add.rectangle(this.WORLD_WIDTH / 2, h - 24, this.WORLD_WIDTH, 48, 0x000000, 0);
    this.physics.add.existing(this.ground, true);
    this.add.rectangle(this.WORLD_WIDTH / 2, h - 32, this.WORLD_WIDTH, 2, 0xffffff, 0.08).setDepth(-1);

    // Player
    this.player = this.physics.add.sprite(120, h - 120, "playerTex");
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(24, 40).setOffset(4, 6);
    this.player.setDragX(1200);
    this.player.setMaxVelocity(400, 1000);
    this.player.setDepth(10);

    // Colliders
    this.physics.add.collider(this.player, this.ground as any);

    // Portals layout
    const portalDefs: { x: number; id: OverlayId; label: string }[] = [
      { x: 400, id: "focus", label: "Training Grounds" },
      { x: 900, id: "mentor", label: "Mind Temple" },
      { x: 1400, id: "library", label: "Sound Studio" },
      { x: 1900, id: "library", label: "Idea Forest" },
      { x: 2450, id: "library", label: "Memory Vault" },
    ];

    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: "Inter, ui-sans-serif, system-ui",
      fontSize: "12px",
      color: "#9AA1AF",
    };

    portalDefs.forEach((p) => {
      const obj = this.add.rectangle(p.x, h - 80, 36, 96, 0xffffff, 0.08).setStrokeStyle(1, 0xffffff, 0.2);
      this.physics.add.existing(obj, true);
      const label = this.add.text(p.x, h - 140, p.label, style).setOrigin(0.5).setAlpha(0.8);
      this.portals.push({ x: p.x, id: p.id, obj, label });
    });

    // Camera follow with a tiny look-ahead
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
  }

  update(time: number, delta: number): void {
    const b = (this as any).bridge as Bridge;
    if (!b) return;

    const speed = 280;
    const onFloor = (this.player.body as Phaser.Physics.Arcade.Body).blocked.down;

    // Horizontal movement from joystick
    const vx = Phaser.Math.Clamp(b.input.x, -1, 1) * speed;
    this.player.setVelocityX(vx);
    if (Math.abs(vx) > 1) this.player.setFlipX(vx < 0);

    // Check proximity to portals (simple distance)
    let near: OverlayId | null = null;
    let activeObj: Phaser.GameObjects.Rectangle | null = null;
    for (const p of this.portals) {
      const d = Math.abs(this.player.x - p.x);
      const isNear = d < 40 && Math.abs(this.player.y - (this.scale.height - 80)) < 120;
      p.obj.setFillStyle(0xffffff, isNear ? 0.18 : 0.08);
      if (isNear) {
        near = p.id;
        activeObj = p.obj;
      }
    }

    // Action press
    if (b.actionTick !== this.lastActionTick) {
      this.lastActionTick = b.actionTick;
      if (near) {
        // Enter portal -> hand over to React overlay
        b.onEnter(near);
        this.scene.pause();
        return;
      } else if (onFloor) {
        // Jump
        this.player.setVelocityY(-520);
      }
    }

    // Subtle camera look-ahead based on input
    const cam = this.cameras.main;
    cam.followOffset.x = Phaser.Math.Linear(cam.followOffset.x, vx * 0.25, 0.05);
  }
}
