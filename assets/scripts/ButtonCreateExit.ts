import { _decorator, Component, Node } from 'cc';
import BJEventManager from './BJEventManager';
import { EVENT } from './Config';
const { ccclass, property } = _decorator;

@ccclass('ButtonCreateExit')
export class ButtonCreateExit extends Component {
    onClick() {
        BJEventManager.instance.emit(EVENT.CHOOSE_EXIT);
    }
}


