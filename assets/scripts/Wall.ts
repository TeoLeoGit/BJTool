import { _decorator, CCString, Component, log, Node, Sprite, SpriteFrame } from 'cc';
import { Global } from './Global';
import BJEventManager from './BJEventManager';
import { EVENT } from './Config';
const { ccclass, property } = _decorator;

@ccclass('Wall')
export class Wall extends Component {
    @property(Sprite)
    sprWall: Sprite = null!;

    @property({ type: [SpriteFrame] })
    public sfCorners: SpriteFrame[] = [];

    @property(CCString)
    debugGrid: string = ""; 

    private _isCorner = false;
    private _isExit = false;
    private _x: number = 0;
    private _y: number = 0;
    private _horDir: string = null;
    private _verDir: string = null;

    public get IsExit(): boolean {
        return this._isExit;
    }

    public set IsExit(exit: boolean) {
        this._isExit = exit;
    }

    public get IsCorner(): boolean {
        return this._isCorner;
    }

    public get X(): number {
        return this._x;
    }

    public get Y(): number {
        return this._y;
    }

    public get HorDir(): string {
        return this._horDir;
    }

    public get VerDir(): string {
        return this._verDir;
    }

    protected onLoad(): void {
        BJEventManager.instance.on(EVENT.CHECK_EXIT_CREATED, this.onCheckExit, this);
        BJEventManager.instance.on(EVENT.CREATE_EXIT_SUCCESS, this.onCreateExit, this);
    }

    protected onDestroy(): void {
        BJEventManager.instance.off(EVENT.CHECK_EXIT_CREATED, this.onCheckExit);
        BJEventManager.instance.off(EVENT.CREATE_EXIT_SUCCESS, this.onCreateExit);
    }

    init(horDir: string, verDir: string, x: number, y: number) {
        this._x = x;
        this._y = y;
        this.debugGrid = `${x}, ${y}`;
        this._horDir = horDir;
        this._verDir = verDir;

        if (horDir && verDir) {
            if (horDir === 'left' && verDir === 'bot') this.sprWall.spriteFrame = this.sfCorners[0];
            if (horDir === 'right' && verDir === 'bot') this.sprWall.spriteFrame = this.sfCorners[1];
            if (horDir === 'left' && verDir === 'top') this.sprWall.spriteFrame = this.sfCorners[2];
            if (horDir === 'right' && verDir === 'top') this.sprWall.spriteFrame = this.sfCorners[3];
            this._isCorner = true;

            return;
        }
        
        this._isCorner = false;
        if (horDir) {
            if (horDir === 'left') this.node.angle = 90;
            if (horDir === 'right') this.node.angle = -90;
        }
    }

    onCreateExit(params: any[]) {
        
        if (params[0] === this._x && params[1] === this._y && params[2] === this._horDir && params[3] === this._verDir) {
            this._isExit = true;
        } 
    }

    onCheckExit(params: any[]) {
        if ((params[0] === this._x && params[1] === this._y && params[2] === this._horDir && params[3] === this._verDir) 
            && (this._isCorner || this._isExit)) 
            Global.CanCreateExit = false;
    }
}


