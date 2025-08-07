import { _decorator, Component, Node, Sprite, SpriteFrame, Vec2, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Block')
export class Block extends Component {
    @property(Sprite)
    sprBlock: Sprite;

    private _offSet: Vec3 = null;
    private _rootPos: Vec2 = null;

    public get RootPos(): Vec2 {
        return this._rootPos;
    }

    changeOffset(offset: Vec3) {
        this._offSet = offset;
        this.sprBlock.node.position = offset;
    }

    setSprite(sf: SpriteFrame) {
        this.sprBlock.spriteFrame = sf;
    }

    setRoot(x: number, y: number) {
        this._rootPos = new Vec2(x, y);
    }

    getSprite(): Sprite {
        return this.sprBlock;
    }
}


