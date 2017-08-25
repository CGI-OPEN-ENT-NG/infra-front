import { ImageView } from '../ImageView';
import { Tool } from '../Tool';
import { $ } from "../../index";

export class Crop implements Tool{
    imageView: ImageView;
    editingElement: any;

    get outputWidth(): number{
        return parseInt($(this.imageView.renderer.view).width());
    }

    get outputHeight(): number{
        return parseInt($(this.imageView.renderer.view).height());
    }

    get outputLeft(): number{
        return parseInt($(this.imageView.renderer.view).position().left);
    }

    get outputTop(): number{
        return parseInt($(this.imageView.renderer.view).position().top);
    }

    stop(){}

    apply(options?: any){
        const handle = this.editingElement.find('.handle');
        
        let width = handle.width() - this.outputLeft;
        let height = handle.height() - this.outputTop;

        let x = handle.position().left - this.outputLeft;
        let y = handle.position().top - this.outputTop;

        if(width > this.outputWidth){
            width = this.outputWidth;
        }

        if(height > this.outputHeight){
            height = this.outputHeight;
        }

        this.imageView.renderer.view.toBlob((blob) => {
            const imageUrl = URL.createObjectURL(blob);
            const image = new Image();
            image.src = imageUrl;
            image.onload = () => {
                const newTexture = PIXI.Texture.from(image);
                this.imageView.stage.removeChildren();
                const cropped = new PIXI.Texture(
                    newTexture.baseTexture, new PIXI.Rectangle(
                        x * (this.imageView.renderer.width / this.outputWidth),
                        y * (this.imageView.renderer.height / this.outputHeight), 
                        width * (this.imageView.renderer.width / this.outputWidth), 
                        height * (this.imageView.renderer.height / this.outputHeight)
                    )
                );
                this.imageView.sprite = new PIXI.Sprite(cropped);
                this.imageView.stage.addChild(this.imageView.sprite);
                this.imageView.renderer.resize(this.imageView.sprite.width, this.imageView.sprite.height);
                this.imageView.render();

                setTimeout(() => {
                    this.setHandle();
                    this.imageView.setOverlay();
                    requestAnimationFrame(() => 
                        this.editingElement.find('.tools-background').height(this.editingElement.find('.output').height())
                    );
                    requestAnimationFrame(() => {
                        this.imageView.backup();
                    });
                }, 50);
                
            };
        }, 'image/jpeg', 1);
    }

    setHandle(){
        const handle = this.editingElement.find('.handle');
        handle.position({
            top: 0,
            left: 0
        });

        handle.width(this.outputWidth);
        handle.height(this.outputHeight);
    }

    start(imageView: ImageView, editingElement: any){
        this.imageView = imageView;
        this.editingElement = editingElement;
        setTimeout(() => {
            this.imageView.setOverlay();
            this.setHandle();
        }, 50);
    }
}