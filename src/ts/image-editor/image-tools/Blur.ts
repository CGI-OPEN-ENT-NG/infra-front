import { ImageView } from '../ImageView';
import { Tool } from '../Tool';

export class Blur implements Tool{
    imageView: ImageView;

    apply(options?: any){

    }

    start(imageView: ImageView, editingElement: any){
        this.imageView = imageView;
    }
}