import { Vec2 } from "cc";

export class Global {
    public static ColorId: string = '1';
    public static ShapeId: string = '1';
    public static ColCount: number = 7;
    public static RowCount: number = 9;
    public static ExitSize: number = 1;
    public static ExitX: number = 0;
    public static ExitY: number = 0;

    //Communicate between objs
    public static CanCreateExit = false;
}