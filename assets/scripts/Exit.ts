import { _decorator, Component, log, Node, resources, Sprite, SpriteFrame, Vec2, Vec3 } from 'cc';
import { Global } from './Global';
const { ccclass, property } = _decorator;

@ccclass('Exit')
export class Exit extends Component {
    @property(Sprite)
    sprExit: Sprite = null!;

    private _x: number = 0;
    private _y: number = 0;
    private _gap: number = 50;
    private _size: number = 1;

    setExit(x: number, y: number, size: number, horDir: string, verDir: string) {
        this._x = x;
        this._y = y;
        this._size = size;

        if (horDir) {
            const spriteName = horDir === 'left' ? `PA_Machine_2_${Global.ColorId}_1_1` : `PA_Machine_4_${Global.ColorId}_1_1`;
            this.setSprite(spriteName);
            this.sprExit.node.scale = new Vec3(1, size);
            this.sprExit.node.position = this.sprExit.node.position.add(new Vec3(0, this._gap * (size - 1)));
        } else {
            const spriteName = verDir === 'bot' ? `PA_Machine_1_${Global.ColorId}_1_1` : `PA_Machine_3_${Global.ColorId}_1_1`;
            this.setSprite(spriteName);
            this.sprExit.node.scale = new Vec3(size, 1);
            this.sprExit.node.position = this.sprExit.node.position.add(new Vec3(this._gap * (size - 1), 0));
        }
    }

    setSprite(spriteName: string) {
        resources.loadDir<SpriteFrame>('images/blockBgs/' + spriteName, SpriteFrame, (err, assets) => {
            if (err) {
                console.error('Failed to load sprites: ', err);
                return;
            }
        
            const found = assets[0];
            if (found) {
                this.sprExit.spriteFrame = found;
            } else {
                console.warn('Sprite not found: ', spriteName);
                return;
            }
        });
    }
}


