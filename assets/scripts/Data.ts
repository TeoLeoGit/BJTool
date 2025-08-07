import { JsonAsset, log, resources } from "cc";
import { LEVEL } from "./Config";

export class Data  {
    private static _levels: any;

    public static get Levels(): any {
        return this._levels;
    }

    public static saveLevel(level: LEVEL) {
        let a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([JSON.stringify(level)], { type: 'application/json' }));
        a.download = 'level.json';
        document.body.appendChild(a);
        a.click();
    }

    public static loadLevels(onSuccess?: () => void) {
        resources.load('data/level', JsonAsset, (err, jsonAsset) => {
            if (err) {
                console.error('❌ Failed to load JSON:', err);
                return;
            }
        
            const data = jsonAsset.json;
            this._levels = data;
            onSuccess();
        });
    }

    public static getLevel(level: number): LEVEL {
        if (this._levels[level]) return this._levels[level];
        return null;
    }
}


