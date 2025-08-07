import { _decorator, CCString, Component, Node } from 'cc';
import { EVENT } from './Config';
import BJEventManager from './BJEventManager';
import { Global } from './Global';
const { ccclass, property } = _decorator;

@ccclass('ButtonCreateBlock')
export class ButtonCreateBlock extends Component {

    @property(CCString)
    private idBlockShape: string = '';

    onClick() {
        Global.ShapeId = this.idBlockShape;
        BJEventManager.instance.emit(EVENT.CHOOSE_BLOCK);
    }
}


