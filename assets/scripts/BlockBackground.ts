import { _decorator, CCString, Component, log, Node } from 'cc';
import { TYPE_BG } from './Config';
const { ccclass, property } = _decorator;

@ccclass('BlockBackground')
export class BlockBackground extends Component {
    @property(CCString)
    debugGrid: string = ""; 
    private _isEmpty: boolean = true;
    private _x: number = 0;
    private _y: number = 0;

    public get IsEmpty(): boolean {
        return this._isEmpty;
    }

    public set IsEmpty(empty: boolean) {
        this._isEmpty = empty;
    }

    public get X(): number {
        return this._x;
    }

    public get Y(): number {
        return this._y;
    }

    public init(x: number, y: number) {
        this._x = x;
        this._y = y;
        this.debugGrid = `${x}, ${y}`;
    }

    public reset() {
        this._x = -1;
        this._y = -1;
        this.debugGrid = `${this._x}, ${this._y}`;
        this._isEmpty = true;
    }
}


