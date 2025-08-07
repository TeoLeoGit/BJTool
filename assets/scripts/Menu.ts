import { _decorator, Component, instantiate, log, Node, Prefab } from 'cc';
import BJEventManager from './BJEventManager';
import { EVENT } from './Config';
import { Data } from './Data';
import { ItemLevel } from './ItemLevel';
const { ccclass, property } = _decorator;

@ccclass('Menu')
export class Menu extends Component {
    @property(Node)
    levelContainer: Node = null!;

    @property(Prefab)
    prefabItemLevel: Prefab = null!;

    protected onLoad(): void {
        BJEventManager.instance.on(EVENT.INIT_MENU, this.init, this);
        BJEventManager.instance.on(EVENT.EDIT_LEVEL, this.onEditLevel, this);
        BJEventManager.instance.on(EVENT.OPEN_MENU, this.openMenu, this);
    }

    protected onDestroy(): void {
        BJEventManager.instance.off(EVENT.INIT_MENU, this.init);
        BJEventManager.instance.off(EVENT.EDIT_LEVEL, this.onEditLevel);
        BJEventManager.instance.off(EVENT.OPEN_MENU, this.openMenu);
    }

    init() {
        const levels = Data.Levels;

        for (const key in levels) {
            if (Object.prototype.hasOwnProperty.call(levels, key)) {
                const item = instantiate(this.prefabItemLevel);
                item.parent = this.levelContainer;
                item.getComponent(ItemLevel).init(levels[key], key);
            }
        }
    }

    onEditLevel() {
        this.node.active = false;
    }

    openMenu() {
        this.node.active = true;
    }
}


