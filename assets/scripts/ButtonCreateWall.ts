import { _decorator, CCString, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ButtonCreateWall')
export class ButtonCreateWall extends Component {
    @property(CCString)
    wallId: string = '';
}


