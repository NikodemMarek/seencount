import './AppRoot';
import './LocationSelector';
import './LocationItem';
import './AssetMap';
import './BottomBar';
import './AssetItemCard';
import './AssetCard';
import './SidePanel';

export type BeancountLocation = {
    beancount_id: string;
    name: string;
    filename: string;
    data: any;
};

export type MetadataType = 'Flat' | 'Room' | 'Container' | 'Asset';

export type LocationContent = {
    asset: string;
    quantity: number;
};

export type Metadata = {
    id: string;
    type: MetadataType;
    name?: string;
    contents: LocationContent[];
};
