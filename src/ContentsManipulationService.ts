import { AssetCard } from "./AssetCard";
import { AssetItemCard } from "./AssetItemCard";
import { AssetsService } from "./AssetsService";
import { DraggableElement } from "./DraggableElement";
import { AssetContent } from "./script";

export class ContentsManipulationService {
    private static _instance: ContentsManipulationService | null = null;
    static get instance(): ContentsManipulationService {
        if (!ContentsManipulationService._instance) {
            ContentsManipulationService._instance = new ContentsManipulationService();
        }
        return ContentsManipulationService._instance;
    }

    private static cm = ContentsManipulationService.instance;
    private static as = AssetsService.instance;

    private _fromId: string | null = null;

    public contents: AssetContent[] = [];
    get isDragging(): boolean {
        return !!this._fromId && this.contents.length > 0;
    }

    constructor() {
        document.addEventListener('mouseup', (ev) => {
            if (!this.isDragging) return;

            const assetCard = ev.composedPath().find(e => e instanceof AssetCard) as AssetCard | null;
            ContentsManipulationService.dispatchContentDrop(assetCard?.id || null);
        });
        document.addEventListener('dragstart', (ev) => {
            const assetItemCard = ev.composedPath().find(e => e instanceof AssetItemCard) as AssetItemCard;
            if (!assetItemCard) return;
            const assetCard = ev.composedPath().find(e => e instanceof AssetCard) as AssetCard;
            if (!assetCard) return;

            ContentsManipulationService.dispatchContentDrag(assetCard.id, [assetItemCard.content]);
            ev.preventDefault();
        });
    }

    public static dispatchContentDrag(id: string, contents: AssetContent[]) {
        const items = contents.map(content => {
            const itemCard = document.createElement('asset-item-card') as AssetItemCard;
            itemCard.content = content;
            itemCard.ghost = true;
            return itemCard;
        });
        const draggable = document.createElement('draggable-element') as DraggableElement;
        draggable.append(...items);
        document.body.appendChild(draggable);

        this.cm.contents = contents;
        this.cm._fromId = id;
        this.as.removeContents(id, contents);
    }

    public static dispatchContentDrop(id: string | null) {
        const movedContents = this.cm.contents;
        const dropId = id || this.cm._fromId;

        this.cm.contents = [];
        this.cm._fromId = null;

        if (!dropId) return;
        this.as.addContents(dropId, movedContents);
    }
}
