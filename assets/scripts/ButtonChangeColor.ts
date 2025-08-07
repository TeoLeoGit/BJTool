import { _decorator, CCString, Component, Node } from 'cc';
import { Global } from './Global';
import BJEventManager from './BJEventManager';
import { EVENT } from './Config';
const { ccclass, property } = _decorator;

@ccclass('ButtonChangeColor')
export class ButtonChangeColor extends Component {
    @property(CCString)
    colorId: string = '';

    onClick() {
        Global.ColorId = this.colorId;
        BJEventManager.instance.emit(EVENT.CHOOSE_BLOCK);
    }
}


