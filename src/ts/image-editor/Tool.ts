import { ImageView } from './ImageView';

export interface Tool{
    apply(options?: any);
    start(imageView: ImageView, editingElement: any);
}