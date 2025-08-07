import { _decorator, Component, Node } from 'cc';
import { Data } from './Data';
import BJEventManager from './BJEventManager';
import { EVENT } from './Config';
const { ccclass, property } = _decorator;

@ccclass('Load')
export class Load extends Component {
    protected onLoad(): void {
        Data.loadLevels(() => {
            BJEventManager.instance.emit(EVENT.INIT_MENU);
        });
    }     
}


