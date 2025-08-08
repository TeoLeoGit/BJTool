import { _decorator, Camera, Component, EditBox, EventMouse, input, Input, instantiate, Layout, log, Node, Prefab, resources, Sprite, SpriteFrame, UITransform, Vec2, Vec3 } from 'cc';
import { BLOCK_TYPE, BlockData, Config, EVENT, EXIT_DATA, LEVEL } from './Config';
import BJEventManager from './BJEventManager';
import { Global } from './Global';
import { Block } from './Block';
import { BlockBackground } from './BlockBackground';
import { Wall } from './Wall';
import { Data } from './Data';
import { Exit } from './Exit';
const { ccclass, property } = _decorator;

@ccclass('ToolMananger')
export class ToolMananger extends Component {
    @property(Prefab)
    blockPrefab: Prefab = null!;

    @property(Prefab)
    blockBackgroundPrefab: Prefab = null!;

    @property(Prefab)
    wallPrefab: Prefab = null!;

    @property(Prefab)
    exitPrefab: Prefab = null!;

    @property(Node)
    gridParent: Node = null!; // Holds grid cells

    @property(Node)
    blockParent: Node = null!;

    @property(Node)
    previewLayer: Node = null!;

    @property(Node)
    wallParent: Node = null!;

    @property(Node)
    exitParent: Node = null!;

    @property(Camera)
    mainCamera: Camera = null!;

    @property(EditBox)
    editBoxCol: EditBox = null!;

    @property(EditBox)
    editBoxRow: EditBox = null!;

    @property(EditBox)
    editBoxExitSize: EditBox = null!;

    @property(Layout)
    layoutGrid: Layout = null!;

    private _draggedBlock: Node | null = null;
    private _draggedExit: Node | null = null;
    private _mousePos: Vec3 = new Vec3();
    private _grid: BlockBackground[][] = [];
    private _rootCell: Node = null;
    private _rootWall: Node = null;
    private _isCreateBlock: boolean = false;
    private _isCreateExit: boolean = false;
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
        this.editBoxExitSize.node.on(EditBox.EventType.TEXT_CHANGED, this.onExitSizeChanged, this);


        BJEventManager.instance.on(EVENT.CHOOSE_BLOCK, this.onClickCreateBlock, this);
        BJEventManager.instance.on(EVENT.CHOOSE_EXIT, this.onClickCreateExit, this);
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
        this.editBoxExitSize.node.off(EditBox.EventType.TEXT_CHANGED, this.onExitSizeChanged, this);

        BJEventManager.instance.off(EVENT.CHOOSE_BLOCK, this.onClickCreateBlock);
        BJEventManager.instance.off(EVENT.CHOOSE_EXIT, this.onClickCreateExit);
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
        
    }
    
    onMouseUp(event: EventMouse) {
        if (this._isCreateBlock) {
            const snappedPos = this.getClosestGridPosition(this._draggedBlock.worldPosition);
            this.createBlockAt(snappedPos);
        } else if (this._isCreateExit) {
            const snappedPos = this.getClosestWallPosition(this._draggedExit.worldPosition);
            this.createExitAt(snappedPos);
        }
    }
    
    onMouseMove(event: EventMouse) {
        if (this._isCreateBlock && this._draggedBlock) {
            const worldPos = this.screenToWorld(new Vec3(event.getLocation().x, event.getLocation().y, 0));
            this._draggedBlock.setWorldPosition(worldPos);
            this._mousePos = worldPos;
        } else if (this._isCreateExit && this._draggedExit) {
            const worldPos = this.screenToWorld(new Vec3(event.getLocation().x, event.getLocation().y, 0));
            this._draggedExit.setWorldPosition(worldPos);
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

        this._isCreateBlock = true;
        this._isCreateExit = false;
        this._draggedBlock.active = true;
        this._draggedExit && (this._draggedExit.active = false);
    }

    onClickCreateExit() {
        if (!this._draggedExit) {
            const exit = instantiate(this.exitPrefab);
            this.previewLayer.addChild(exit);
            const exitPos = this.previewLayer.getComponent(UITransform).convertToNodeSpaceAR(this._mousePos);
            exit.setPosition(exitPos);
            this._draggedExit = exit;
        }

        this._draggedExit.getComponent(Exit).setSprite(`PA_Machine_1_${Global.ColorId}_1_1`);
        this._isCreateExit = true;
        this._isCreateBlock = false;
        this._draggedBlock && (this._draggedBlock.active = false);
        this._draggedExit.active = true;
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

    getClosestWallPosition(worldPos: Vec3): Vec3 {
        let closest = null;
        let minDist = Number.MAX_VALUE;
    
        for (const wall of this.wallParent.children) {
            const dist = Vec3.distance(wall.worldPosition, worldPos);
            if (dist < minDist) {
                minDist = dist;
                closest = wall;
            }
        }
        
        this._rootWall = closest;
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

    createExitAt(position: Vec3) {
        const rootWallComp = this._rootWall.getComponent(Wall);
        if (rootWallComp.IsCorner || rootWallComp.IsExit) return;
        
        Global.CanCreateExit = true;
        if (rootWallComp.HorDir) {
            if ((rootWallComp.Y + Global.ExitSize - 1) >= Global.RowCount) Global.CanCreateExit = false;
            for (let i = 1; i < Global.ExitSize; i++)
                BJEventManager.instance.emit(EVENT.CHECK_EXIT_CREATED, [rootWallComp.X, rootWallComp.Y + i, rootWallComp.HorDir, rootWallComp.VerDir]);
        }
        if (rootWallComp.VerDir) {
            if ((rootWallComp.X + Global.ExitSize - 1) >= Global.ColCount) Global.CanCreateExit = false;
            for (let i = 0; i < Global.ExitSize; i++)
                BJEventManager.instance.emit(EVENT.CHECK_EXIT_CREATED, [rootWallComp.X + i, rootWallComp.Y, rootWallComp.HorDir, rootWallComp.VerDir]);
        }
        
        if (Global.CanCreateExit) {
            const newExit = instantiate(this.exitPrefab);
            this.exitParent.addChild(newExit);
            newExit.setWorldPosition(position);
            const exitComponent = newExit.getComponent(Exit);
            exitComponent.setExit(rootWallComp.X, rootWallComp.Y, Global.ExitSize, rootWallComp.HorDir, rootWallComp.VerDir);
            rootWallComp.IsExit = true;

            let spriteName = '';
            if (rootWallComp.HorDir) {
                spriteName = rootWallComp.HorDir === 'left' ? `PA_Machine_2_${Global.ColorId}_1_1` : `PA_Machine_4_${Global.ColorId}_1_1`;
                for (let i = 1; i < Global.ExitSize; i++) {
                    BJEventManager.instance.emit(EVENT.CREATE_EXIT_SUCCESS, [rootWallComp.X, rootWallComp.Y + i, rootWallComp.HorDir, rootWallComp.VerDir]);
                }
            }
            else {
                spriteName = rootWallComp.VerDir === 'bot' ? `PA_Machine_1_${Global.ColorId}_1_1` : `PA_Machine_3_${Global.ColorId}_1_1`;
                for (let i = 1; i < Global.ExitSize; i++) {
                    BJEventManager.instance.emit(EVENT.CREATE_EXIT_SUCCESS, [rootWallComp.X + i, rootWallComp.Y, rootWallComp.HorDir, rootWallComp.VerDir]);
                }
            }

            let newExitData: EXIT_DATA = {
                icon: spriteName,
                size: Global.ExitSize,
                x: rootWallComp.X,
                y: rootWallComp.Y,
                type: 0,
            }
            this._editLevel.exits.push(newExitData);
        }
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

    onExitSizeChanged(editBox: EditBox) {
        const value = editBox.string;
        const parsed = Number(value);

        if (isNaN(parsed)) {
            log(`Invalid number: "${value}"`);
        } else {
            if (parsed > 0 && parsed <= 4) {
                Global.ExitSize = parsed;
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
            this.clearWalls();
            this.clearBlocks();
            this.clearExits();
        }, 0.4)
    }

    createWalls() {
        const uiTransform = this.wallParent.getComponent(UITransform);
    
        // Clear existing walls
        this.wallParent.removeAllChildren();
    
        // Helper to create a wall
        const createWall = (col: number, row: number, offset: Vec3, sideH: string | null, sideV: string | null) => {
            const wall = instantiate(this.wallPrefab);
            this.wallParent.addChild(wall);
            const worldPos = this._grid[row][col].node.worldPosition;
            const localPos = uiTransform.convertToNodeSpaceAR(worldPos).add(offset);
            wall.setPosition(localPos);
            wall.getComponent(Wall).init(sideH, sideV, col, row);
        };
    
        // Bottom & Top walls
        for (let col = 0; col < Global.ColCount; col++) {
            createWall(col, 0, new Vec3(0, -75), null, 'bot');
            createWall(col, Global.RowCount - 1, new Vec3(0, 75), null, 'top');
        }
    
        // Left & Right walls
        for (let row = 0; row < Global.RowCount; row++) {
            createWall(0, row, new Vec3(-75, 0), 'left', null);
            createWall(Global.ColCount - 1, row, new Vec3(75, 0), 'right', null);
        }
    
        // Corners
        createWall(0, 0, new Vec3(-75, -75), 'left', 'bot'); // bottom-left
        createWall(Global.ColCount - 1, 0, new Vec3(75, -75), 'right', 'bot'); // bottom-right
        createWall(0, Global.RowCount - 1, new Vec3(-75, 75), 'left', 'top'); // top-left
        createWall(Global.ColCount - 1, Global.RowCount - 1, new Vec3(75, 75), 'right', 'top'); // top-right
    }

    clearBlocks() {
        for (const child of this.blockParent.children) {
            child.destroy();
        }
        this.blockParent.removeAllChildren();
        this._editLevel.blocks = [];
    }

    clearExits() {
        for (const child of this.exitParent.children) {
            child.destroy();
        }
        this.exitParent.removeAllChildren();
    }

    clearWalls() {
        for (const child of this.wallParent.children) {
            child.destroy();
        }
        this.wallParent.removeAllChildren();
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
        this.clearWalls();
        this.clearExits();
        this.onGridDimChanged(Global.ColCount, Global.RowCount);
        this.createWalls();
        this.scheduleOnce(() => {
            this._editLevel = data;
            this.createBlocks(data.blocks);
            this.createWalls();
        }, 0.4);

        this.node.active = true;
    }

    onOpenMenu() {
        this.node.active = false;
        BJEventManager.instance.emit(EVENT.OPEN_MENU);
    }
}