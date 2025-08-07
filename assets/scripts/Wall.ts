import { _decorator, Component, Node, Sprite, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Wall')
export class Wall extends Component {
    @property(Sprite)
    sprWall: Sprite = null!;

    @property({ type: [SpriteFrame] })
    public sfCorners: SpriteFrame[] = [];

    private _isCorner = false;

    init(horDir: string, verDir: string) {
        if (horDir && verDir) {
            if (horDir === 'left' && verDir === 'bot') this.sprWall.spriteFrame = this.sfCorners[0];
            if (horDir === 'right' && verDir === 'bot') this.sprWall.spriteFrame = this.sfCorners[1];
            if (horDir === 'left' && verDir === 'top') this.sprWall.spriteFrame = this.sfCorners[2];
            if (horDir === 'right' && verDir === 'top') this.sprWall.spriteFrame = this.sfCorners[3];

            return;
        }

        if (horDir) {
            if (horDir === 'left') this.node.angle = 90;
            if (horDir === 'right') this.node.angle = -90;
        }
    }
}


