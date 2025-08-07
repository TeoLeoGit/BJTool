import { _decorator, Camera, Component, EditBox, EventMouse, input, Input, instantiate, Layout, log, Node, Prefab, resources, Sprite, SpriteFrame, UITransform, Vec2, Vec3 } from 'cc';
import { BLOCK_TYPE, BlockData, Config, EVENT, LEVEL } from './Config';
import BJEventManager from './BJEventManager';
import { Global } from './Global';
import { Block } from './Block';
import { BlockBackground } from './BlockBackground';
import { Wall } from './Wall';
import { Data } from './Data';
const { ccclass, property } = _decorator;

@ccclass('ToolMananger')
export class ToolMananger extends Component {
    @property(Prefab)
    blockPrefab: Prefab = null!;

    @property(Prefab)
    blockBackgroundPrefab: Prefab = null!;

    @property(Prefab)
    wallPrefab: Prefab = null!;

    @property(Node)
    gridParent: Node = null!; // Holds grid cells

    @property(Node)
    blockParent: Node = null!;

    @property(Node)
    previewLayer: Node = null!;

    @property(Node)
    wallParent: Node = null!;

    @property(Camera)
    mainCamera: Camera = null!;

    @property(EditBox)
    editBoxCol: EditBox = null!;

    @property(EditBox)
    editBoxRow: EditBox = null!;

    @property(Layout)
    layoutGrid: Layout = null!;

    private _draggedBlock: Node | null = null;
    private _isDragging: boolean = false;
    private _mousePos: Vec3 = new Vec3();
    private _grid: BlockBackground[][] = [];
    private _rootCell: Node = null;
    private _editLevel: LEVEL = {
        rowNum: 0,
        colNum: 0,
        blocks: [],
        exits: []
    };

    private _offsetMap: Record<string, Vec3> = { // shapeId, offset
        '1': new Vec3(0, 0, 0),
        '2': new Vec3(50, 0, 0),
        '3': new Vec3(100, 0, 0),
        '4': new Vec3(0, 50, 0),
        '5': new Vec3(0, 100, 0),
        '6': new Vec3(50, 50, 0),
        '7': new Vec3(50, 50, 0),
        '8': new Vec3(50, 50, 0),
        '9': new Vec3(50, 50, 0),
        '10': new Vec3(50, 50, 0),
        '11': new Vec3(50, 100, 0),
        '12': new Vec3(50, 100, 0),
        '13': new Vec3(100, 100, 0),
        '14': new Vec3(0, 150, 0),
        '15': new Vec3(100, 50, 0),
        '16': new Vec3(100, 50, 0),
        '17': new Vec3(50, 100, 0),
        '18': new Vec3(50, 100, 0),
        '19': new Vec3(50, 100, 0),
        '20': new Vec3(50, 100, 0),
        '21': new Vec3(100, 50, 0),
        '22': new Vec3(100, 50, 0),
    };

    private _blockShapeMap: Record<string, number[][]> = { //shapeId, 2d shape
        '1': [
            [1],
        ], 
        '2': [
            [1, 1],
        ], 
        '3': [
            [1, 1, 1],
        ], 
        '4': [
            [1],
            [1]
        ], 
        '5': [
            [1],
            [1],
            [1]
        ], 
        '6': [
            [1, 1],
            [1, 1],
        ], 
        '7': [
            [1, 1],
            [1, 0],
        ],
        '8': [
            [1, 1],
            [0, 1],
        ],
        '9': [
            [1, 0],
            [1, 1],
        ],
        '10': [
            [0, 1],
            [1, 1],
        ],
        '11': [
            [1, 1],
            [1, 0],
            [1, 0],
        ],
        '12': [
            [0, 1],
            [0, 1],
            [1, 1],
        ],
        '13': [
            [0, 1, 0],
            [1, 1, 1],
            [0, 1, 0],
        ],
        '14': [
            [1],
            [1],
            [1],
            [1],
        ],
        '15': [
            [1, 1, 1],
            [0, 1, 0],
        ],
        '16': [
            [0, 1, 0],
            [1, 1, 1],
        ],
        '17': [
            [0, 1],
            [1, 1],
            [0, 1],
        ],
        '18': [
            [1, 0],
            [1, 1],
            [1, 0],
        ],
        '19': [
            [1, 1],
            [0, 1],
            [0, 1],
        ],
        '20': [
            [1, 0],
            [1, 0],
            [1, 1],
        ],
        '21': [
            [1, 1, 1],
            [1, 0, 0],
        ],
        '22': [
            [0, 0, 1],
            [1, 1, 1],
        ]
    }

    onLoad() {
        input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
        input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);

        this.editBoxCol.node.on(EditBox.EventType.TEXT_CHANGED, this.onColumnChanged, this);
        this.editBoxRow.node.on(EditBox.EventType.TEXT_CHANGED, this.onRowChanged, this);

        BJEventManager.instance.on(EVENT.CHOOSE_BLOCK, this.onClickCreateBlock, this);
        BJEventManager.instance.on(EVENT.EDIT_LEVEL, this.loadLevel, this);

        this.initGrid();
        this.node.active = false;
    }
    
    onDestroy() {
        input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);
        input.off(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);

        this.editBoxCol.node.off(EditBox.EventType.TEXT_CHANGED, this.onColumnChanged, this);
        this.editBoxRow.node.off(EditBox.EventType.TEXT_CHANGED, this.onRowChanged, this);

        BJEventManager.instance.off(EVENT.CHOOSE_BLOCK, this.onClickCreateBlock);
        BJEventManager.instance.off(EVENT.EDIT_LEVEL, this.loadLevel);
    }

    initGrid() {
        let childIter = 0;
        for (let i = 0; i < Config.MAX_ROW; i++) {
            let row: BlockBackground[] = [];
            for (let j = 0; j < Config.MAX_COLUMN; j++) {
                const cell = this.gridParent.children[childIter].getComponent(BlockBackground);
                cell.init(j, i);
                row.push(cell);
                childIter++;
            }
            this._grid.push(row);
        }
        this.createWalls();
    }

    loadBlockSprite(name: string, spriteToChange: Sprite) {
        resources.loadDir<SpriteFrame>('images/blocks/' + name, SpriteFrame, (err, assets) => {
            if (err) {
                console.error('Failed to load sprites:', err);
                return;
            }
        
            const found = assets[0];
            if (found) {
                spriteToChange.spriteFrame = found;
            } else {
                console.warn('Sprite not found:', name);
                return ;
            }
        });
    }

    onMouseDown(event: EventMouse) {
        if (this._draggedBlock) {
            this._isDragging = true;
        }
    }
    
    onMouseUp(event: EventMouse) {
        if (this._draggedBlock) {
            const snappedPos = this.getClosestGridPosition(this._draggedBlock.worldPosition);
            this.createBlockAt(snappedPos);
        }
    }
    
    onMouseMove(event: EventMouse) {
        if (this._isDragging && this._draggedBlock) {
            const worldPos = this.screenToWorld(new Vec3(event.getLocation().x, event.getLocation().y, 0));
            this._draggedBlock.setWorldPosition(worldPos);
            this._mousePos = worldPos;
        }
    }

    onClickCreateBlock() {
        if (!this._draggedBlock) {
            const block = instantiate(this.blockPrefab);
            this.previewLayer.addChild(block); // Or add to another layer
            const blockPos = this.previewLayer.getComponent(UITransform).convertToNodeSpaceAR(this._mousePos);
            block.setPosition(blockPos);
            this._draggedBlock = block;
        }

        this._draggedBlock.getComponent(Block).changeOffset(this._offsetMap[Global.ShapeId]);
        this.loadBlockSprite(`PA_Grid_${Global.ShapeId}_${Global.ColorId}`, 
            this._draggedBlock.getChildByName('sprite').getComponent(Sprite));

        this._isDragging = true;
    }

    getClosestGridPosition(worldPos: Vec3): Vec3 {
        let closest = null;
        let minDist = Number.MAX_VALUE;
    
        for (const tile of this.gridParent.children) {
            const dist = Vec3.distance(tile.worldPosition, worldPos);
            if (dist < minDist) {
                minDist = dist;
                closest = tile;
            }
        }
        
        this._rootCell = closest;
        return closest ? closest.worldPosition : worldPos;
    }

    createBlockAt(position: Vec3) {
        const shape = this._blockShapeMap[Global.ShapeId];
        const canCreate = this.fillEmptyCells(this._rootCell, shape);

        if (canCreate) {
            const newBlock = instantiate(this.blockPrefab);
            this.blockParent.addChild(newBlock);
            newBlock.setWorldPosition(position);
            const blockComponent = newBlock.getComponent(Block);
            const rootBlockBg = this._rootCell.getComponent(BlockBackground);
            blockComponent.changeOffset(this._offsetMap[Global.ShapeId]);
            blockComponent.setSprite(this._draggedBlock.getChildByName('sprite').getComponent(Sprite).spriteFrame);
            blockComponent.setRoot(rootBlockBg.X, rootBlockBg.Y)

            let newBlockData: BlockData = {
                icon: `PA_Grid_${Global.ShapeId}_${Global.ColorId}`,
                x: rootBlockBg.X,
                y: rootBlockBg.Y,
                type: 0,
            }
            this._editLevel.blocks.push(newBlockData);
        }
    }

    fillEmptyCells(root: Node, shape: number[][]): boolean {
        const rootCell = root.getComponent(BlockBackground);
        let changedCells: BlockBackground[] = [];
        const botToTop = shape.slice().reverse(); //Start from bottom
        if (rootCell.Y + botToTop.length > Global.RowCount || rootCell.X + botToTop[0].length > Global.ColCount) return false; //Out of range 
        for (let row = 0; row < botToTop.length; row++) { 
            for (let col = 0; col < botToTop[row].length; col++) {
                if (botToTop[row][col] === 1) {
                    if (this._grid[rootCell.Y + row][rootCell.X + col].IsEmpty) {
                        this._grid[rootCell.Y + row][rootCell.X + col].IsEmpty = false;
                        changedCells.push(this._grid[rootCell.Y + row][rootCell.X + col]);
                    } else {
                        changedCells.forEach(cell => cell.IsEmpty = true); //Reset
                        return false;
                    }
                }
            }
        }
        return true;
    }

    screenToWorld(screenPos: Vec3): Vec3 {
        const out = new Vec3();
        this.mainCamera.screenToWorld(screenPos, out);
        return out;
    }

    onColumnChanged(editBox: EditBox) {
        const value = editBox.string;
        const parsed = Number(value);

        if (isNaN(parsed)) {
            log(`Invalid number: "${value}"`);
        } else {
            if (parsed > 2 && parsed <= Config.MAX_COLUMN) {
                Global.ColCount = parsed;
                this.onGridDimChanged(Global.ColCount, Global.RowCount);
                this._editLevel.colNum = Global.ColCount;
            }
        }
    }

    onRowChanged(editBox: EditBox) {
        const value = editBox.string;
        const parsed = Number(value);

        if (isNaN(parsed)) {
            log(`Invalid number: "${value}"`);
        } else {
            if (parsed > 2 && parsed <= Config.MAX_ROW) {
                Global.RowCount = parsed;
                this.onGridDimChanged(Global.ColCount, Global.RowCount);
                this._editLevel.rowNum = Global.RowCount;
            }
        }
    }

    onGridDimChanged(col: number, row: number) {
        this.layoutGrid.constraintNum = col;
        const cellNumb = col * row;

        for (let i = 0; i < cellNumb; i++) {
            this.gridParent.children[i].active = true;
            this.gridParent.children[i].getComponent(BlockBackground).reset();
        }
        for (let i = cellNumb; i < this.gridParent.children.length; i++) {
            this.gridParent.children[i].getComponent(BlockBackground).reset();
            this.gridParent.children[i].active = false;
        }

        let childIter = 0;
        this._grid = [];
        for (let i = 0; i < Global.RowCount; i++) {
            let row: BlockBackground[] = [];
            for (let j = 0; j < Global.ColCount; j++) {
                const cell = this.gridParent.children[childIter].getComponent(BlockBackground);
                cell.init(j, i);
                row.push(cell);
                childIter++;
            }
            this._grid.push(row);
        }

        this.gridParent.position = new Vec3(204 + (Config.MAX_COLUMN - col) * 50, -406 + (Config.MAX_ROW - row) * 50);

        this.scheduleOnce(() => {
            this.createWalls();
            this.clearBlocks();
        }, 0.4)
    }

    createWalls() {
        for (const child of this.wallParent.children) {
            child.destroy();
        }
        this.wallParent.removeAllChildren();
        
        //bottom walls
        for (let col = 0; col < Global.ColCount; col++) {
            const newWall = instantiate(this.wallPrefab);
            this.wallParent.addChild(newWall);
            const cellWorldPos = this._grid[0][col].node.worldPosition;
            const wallPos = this.wallParent.getComponent(UITransform).convertToNodeSpaceAR(cellWorldPos).add(new Vec3(0, -75));
            newWall.setPosition(wallPos);
        }

        //top walls
        for (let col = 0; col < Global.ColCount; col++) {
            const newWall = instantiate(this.wallPrefab);
            this.wallParent.addChild(newWall);
            const cellWorldPos = this._grid[Global.RowCount - 1][col].node.worldPosition;
            const wallPos = this.wallParent.getComponent(UITransform).convertToNodeSpaceAR(cellWorldPos).add(new Vec3(0, 75));
            newWall.setPosition(wallPos);
        }
        
        //left walls
        for (let row = 0; row < Global.RowCount; row++) {
            const newWall = instantiate(this.wallPrefab);
            this.wallParent.addChild(newWall);
            const cellWorldPos = this._grid[row][0].node.worldPosition;
            const wallPos = this.wallParent.getComponent(UITransform).convertToNodeSpaceAR(cellWorldPos).add(new Vec3(-75, 0));
            newWall.setPosition(wallPos);
            newWall.getComponent(Wall).init('left', null);
        }

        //right walls
        for (let row = 0; row < Global.RowCount; row++) {
            const newWall = instantiate(this.wallPrefab);
            this.wallParent.addChild(newWall);
            const cellWorldPos = this._grid[row][Global.ColCount - 1].node.worldPosition;
            const wallPos = this.wallParent.getComponent(UITransform).convertToNodeSpaceAR(cellWorldPos).add(new Vec3(75, 0));
            newWall.setPosition(wallPos);
            newWall.getComponent(Wall).init('right', null);
        }

        //corners
        const botLeftWall = instantiate(this.wallPrefab);
        this.wallParent.addChild(botLeftWall);
        const cellWorldPos1 = this._grid[0][0].node.worldPosition;
        const wallPos1 = this.wallParent.getComponent(UITransform).convertToNodeSpaceAR(cellWorldPos1).add(new Vec3(-75, -75));
        botLeftWall.setPosition(wallPos1);
        botLeftWall.getComponent(Wall).init('left', 'bot');

        const botRightWall = instantiate(this.wallPrefab);
        this.wallParent.addChild(botRightWall);
        const cellWorldPos2 = this._grid[0][Global.ColCount - 1].node.worldPosition;
        const wallPos2 = this.wallParent.getComponent(UITransform).convertToNodeSpaceAR(cellWorldPos2).add(new Vec3(75, -75));
        botRightWall.setPosition(wallPos2);
        botRightWall.getComponent(Wall).init('right', 'bot');

        const topLeftWall = instantiate(this.wallPrefab);
        this.wallParent.addChild(topLeftWall);
        const cellWorldPos3 = this._grid[Global.RowCount - 1][0].node.worldPosition;
        const wallPos3 = this.wallParent.getComponent(UITransform).convertToNodeSpaceAR(cellWorldPos3).add(new Vec3(-75, 75));
        topLeftWall.setPosition(wallPos3);
        topLeftWall.getComponent(Wall).init('left', 'top');

        const topRightWall = instantiate(this.wallPrefab);
        this.wallParent.addChild(topRightWall);
        const cellWorldPos4 = this._grid[Global.RowCount - 1][Global.ColCount - 1].node.worldPosition;
        const wallPos4 = this.wallParent.getComponent(UITransform).convertToNodeSpaceAR(cellWorldPos4).add(new Vec3(75, 75));
        topRightWall.setPosition(wallPos4);
        topRightWall.getComponent(Wall).init('right', 'top');
    }

    clearBlocks() {
        for (const child of this.blockParent.children) {
            child.destroy();
        }
        this.blockParent.removeAllChildren();
        this._editLevel.blocks = [];
    }

    createBlocks(blockData: BlockData[]) {
        for (let i = 0; i < blockData.length; i++) {
            const worldPos = this._grid[blockData[i].y][blockData[i].x].node.worldPosition;
            const newBlock = instantiate(this.blockPrefab);
            this.blockParent.addChild(newBlock);
            newBlock.setWorldPosition(worldPos);
            const blockComponent = newBlock.getComponent(Block);
            const rootBlockBg = this._grid[blockData[i].y][blockData[i].x].getComponent(BlockBackground);

            //Init shape && color.
            this.loadBlockSprite(blockData[i].icon, blockComponent.getSprite());
            const shapeId = blockData[i].icon.match(/\d+/);
            if (shapeId) {
                const firstNumber = parseInt(shapeId[0]);
                blockComponent.changeOffset(this._offsetMap[firstNumber]);
            }
            blockComponent.setRoot(rootBlockBg.X, rootBlockBg.Y)

            this.fillEmptyCells(this._grid[blockData[i].y][blockData[i].x].node, this._blockShapeMap[shapeId[0]])
        }
    }

    createNewLevel() {
        this._editLevel = {
            rowNum: Global.RowCount,
            colNum: Global.ColCount,
            blocks: [],
            exits: []
        };
    }

    saveLevel() {
        Data.saveLevel(this._editLevel);
    }

    loadLevel(level: number) {
        const data: LEVEL = {...Data.getLevel(level)};
        if (!data) return;
        Global.RowCount = data.rowNum;
        Global.ColCount = data.colNum;
        
        this.clearBlocks();
        this.onGridDimChanged(Global.ColCount, Global.RowCount);
        this.createWalls();
        this.scheduleOnce(() => {
            this._editLevel = data;
            this.createBlocks(data.blocks);
        }, 0.4);

        this.node.active = true;
    }

    onOpenMenu() {
        this.node.active = false;
        BJEventManager.instance.emit(EVENT.OPEN_MENU);
    }
}


