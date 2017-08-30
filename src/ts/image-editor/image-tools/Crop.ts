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
        let width = handle.width();
        if(handle.width() > this.outputWidth){
            width = handle.width() - (this.outputLeft - handle.position().left);
        }
        
        let height = handle.height();
        if(handle.height() > this.outputHeight){
            height = handle.height() - (this.outputHeight - handle.position().top);
        }

        let x = handle.position().left - this.outputLeft;
        let y = handle.position().top - this.outputTop;

        if(x > this.outputWidth || y > this.outputHeight){
            return;
        }

        if(x < 0){ x = 0; }
        if(y < 0){ y = 0; }

        if(width > this.outputWidth){
            width = this.outputWidth;
        }

        if(height > this.outputHeight){
            height = this.outputHeight;
        }

        const texture = PIXI.Texture.fromImage(this.imageView.sprite.texture.baseTexture.imageUrl);
        this.imageView.stage.removeChildren();
        const cropped = new PIXI.Texture(
            texture.baseTexture, new PIXI.Rectangle(
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

        requestAnimationFrame(async () => {
            await this.imageView.backup();
            this.imageView.render();
            requestAnimationFrame(() => {
                this.setHandle();
                this.imageView.setOverlay();
                this.editingElement.find('.tools-background').height(this.editingElement.find('.output').height())
            });
        });
    }

    setHandle(){
        const handle = this.editingElement.find('.handle');
        handle.css({
            top: "0px",
            left: "0px"
        });

        handle.width(this.outputWidth - 4);
        handle.height(this.outputHeight - 4);
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