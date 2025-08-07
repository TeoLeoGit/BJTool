import { _decorator, Component, Label, Node } from 'cc';
import { EVENT, LEVEL } from './Config';
import BJEventManager from './BJEventManager';
import { Global } from './Global';
const { ccclass, property } = _decorator;

@ccclass('ItemLevel')
export class ItemLevel extends Component {
    @property(Label)
    lblLevel: Label = null!;

    private _level: LEVEL = null;
    private _levelNumb: number = -1;

    public get Level(): LEVEL {
        return this._level;
    }

    init(level: LEVEL, number: string) {
        this.lblLevel.string = `LEVEL ${number}`;
        this._levelNumb = parseInt(number);
        this._level = level;
    }

    edit() {
        BJEventManager.instance.emit(EVENT.EDIT_LEVEL, this._levelNumb);
    }
}


