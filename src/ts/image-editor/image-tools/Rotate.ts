import { ImageView } from '../ImageView';
import { Tool } from '../Tool';

export class Rotate implements Tool{
    imageView: ImageView;
    editingElement: any;

    apply(options?: any){
        this.imageView.sprite.rotation += (90 * (Math.PI / 180));
        this.imageView.renderer.resize(this.imageView.sprite.height, this.imageView.sprite.width);
        this.imageView.sprite.position = {
            x: this.imageView.sprite.height / 2,
            y: this.imageView.sprite.width / 2
        } as PIXI.Point;
        this.imageView.render();
        
        requestAnimationFrame(() => {
            this.imageView.backup();
            requestAnimationFrame(() => 
                this.imageView.editingElement.find('.tools-background').height(this.editingElement.find('.output').height())
            );
        });
    }

    start(imageView: ImageView, editingElement: any){
        this.imageView = imageView;
        this.editingElement = editingElement;
    }
}